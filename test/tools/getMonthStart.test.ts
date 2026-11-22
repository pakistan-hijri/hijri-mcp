import { describe, expect, it } from "vitest";
import { silentLogger } from "../../src/log.js";
import { getMonthStart } from "../../src/tools/getMonthStart.js";
import { createFixtureApi } from "../helpers/api.js";

const deps = {
  api: createFixtureApi().api,
  clock: () => new Date("2026-11-21T00:00:00Z"),
  logger: silentLogger,
};

describe("getMonthStart", () => {
  it("returns a confirmed month start", async () => {
    const result = await getMonthStart({ hijri_year: 1448, hijri_month: 1 }, deps);
    expect(result).toMatchObject({
      hijri_year: 1448,
      hijri_month: 1,
      start_gregorian: "2026-06-17",
      confidence: "confirmed",
      announcement: "confirmed",
      sources: ["https://example.test/muharram"],
    });
  });

  it("returns an awaiting month start with an estimate range", async () => {
    const result = await getMonthStart({ hijri_year: 1448, hijri_month: 6 }, deps);
    expect(result).toMatchObject({
      start_gregorian: "2026-12-11",
      announcement: "awaiting_announcement",
      uncertainty_days: 2,
      estimate_range: { earliest: "2026-12-09", latest: "2026-12-13" },
    });
  });

  it("returns NOT_PUBLISHED for an unpublished month", async () => {
    await expect(
      getMonthStart({ hijri_year: 1448, hijri_month: 10 }, deps),
    ).rejects.toMatchObject({ code: "NOT_PUBLISHED" });
  });
});
