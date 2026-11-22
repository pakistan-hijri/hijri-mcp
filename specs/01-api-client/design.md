# 01 — API Client: Design

## 1. Rationale

The MCP tools need a small, typed data layer that is independent of MCP. Keeping
transport, validation, cache, and pure date logic separate makes the tool
handlers thin and the date behavior testable without a host or network.

The server reads `hijri-api` directly. `hijri-cli` is a behavioral reference
only; there is no runtime dependency, import, or subprocess.

## 2. Interfaces

```ts
export interface HijriApi {
  getCities(): Promise<City[]>;
  getIndex(): Promise<CalendarIndex>;
  getCalendar(hijriYear: number): Promise<CalendarFile>;
  getPrayer(city: string, profile: ProfileId, year: number): Promise<PrayerFile>;
}

export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  getOrLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T>;
}

export interface HttpClient {
  getJson(url: string): Promise<unknown>;
}
```

`HijriApi` methods return validated data. They throw `AppError`; they do not
return partial or unvalidated payloads.

## 3. HTTP behavior

- Use global `fetch` with an injected implementation for tests.
- Default timeout: `HIJRI_MCP_HTTP_TIMEOUT_MS` or 10 seconds.
- Reject response bodies larger than 10 MiB.
- Non-2xx: `NETWORK`, message includes route and status.
- Timeout/abort: `NETWORK`, `retryable: true`, original error as `cause`.
- JSON parse or zod failure: `INVALID_DATA`, message names the route.
- Do not retry in v1. A retry can hide a persistent upstream failure and is not
  required for static files.

## 4. Schemas

`src/api/schema.ts` defines zod schemas matching `hijri-api` `src/types.ts`:

- `citySchema`
- `calendarIndexSchema`
- `calendarFileSchema`
- `prayerFileSchema`

Rules:

- Preserve `confidence`, `sources`, and `uncertainty_days` as published.
- Require `days` to be a record keyed by `YYYY-MM-DD`.
- Allow additive unknown fields at the top level? No. Use `.strict()` for
  payloads so drift is visible; add fields deliberately in a release.
- Keep schema types as the source of truth for API data.

## 5. Cache

`src/api/cache.ts` implements a process-local `Map`:

```ts
interface Entry {
  value: unknown;
  expiresAt: number;
}
```

- Key: absolute URL.
- TTL: per route, as specified.
- `getOrLoad` stores the in-flight promise so concurrent calls share one fetch.
- On rejection, remove the in-flight entry; do not cache errors.
- On expiry, refetch. No stale fallback.
- Clock and `fetch` are injectable for tests.

## 6. Date and coverage algorithms

### Karachi today

Use `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" })` on the injected
clock to produce `YYYY-MM-DD`. Do not use the machine timezone.

### Maghrib rollover

1. `civil = todayInKarachi(now)`.
2. Load prayer file for `city`, `profile`, Gregorian year of `civil`.
3. Read `days[civil].times.maghrib`; parse to an instant.
4. If `now >= maghrib`, `effective = addDays(civil, 1)`, else `civil`.
5. Set `rollover_applied` accordingly.
6. If prayer data is missing, throw `PRAYER_DATA_UNAVAILABLE`.

Explicit dates bypass this algorithm.

### Year selection

Use `Intl.DateTimeFormat("en-u-ca-islamic-umalqura")` to estimate the Hijri year
of the effective Gregorian date. Build candidates `[estimate-1, estimate,
estimate+1]`, filter to `index.hijri_years`, fetch each calendar, and return the
first day hit. If none, `OUT_OF_COVERAGE`.

### Announcement and estimates

```ts
const announcement =
  confirmedThrough !== null && effective <= confirmedThrough
    ? "confirmed"
    : "awaiting_announcement";
```

If awaiting and `uncertainty_days` is a positive integer, return
`{ earliest: addDays(date, -n), latest: addDays(date, n) }`; otherwise `null`.
Never invent an uncertainty value.

## 7. Ramadan projection

Use the prayer file’s `sehri_offset_min` and `iftar_offset_min`:

- `sehri_ends = fajr + sehri_offset_min`
- `iftar = maghrib + iftar_offset_min`

Only when the Hijri month is 9. Return `null` otherwise. The offsets are minutes
and may be negative.

## 8. Failure modes

| Failure | Code |
|---|---|
| Timeout, DNS, connection, non-2xx | `NETWORK` |
| Invalid JSON or schema | `INVALID_DATA` |
| Date before coverage | `OUT_OF_COVERAGE` |
| Date absent from all published years | `OUT_OF_COVERAGE` |
| Hijri year/month not published | `NOT_PUBLISHED` |
| Prayer year/day not published | `NOT_PUBLISHED` |
| Maghrib needed but missing | `PRAYER_DATA_UNAVAILABLE` |
| Unknown city | `UNKNOWN_CITY` |
| Unknown profile | `UNKNOWN_PROFILE` |

## 9. Testing

- Inject `fetch`, clock, and cache into unit tests.
- Use fixtures under `test/fixtures/`.
- Cover the test matrix in `date-and-coverage` requirements: boundaries,
  rollover, coverage, Ramadan, invalid payloads, cache expiry, and deduplication.
- No live network.

## 10. Open decisions

- **OD-01-1 — Retry policy.** Resolved: no retry in v1. Static files and a clear
  `NETWORK` error are enough; add bounded retry only if real usage shows
  transient failures.
- **OD-01-2 — Stale cache.** Resolved: none in v1. Serving stale dates could
  misstate a religious date; return an error instead.
- **OD-01-3 — Schema strictness.** Resolved: strict top-level objects. Upstream
  additive fields require a deliberate schema update.
- **OD-01-4 — Year candidate count.** Resolved: estimate ± 1, filtered by the
  index. If a future dataset spans unusual boundaries, revisit.
