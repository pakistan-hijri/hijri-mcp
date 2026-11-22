/** Civil-date helpers for Asia/Karachi and strict YYYY-MM-DD handling. */
import { AppError } from "../errors.js";

export type Clock = () => Date;

const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const KARACHI_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parseCivilDate(value: string): string {
  const match = CIVIL_DATE_PATTERN.exec(value);
  if (!match) {
    throw new AppError("INVALID_INPUT", `Invalid date '${value}'. Use YYYY-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new AppError("INVALID_INPUT", `Invalid date '${value}'. Use YYYY-MM-DD.`);
  }

  return value;
}

export function todayInKarachi(now: Date): string {
  const parts = KARACHI_FORMAT.formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new AppError("INTERNAL", "Could not determine the current Karachi date.");
  }
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  const parsed = parseCivilDate(date);
  const shifted = new Date(`${parsed}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function gregorianYearOf(date: string): number {
  return Number(parseCivilDate(date).slice(0, 4));
}

export function parseInstant(value: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new AppError("PRAYER_DATA_UNAVAILABLE", "Prayer time is not a valid instant.");
  }
  return timestamp;
}
