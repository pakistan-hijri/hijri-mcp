import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors.js";
import { getHijriDateInput } from "../../src/tools/getHijriDate.js";
import { getMonthStartInput } from "../../src/tools/getMonthStart.js";
import { parseInput } from "../../src/tools/input.js";

function failWith(schema: typeof getHijriDateInput | typeof getMonthStartInput, value: unknown) {
  try {
    parseInput(schema, value, "test_tool");
  } catch (error) {
    return error as AppError;
  }
  throw new Error("Expected parseInput to fail.");
}

describe("parseInput", () => {
  it("maps unknown cities to UNKNOWN_CITY", () => {
    const error = failWith(getHijriDateInput, { city: "islamabad" });
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("UNKNOWN_CITY");
    expect(error.retryable).toBe(false);
    expect(error.message).toContain("list_cities");
  });

  it("maps unknown profiles to UNKNOWN_PROFILE", () => {
    const error = failWith(getHijriDateInput, { profile: "bogus" });
    expect(error.code).toBe("UNKNOWN_PROFILE");
    expect(error.retryable).toBe(false);
  });

  it("rejects extra properties", () => {
    expect(failWith(getHijriDateInput, { city: "karachi", bogus: true }).code).toBe("INVALID_INPUT");
  });

  it("rejects missing required properties", () => {
    expect(failWith(getMonthStartInput, { hijri_year: 1448 }).code).toBe("INVALID_INPUT");
  });

  it("rejects invalid months", () => {
    expect(failWith(getMonthStartInput, { hijri_year: 1448, hijri_month: 13 }).code).toBe(
      "INVALID_INPUT",
    );
  });

  it("rejects malformed dates", () => {
    expect(failWith(getHijriDateInput, { date: "17-06-2026" }).code).toBe("INVALID_INPUT");
  });
});
