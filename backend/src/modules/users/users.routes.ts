import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializeMe, serializePublicUser } from "@/utils/serializers";
import {
  persistUploadedFile,
  uploadAvatar,
  uploadDocument,
  handleUploadErrors,
  uploadRoot,
} from "@/modules/uploads/upload.middleware";
import { updateMeSchema, uploadDocumentSchema, userIdParamSchema } from "./users.schemas";
import { deleteUserAccount } from "./account-deletion.service";

export const usersRouter = Router();

/** Doit rester identique au cookie émis par auth.routes.ts (même nom/scope). */
const REFRESH_COOKIE_NAME = "cm_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    res.json({ user: serializeMe(user) });
  }),
);

/**
 * Suppression de compte en libre-service (exigée par Apple 5.1.1v et la politique Google Play) :
 * anonymise le compte plutôt qu'un hard delete — voir account-deletion.service.ts pour le détail
 * et la justification (historique des transactions référencé par d'autres tables).
 */
usersRouter.delete(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    await deleteUserAccount(req.userId!);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
    res.status(204).send();
  }),
);

usersRouter.patch(
  "/me",
  requireAuth,
  validate({ body: updateMeSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.userId }, data: req.body });
    res.json({ user: serializeMe(user) });
  }),
);

usersRouter.post(
  "/me/avatar",
  requireAuth,
  uploadAvatar,
  handleUploadErrors,
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("Aucun fichier reçu");
    const url = await persistUploadedFile(req.file, "avatars");
    const user = await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: url } });
    res.json({ user: serializeMe(user) });
  }),
);

usersRouter.post(
  "/me/documents",
  requireAuth,
  uploadDocument,
  handleUploadErrors,
  validate({ body: uploadDocumentSchema }),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("Aucun fichier reçu");
    const url = await persistUploadedFile(req.file, "documents");
    const doc = await prisma.verificationDocument.create({
      data: { userId: req.userId!, type: req.body.type, fileUrl: url },
    });
    res.status(201).json({ document: doc });
  }),
);

/**
 * Les documents d'identité ne sont JAMAIS servis en statique public (contrairement aux avatars) :
 * seul le propriétaire (ou un admin) peut les récupérer, via une route authentifiée.
 */
usersRouter.get(
  "/me/documents/:docId/file",
  requireAuth,
  validate({ params: z.object({ docId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const doc = await prisma.verificationDocument.findUnique({ where: { id: req.params.docId } });
    if (!doc) throw ApiError.notFound("Document introuvable");
    if (doc.userId !== req.userId) throw ApiError.forbidden();

    const filePath = path.join(uploadRoot, doc.fileUrl.replace(/^\/uploads\//, ""));
    if (!filePath.startsWith(uploadRoot)) throw ApiError.forbidden();
    res.sendFile(filePath);
  }),
);

usersRouter.get(
  "/me/documents",
  requireAuth,
  asyncHandler(async (req, res) => {
    const documents = await prisma.verificationDocument.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ documents });
  }),
);

/** Profil public — ne retourne jamais email/téléphone (cf. serializePublicUser). */
usersRouter.get(
  "/:id/public",
  validate({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw ApiError.notFound("Utilisateur introuvable");
    res.json({ user: serializePublicUser(user) });
  }),
);

usersRouter.get(
  "/:id/reviews",
  validate({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { targetId: req.params.id },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        bookingId: r.bookingId,
        author: serializePublicUser(r.author),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }),
);
