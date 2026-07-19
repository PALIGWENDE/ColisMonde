import { z } from "zod";
import { INSURANCE_TIERS } from "@colismonde/shared";

export const createBookingSchema = z.object({
  tripId: z.string().uuid(),
  requestId: z.string().uuid(),
  insuranceTier: z.enum(INSURANCE_TIERS).default("BASIC"),
});

export const confirmDeliverySchema = z.object({
  confirmationCode: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres"),
});

export const advanceStatusSchema = z.object({
  location: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
});
