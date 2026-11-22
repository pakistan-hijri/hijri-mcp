/** The get_hijri_date tool contract and handler. */
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { announcementFor, estimateRangeFor } from "../domain/coverage.js";
import {
  parseCivilDate,
  todayInKarachi,
} from "../domain/date.js";
import { findHijriDay } from "../domain/hijri.js";
import { resolveEffectiveDate } from "../domain/rollover.js";
import type { HijriDateData } from "../types.js";
import {
  announcementSchema,
  cityIdSchema,
  confidenceSchema,
  coverageSchema,
  dateString,
  envelopeSchema,
  estimateRangeSchema,
  monthNameSchema,
  profileIdSchema,
  READ_ONLY_ANNOTATIONS,
  sourcesSchema,
  uncertaintySchema,
} from "./common.js";
import type { ToolDeps } from "./deps.js";
import { advertisedInput, parseInput } from "./input.js";
import { runTool } from "./result.js";

export const GET_HIJRI_DATE_DESCRIPTION =
  "Resolve a Gregorian civil date, or today in Pakistan, to the published Hijri date. When date is omitted, applies the Maghrib rollover by default using the selected city and profile. Returns confidence, announcement status, sources, uncertainty, and coverage. Never use this tool to answer dates outside the returned coverage.";

export const getHijriDateInput = z
  .object({
    date: dateString.optional(),
    city: cityIdSchema.default("karachi"),
    profile: profileIdSchema.default("sunni_hanafi"),
    after_maghrib: z.boolean().default(true),
  })
  .strict();

const hijriDateDataSchema = z
  .object({
    query: z
      .object({
        date: dateString.nullable(),
        city: cityIdSchema,
        profile: profileIdSchema,
        after_maghrib: z.boolean(),
      })
      .strict(),
    civil_date: dateString,
    gregorian: dateString,
    hijri: z
      .object({
        date: dateString,
        year: z.number().int(),
        month: z.number().int(),
        day: z.number().int(),
        month_name: monthNameSchema,
      })
      .strict(),
    confidence: confidenceSchema,
    announcement: announcementSchema,
    sources: sourcesSchema,
    uncertainty_days: uncertaintySchema,
    estimate_range: estimateRangeSchema,
    rollover_applied: z.boolean(),
    timezone: z.literal("Asia/Karachi"),
    coverage: coverageSchema,
  })
  .strict();

export const getHijriDateOutput = envelopeSchema(hijriDateDataSchema);

export async function getHijriDate(
  input: z.infer<typeof getHijriDateInput>,
  deps: ToolDeps,
): Promise<HijriDateData> {
  const now = deps.clock();
  let civilDate: string;
  let effectiveDate: string;
  let rolloverApplied = false;

  if (input.date !== undefined) {
    civilDate = parseCivilDate(input.date);
    effectiveDate = civilDate;
  } else {
    civilDate = todayInKarachi(now);
    const resolved = await resolveEffectiveDate({
      now,
      api: deps.api,
      city: input.city,
      profile: input.profile,
      afterMaghrib: input.after_maghrib,
    });
    effectiveDate = resolved.date;
    rolloverApplied = resolved.rolloverApplied;
  }

  const lookup = await findHijriDay(deps.api, effectiveDate);
  const announcement = announcementFor(effectiveDate, lookup.index.confirmed_through);

  return {
    query: {
      date: input.date ?? null,
      city: input.city,
      profile: input.profile,
      after_maghrib: input.after_maghrib,
    },
    civil_date: civilDate,
    gregorian: effectiveDate,
    hijri: {
      date: lookup.entry.hijri,
      year: lookup.entry.year,
      month: lookup.entry.month,
      day: lookup.entry.day,
      month_name: lookup.entry.month_name,
    },
    confidence: lookup.entry.confidence,
    announcement,
    sources: lookup.entry.sources ?? null,
    uncertainty_days: lookup.entry.uncertainty_days ?? null,
    estimate_range: estimateRangeFor(
      effectiveDate,
      announcement,
      lookup.entry.uncertainty_days,
    ),
    rollover_applied: rolloverApplied,
    timezone: "Asia/Karachi",
    coverage: {
      start: lookup.index.coverage_start,
      confirmed_through: lookup.index.confirmed_through,
    },
  };
}

export function registerGetHijriDate(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "get_hijri_date",
    {
      description: GET_HIJRI_DATE_DESCRIPTION,
      inputSchema: advertisedInput(getHijriDateInput),
      outputSchema: getHijriDateOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    (input) =>
      runTool("get_hijri_date", deps.logger, async () => {
        const data = await getHijriDate(
          parseInput(getHijriDateInput, input, "get_hijri_date"),
          deps,
        );
        return {
          data,
          text: `${data.gregorian} is ${data.hijri.date} (${data.confidence}, ${data.announcement}).`,
        };
      }),
  );
}
