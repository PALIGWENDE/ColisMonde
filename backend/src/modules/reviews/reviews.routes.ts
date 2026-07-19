import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializeReview } from "@/utils/serializers";
import { createNotification } from "@/modules/notifications/notifications.service";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

reviewsRouter.post(
  "/bookings/:bookingId/reviews",
  requireAuth,
  validate({ params: z.object({ bookingId: z.string().uuid() }), body: createReviewSchema }),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw ApiError.notFound("Réservation introuvable");
    if (booking.senderId !== req.userId && booking.travelerId !== req.userId) throw ApiError.forbidden();
    if (booking.status !== "DELIVERED") throw ApiError.conflict("Vous ne pouvez évaluer qu'une livraison terminée");

    const targetId = booking.senderId === req.userId ? booking.travelerId : booking.senderId;

    const existing = await prisma.review.findUnique({
      where: { bookingId_authorId: { bookingId: booking.id, authorId: req.userId! } },
    });
    if (existing) throw ApiError.conflict("Vous avez déjà évalué cette livraison");

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { bookingId: booking.id, authorId: req.userId!, targetId, rating: req.body.rating, comment: req.body.comment },
        include: { author: true },
      });

      const stats = await tx.review.aggregate({ where: { targetId }, _avg: { rating: true }, _count: true });
      await tx.user.update({
        where: { id: targetId },
        data: { ratingAvg: stats._avg.rating ?? 0, ratingCount: stats._count },
      });

      return created;
    });

    await createNotification({
      userId: targetId,
      type: "REVIEW_RECEIVED",
      title: "Nouvel avis reçu",
      body: `Vous avez reçu une note de ${req.body.rating}/5.`,
      relatedBookingId: booking.id,
    });

    res.status(201).json({ review: serializeReview(review) });
  }),
);

reviewsRouter.get(
  "/bookings/:bookingId/reviews",
  requireAuth,
  validate({ params: z.object({ bookingId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId } });
    if (!booking) throw ApiError.notFound("Réservation introuvable");
    if (booking.senderId !== req.userId && booking.travelerId !== req.userId) throw ApiError.forbidden();

    const reviews = await prisma.review.findMany({ where: { bookingId: booking.id }, include: { author: true } });
    res.json({ reviews: reviews.map(serializeReview) });
  }),
);
