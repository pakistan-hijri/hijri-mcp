import { describe, expect, it } from "vitest";
import {
  calendarFileSchema,
  calendarIndexSchema,
  citiesSchema,
  prayerFileSchema,
} from "../src/api/schema.js";
import { fixture } from "./helpers/fixtures.js";

describe("API schemas", () => {
  it("accepts published payload shapes", () => {
    expect(citiesSchema.safeParse(fixture("cities.json")).success).toBe(true);
    expect(calendarIndexSchema.safeParse(fixture("index.json")).success).toBe(true);
    expect(calendarFileSchema.safeParse(fixture("calendar-1448.json")).success).toBe(true);
    expect(prayerFileSchema.safeParse(fixture("prayer-karachi-2026.json")).success).toBe(true);
  });

  it("rejects malformed payloads", () => {
    expect(citiesSchema.safeParse(fixture("bad-cities.json")).success).toBe(false);
    expect(citiesSchema.safeParse([{ id: "karachi" }]).success).toBe(false);
  });
});
