import { Router } from "express";
import { z } from "zod";
import { REPORT_REASONS } from "@colismonde/shared";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";

export const reportsRouter = Router();

const createReportSchema = z
  .object({
    targetUserId: z.string().uuid().optional(),
    bookingId: z.string().uuid().optional(),
    reason: z.enum(REPORT_REASONS),
    description: z.string().trim().min(10).max(2000),
  })
  .refine((v) => v.targetUserId || v.bookingId, {
    message: "Un signalement doit cibler un utilisateur ou une réservation",
  });

reportsRouter.post(
  "/",
  requireAuth,
  validate({ body: createReportSchema }),
  asyncHandler(async (req, res) => {
    if (req.body.bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: req.body.bookingId } });
      if (!booking) throw ApiError.notFound("Réservation introuvable");
      if (booking.senderId !== req.userId && booking.travelerId !== req.userId) {
        throw ApiError.forbidden("Vous ne pouvez signaler qu'une réservation à laquelle vous participez");
      }
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.userId!,
        targetUserId: req.body.targetUserId,
        bookingId: req.body.bookingId,
        reason: req.body.reason,
        description: req.body.description,
      },
    });

    res.status(201).json({ report });
  }),
);

reportsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const reports = await prisma.report.findMany({ where: { reporterId: req.userId }, orderBy: { createdAt: "desc" } });
    res.json({ reports });
  }),
);

/** Réservé à l'équipe de modération (isAdmin). */
reportsRouter.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ reports });
  }),
);
