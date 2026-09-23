import { z } from "zod";
import { ITEM_SIZES, PACKAGE_CATEGORIES, TRANSPORT_MODES } from "@colismonde/shared";

export const createTripSchema = z.object({
  departureCityId: z.string().uuid(),
  arrivalCityId: z.string().uuid(),
  departureDate: z.coerce.date(),
  arrivalDate: z.coerce.date().nullable().optional(),
  availableWeightKg: z.coerce.number().positive().max(1000),
  pricePerKg: z.coerce.number().nonnegative().max(10000),
  acceptedCategories: z.array(z.enum(PACKAGE_CATEGORIES)).min(1),
  maxItemSize: z.enum(ITEM_SIZES),
  transportMode: z.enum(TRANSPORT_MODES),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateTripSchema = createTripSchema.partial().extend({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export const searchTripsSchema = z.object({
  departureCityId: z.string().uuid().optional(),
  arrivalCityId: z.string().uuid().optional(),
  departureCityName: z.string().trim().max(100).optional(),
  arrivalCityName: z.string().trim().max(100).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  category: z.enum(PACKAGE_CATEGORIES).optional(),
  minWeightKg: z.coerce.number().positive().optional(),
  maxPricePerKg: z.coerce.number().positive().optional(),
  sort: z.enum(["date", "price_asc", "price_desc", "rating"]).default("date"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
