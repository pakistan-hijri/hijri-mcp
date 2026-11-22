/** Shared domain and public result types for hijri-mcp. */

export type ProfileId = "sunni_hanafi" | "sunni_asr1" | "shia_jafari";

export type Confidence = "confirmed" | "estimated" | "predicted" | "unconfirmed";

export type Announcement = "confirmed" | "awaiting_announcement";

export interface City {
  id: string;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
}

export interface PublicCity {
  id: string;
  name: string;
  province: string;
  timezone: string;
}

export interface MonthName {
  en: string;
  ur: string;
}

export interface HijriDayEntry {
  hijri: string;
  year: number;
  month: number;
  day: number;
  month_name: MonthName;
  confidence: Confidence;
  sources?: string[] | undefined;
  uncertainty_days?: number | undefined;
}

export interface CalendarFile {
  hijri_year: number;
  coverage_start: string | null;
  generated_at: string;
  baseline: string;
  days: Record<string, HijriDayEntry>;
}

export interface CalendarIndex {
  coverage_start: string | null;
  generated_at: string;
  baseline: string;
  hijri_years: number[];
  confirmed_days: number;
  confirmed_through: string | null;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface PrayerDay {
  date: string;
  times: PrayerTimes;
}

export interface PrayerFile {
  city: string;
  city_name: string;
  province: string;
  profile: ProfileId;
  profile_label: string;
  year: number;
  timezone: string;
  generated_at: string;
  disclaimer: string;
  sehri_offset_min: number;
  iftar_offset_min: number;
  days: Record<string, PrayerDay>;
}

export interface Coverage {
  start: string | null;
  confirmed_through: string | null;
}

export interface EstimateRange {
  earliest: string;
  latest: string;
}

export interface HijriSummary {
  date: string;
  year: number;
  month: number;
  day: number;
  month_name: MonthName;
  confidence: Confidence;
  announcement: Announcement;
}

export interface PublicProfile {
  id: ProfileId;
  label: string;
}

export interface ListCitiesData {
  cities: PublicCity[];
  profiles: PublicProfile[];
  coverage: Coverage & {
    hijri_years: number[];
    confirmed_days: number;
  };
  baseline: string;
  generated_at: string;
}

export interface HijriDateData {
  query: {
    date: string | null;
    city: string;
    profile: ProfileId;
    after_maghrib: boolean;
  };
  civil_date: string;
  gregorian: string;
  hijri: {
    date: string;
    year: number;
    month: number;
    day: number;
    month_name: MonthName;
  };
  confidence: Confidence;
  announcement: Announcement;
  sources: string[] | null;
  uncertainty_days: number | null;
  estimate_range: EstimateRange | null;
  rollover_applied: boolean;
  timezone: "Asia/Karachi";
  coverage: Coverage;
}

export interface MonthStartData {
  hijri_year: number;
  hijri_month: number;
  month_name: MonthName;
  start_gregorian: string;
  confidence: Confidence;
  announcement: Announcement;
  sources: string[] | null;
  uncertainty_days: number | null;
  estimate_range: EstimateRange | null;
  coverage: Coverage;
}

export interface RamadanWindow {
  sehri_ends: string;
  iftar: string;
}

export interface PrayerTimesData {
  city: string;
  city_name: string;
  province: string;
  profile: ProfileId;
  profile_label: string;
  date: string;
  timezone: "Asia/Karachi";
  times: PrayerTimes;
  ramadan: RamadanWindow | null;
  hijri: HijriSummary;
  disclaimer: string;
  generated_at: string;
}

export type ErrorCode =
  | "INVALID_INPUT"
  | "UNKNOWN_CITY"
  | "UNKNOWN_PROFILE"
  | "OUT_OF_COVERAGE"
  | "NOT_PUBLISHED"
  | "PRAYER_DATA_UNAVAILABLE"
  | "NETWORK"
  | "INVALID_DATA"
  | "INTERNAL";

export interface ToolError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details: Record<string, unknown> | null;
}

export type ToolEnvelope<T> = { ok: true; data: T } | { ok: false; error: ToolError };
