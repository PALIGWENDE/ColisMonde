import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializePayment } from "@/utils/serializers";
import { createNotification } from "@/modules/notifications/notifications.service";

export const paymentsRouter = Router();

async function loadBookingForPayment(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw ApiError.notFound("Réservation introuvable");
  if (booking.senderId !== userId) throw ApiError.forbidden("Seul l'expéditeur peut payer cette réservation");
  return booking;
}

paymentsRouter.post(
  "/bookings/:bookingId/payment",
  requireAuth,
  validate({ params: z.object({ bookingId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await loadBookingForPayment(req.params.bookingId, req.userId!);
    if (booking.status !== "ACCEPTED") {
      throw ApiError.conflict("La réservation doit être acceptée avant le paiement");
    }

    const existing = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (existing) {
      res.status(200).json({ payment: serializePayment(existing) });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.agreedPrice,
        shippingFee: booking.agreedPrice,
        serviceFee: booking.serviceFee,
        insuranceFee: booking.insuranceFee,
        status: "PENDING",
        provider: "mock",
      },
    });

    res.status(201).json({ payment: serializePayment(payment) });
  }),
);

paymentsRouter.get(
  "/bookings/:bookingId/payment",
  requireAuth,
  validate({ params: z.object({ bookingId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw ApiError.notFound("Réservation introuvable");
    if (booking.senderId !== req.userId && booking.travelerId !== req.userId) throw ApiError.forbidden();

    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    if (!payment) throw ApiError.notFound("Aucun paiement pour cette réservation");
    res.json({ payment: serializePayment(payment) });
  }),
);

/**
 * Confirmation "mock" du paiement : simule un fournisseur de paiement (remplaçable par Stripe
 * plus tard derrière la même interface REST). Aucune donnée de carte n'est jamais reçue/stockée ici.
 */
paymentsRouter.post(
  "/:paymentId/confirm",
  requireAuth,
  validate({ params: z.object({ paymentId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId }, include: { booking: true } });
    if (!payment) throw ApiError.notFound("Paiement introuvable");
    if (payment.booking.senderId !== req.userId) throw ApiError.forbidden();
    if (payment.status === "PAID") {
      res.json({ payment: serializePayment(payment) });
      return;
    }
    if (payment.status !== "PENDING") throw ApiError.conflict("Ce paiement ne peut plus être confirmé");

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date(), providerRef: `mock_${crypto.randomBytes(8).toString("hex")}` },
    });

    await createNotification({
      userId: payment.booking.travelerId,
      type: "PAYMENT_RECEIVED",
      title: "Paiement reçu",
      body: "Le paiement de l'expéditeur a été confirmé, vous pouvez récupérer le colis.",
      relatedBookingId: payment.booking.id,
    });

    res.json({ payment: serializePayment(updated) });
  }),
);
