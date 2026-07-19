import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializeRequest } from "@/utils/serializers";
import { getBlockedUserIds } from "@/modules/blocks/blocks.routes";
import { createRequestSchema, searchRequestsSchema, updateRequestSchema } from "./requests.schemas";

export const requestsRouter = Router();

const include = { sender: true, departureCity: true, arrivalCity: true } as const;

requestsRouter.get(
  "/",
  optionalAuth,
  validate({ query: searchRequestsSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof searchRequestsSchema>;

    const where: Record<string, unknown> = { status: "OPEN" };
    if (q.departureCityId) where.departureCityId = q.departureCityId;
    if (q.arrivalCityId) where.arrivalCityId = q.arrivalCityId;
    if (q.category) where.category = q.category;
    if (q.isUrgent !== undefined) where.isUrgent = q.isUrgent;
    if (req.userId) {
      const blockedIds = await getBlockedUserIds(req.userId);
      if (blockedIds.length > 0) where.senderId = { notIn: blockedIds };
    }

    const [requests, total] = await Promise.all([
      prisma.packageRequest.findMany({
        where,
        include,
        orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.packageRequest.count({ where }),
    ]);

    res.json({ requests: requests.map(serializeRequest), total, page: q.page, pageSize: q.pageSize });
  }),
);

requestsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const requests = await prisma.packageRequest.findMany({
      where: { senderId: req.userId },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json({ requests: requests.map(serializeRequest) });
  }),
);

requestsRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const request = await prisma.packageRequest.findUnique({ where: { id: req.params.id }, include });
    if (!request) throw ApiError.notFound("Demande introuvable");
    res.json({ request: serializeRequest(request) });
  }),
);

requestsRouter.post(
  "/",
  requireAuth,
  validate({ body: createRequestSchema }),
  asyncHandler(async (req, res) => {
    if (req.body.departureCityId === req.body.arrivalCityId) {
      throw ApiError.badRequest("La ville de départ et d'arrivée doivent être différentes");
    }
    const [departureCity, arrivalCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: req.body.departureCityId } }),
      prisma.city.findUnique({ where: { id: req.body.arrivalCityId } }),
    ]);
    if (!departureCity || !arrivalCity) throw ApiError.badRequest("Ville de départ ou d'arrivée invalide");

    const request = await prisma.packageRequest.create({
      data: { ...req.body, senderId: req.userId! },
      include,
    });
    res.status(201).json({ request: serializeRequest(request) });
  }),
);

async function requireRequestOwner(requestId: string, userId: string) {
  const request = await prisma.packageRequest.findUnique({ where: { id: requestId } });
  if (!request) throw ApiError.notFound("Demande introuvable");
  if (request.senderId !== userId) throw ApiError.forbidden("Vous n'êtes pas propriétaire de cette demande");
  return request;
}

requestsRouter.patch(
  "/:id",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: updateRequestSchema }),
  asyncHandler(async (req, res) => {
    await requireRequestOwner(req.params.id, req.userId!);
    const request = await prisma.packageRequest.update({ where: { id: req.params.id }, data: req.body, include });
    res.json({ request: serializeRequest(request) });
  }),
);

requestsRouter.delete(
  "/:id",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    await requireRequestOwner(req.params.id, req.userId!);
    await prisma.packageRequest.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
    res.status(204).send();
  }),
);
