/** The get_month_start tool contract and handler. */
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { announcementFor, estimateRangeFor } from "../domain/coverage.js";
import { findHijriMonthStart } from "../domain/hijri.js";
import type { MonthStartData } from "../types.js";
import {
  announcementSchema,
  confidenceSchema,
  coverageSchema,
  dateString,
  envelopeSchema,
  estimateRangeSchema,
  monthNameSchema,
  READ_ONLY_ANNOTATIONS,
  sourcesSchema,
  uncertaintySchema,
} from "./common.js";
import type { ToolDeps } from "./deps.js";
import { advertisedInput, parseInput } from "./input.js";
import { runTool } from "./result.js";

export const GET_MONTH_START_DESCRIPTION =
  "Return the Gregorian start date of a Hijri month, with confidence and announcement status. Use for Ramadan, Eid, or month-boundary questions.";

export const getMonthStartInput = z
  .object({
    hijri_year: z.number().int().min(1),
    hijri_month: z.number().int().min(1).max(12),
  })
  .strict();

const monthStartDataSchema = z
  .object({
    hijri_year: z.number().int(),
    hijri_month: z.number().int(),
    month_name: monthNameSchema,
    start_gregorian: dateString,
    confidence: confidenceSchema,
    announcement: announcementSchema,
    sources: sourcesSchema,
    uncertainty_days: uncertaintySchema,
    estimate_range: estimateRangeSchema,
    coverage: coverageSchema,
  })
  .strict();

export const getMonthStartOutput = envelopeSchema(monthStartDataSchema);

export async function getMonthStart(
  input: z.infer<typeof getMonthStartInput>,
  deps: ToolDeps,
): Promise<MonthStartData> {
  const lookup = await findHijriMonthStart(
    deps.api,
    input.hijri_year,
    input.hijri_month,
  );
  const announcement = announcementFor(
    lookup.date,
    lookup.index.confirmed_through,
  );

  return {
    hijri_year: input.hijri_year,
    hijri_month: input.hijri_month,
    month_name: lookup.entry.month_name,
    start_gregorian: lookup.date,
    confidence: lookup.entry.confidence,
    announcement,
    sources: lookup.entry.sources ?? null,
    uncertainty_days: lookup.entry.uncertainty_days ?? null,
    estimate_range: estimateRangeFor(
      lookup.date,
      announcement,
      lookup.entry.uncertainty_days,
    ),
    coverage: {
      start: lookup.index.coverage_start,
      confirmed_through: lookup.index.confirmed_through,
    },
  };
}

export function registerGetMonthStart(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "get_month_start",
    {
      description: GET_MONTH_START_DESCRIPTION,
      inputSchema: advertisedInput(getMonthStartInput),
      outputSchema: getMonthStartOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    (input) =>
      runTool("get_month_start", deps.logger, async () => {
        const data = await getMonthStart(
          parseInput(getMonthStartInput, input, "get_month_start"),
          deps,
        );
        return {
          data,
          text: `${data.hijri_year}-${String(data.hijri_month).padStart(2, "0")} starts ${data.start_gregorian} (${data.confidence}, ${data.announcement}).`,
        };
      }),
  );
}
