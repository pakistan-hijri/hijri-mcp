import { describe, expect, it } from "vitest";
import { announcementFor, estimateRangeFor } from "../src/domain/coverage.js";

describe("announcementFor", () => {
  it("marks dates through confirmed_through as confirmed", () => {
    expect(announcementFor("2026-12-10", "2026-12-10")).toBe("confirmed");
    expect(announcementFor("2026-12-09", "2026-12-10")).toBe("confirmed");
  });

  it("marks later dates as awaiting announcement", () => {
    expect(announcementFor("2026-12-11", "2026-12-10")).toBe("awaiting_announcement");
    expect(announcementFor("2026-12-11", null)).toBe("awaiting_announcement");
  });
});

describe("estimateRangeFor", () => {
  it("uses uncertainty only for awaiting dates", () => {
    expect(estimateRangeFor("2026-12-11", "awaiting_announcement", 2)).toEqual({
      earliest: "2026-12-09",
      latest: "2026-12-13",
    });
    expect(estimateRangeFor("2026-12-11", "confirmed", 2)).toBeNull();
  });

  it("never invents uncertainty", () => {
    expect(estimateRangeFor("2026-12-11", "awaiting_announcement", undefined)).toBeNull();
    expect(estimateRangeFor("2026-12-11", "awaiting_announcement", 0)).toBeNull();
    expect(estimateRangeFor("2026-12-11", "awaiting_announcement", -1)).toBeNull();
  });
});
