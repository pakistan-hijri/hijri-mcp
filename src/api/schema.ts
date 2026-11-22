/** Zod schemas for every hijri-api payload the server reads. */
import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const monthNameSchema = z
  .object({
    en: z.string(),
    ur: z.string(),
  })
  .strict();

const confidenceSchema = z.enum(["confirmed", "estimated", "predicted", "unconfirmed"]);

export const citySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    province: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    elevation: z.number(),
    timezone: z.string(),
  })
  .strict();

export const citiesSchema = z.array(citySchema);

export const calendarIndexSchema = z
  .object({
    coverage_start: dateString.nullable(),
    generated_at: z.string(),
    baseline: z.string(),
    hijri_years: z.array(z.number().int()),
    confirmed_days: z.number().int(),
    confirmed_through: dateString.nullable(),
  })
  .strict();

export const hijriDayEntrySchema = z
  .object({
    hijri: dateString,
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
    month_name: monthNameSchema,
    confidence: confidenceSchema,
    sources: z.array(z.string()).optional(),
    uncertainty_days: z.number().int().optional(),
  })
  .strict();

export const calendarFileSchema = z
  .object({
    hijri_year: z.number().int(),
    coverage_start: dateString.nullable(),
    generated_at: z.string(),
    baseline: z.string(),
    days: z.record(dateString, hijriDayEntrySchema),
  })
  .strict();

export const prayerTimesSchema = z
  .object({
    fajr: z.string(),
    sunrise: z.string(),
    dhuhr: z.string(),
    asr: z.string(),
    maghrib: z.string(),
    isha: z.string(),
  })
  .strict();

export const prayerDaySchema = z
  .object({
    date: dateString,
    times: prayerTimesSchema,
  })
  .strict();

export const prayerFileSchema = z
  .object({
    city: z.string(),
    city_name: z.string(),
    province: z.string(),
    profile: z.enum(["sunni_hanafi", "sunni_asr1", "shia_jafari"]),
    profile_label: z.string(),
    year: z.number().int(),
    timezone: z.string(),
    generated_at: z.string(),
    disclaimer: z.string(),
    sehri_offset_min: z.number(),
    iftar_offset_min: z.number(),
    days: z.record(dateString, prayerDaySchema),
  })
  .strict();
