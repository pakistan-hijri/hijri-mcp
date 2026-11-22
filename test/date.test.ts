import { describe, expect, it } from "vitest";
import { addDays, gregorianYearOf, parseCivilDate, todayInKarachi } from "../src/domain/date.js";

describe("civil date helpers", () => {
  it("parses valid dates and rejects invalid calendar days", () => {
    expect(parseCivilDate("2026-02-28")).toBe("2026-02-28");
    expect(() => parseCivilDate("2026-02-30")).toThrowError(
      expect.objectContaining({ code: "INVALID_INPUT" }),
    );
    expect(() => parseCivilDate("26-02-28")).toThrowError(
      expect.objectContaining({ code: "INVALID_INPUT" }),
    );
  });

  it("adds and subtracts days across month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("derives Karachi dates independent of machine timezone", () => {
    expect(todayInKarachi(new Date("2026-11-21T18:30:00Z"))).toBe("2026-11-21");
    expect(todayInKarachi(new Date("2026-11-21T20:30:00Z"))).toBe("2026-11-22");
  });

  it("extracts the Gregorian year", () => {
    expect(gregorianYearOf("2026-11-21")).toBe(2026);
  });
});
