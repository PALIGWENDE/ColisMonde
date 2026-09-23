import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET doit faire au moins 16 caractères"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET doit faire au moins 16 caractères"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  // Stockage objet S3-compatible (Cloudflare R2, AWS S3, Backblaze B2...) — optionnel : si absent,
  // les fichiers sont écrits sur le disque local (comportement historique, adapté au dev seulement,
  // car ce disque est éphémère chez la plupart des hébergeurs gérés).
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // Redis (optionnel) : adaptateur Socket.IO multi-instances + store partagé pour la limitation de
  // débit. Sans REDIS_URL, l'app tourne normalement en mono-instance (comportement historique).
  REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :", parsed.error.flatten().fieldErrors);
  throw new Error("Configuration d'environnement invalide — vérifiez votre fichier .env");
}

export const env = parsed.data;

export const webOrigins = env.WEB_ORIGIN.split(",").map((o) => o.trim());
