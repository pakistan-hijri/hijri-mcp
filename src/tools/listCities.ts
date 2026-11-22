/** The list_cities tool contract and handler. */
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { publicProfiles } from "../domain/profiles.js";
import type { ListCitiesData } from "../types.js";
import {
  dateString,
  envelopeSchema,
  READ_ONLY_ANNOTATIONS,
} from "./common.js";
import type { ToolDeps } from "./deps.js";
import { advertisedInput, parseInput } from "./input.js";
import { runTool } from "./result.js";

export const LIST_CITIES_DESCRIPTION =
  "List the supported Pakistani cities, prayer-time profiles, and the Hijri dataset coverage window. Use this before asking the user to choose a city or profile.";

export const listCitiesInput = z.object({}).strict();

const listCitiesDataSchema = z
  .object({
    cities: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            province: z.string(),
            timezone: z.string(),
          })
          .strict(),
      ),
    profiles: z
      .array(z.object({ id: z.string(), label: z.string() }).strict()),
    coverage: z
      .object({
        start: dateString.nullable(),
        confirmed_through: dateString.nullable(),
        hijri_years: z.array(z.number().int()),
        confirmed_days: z.number().int(),
      })
      .strict(),
    baseline: z.string(),
    generated_at: z.string(),
  })
  .strict();

export const listCitiesOutput = envelopeSchema(listCitiesDataSchema);

export async function listCities(deps: ToolDeps): Promise<ListCitiesData> {
  const [cities, index] = await Promise.all([
    deps.api.getCities(),
    deps.api.getIndex(),
  ]);
  const profiles = publicProfiles();

  return {
    cities: cities.map(({ id, name, province, timezone }) => ({
      id,
      name,
      province,
      timezone,
    })),
    profiles,
    coverage: {
      start: index.coverage_start,
      confirmed_through: index.confirmed_through,
      hijri_years: index.hijri_years,
      confirmed_days: index.confirmed_days,
    },
    baseline: index.baseline,
    generated_at: index.generated_at,
  };
}

export function registerListCities(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "list_cities",
    {
      description: LIST_CITIES_DESCRIPTION,
      inputSchema: advertisedInput(listCitiesInput),
      outputSchema: listCitiesOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    (input) =>
      runTool("list_cities", deps.logger, async () => {
        parseInput(listCitiesInput, input, "list_cities");
        const data = await listCities(deps);
        return {
          data,
          text: `${data.cities.length} cities and ${data.profiles.length} profiles. Coverage starts ${data.coverage.start ?? "unknown"}.`,
        };
      }),
  );
}
