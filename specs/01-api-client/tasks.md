# 01 — API Client: Tasks

Each task cites the requirements it satisfies.

## 1. Types and errors

- [ ] Define `City`, `CalendarIndex`, `CalendarFile`, `HijriDayEntry`,
      `PrayerFile`, `PrayerDay`, `ProfileId`, `Announcement`, and result types in
      `src/types.ts`. (`API-CAL-5`, `API-PRAY-2`)
- [ ] Define `AppError` with code, message, retryable, and optional cause in
      `src/errors.ts`. (`API-NFR-2`)
- [ ] Define profile constants and labels in `src/domain/profiles.ts`.
      (`API-PROFILE-1`)

## 2. Schemas

- [ ] Add zod schemas for cities, index, calendar, and prayer payloads.
      (`API-CITY-1`, `API-CAL-1`, `API-PRAY-2`)
- [ ] Add schema tests that accept published shapes and reject malformed
      payloads. (`API-HTTP-4`)

## 3. HTTP and cache

- [ ] Implement `getJson` with timeout, size limit, and typed errors.
      (`API-HTTP-1`–`API-HTTP-5`)
- [ ] Implement in-memory cache with TTL and in-flight deduplication.
      (`API-CACHE-1`–`API-CACHE-7`)
- [ ] Add cache tests for fresh hit, expiry, deduplication, and error eviction.
      (`API-CACHE-2`–`API-CACHE-6`)

## 4. Client

- [ ] Implement `HijriApi.getCities`, `getIndex`, `getCalendar`, and
      `getPrayer`. (`API-CITY-1`, `API-CAL-1`, `API-PRAY-1`)
- [ ] Validate city and profile inputs. (`API-CITY-2`, `API-PROFILE-2`)
- [ ] Add contract tests using `test/fixtures/`. (`API-HTTP-4`)

## 5. Dates and coverage

- [ ] Implement strict date parsing and `todayInKarachi` with an injected clock.
      (`API-DATE-1`)
- [ ] Implement `addDays` and date comparisons. (`API-DATE-2`)
- [ ] Implement Maghrib rollover, including missing-prayer error.
      (`API-DATE-2`–`API-DATE-5`)
- [ ] Implement candidate year selection and day lookup.
      (`API-CAL-2`–`API-CAL-5`)
- [ ] Implement month-start lookup. (`API-CAL-6`, `API-CAL-7`)
- [ ] Implement announcement and estimate range. (`API-COV-1`–`API-COV-4`)
- [ ] Implement Ramadan Sehri/Iftar projection. (`API-PRAY-4`)
- [ ] Add table-driven tests for the full date/coverage matrix. (`API-NFR-1`)

## 6. Exit criteria

- [ ] `npm run lint` passes.
- [ ] `npm test` passes offline.
- [ ] `npm run build` passes.
- [ ] No MCP imports exist in `src/api` or `src/domain`.
