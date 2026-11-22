import { describe, expect, it } from "vitest";
import { silentLogger } from "../../src/log.js";
import { getHijriDate } from "../../src/tools/getHijriDate.js";
import { createFixtureApi } from "../helpers/api.js";

function deps(now = "2026-11-21T10:00:00Z") {
  return {
    api: createFixtureApi().api,
    clock: () => new Date(now),
    logger: silentLogger,
  };
}

describe("getHijriDate", () => {
  it("uses an explicit date without rollover", async () => {
    const result = await getHijriDate(
      {
        date: "2026-06-17",
        city: "karachi",
        profile: "sunni_hanafi",
        after_maghrib: true,
      },
      deps(),
    );

    expect(result).toMatchObject({
      civil_date: "2026-06-17",
      gregorian: "2026-06-17",
      rollover_applied: false,
      hijri: { date: "1448-01-01", month: 1, day: 1 },
      confidence: "confirmed",
      announcement: "confirmed",
    });
    expect(result.query).toEqual({
      date: "2026-06-17",
      city: "karachi",
      profile: "sunni_hanafi",
      after_maghrib: true,
    });
  });

  it("uses today in Karachi when no date is supplied", async () => {
    const result = await getHijriDate(
      { city: "karachi", profile: "sunni_hanafi", after_maghrib: true },
      deps(),
    );
    expect(result.civil_date).toBe("2026-11-21");
    expect(result.gregorian).toBe("2026-11-21");
    expect(result.query.date).toBeNull();
  });

  it("marks the confirmed_through boundary as confirmed", async () => {
    const result = await getHijriDate(
      {
        date: "2026-12-10",
        city: "karachi",
        profile: "sunni_hanafi",
        after_maghrib: true,
      },
      deps(),
    );
    expect(result.announcement).toBe("confirmed");
    expect(result.estimate_range).toBeNull();
  });

  it("resolves explicit dates across the Gregorian year boundary", async () => {
    const before = await getHijriDate(
      {
        date: "2026-12-31",
        city: "karachi",
        profile: "sunni_hanafi",
        after_maghrib: true,
      },
      deps(),
    );
    const after = await getHijriDate(
      {
        date: "2027-01-01",
        city: "karachi",
        profile: "sunni_hanafi",
        after_maghrib: true,
      },
      deps(),
    );
    expect(before.hijri.date).toBe("1448-09-12");
    expect(after.hijri.date).toBe("1448-09-13");
    expect(before.announcement).toBe("awaiting_announcement");
    expect(after.announcement).toBe("awaiting_announcement");
  });

  it("reports awaiting dates with an uncertainty range", async () => {
    const result = await getHijriDate(
      {
        date: "2026-12-11",
        city: "karachi",
        profile: "sunni_hanafi",
        after_maghrib: true,
      },
      deps(),
    );
    expect(result.announcement).toBe("awaiting_announcement");
    expect(result.uncertainty_days).toBe(2);
    expect(result.estimate_range).toEqual({
      earliest: "2026-12-09",
      latest: "2026-12-13",
    });
  });

  it("rejects impossible dates", async () => {
    await expect(
      getHijriDate(
        {
          date: "2026-02-30",
          city: "karachi",
          profile: "sunni_hanafi",
          after_maghrib: true,
        },
        deps(),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("rejects dates before coverage", async () => {
    await expect(
      getHijriDate(
        {
          date: "2025-06-26",
          city: "karachi",
          profile: "sunni_hanafi",
          after_maghrib: true,
        },
        deps(),
      ),
    ).rejects.toMatchObject({ code: "OUT_OF_COVERAGE" });
  });
});
