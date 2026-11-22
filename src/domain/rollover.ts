/** Maghrib-based civil-date rollover resolution. */
import type { HijriApi } from "../api/client.js";
import { AppError } from "../errors.js";
import type { ProfileId } from "../types.js";
import { addDays, gregorianYearOf, parseInstant, todayInKarachi } from "./date.js";

export interface EffectiveDate {
  date: string;
  rolloverApplied: boolean;
}

export interface ResolveEffectiveDateInput {
  now: Date;
  api: HijriApi;
  city: string;
  profile: ProfileId;
  afterMaghrib: boolean;
}

export async function resolveEffectiveDate(
  input: ResolveEffectiveDateInput,
): Promise<EffectiveDate> {
  const civil = todayInKarachi(input.now);
  if (!input.afterMaghrib) return { date: civil, rolloverApplied: false };

  const prayer = await input.api.getPrayer(input.city, input.profile, gregorianYearOf(civil));
  const day = prayer.days[civil];
  if (!day) {
    throw new AppError("PRAYER_DATA_UNAVAILABLE", `Prayer data is missing for ${civil}.`, {
      details: { city: input.city, date: civil, profile: input.profile },
    });
  }

  const maghrib = parseInstant(day.times.maghrib);
  if (input.now.getTime() >= maghrib) {
    return { date: addDays(civil, 1), rolloverApplied: true };
  }
  return { date: civil, rolloverApplied: false };
}
