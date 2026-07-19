import { z } from "zod";
import { ITEM_SIZES, PACKAGE_CATEGORIES } from "@colismonde/shared";

export const createRequestSchema = z.object({
  departureCityId: z.string().uuid(),
  arrivalCityId: z.string().uuid(),
  desiredDate: z.coerce.date(),
  weightKg: z.coerce.number().positive().max(1000),
  category: z.enum(PACKAGE_CATEGORIES),
  description: z.string().trim().min(1).max(1000),
  sizeEstimate: z.enum(ITEM_SIZES),
  isUrgent: z.coerce.boolean().default(false),
  offeredPrice: z.coerce.number().nonnegative().max(100000),
});

export const updateRequestSchema = createRequestSchema.partial().extend({
  status: z.enum(["OPEN", "MATCHED", "CANCELLED"]).optional(),
});

export const searchRequestsSchema = z.object({
  departureCityId: z.string().uuid().optional(),
  arrivalCityId: z.string().uuid().optional(),
  category: z.enum(PACKAGE_CATEGORIES).optional(),
  isUrgent: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
