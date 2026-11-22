import { describe, expect, it, vi } from "vitest";
import type { HijriApi } from "../src/api/client.js";
import { resolveEffectiveDate } from "../src/domain/rollover.js";
import type { PrayerFile } from "../src/types.js";
import { fixture } from "./helpers/fixtures.js";

const prayer = fixture<PrayerFile>("prayer-karachi-2026.json");

function apiWithPrayer(file: PrayerFile): HijriApi {
  return {
    getPrayer: vi.fn().mockResolvedValue(file),
  } as unknown as HijriApi;
}

describe("resolveEffectiveDate", () => {
  it("keeps the civil date before Maghrib", async () => {
    const result = await resolveEffectiveDate({
      now: new Date("2026-11-21T10:00:00Z"),
      api: apiWithPrayer(prayer),
      city: "karachi",
      profile: "sunni_hanafi",
      afterMaghrib: true,
    });
    expect(result).toEqual({ date: "2026-11-21", rolloverApplied: false });
  });

  it("keeps the civil date just before Maghrib", async () => {
    const result = await resolveEffectiveDate({
      now: new Date("2026-11-21T12:44:59.000Z"),
      api: apiWithPrayer(prayer),
      city: "karachi",
      profile: "sunni_hanafi",
      afterMaghrib: true,
    });
    expect(result).toEqual({ date: "2026-11-21", rolloverApplied: false });
  });

  it("advances the civil date exactly at Maghrib", async () => {
    const result = await resolveEffectiveDate({
      now: new Date("2026-11-21T12:45:00.000Z"),
      api: apiWithPrayer(prayer),
      city: "karachi",
      profile: "sunni_hanafi",
      afterMaghrib: true,
    });
    expect(result).toEqual({ date: "2026-11-22", rolloverApplied: true });
  });

  it("does not fetch prayer data when rollover is disabled", async () => {
    const api = apiWithPrayer(prayer);
    const result = await resolveEffectiveDate({
      now: new Date("2026-11-21T14:00:00Z"),
      api,
      city: "karachi",
      profile: "sunni_hanafi",
      afterMaghrib: false,
    });
    expect(result).toEqual({ date: "2026-11-21", rolloverApplied: false });
    expect(api.getPrayer).not.toHaveBeenCalled();
  });

  it("fails clearly when prayer data is missing", async () => {
    await expect(
      resolveEffectiveDate({
        now: new Date("2026-06-19T10:00:00Z"),
        api: apiWithPrayer(prayer),
        city: "karachi",
        profile: "sunni_hanafi",
        afterMaghrib: true,
      }),
    ).rejects.toMatchObject({
      code: "PRAYER_DATA_UNAVAILABLE",
      message:
        "Maghrib is unavailable for karachi on 2026-06-19; use after_maghrib: false for a civil-date lookup.",
    });
  });
});
