import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ notifications });
  }),
);

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) throw ApiError.notFound("Notification introuvable");
    if (notification.userId !== req.userId) throw ApiError.forbidden();

    const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ notification: updated });
  }),
);

notificationsRouter.post(
  "/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
    res.status(204).send();
  }),
);
