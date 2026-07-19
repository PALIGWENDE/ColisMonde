import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/utils/apiError";
import { env } from "@/config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "NOT_FOUND", message: `Route inconnue : ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Les données envoyées sont invalides",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "CONFLICT", message: "Cette ressource existe déjà" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ressource introuvable" });
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Une erreur interne est survenue",
    ...(env.NODE_ENV !== "production" && err instanceof Error ? { debug: err.message } : {}),
  });
}
