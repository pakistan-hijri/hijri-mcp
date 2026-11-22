import { describe, expect, it } from "vitest";
import { silentLogger } from "../../src/log.js";
import { getPrayerTimes } from "../../src/tools/getPrayerTimes.js";
import { createFixtureApi } from "../helpers/api.js";

const deps = {
  api: createFixtureApi().api,
  clock: () => new Date("2026-11-21T10:00:00Z"),
  logger: silentLogger,
};

describe("getPrayerTimes", () => {
  it("returns non-Ramadan prayer data without rollover", async () => {
    const result = await getPrayerTimes(
      { city: "karachi", profile: "sunni_hanafi", date: "2026-06-17" },
      deps,
    );
    expect(result).toMatchObject({
      city: "karachi",
      date: "2026-06-17",
      timezone: "Asia/Karachi",
      ramadan: null,
      hijri: { date: "1448-01-01", month: 1, announcement: "confirmed" },
    });
    expect(result.times.maghrib).toBe("2026-06-17T19:20:00+05:00");
  });

  it("adds Ramadan Sehri and Iftar", async () => {
    const result = await getPrayerTimes(
      { city: "karachi", profile: "sunni_hanafi", date: "2026-12-20" },
      deps,
    );
    expect(result.hijri.month).toBe(9);
    expect(result.ramadan).toEqual({
      sehri_ends: "2026-12-20T00:55:00.000Z",
      iftar: "2026-12-20T12:55:00.000Z",
    });
  });

  it("returns NOT_PUBLISHED for a missing prayer day", async () => {
    await expect(
      getPrayerTimes(
        { city: "karachi", profile: "sunni_hanafi", date: "2026-06-19" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "NOT_PUBLISHED" });
  });
});
