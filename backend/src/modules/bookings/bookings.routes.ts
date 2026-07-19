import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializeBooking } from "@/utils/serializers";
import { computeAgreedPrice, computeInsuranceFee } from "@/config/pricing";
import { generateConfirmationCode } from "@/utils/jwt";
import { createNotification } from "@/modules/notifications/notifications.service";
import { persistUploadedFile, uploadProof, handleUploadErrors } from "@/modules/uploads/upload.middleware";
import { isBlockedEitherWay } from "@/modules/blocks/blocks.routes";
import { createBookingSchema, confirmDeliverySchema, advanceStatusSchema } from "./bookings.schemas";

export const bookingsRouter = Router();

const fullInclude = {
  trip: { include: { traveler: true, departureCity: true, arrivalCity: true } },
  request: { include: { sender: true, departureCity: true, arrivalCity: true } },
  sender: true,
  traveler: true,
} as const;

async function loadBookingOrThrow(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: fullInclude });
  if (!booking) throw ApiError.notFound("Réservation introuvable");
  return booking;
}

/** Barrière IDOR centrale : seuls les deux participants (ou un admin) peuvent voir/modifier un booking. */
function assertParticipant(booking: { senderId: string; travelerId: string }, userId: string) {
  if (booking.senderId !== userId && booking.travelerId !== userId) {
    throw ApiError.forbidden("Vous n'avez pas accès à cette réservation");
  }
}

async function logTrackingEvent(
  bookingId: string,
  status: string,
  label: string,
  description?: string,
  location?: string,
) {
  await prisma.trackingEvent.create({
    data: { bookingId, status: status as never, label, description, location },
  });
}

bookingsRouter.post(
  "/",
  requireAuth,
  validate({ body: createBookingSchema }),
  asyncHandler(async (req, res) => {
    const { tripId, requestId, insuranceTier } = req.body;

    const [trip, request] = await Promise.all([
      prisma.trip.findUnique({ where: { id: tripId } }),
      prisma.packageRequest.findUnique({ where: { id: requestId } }),
    ]);

    if (!trip || trip.status !== "ACTIVE") throw ApiError.badRequest("Trajet indisponible");
    if (!request || request.status !== "OPEN") throw ApiError.badRequest("Demande indisponible");
    if (trip.travelerId === request.senderId) throw ApiError.badRequest("Impossible de réserver son propre trajet");
    if (req.userId !== trip.travelerId && req.userId !== request.senderId) {
      throw ApiError.forbidden("Vous devez être l'expéditeur de la demande ou le voyageur du trajet");
    }
    if (request.weightKg > trip.availableWeightKg) {
      throw ApiError.badRequest("Le poids de la demande dépasse la capacité disponible du trajet");
    }
    if (!trip.acceptedCategories.includes(request.category)) {
      throw ApiError.badRequest("Ce trajet n'accepte pas cette catégorie de colis");
    }
    if (await isBlockedEitherWay(trip.travelerId, request.senderId)) {
      throw ApiError.badRequest("Cette réservation n'est pas possible entre ces deux utilisateurs");
    }

    const existing = await prisma.booking.findFirst({
      where: { tripId, requestId, status: { in: ["PENDING", "ACCEPTED", "PICKED_UP", "IN_TRANSIT"] } },
    });
    if (existing) throw ApiError.conflict("Une réservation est déjà en cours pour ce trajet et cette demande");

    const agreedPrice = computeAgreedPrice(trip.pricePerKg, request.weightKg, request.offeredPrice);
    const insuranceFee = computeInsuranceFee(insuranceTier);

    const booking = await prisma.booking.create({
      data: {
        tripId,
        requestId,
        senderId: request.senderId,
        travelerId: trip.travelerId,
        initiatorId: req.userId!,
        insuranceTier,
        insuranceFee,
        serviceFee: 15,
        agreedPrice,
      },
      include: fullInclude,
    });

    const counterpartId = req.userId === trip.travelerId ? request.senderId : trip.travelerId;
    await createNotification({
      userId: counterpartId,
      type: "BOOKING_REQUEST",
      title: "Nouvelle proposition de réservation",
      body: `Une mise en relation a été proposée pour un envoi de ${request.weightKg}kg.`,
      relatedBookingId: booking.id,
    });

    res.status(201).json({ booking: serializeBooking(booking, req.userId!) });
  }),
);

bookingsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = req.query.role as "sender" | "traveler" | undefined;
    const where =
      role === "sender"
        ? { senderId: req.userId }
        : role === "traveler"
          ? { travelerId: req.userId }
          : { OR: [{ senderId: req.userId }, { travelerId: req.userId }] };

    const bookings = await prisma.booking.findMany({
      where,
      include: fullInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ bookings: bookings.map((b) => serializeBooking(b, req.userId!)) });
  }),
);

bookingsRouter.get(
  "/:id",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    res.json({ booking: serializeBooking(booking, req.userId!) });
  }),
);

bookingsRouter.get(
  "/:id/tracking",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    const events = await prisma.trackingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { occurredAt: "asc" },
    });
    res.json({ events });
  }),
);

bookingsRouter.get(
  "/:id/conversation",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    const conversation = await prisma.conversation.findUnique({ where: { bookingId: booking.id } });
    if (!conversation) throw ApiError.notFound("Aucune conversation pour cette réservation");
    res.json({ conversationId: conversation.id });
  }),
);

bookingsRouter.patch(
  "/:id/accept",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    if (booking.initiatorId === req.userId) {
      throw ApiError.forbidden("Vous ne pouvez pas accepter votre propre proposition");
    }
    if (booking.status !== "PENDING") throw ApiError.conflict("Cette réservation n'est plus en attente");

    const confirmationCode = generateConfirmationCode();
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: { status: "ACCEPTED", confirmationCode },
        include: fullInclude,
      });
      await tx.packageRequest.update({ where: { id: booking.requestId }, data: { status: "MATCHED" } });
      // Les autres propositions concurrentes sur la même demande sont automatiquement refusées.
      await tx.booking.updateMany({
        where: { requestId: booking.requestId, id: { not: booking.id }, status: "PENDING" },
        data: { status: "REJECTED" },
      });
      await tx.conversation.create({ data: { bookingId: booking.id } });
      return b;
    });

    await logTrackingEvent(booking.id, "ACCEPTED", "Accepté", "L'offre a été validée par les deux parties.");
    await createNotification({
      userId: booking.initiatorId,
      type: "BOOKING_ACCEPTED",
      title: "Réservation acceptée",
      body: "Votre proposition de réservation a été acceptée.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

const insuranceSchema = z.object({ insuranceTier: z.enum(["BASIC", "PREMIUM"]) });

/** Choix de l'assurance au moment du paiement (cf. écran "Récapitulatif du paiement"). */
bookingsRouter.patch(
  "/:id/insurance",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: insuranceSchema }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    if (booking.senderId !== req.userId) throw ApiError.forbidden("Seul l'expéditeur peut choisir l'assurance");
    if (booking.status !== "ACCEPTED") throw ApiError.conflict("L'assurance ne peut plus être modifiée");

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (existingPayment) throw ApiError.conflict("Le paiement a déjà été initié");

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { insuranceTier: req.body.insuranceTier, insuranceFee: computeInsuranceFee(req.body.insuranceTier) },
      include: fullInclude,
    });
    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

bookingsRouter.patch(
  "/:id/reject",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    if (booking.initiatorId === req.userId) {
      throw ApiError.forbidden("Vous ne pouvez pas refuser votre propre proposition");
    }
    if (booking.status !== "PENDING") throw ApiError.conflict("Cette réservation n'est plus en attente");

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "REJECTED" },
      include: fullInclude,
    });

    await createNotification({
      userId: booking.initiatorId,
      type: "BOOKING_REJECTED",
      title: "Réservation refusée",
      body: "Votre proposition de réservation a été refusée.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

bookingsRouter.patch(
  "/:id/cancel",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    assertParticipant(booking, req.userId!);
    if (["DELIVERED", "CANCELLED", "REJECTED"].includes(booking.status)) {
      throw ApiError.conflict("Cette réservation ne peut plus être annulée");
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
      include: fullInclude,
    });
    await logTrackingEvent(booking.id, "CANCELLED", "Annulé", "La réservation a été annulée.");

    const counterpartId = req.userId === booking.senderId ? booking.travelerId : booking.senderId;
    await createNotification({
      userId: counterpartId,
      type: "BOOKING_REJECTED",
      title: "Réservation annulée",
      body: "La réservation a été annulée par l'autre partie.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

/** Seul le voyageur fait progresser physiquement le colis : remis -> en transit. */
bookingsRouter.patch(
  "/:id/pickup",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: advanceStatusSchema }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    if (booking.travelerId !== req.userId) throw ApiError.forbidden("Seul le voyageur peut confirmer la remise du colis");
    if (booking.status !== "ACCEPTED") throw ApiError.conflict("La réservation doit être acceptée avant la remise");

    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (!payment || payment.status !== "PAID") throw ApiError.conflict("Le paiement doit être finalisé avant la remise");

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "PICKED_UP" }, include: fullInclude });
    await logTrackingEvent(booking.id, "PICKED_UP", "Colis remis", req.body.note ?? "Le colis a été confié au voyageur.", req.body.location);
    await createNotification({
      userId: booking.senderId,
      type: "PACKAGE_PICKED_UP",
      title: "Colis récupéré",
      body: "Votre voyageur a récupéré le colis.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

bookingsRouter.patch(
  "/:id/in-transit",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: advanceStatusSchema }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    if (booking.travelerId !== req.userId) throw ApiError.forbidden("Seul le voyageur peut mettre à jour ce statut");
    if (booking.status !== "PICKED_UP") throw ApiError.conflict("Le colis doit d'abord être récupéré");

    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "IN_TRANSIT" }, include: fullInclude });
    await logTrackingEvent(booking.id, "IN_TRANSIT", "En transit", req.body.note ?? "Le colis est en cours de transit.", req.body.location);
    await createNotification({
      userId: booking.senderId,
      type: "PACKAGE_IN_TRANSIT",
      title: "Colis en transit",
      body: "Votre colis est en cours de transit.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

/** Remise finale : le voyageur doit fournir le code à 6 chiffres communiqué par l'expéditeur/destinataire. */
bookingsRouter.patch(
  "/:id/deliver",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: confirmDeliverySchema }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    if (booking.travelerId !== req.userId) throw ApiError.forbidden("Seul le voyageur peut confirmer la livraison");
    if (booking.status !== "IN_TRANSIT" && booking.status !== "PICKED_UP") {
      throw ApiError.conflict("Le colis n'est pas encore en cours de livraison");
    }
    if (req.body.confirmationCode !== booking.confirmationCode) {
      throw ApiError.badRequest("Code de confirmation incorrect");
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "DELIVERED", confirmedAt: new Date() },
      include: fullInclude,
    });
    await logTrackingEvent(booking.id, "DELIVERED", "Livré", "Remise finale confirmée au destinataire.");
    await createNotification({
      userId: booking.senderId,
      type: "PACKAGE_DELIVERED",
      title: "Colis livré",
      body: "Votre colis a été livré avec succès.",
      relatedBookingId: booking.id,
    });

    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);

/** Photo de preuve de livraison, prise par le voyageur au moment de la remise finale. */
bookingsRouter.post(
  "/:id/proof",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  uploadProof,
  handleUploadErrors,
  asyncHandler(async (req, res) => {
    const booking = await loadBookingOrThrow(req.params.id);
    if (booking.travelerId !== req.userId) throw ApiError.forbidden("Seul le voyageur peut ajouter une preuve de livraison");
    if (booking.status !== "DELIVERED") throw ApiError.conflict("La livraison doit être confirmée avant l'ajout d'une preuve");
    if (!req.file) throw ApiError.badRequest("Aucun fichier reçu");

    const url = await persistUploadedFile(req.file, "proofs");
    const updated = await prisma.booking.update({ where: { id: booking.id }, data: { proofPhotoUrl: url }, include: fullInclude });
    res.json({ booking: serializeBooking(updated, req.userId!) });
  }),
);
