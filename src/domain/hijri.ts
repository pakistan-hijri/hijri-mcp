/** Hijri year estimation, calendar-day lookup, and month-start lookup. */
import type { HijriApi } from "../api/client.js";
import { AppError } from "../errors.js";
import type { CalendarIndex, HijriDayEntry } from "../types.js";
import { parseCivilDate } from "./date.js";

const HIJRI_YEAR_FORMAT = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  timeZone: "UTC",
  year: "numeric",
});

export interface HijriDayLookup {
  date: string;
  entry: HijriDayEntry;
  index: CalendarIndex;
}

export interface HijriMonthStartLookup {
  date: string;
  entry: HijriDayEntry;
  index: CalendarIndex;
}

export function estimateHijriYear(date: string): number {
  const parts = HIJRI_YEAR_FORMAT.formatToParts(new Date(`${parseCivilDate(date)}T00:00:00Z`));
  const raw = parts.find((part) => part.type === "year")?.value ?? "";
  const year = Number(raw.replace(/\D/g, ""));
  if (!Number.isFinite(year)) {
    throw new AppError("INTERNAL", "Could not estimate the Hijri year.");
  }
  return year;
}

export async function findHijriDay(api: HijriApi, date: string): Promise<HijriDayLookup> {
  const effectiveDate = parseCivilDate(date);
  const index = await api.getIndex();

  if (index.coverage_start !== null && effectiveDate < index.coverage_start) {
    throw new AppError("OUT_OF_COVERAGE", `Date ${effectiveDate} predates the published calendar.`, {
      details: { coverageStart: index.coverage_start, date: effectiveDate },
    });
  }

  const estimate = estimateHijriYear(effectiveDate);
  const candidates = [estimate - 1, estimate, estimate + 1].filter((year) =>
    index.hijri_years.includes(year),
  );

  for (const year of candidates) {
    const calendar = await api.getCalendar(year);
    const entry = calendar.days[effectiveDate];
    if (entry) return { date: effectiveDate, entry, index };
  }

  throw new AppError("OUT_OF_COVERAGE", `Date ${effectiveDate} is not in the published calendar.`, {
    details: { date: effectiveDate, hijriYears: index.hijri_years },
  });
}

export async function findHijriMonthStart(
  api: HijriApi,
  hijriYear: number,
  hijriMonth: number,
): Promise<HijriMonthStartLookup> {
  const index = await api.getIndex();
  if (!index.hijri_years.includes(hijriYear)) {
    throw new AppError("NOT_PUBLISHED", `Hijri year ${hijriYear} is not published.`, {
      details: { hijriYear, hijriYears: index.hijri_years },
    });
  }

  const calendar = await api.getCalendar(hijriYear);
  const matches = Object.entries(calendar.days)
    .filter(([, entry]) => entry.month === hijriMonth && entry.day === 1)
    .sort(([left], [right]) => left.localeCompare(right));

  const first = matches[0];
  if (!first) {
    throw new AppError(
      "NOT_PUBLISHED",
      `Hijri month ${hijriMonth} of ${hijriYear} is not published.`,
      { details: { hijriMonth, hijriYear } },
    );
  }

  return { date: first[0], entry: first[1], index };
}
