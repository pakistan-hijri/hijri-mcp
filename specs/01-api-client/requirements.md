# 01 — API Client: Requirements

## 1. Purpose

Provide the typed, validated, cached data layer and pure date/coverage logic
behind the MCP tools. This milestone contains no MCP registration and no tool
output.

## 2. Scope

**In scope**

- HTTP transport with timeout and response-size limit.
- In-memory TTL cache with in-flight deduplication.
- Zod validation of every external payload.
- City, index, calendar-year, and prayer-year loading.
- Hijri year selection and calendar-day lookup.
- Karachi civil-date helpers and Maghrib rollover.
- Announcement status, estimate ranges, and coverage checks.
- Ramadan Sehri/Iftar projection.
- Stable typed errors with preserved causes.

**Out of scope**

- MCP server construction and tool registration (milestone 02).
- Tool input schemas and descriptions (milestone 03).
- Disk cache, offline mode, and stale fallback.
- Computing dates or prayer times.
- CLI output, prompts, or configuration files.

Requirement IDs use `API-<AREA>-<n>` and are referenced from `tasks.md`.

## 3. Definitions

- **Civil date** — `YYYY-MM-DD` in `Asia/Karachi`.
- **Effective date** — the civil date after applying Maghrib rollover.
- **Hijri day entry** — one value in `calendar.days[date]`.
- **Prayer day** — one value in `prayer.days[date]`, with six ISO instants.
- **Confirmed through** — the last published confirmed Gregorian day.
- **Announcement** — `confirmed` on or before `confirmed_through`, otherwise
  `awaiting_announcement`.

## 4. Functional requirements

### 4.1 Cities and profiles

- **API-CITY-1** — WHEN the city list is requested, THE SYSTEM SHALL fetch
  `/cities.json`, validate it, and return every city with `id`, `name`,
  `province`, coordinates, and timezone.
- **API-CITY-2** — WHEN a city id is validated, THE SYSTEM SHALL accept it only
  when it appears in the validated city list.
- **API-PROFILE-1** — Profile ids and labels SHALL be defined once and match the
  API contract: `sunni_hanafi`, `sunni_asr1`, `shia_jafari`.
- **API-PROFILE-2** — WHEN an unknown profile is supplied, THE SYSTEM SHALL
  produce `UNKNOWN_PROFILE` listing the accepted ids.

### 4.2 Transport

- **API-HTTP-1** — EVERY outbound request SHALL have a configurable timeout with
  a default of 10 seconds.
- **API-HTTP-2** — NON-2xx responses SHALL produce a `NETWORK` error naming the
  route and status; the response body SHALL NOT be returned as data.
- **API-HTTP-3** — Responses SHALL be rejected when they exceed a fixed size
  limit.
- **API-HTTP-4** — Invalid JSON or schema failures SHALL produce `INVALID_DATA`
  naming the route; partial data SHALL NOT be returned.
- **API-HTTP-5** — Network and timeout failures SHALL preserve the original
  error as `cause`.

### 4.3 Cache

- **API-CACHE-1** — Responses SHALL be cached in memory by absolute URL.
- **API-CACHE-2** — WHEN a fresh cache entry exists, THE SYSTEM SHALL serve it
  without a network request.
- **API-CACHE-3** — WHEN an entry is expired, THE SYSTEM SHALL refetch it.
- **API-CACHE-4** — Concurrent requests for the same URL SHALL share one
  in-flight fetch.
- **API-CACHE-5** — Only validated data SHALL be cached.
- **API-CACHE-6** — THE SYSTEM SHALL NOT serve stale data after a network
  failure.
- **API-CACHE-7** — Cache TTLs SHALL be: cities 7 days, index 7 days, calendar
  12 hours, prayer 30 days.

### 4.4 Calendar

- **API-CAL-1** — THE SYSTEM SHALL fetch and validate `/hijri/index.json`,
  exposing `coverage_start`, `confirmed_through`, `hijri_years`, `baseline`,
  `confirmed_days`, and `generated_at`.
- **API-CAL-2** — WHEN a Gregorian date is looked up, THE SYSTEM SHALL select
  candidate Hijri years using an `islamic-umalqura` estimate and SHALL try
  adjacent years listed in `hijri_years` until the date is found.
- **API-CAL-3** — WHEN the requested date is before `coverage_start`, THE SYSTEM
  SHALL produce `OUT_OF_COVERAGE` including the coverage start.
- **API-CAL-4** — WHEN no published calendar year contains the date, THE SYSTEM
  SHALL produce `OUT_OF_COVERAGE`.
- **API-CAL-5** — Calendar lookups SHALL preserve the published Hijri date,
  month names, confidence, sources, and uncertainty exactly as received.
- **API-CAL-6** — WHEN a Hijri year is not in `hijri_years`, THE SYSTEM SHALL
  produce `NOT_PUBLISHED`.
- **API-CAL-7** — WHEN a Hijri month start is requested, THE SYSTEM SHALL find
  the entry whose day is 1 and return its Gregorian key.

### 4.5 Prayer

- **API-PRAY-1** — WHEN a prayer day is requested, THE SYSTEM SHALL fetch
  `/prayer/<city>/<profile>/<gregorianYear>.json` for the civil date’s Gregorian
  year and validate it.
- **API-PRAY-2** — The prayer lookup SHALL expose the six times, city and
  province metadata, profile label, disclaimer, generated time, and Sehri/Iftar
  offsets.
- **API-PRAY-3** — WHEN the requested prayer year or day is not published, THE
  SYSTEM SHALL produce `NOT_PUBLISHED` naming the city, profile, and year.
- **API-PRAY-4** — WHEN the Hijri month is 9, THE SYSTEM SHALL calculate
  `sehri_ends` as Fajr plus `sehri_offset_min` and `iftar` as Maghrib plus
  `iftar_offset_min`; otherwise it SHALL return `null`.

### 4.6 Dates and coverage

- **API-DATE-1** — THE SYSTEM SHALL derive the civil date from an injected clock
  in `Asia/Karachi`, independent of the machine timezone.
- **API-DATE-2** — WHEN `after_maghrib` is true and the current instant is at or
  after the civil day’s Maghrib, THE SYSTEM SHALL advance the effective date by
  one civil day and set `rollover_applied` true.
- **API-DATE-3** — WHEN `after_maghrib` is false, THE SYSTEM SHALL keep the
  civil date and set `rollover_applied` false.
- **API-DATE-4** — WHEN an explicit date is supplied, THE SYSTEM SHALL treat it
  as the effective date without applying a clock-based rollover.
- **API-DATE-5** — WHEN Maghrib is required for rollover but the prayer day is
  missing, THE SYSTEM SHALL produce `PRAYER_DATA_UNAVAILABLE`.
- **API-COV-1** — THE SYSTEM SHALL set `announcement` to `confirmed` when the
  effective date is on or before `confirmed_through`, otherwise
  `awaiting_announcement`.
- **API-COV-2** — THE SYSTEM SHALL expose both `confidence` and `announcement`;
  it SHALL NOT collapse them.
- **API-COV-3** — WHEN `announcement` is `awaiting_announcement` and
  `uncertainty_days` is a positive integer, THE SYSTEM SHALL return an
  `estimate_range` by adding and subtracting those days.
- **API-COV-4** — WHEN `uncertainty_days` is absent, `estimate_range` SHALL be
  `null`.

## 5. Non-functional requirements

- **API-NFR-1** — Unit tests SHALL be deterministic and offline; `fetch`,
  clocks, and cache SHALL be injected or faked.
- **API-NFR-2** — Errors SHALL carry a stable code, a human message, a
  retryable flag, and the original cause where one exists.
- **API-NFR-3** — The API and domain layers SHALL NOT import MCP, tools, or
  `process.stdout`.
- **API-NFR-4** — A live smoke against the deployed API SHALL be a manual
  verification step, never a unit test.

## 6. Traceability

Each requirement above is covered by a task in `tasks.md`. Interfaces,
algorithms, and open decisions are in `design.md`.
