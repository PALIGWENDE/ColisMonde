import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env, webOrigins } from "@/config/env";
import { globalRateLimiter } from "@/middleware/rateLimiters";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { citiesRouter } from "@/modules/cities/cities.routes";
import { tripsRouter } from "@/modules/trips/trips.routes";
import { requestsRouter } from "@/modules/requests/requests.routes";
import { bookingsRouter } from "@/modules/bookings/bookings.routes";
import { paymentsRouter } from "@/modules/payments/payments.routes";
import { messagesRouter } from "@/modules/messages/messages.routes";
import { reviewsRouter } from "@/modules/reviews/reviews.routes";
import { reportsRouter } from "@/modules/reports/reports.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.routes";
import { blocksRouter } from "@/modules/blocks/blocks.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // helmet applique des en-têtes de sécurité stricts (CSP, HSTS, X-Frame-Options, etc.)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // nécessaire pour que /uploads soit chargé depuis le domaine du frontend
    }),
  );

  // CORS restreint à une allowlist explicite d'origines (WEB_ORIGIN), credentials pour les cookies de refresh.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || webOrigins.includes(origin)) return callback(null, true);
        callback(new Error("Origine non autorisée par la politique CORS"));
      },
      credentials: true,
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  if (env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.use(globalRateLimiter);

  // Fichiers publics uniquement (avatars, preuves de livraison) — les documents d'identité
  // sont volontairement exclus et servis via une route authentifiée (cf. users.routes.ts).
  const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use("/uploads/avatars", express.static(path.join(uploadRoot, "avatars"), { maxAge: "7d" }));
  app.use("/uploads/proofs", express.static(path.join(uploadRoot, "proofs"), { maxAge: "7d" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/users", blocksRouter);
  app.use("/api/cities", citiesRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/conversations", messagesRouter);
  app.use("/api", reviewsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
