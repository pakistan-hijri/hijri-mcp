/** The get_prayer_times tool contract and handler. */
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { announcementFor } from "../domain/coverage.js";
import { gregorianYearOf, parseCivilDate, todayInKarachi } from "../domain/date.js";
import { findHijriDay } from "../domain/hijri.js";
import { projectRamadanWindow } from "../domain/prayer.js";
import { AppError } from "../errors.js";
import type { PrayerTimesData } from "../types.js";
import {
  announcementSchema,
  cityIdSchema,
  confidenceSchema,
  dateString,
  envelopeSchema,
  monthNameSchema,
  profileIdSchema,
  READ_ONLY_ANNOTATIONS,
} from "./common.js";
import type { ToolDeps } from "./deps.js";
import { advertisedInput, parseInput } from "./input.js";
import { runTool } from "./result.js";

export const GET_PRAYER_TIMES_DESCRIPTION =
  "Return calculated prayer start times for a Pakistani city and profile on a Gregorian date. Includes Sehri and Iftar during Ramadan. Times are calculated, not congregation times.";

export const getPrayerTimesInput = z
  .object({
    city: cityIdSchema,
    profile: profileIdSchema.default("sunni_hanafi"),
    date: dateString.optional(),
  })
  .strict();

const timesSchema = z
  .object({
    fajr: z.string(),
    sunrise: z.string(),
    dhuhr: z.string(),
    asr: z.string(),
    maghrib: z.string(),
    isha: z.string(),
  })
  .strict();

const prayerTimesDataSchema = z
  .object({
    city: cityIdSchema,
    city_name: z.string(),
    province: z.string(),
    profile: profileIdSchema,
    profile_label: z.string(),
    date: dateString,
    timezone: z.literal("Asia/Karachi"),
    times: timesSchema,
    ramadan: z
      .object({ sehri_ends: z.string(), iftar: z.string() })
      .strict()
      .nullable(),
    hijri: z
      .object({
        date: dateString,
        year: z.number().int(),
        month: z.number().int(),
        day: z.number().int(),
        month_name: monthNameSchema,
        confidence: confidenceSchema,
        announcement: announcementSchema,
      })
      .strict(),
    disclaimer: z.string(),
    generated_at: z.string(),
  })
  .strict();

export const getPrayerTimesOutput = envelopeSchema(prayerTimesDataSchema);

export async function getPrayerTimes(
  input: z.infer<typeof getPrayerTimesInput>,
  deps: ToolDeps,
): Promise<PrayerTimesData> {
  const date = input.date !== undefined ? parseCivilDate(input.date) : todayInKarachi(deps.clock());
  const prayer = await deps.api.getPrayer(
    input.city,
    input.profile,
    gregorianYearOf(date),
  );
  const day = prayer.days[date];
  if (!day) {
    throw new AppError(
      "NOT_PUBLISHED",
      `Prayer data for ${input.city}/${input.profile}/${date} is not published.`,
      { details: { city: input.city, date, profile: input.profile, year: prayer.year } },
    );
  }

  const lookup = await findHijriDay(deps.api, date);
  const announcement = announcementFor(date, lookup.index.confirmed_through);

  return {
    city: prayer.city,
    city_name: prayer.city_name,
    province: prayer.province,
    profile: prayer.profile,
    profile_label: prayer.profile_label,
    date,
    timezone: "Asia/Karachi",
    times: day.times,
    ramadan: projectRamadanWindow(
      lookup.entry.month,
      day,
      prayer.sehri_offset_min,
      prayer.iftar_offset_min,
    ),
    hijri: {
      date: lookup.entry.hijri,
      year: lookup.entry.year,
      month: lookup.entry.month,
      day: lookup.entry.day,
      month_name: lookup.entry.month_name,
      confidence: lookup.entry.confidence,
      announcement,
    },
    disclaimer: prayer.disclaimer,
    generated_at: prayer.generated_at,
  };
}

export function registerGetPrayerTimes(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "get_prayer_times",
    {
      description: GET_PRAYER_TIMES_DESCRIPTION,
      inputSchema: advertisedInput(getPrayerTimesInput),
      outputSchema: getPrayerTimesOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    (input) =>
      runTool("get_prayer_times", deps.logger, async () => {
        const data = await getPrayerTimes(
          parseInput(getPrayerTimesInput, input, "get_prayer_times"),
          deps,
        );
        return {
          data,
          text: `Prayer times for ${data.city_name} on ${data.date} (${data.profile_label}).`,
        };
      }),
  );
}
