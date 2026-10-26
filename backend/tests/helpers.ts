import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/utils/jwt";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}

/** Crée un utilisateur directement en base et renvoie un jeton d'accès valide pour lui. */
export async function createUser(prefix: string) {
  const user = await prisma.user.create({
    data: { email: uniqueEmail(prefix), passwordHash: "not-used", firstName: prefix, lastName: "Test" },
  });
  return { user, token: signAccessToken({ sub: user.id, email: user.email }) };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createCity(name: string, countryCode: string) {
  return prisma.city.upsert({
    where: { name_countryCode: { name, countryCode } },
    update: {},
    create: { name, country: countryCode, countryCode, lat: 0, lng: 0 },
  });
}

/** Un trajet Paris → Ouagadougou et une demande d'envoi compatible (5 kg de vêtements). */
export async function createMatchingTripAndRequest(travelerId: string, senderId: string) {
  const [paris, ouaga] = await Promise.all([createCity("Paris", "FR"), createCity("Ouagadougou", "BF")]);
  const departureDate = new Date(Date.now() + 7 * 86_400_000);

  const trip = await prisma.trip.create({
    data: {
      travelerId,
      departureCityId: paris.id,
      arrivalCityId: ouaga.id,
      departureDate,
      availableWeightKg: 20,
      pricePerKg: 8.5,
      acceptedCategories: ["CLOTHING", "DOCUMENTS"],
      maxItemSize: "MEDIUM",
      transportMode: "PLANE",
    },
  });

  const request = await prisma.packageRequest.create({
    data: {
      senderId,
      departureCityId: paris.id,
      arrivalCityId: ouaga.id,
      desiredDate: departureDate,
      weightKg: 5,
      category: "CLOTHING",
      description: "Vêtements pour la famille",
      sizeEstimate: "SMALL",
      offeredPrice: 30,
    },
  });

  return { trip, request };
}
