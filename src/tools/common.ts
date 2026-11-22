/** Shared zod pieces for public tool contracts. */
import { z } from "zod";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const cityIdSchema = z.enum(["karachi", "lahore", "peshawar", "quetta"]);

export const profileIdSchema = z.enum(["sunni_hanafi", "sunni_asr1", "shia_jafari"]);

export const confidenceSchema = z.enum(["confirmed", "estimated", "predicted", "unconfirmed"]);

export const announcementSchema = z.enum(["confirmed", "awaiting_announcement"]);

export const monthNameSchema = z
  .object({ en: z.string(), ur: z.string() })
  .strict();

export const errorSchema = z
  .object({
    code: z.enum([
      "INVALID_INPUT",
      "UNKNOWN_CITY",
      "UNKNOWN_PROFILE",
      "OUT_OF_COVERAGE",
      "NOT_PUBLISHED",
      "PRAYER_DATA_UNAVAILABLE",
      "NETWORK",
      "INVALID_DATA",
      "INTERNAL",
    ]),
    message: z.string(),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).nullable(),
  })
  .strict();

export function envelopeSchema<T extends z.ZodTypeAny>(data: T) {
  return z.discriminatedUnion("ok", [
    z.object({ ok: z.literal(true), data }).strict(),
    z.object({ ok: z.literal(false), error: errorSchema }).strict(),
  ]);
}

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const coverageSchema = z
  .object({
    start: dateString.nullable(),
    confirmed_through: dateString.nullable(),
  })
  .strict();

export const sourcesSchema = z.array(z.string()).nullable();

export const uncertaintySchema = z.number().int().nullable();

export const estimateRangeSchema = z
  .object({ earliest: dateString, latest: dateString })
  .strict()
  .nullable();
