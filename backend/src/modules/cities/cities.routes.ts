import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validate } from "@/middleware/validate";
import { asyncHandler } from "@/utils/asyncHandler";
import { serializeCity } from "@/utils/serializers";

export const citiesRouter = Router();

const searchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

citiesRouter.get(
  "/search",
  validate({ query: searchSchema }),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };

    const cities = await prisma.city.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ population: "desc" }],
      take: limit,
    });

    res.json({ cities: cities.map(serializeCity) });
  }),
);

citiesRouter.get(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const city = await prisma.city.findUnique({ where: { id: req.params.id } });
    if (!city) return res.status(404).json({ error: "NOT_FOUND", message: "Ville introuvable" });
    res.json({ city: serializeCity(city) });
  }),
);
