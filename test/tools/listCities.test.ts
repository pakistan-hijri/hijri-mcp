import { describe, expect, it } from "vitest";
import { silentLogger } from "../../src/log.js";
import { listCities } from "../../src/tools/listCities.js";
import { createFixtureApi } from "../helpers/api.js";

describe("listCities", () => {
  it("projects cities, profiles, and coverage", async () => {
    const result = await listCities({
      api: createFixtureApi().api,
      clock: () => new Date("2026-11-21T00:00:00Z"),
      logger: silentLogger,
    });

    expect(result.cities).toHaveLength(2);
    expect(result.cities[0]).toEqual({
      id: "karachi",
      name: "Karachi",
      province: "Sindh",
      timezone: "Asia/Karachi",
    });
    expect(result.profiles).toHaveLength(3);
    expect(result.coverage).toMatchObject({
      start: "2025-06-27",
      confirmed_through: "2026-12-10",
      confirmed_days: 532,
    });
  });
});
