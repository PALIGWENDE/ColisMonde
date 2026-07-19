import { Router } from "express";
import type { Response } from "express";
import { prisma } from "@/lib/prisma";
import { validate } from "@/middleware/validate";
import { requireAuth } from "@/middleware/auth";
import { loginRateLimiter, refreshRateLimiter, registerRateLimiter } from "@/middleware/rateLimiters";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { hashPassword, verifyPassword } from "@/utils/password";
import { accessTokenExpiryDate, generateRefreshToken, hashRefreshToken, signAccessToken } from "@/utils/jwt";
import { serializeMe } from "@/utils/serializers";
import { env } from "@/config/env";
import { loginSchema, registerSchema } from "./auth.schemas";

export const authRouter = Router();

const REFRESH_COOKIE_NAME = "cm_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

async function issueSession(res: Response, userId: string, email: string, req: { headers: Record<string, unknown>; ip?: string }) {
  const accessToken = signAccessToken({ sub: userId, email });
  const { token: refreshToken, hash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt,
      userAgent: typeof req.headers["user-agent"] === "string" ? (req.headers["user-agent"] as string).slice(0, 255) : undefined,
      ip: req.ip,
    },
  });

  setRefreshCookie(res, refreshToken, expiresAt);
  return { accessToken, accessTokenExpiresAt: accessTokenExpiryDate().toISOString() };
}

authRouter.post(
  "/register",
  registerRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, phone, country, city } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("Un compte existe déjà avec cet e-mail");

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, phone, country, city },
    });

    const tokens = await issueSession(res, user.id, user.email, req);
    res.status(201).json({ user: serializeMe(user), ...tokens });
  }),
);

// Hash factice utilisé pour égaliser le temps de réponse et éviter l'énumération de comptes par timing.
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeOTa9Ym0.wxsq0Bpu0ldk3F9uSmn7zH7q";

authRouter.post(
  "/login",
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) throw ApiError.unauthorized("E-mail ou mot de passe incorrect");
    if (user.isSuspended) throw ApiError.forbidden("Ce compte a été suspendu");
    if (user.deletedAt) throw ApiError.unauthorized("E-mail ou mot de passe incorrect");

    const tokens = await issueSession(res, user.id, user.email, req);
    res.json({ user: serializeMe(user), ...tokens });
  }),
);

authRouter.post(
  "/refresh",
  refreshRateLimiter,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw ApiError.unauthorized("Aucune session active");

    const tokenHash = hashRefreshToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Réutilisation d'un refresh token révoqué/expiré : signe possible de vol -> on invalide tout.
      if (stored && !stored.revokedAt) {
        await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      }
      clearRefreshCookie(res);
      throw ApiError.unauthorized("Session expirée, veuillez vous reconnecter");
    }

    if (stored.user.isSuspended) throw ApiError.forbidden("Ce compte a été suspendu");
    if (stored.user.deletedAt) throw ApiError.unauthorized("Session expirée, veuillez vous reconnecter");

    // Rotation : l'ancien token est révoqué, un nouveau est émis (détection de rejeu).
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const tokens = await issueSession(res, stored.user.id, stored.user.email, req);
    res.json({ user: serializeMe(stored.user), ...tokens });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      const tokenHash = hashRefreshToken(token);
      await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    clearRefreshCookie(res);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    res.json({ user: serializeMe(user) });
  }),
);
