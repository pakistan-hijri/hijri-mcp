import { describe, expect, it } from "vitest";
import { projectRamadanWindow } from "../src/domain/prayer.js";
import type { PrayerFile } from "../src/types.js";
import { fixture } from "./helpers/fixtures.js";

const day = fixture<PrayerFile>("prayer-karachi-2026.json").days["2026-06-17"];

describe("projectRamadanWindow", () => {
  it("returns null outside Ramadan", () => {
    expect(projectRamadanWindow(1, day!, 10, 5)).toBeNull();
  });

  it("applies Sehri and Iftar offsets in Ramadan", () => {
    expect(projectRamadanWindow(9, day!, 10, 5)).toEqual({
      sehri_ends: "2026-06-16T23:25:00.000Z",
      iftar: "2026-06-17T14:25:00.000Z",
    });
  });
});
