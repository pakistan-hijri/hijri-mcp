import { describe, expect, it } from "vitest";
import { estimateHijriYear, findHijriDay, findHijriMonthStart } from "../src/domain/hijri.js";
import { createFixtureApi } from "./helpers/api.js";

describe("Hijri calendar helpers", () => {
  it("estimates the Hijri year with islamic-umalqura", () => {
    expect(estimateHijriYear("2026-06-17")).toBe(1448);
    expect(estimateHijriYear("2025-06-27")).toBe(1447);
  });

  it("finds a published calendar day", async () => {
    const { api } = createFixtureApi();
    const result = await findHijriDay(api, "2026-06-17");
    expect(result.entry).toMatchObject({
      hijri: "1448-01-01",
      month: 1,
      day: 1,
      confidence: "confirmed",
    });
  });

  it("rejects dates before coverage", async () => {
    const { api } = createFixtureApi();
    await expect(findHijriDay(api, "2025-06-26")).rejects.toMatchObject({
      code: "OUT_OF_COVERAGE",
    });
  });

  it("rejects dates absent from all published years", async () => {
    const { api } = createFixtureApi();
    await expect(findHijriDay(api, "2026-06-20")).rejects.toMatchObject({
      code: "OUT_OF_COVERAGE",
    });
  });

  it("finds a Hijri month start", async () => {
    const { api } = createFixtureApi();
    const result = await findHijriMonthStart(api, 1448, 1);
    expect(result.date).toBe("2026-06-17");
  });

  it("rejects unpublished Hijri years", async () => {
    const { api } = createFixtureApi();
    await expect(findHijriMonthStart(api, 9999, 1)).rejects.toMatchObject({
      code: "NOT_PUBLISHED",
    });
  });
});
