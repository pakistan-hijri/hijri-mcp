import { readFileSync } from "node:fs";
import type { CalendarFile } from "../../src/types.js";

export function fixture<T>(name: string): T {
  const url = new URL(`../fixtures/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as T;
}

export function emptyCalendar(hijriYear: number): CalendarFile {
  return {
    hijri_year: hijriYear,
    coverage_start: "2025-06-27",
    generated_at: "2026-11-21T09:22:41.389Z",
    baseline: "islamic-umalqura (Intl)",
    days: {},
  };
}
