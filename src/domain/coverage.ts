/** Announcement status and uncertainty-range derivation. */
import type { Announcement, EstimateRange } from "../types.js";
import { addDays } from "./date.js";

export function announcementFor(date: string, confirmedThrough: string | null): Announcement {
  if (confirmedThrough !== null && date <= confirmedThrough) return "confirmed";
  return "awaiting_announcement";
}

export function estimateRangeFor(
  date: string,
  announcement: Announcement,
  uncertaintyDays: number | undefined,
): EstimateRange | null {
  if (announcement !== "awaiting_announcement") return null;
  if (!Number.isInteger(uncertaintyDays) || (uncertaintyDays ?? 0) <= 0) return null;
  const days = uncertaintyDays as number;
  return { earliest: addDays(date, -days), latest: addDays(date, days) };
}
