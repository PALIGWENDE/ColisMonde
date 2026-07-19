import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function accessTokenExpiryDate(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_ACCESS_TTL);
  const now = Date.now();
  if (!match) return new Date(now + 15 * 60 * 1000);
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
  return new Date(now + value * unitMs);
}

/**
 * Le refresh token est une valeur aléatoire opaque (pas un JWT signé) : seul son hash SHA-256
 * est stocké en base, ce qui empêche toute réutilisation en cas de fuite de la base de données.
 */
export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString("hex");
  const hash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86_400_000);
  return { token, hash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateConfirmationCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}
