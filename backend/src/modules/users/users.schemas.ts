import { z } from "zod";
import { DOCUMENT_TYPES } from "@colismonde/shared";

export const updateMeSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
});

export const uploadDocumentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
