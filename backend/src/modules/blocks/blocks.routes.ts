import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializePublicUser } from "@/utils/serializers";

export const blocksRouter = Router();

const targetParamSchema = z.object({ id: z.string().uuid() });

blocksRouter.post(
  "/:id/block",
  requireAuth,
  validate({ params: targetParamSchema }),
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    if (targetId === req.userId) throw ApiError.badRequest("Vous ne pouvez pas vous bloquer vous-même");

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw ApiError.notFound("Utilisateur introuvable");

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId: targetId } },
      create: { blockerId: req.userId!, blockedId: targetId },
      update: {},
    });

    res.status(204).send();
  }),
);

blocksRouter.delete(
  "/:id/block",
  requireAuth,
  validate({ params: targetParamSchema }),
  asyncHandler(async (req, res) => {
    await prisma.block.deleteMany({ where: { blockerId: req.userId!, blockedId: req.params.id } });
    res.status(204).send();
  }),
);

blocksRouter.get(
  "/me/blocks",
  requireAuth,
  asyncHandler(async (req, res) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.userId },
      include: { blocked: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ blockedUsers: blocks.map((b) => serializePublicUser(b.blocked)) });
  }),
);

/**
 * Vrai dans les deux sens : si A a bloqué B ou si B a bloqué A, le contact doit être coupé
 * (sinon un utilisateur bloqué pourrait quand même écrire à la personne qui l'a bloqué).
 */
export async function isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return Boolean(block);
}

/** Liste des ids bloqués par l'utilisateur (dans un sens ou l'autre), pour filtrer des résultats de recherche. */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  }
  return Array.from(ids);
}
