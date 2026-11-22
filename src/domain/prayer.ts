/** Ramadan Sehri/Iftar projection from published prayer offsets. */
import type { PrayerDay, RamadanWindow } from "../types.js";
import { parseInstant } from "./date.js";

export function projectRamadanWindow(
  hijriMonth: number,
  day: PrayerDay,
  sehriOffsetMin: number,
  iftarOffsetMin: number,
): RamadanWindow | null {
  if (hijriMonth !== 9) return null;
  return {
    sehri_ends: new Date(parseInstant(day.times.fajr) + sehriOffsetMin * 60_000).toISOString(),
    iftar: new Date(parseInstant(day.times.maghrib) + iftarOffsetMin * 60_000).toISOString(),
  };
}
