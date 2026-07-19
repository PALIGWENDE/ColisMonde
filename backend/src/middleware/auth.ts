import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/apiError";
import { verifyAccessToken } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized();

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isSuspended || user.deletedAt) throw ApiError.unauthorized("Compte introuvable ou suspendu");

    req.userId = user.id;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Session invalide ou expirée"));
  }
}

/** Pour les routes publiques dont la réponse varie légèrement si l'utilisateur est connecté. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && !user.isSuspended && !user.deletedAt) req.userId = user.id;
  } catch {
    // token invalide -> on continue en mode anonyme, silencieusement
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  prisma.user
    .findUnique({ where: { id: req.userId } })
    .then((user) => {
      if (!user?.isAdmin) return next(ApiError.forbidden("Réservé aux administrateurs"));
      next();
    })
    .catch(next);
}
