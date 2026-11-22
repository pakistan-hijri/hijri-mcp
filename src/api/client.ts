/** Validated, cached access to hijri-api static JSON routes. */
import { AppError } from "../errors.js";
import { assertProfile } from "../domain/profiles.js";
import type {
  CalendarFile,
  CalendarIndex,
  City,
  PrayerFile,
  ProfileId,
} from "../types.js";
import type { Cache } from "./cache.js";
import type { HttpClient } from "./http.js";
import {
  calendarFileSchema,
  calendarIndexSchema,
  citiesSchema,
  prayerFileSchema,
} from "./schema.js";

export interface HijriApi {
  getCities(): Promise<City[]>;
  getIndex(): Promise<CalendarIndex>;
  getCalendar(hijriYear: number): Promise<CalendarFile>;
  getPrayer(city: string, profile: ProfileId, year: number): Promise<PrayerFile>;
}

export interface HijriApiOptions {
  baseUrl: string;
  http: HttpClient;
  cache: Cache;
}

export const CACHE_TTL_MS = {
  cities: 7 * 24 * 60 * 60 * 1000,
  index: 7 * 24 * 60 * 60 * 1000,
  calendar: 12 * 60 * 60 * 1000,
  prayer: 30 * 24 * 60 * 60 * 1000,
} as const;

interface PayloadSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: unknown };
}

export function createHijriApi(options: HijriApiOptions): HijriApi {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");

  async function load<T>(
    path: string,
    schema: PayloadSchema<T>,
    ttlMs: number,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    return options.cache.getOrLoad(url, ttlMs, async () => {
      const raw = await options.http.getJson(url);
      const result = schema.safeParse(raw);
      if (!result.success) {
        throw new AppError("INVALID_DATA", `Invalid payload from ${path}.`, {
          cause: result.error,
        });
      }
      return result.data;
    });
  }

  async function getCities(): Promise<City[]> {
    return load("/cities.json", citiesSchema, CACHE_TTL_MS.cities);
  }

  async function requireCity(city: string): Promise<string> {
    const cities = await getCities();
    if (!cities.some((entry) => entry.id === city)) {
      throw new AppError("UNKNOWN_CITY", `Unknown city '${city}'.`, {
        details: { city, accepted: cities.map((entry) => entry.id) },
      });
    }
    return city;
  }

  return {
    getCities,
    getIndex: () => load("/hijri/index.json", calendarIndexSchema, CACHE_TTL_MS.index),
    getCalendar: (hijriYear) => {
      if (!Number.isInteger(hijriYear)) {
        throw new AppError("INVALID_INPUT", "Hijri year must be an integer.");
      }
      return load(
        `/hijri/calendar/${hijriYear}.json`,
        calendarFileSchema,
        CACHE_TTL_MS.calendar,
      );
    },
    getPrayer: async (city, profile, year) => {
      const validCity = await requireCity(city);
      const validProfile = assertProfile(profile);
      if (!Number.isInteger(year)) {
        throw new AppError("INVALID_INPUT", "Gregorian year must be an integer.");
      }
      return load(
        `/prayer/${encodeURIComponent(validCity)}/${validProfile}/${year}.json`,
        prayerFileSchema,
        CACHE_TTL_MS.prayer,
      );
    },
  };
}
