import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, optionalAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/apiError";
import { serializeTrip } from "@/utils/serializers";
import { getBlockedUserIds } from "@/modules/blocks/blocks.routes";
import { createTripSchema, searchTripsSchema, updateTripSchema } from "./trips.schemas";

export const tripsRouter = Router();

const include = { traveler: true, departureCity: true, arrivalCity: true } as const;

tripsRouter.get(
  "/",
  optionalAuth,
  validate({ query: searchTripsSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof searchTripsSchema>;

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (q.departureCityId) where.departureCityId = q.departureCityId;
    if (q.arrivalCityId) where.arrivalCityId = q.arrivalCityId;
    if (q.departureCityName) where.departureCity = { name: { contains: q.departureCityName, mode: "insensitive" } };
    if (q.arrivalCityName) where.arrivalCity = { name: { contains: q.arrivalCityName, mode: "insensitive" } };
    if (q.category) where.acceptedCategories = { has: q.category };
    if (q.minWeightKg) where.availableWeightKg = { gte: q.minWeightKg };
    if (q.maxPricePerKg) where.pricePerKg = { lte: q.maxPricePerKg };
    if (q.dateFrom || q.dateTo) {
      where.departureDate = {
        ...(q.dateFrom ? { gte: q.dateFrom } : {}),
        ...(q.dateTo ? { lte: q.dateTo } : {}),
      };
    }
    // Le blocage doit être réellement effectif : on n'affiche jamais les trajets d'un utilisateur
    // bloqué (ou qui nous a bloqué) dans les résultats de recherche.
    if (req.userId) {
      const blockedIds = await getBlockedUserIds(req.userId);
      if (blockedIds.length > 0) where.travelerId = { notIn: blockedIds };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include,
        orderBy: { departureDate: "asc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({ trips: trips.map(serializeTrip), total, page: q.page, pageSize: q.pageSize });
  }),
);

tripsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const trips = await prisma.trip.findMany({
      where: { travelerId: req.userId },
      include,
      orderBy: { createdAt: "desc" },
    });
    res.json({ trips: trips.map(serializeTrip) });
  }),
);

tripsRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id }, include });
    if (!trip) throw ApiError.notFound("Trajet introuvable");
    res.json({ trip: serializeTrip(trip) });
  }),
);

tripsRouter.post(
  "/",
  requireAuth,
  validate({ body: createTripSchema }),
  asyncHandler(async (req, res) => {
    if (req.body.departureCityId === req.body.arrivalCityId) {
      throw ApiError.badRequest("La ville de départ et d'arrivée doivent être différentes");
    }
    const [departureCity, arrivalCity] = await Promise.all([
      prisma.city.findUnique({ where: { id: req.body.departureCityId } }),
      prisma.city.findUnique({ where: { id: req.body.arrivalCityId } }),
    ]);
    if (!departureCity || !arrivalCity) throw ApiError.badRequest("Ville de départ ou d'arrivée invalide");

    const trip = await prisma.trip.create({
      data: { ...req.body, travelerId: req.userId! },
      include,
    });
    res.status(201).json({ trip: serializeTrip(trip) });
  }),
);

async function requireTripOwner(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw ApiError.notFound("Trajet introuvable");
  if (trip.travelerId !== userId) throw ApiError.forbidden("Vous n'êtes pas propriétaire de ce trajet");
  return trip;
}

tripsRouter.patch(
  "/:id",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: updateTripSchema }),
  asyncHandler(async (req, res) => {
    await requireTripOwner(req.params.id, req.userId!);
    const trip = await prisma.trip.update({ where: { id: req.params.id }, data: req.body, include });
    res.json({ trip: serializeTrip(trip) });
  }),
);

tripsRouter.delete(
  "/:id",
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    await requireTripOwner(req.params.id, req.userId!);
    await prisma.trip.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
    res.status(204).send();
  }),
);
