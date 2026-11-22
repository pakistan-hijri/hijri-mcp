# Architecture

The system overview for `hijri-mcp`. Milestone-specific rationale lives in
`specs/<milestone>/design.md`; this document records the stable shape those
milestones share.

## 1. Problem and audience

An LLM host such as Claude Desktop, Cursor, or VS Code needs trustworthy
Pakistan Hijri dates and prayer times. Models cannot answer these from memory:
the date depends on a published month-start record, the Islamic day changes at
Maghrib, and prayer times depend on city and calculation profile.

`hijri-mcp` is a local MCP server that gives the host four small, read-only tools
over the [`hijri-api`](https://github.com/pakistan-hijri/hijri-api) dataset. It
projects published data; it is not a second source of truth.

Goals:

- Correct Pakistan Hijri dates with visible confidence and coverage.
- Correct Maghrib rollover when the caller does not supply a date.
- Calculated prayer times for the four published cities and three profiles.
- Honest “awaiting announcement” behavior for dates beyond `confirmed_through`.
- A small, predictable tool surface that is cheap to call and easy to audit.
- Local stdio operation with no accounts, secrets, or remote service.

Non-goals:

- Computing Hijri dates, moon sightings, or prayer times locally.
- Supporting cities, profiles, or calculation methods the API does not publish.
- Writing data, editing overrides, or persisting user configuration.
- A full-month calendar tool or raw dataset dumps.
- HTTP/SSE transport, remote hosting, multi-tenancy, or telemetry.
- A runtime dependency on `hijri-cli` or any terminal UI.

## 2. System context

```mermaid
flowchart LR
    host["MCP host<br/>Claude Desktop / Cursor / VS Code"]
    server["hijri-mcp<br/>local stdio process"]
    api["hijri-api<br/>static JSON on GitHub Pages"]

    host <-->|"MCP JSON-RPC over stdio"| server
    server -->|"HTTPS GET"| api
```

The host starts the server, discovers four tools, and calls them. The server
fetches only the static files needed for the current request. There is no
inbound network listener, no database, and no shared state between processes.

## 3. Data source contract

Base URL: `https://pakistan-hijri.github.io/hijri-api`, overridable with
`HIJRI_API_BASE_URL`. All routes are static `GET` JSON.

| Route | Purpose |
|---|---|
| `/cities.json` | City id, name, province, coordinates, timezone |
| `/hijri/index.json` | Coverage start, `confirmed_through`, available Hijri years, baseline |
| `/hijri/calendar/<hijriYear>.json` | `days[YYYY-MM-DD]` to Hijri date, month names, confidence, optional sources or uncertainty |
| `/prayer/<city>/<profile>/<gregorianYear>.json` | Prayer metadata and `days[YYYY-MM-DD].times` as ISO datetimes with `+05:00` |

Published cities: `karachi`, `lahore`, `peshawar`, `quetta`.
Published profiles: `sunni_hanafi`, `sunni_asr1`, `shia_jafari`.

The server validates every payload with zod before caching or using it. Upstream
changes are additive by contract; a breaking change requires a new schema and a
new server release.

Important fields:

- `coverage_start` is the first confirmed month start.
- `confirmed_through` is the last published confirmed day, not the last
  confirmed first-of-month.
- `confidence` is one of `confirmed`, `estimated`, `predicted`, `unconfirmed`.
- Confirmed calendar entries have `sources`; predicted entries have
  `uncertainty_days`; an entry never has both.
- Prayer times are start times, not congregation times.

## 4. Design principles

1. **Read, don't compute.** Dates and prayer times come from the API. The only
   arithmetic is date addition, instant comparison, and applying published
   Sehri/Iftar offsets.
2. **Pure core, adapters at the edges.** Domain code is pure over typed data and
   an injected clock. Network, cache, logging, and MCP live behind adapters.
3. **Validate once, at the boundary.** Zod parses tool input and every external
   payload. Inward code trusts the parsed type.
4. **Uncertainty is visible.** Every Hijri result carries `confidence`,
   `announcement`, coverage, and optional sources/uncertainty.
5. **Small modules with one reason to change.** The module map in §6 is
   authoritative.
6. **stdout is protocol-only.** Diagnostics go to stderr. A stray
   `console.log` corrupts the MCP stream and is treated as a bug.

## 5. Runtime and transport

- Runtime: Node.js `>=20`, ESM, TypeScript compiled to `dist/`.
- Transport: MCP stdio only. JSON-RPC on stdin/stdout.
- Entry point: `src/index.ts`, launched as `hijri-mcp` or `npx -y hijri-mcp`.
- SDK: `@modelcontextprotocol/server` v2, with `McpServer` and `serveStdio`.
  Pin the exact v2 version; do not mix the v1 `@modelcontextprotocol/sdk`.
- Lifecycle: the host owns the process. The server handles `SIGINT` and
  `SIGTERM` by closing the transport and exiting cleanly.
- Concurrency: Node’s event loop handles concurrent tool calls. In-memory cache
  entries deduplicate in-flight fetches for the same URL.
- State: no session state. The only mutable state is the process-local cache.

## 6. Module map

```text
src/
  index.ts                 composition root: config, API client, server, signals
  server.ts                McpServer construction, instructions, tool registration
  config.ts                environment parsing and defaults
  log.ts                   stderr-only structured logging
  errors.ts                stable error codes and AppError
  types.ts                 shared domain and result types

  tools/
    result.ts              success/error envelope helpers
    list-cities.ts         list_cities handler
    get-hijri-date.ts      get_hijri_date handler
    get-month-start.ts     get_month_start handler
    get-prayer-times.ts    get_prayer_times handler

  domain/
    dates.ts               Karachi civil date, strict date parsing, day arithmetic
    coverage.ts            announcement status, estimate ranges, coverage checks
    hijri.ts               day lookup and month-start lookup over parsed calendars
    prayer.ts              prayer-day lookup, Ramadan Sehri/Iftar projection
    profiles.ts            profile ids, labels, and validation

  api/
    client.ts              typed methods for cities, index, calendar, prayer
    http.ts                fetch with timeout, size limit, status handling
    cache.ts               in-memory TTL cache and in-flight deduplication
    schema.ts              zod schemas for every upstream payload
```

Dependency direction:

```text
index
  ├── config
  ├── api
  └── server
        └── tools
              ├── api
              └── domain
```

Boundaries:

- **`domain` is pure.** It receives typed data and an injected clock. It does not
  fetch, read files, read environment variables, or write output.
- **`api` owns transport.** It fetches, validates, caches, and returns typed
  upstream data. It does not decide what the LLM should see.
- **`tools` own policy.** They validate tool input, orchestrate API reads, apply
  domain rules, and build the public result envelope.
- **`server` owns MCP.** It registers tool names, descriptions, schemas,
  annotations, and delegates to handlers. It does not contain date logic.
- **`index` owns wiring.** It reads configuration, constructs dependencies, and
  starts the transport.

## 7. Request flows

### `list_cities`

1. Fetch `/cities.json` and `/hijri/index.json` through the API client.
2. Project only `id`, `name`, `province`, and `timezone`; omit coordinates.
3. Add the fixed profile list and coverage metadata.
4. Return a success envelope.

### `get_hijri_date`

1. Validate `date`, `city`, `profile`, and `after_maghrib`.
2. If `date` is present, use it as an explicit civil-day lookup. Ignore
   `after_maghrib`; no rollover is applied.
3. If `date` is absent, compute today in `Asia/Karachi` from the injected clock.
4. If `after_maghrib` is true, load the prayer file for the city/profile and
   current Gregorian year, find that civil day’s Maghrib, and compare instants.
   If `now >= maghrib`, advance the effective Gregorian date by one day.
5. Fetch the index and the calendar year(s) that can contain the effective date.
   Use the `Intl` Umm al-Qura baseline to choose candidate Hijri years, then try
   the candidate and adjacent published years.
6. Find the day entry. A missing day is a coverage error, not a guess.
7. Build the result with Gregorian date, Hijri date, month names, confidence,
   sources, uncertainty, announcement status, estimate range, and coverage.

### `get_month_start`

1. Validate `hijri_year` and `hijri_month`.
2. Fetch the index; reject years not listed in `hijri_years`.
3. Fetch the calendar file for that year and find the entry whose Hijri day is 1.
4. If the month is not published, return a “not published” error.
5. Build the result with `start_gregorian`, confidence, sources, uncertainty,
   announcement status, estimate range, and coverage.

### `get_prayer_times`

1. Validate `city`, `profile`, and `date`.
2. Fetch `/cities.json`; reject unknown city ids.
3. If `date` is absent, use today in `Asia/Karachi`; prayer times do not roll
   over at Maghrib.
4. Fetch the prayer file for `city/profile/Gregorian year`.
5. Find the day. A missing day is a “not published” or coverage error.
6. Fetch the calendar day to identify Ramadan and expose a small Hijri summary.
7. If the Hijri month is Ramadan, add `sehri_ends` and `iftar` from the prayer
   file’s offsets.
8. Return times, metadata, Ramadan fields when applicable, and the disclaimer.

### Year selection for a Gregorian date

Calendar files are keyed by Hijri year. The server uses `Intl.DateTimeFormat`
with the Islamic Umm al-Qura calendar to estimate the Hijri year for a Gregorian
date, then tries that year and adjacent years present in `hijri_years`. The first
exact `days[gregorian]` hit wins. If none match, the date is outside published
coverage.

## 8. Date semantics

All civil dates are `YYYY-MM-DD` in `Asia/Karachi`, never the machine timezone.

- **Default convention: after Maghrib.** Before today’s Maghrib, the effective
  date is the civil date. At or after it, the effective date advances one civil
  day. `after_maghrib: false` disables the advance.
- **Explicit date:** a deterministic civil-day lookup. It ignores the current
  instant and never rolls over.
- **Cross-year:** a rollover or lookup may cross 31 December. The prayer lookup
  loads the next Gregorian year’s file only when needed.
- **Ramadan:** a day with Hijri month 9 gets
  `sehri_ends = fajr + sehri_offset_min` and
  `iftar = maghrib + iftar_offset_min`, both from the prayer file. Outside
  Ramadan the pair is `null`.
- **Confidence and announcement:** `confidence` is passed through from the API.
  `announcement` is `confirmed` on or before `confirmed_through`, otherwise
  `awaiting_announcement`.
- **Estimate range:** when awaiting and `uncertainty_days` is present, return
  `earliest` and `latest` by adding/subtracting those days.

## 9. LLM interface

The server is constructed with instructions that tell the model not to answer
Hijri dates from memory, to report confidence and announcement status, and not
to invent fallback data. The exact instructions, tool descriptions, input
schemas, and result shapes are in `specs/03-tools/design.md`.

Every tool returns:

```json
{ "ok": true, "data": {} }
```

or:

```json
{
  "ok": false,
  "error": {
    "code": "OUT_OF_COVERAGE",
    "message": "No calendar data covers 2024-01-01. Coverage starts 2025-06-27.",
    "retryable": false,
    "details": null
  }
}
```

Failures set `isError: true` and include a text fallback. Success results carry
`structuredContent` and a short text fallback. `outputSchema` describes the
envelope.

## 10. Cache and configuration

Cache is process-local and in-memory. It avoids repeated fetches of static files
within one host session; it is not an offline mode.

| Data | TTL |
|---|---|
| `/cities.json` | 7 days |
| `/hijri/index.json` | 7 days |
| `/hijri/calendar/<year>.json` | 12 hours |
| `/prayer/<city>/<profile>/<year>.json` | 30 days |

- Cache key: absolute URL, including the configured base URL.
- Cache only validated data.
- Deduplicate concurrent requests for the same URL.
- Do not serve stale data after a network failure in v1.
- No disk cache.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `HIJRI_API_BASE_URL` | `https://pakistan-hijri.github.io/hijri-api` | Alternate API build or local test server |
| `HIJRI_MCP_HTTP_TIMEOUT_MS` | `10000` | Per-request timeout |
| `HIJRI_MCP_LOG_LEVEL` | `warn` | `error`, `warn`, `info`, or `debug`; always stderr |

## 11. Failure modes

| Failure | Behaviour |
|---|---|
| Network unavailable | `NETWORK` error, retryable |
| HTTP non-2xx | `NETWORK` error naming route/status |
| Invalid JSON or schema | `INVALID_DATA`, no partial data |
| Date before `coverage_start` | `OUT_OF_COVERAGE` naming coverage start |
| Date not in any published calendar year | `OUT_OF_COVERAGE` |
| Hijri year not in `hijri_years` | `NOT_PUBLISHED` |
| Month not published | `NOT_PUBLISHED` |
| Prayer file/day missing | `NOT_PUBLISHED` |
| Maghrib needed for rollover but missing | `PRAYER_DATA_UNAVAILABLE` |
| Unknown city/profile | `UNKNOWN_CITY` / `UNKNOWN_PROFILE` |
| Invalid tool input | `INVALID_INPUT` |
| Unexpected failure | `INTERNAL`; log stack to stderr only |

## 12. Testing strategy

- Unit tests for date parsing, Karachi “today,” day arithmetic, rollover,
  coverage, estimate ranges, Ramadan, envelopes, and cache.
- Contract tests with committed fixtures for cities, index, calendar, and
  prayer. No live network in CI.
- Protocol tests using `@modelcontextprotocol/client` over stdio: tool
  discovery, schemas, annotations, instructions, success/error envelopes, and
  clean shutdown.
- Manual smoke in Claude Desktop, Cursor, and VS Code.
- A live smoke against the public API is manual, never part of CI.

## 13. Dependencies

Runtime:

| Dependency | Why |
|---|---|
| `@modelcontextprotocol/server` | MCP server SDK v2, stdio transport, tool registration |
| `zod` | Runtime validation of tool input and untrusted API JSON |

Dev dependencies are tooling: TypeScript, Vitest, ESLint, Prettier, and
`@modelcontextprotocol/client`.

No `hijri-cli`, no terminal UI, no date library, and no HTTP client. Node’s
global `fetch` and `Intl` are sufficient.

## 14. Milestones

| Milestone | Scope |
|---|---|
| `00-scaffolding` | Repository metadata, standards, package scaffold, CI |
| `01-api-client` | Schemas, HTTP, cache, typed client, domain date/coverage logic |
| `02-mcp-server` | MCP server, instructions, stdio, result envelope |
| `03-tools` | Four tools and their schemas/descriptions |
| `04-hardening` | Error paths, coverage edge cases, protocol tests |
| `05-docs-release` | README, host configs, packaging, release workflow |

## 15. Resolved decisions

- No runtime dependency on `hijri-cli`.
- Default city `karachi`; default profile `sunni_hanafi`; default
  `after_maghrib: true`.
- `get_hijri_date` takes an optional `profile` for deterministic Maghrib.
- Expose both API `confidence` and derived `announcement`.
- Include `estimate_range` only when `uncertainty_days` is present.
- Use a uniform `{ ok, data }` / `{ ok, error }` envelope.
- Include a small Hijri summary in prayer results.
- In-memory cache only; no stale fallback in v1.
- Node.js `>=20`; npm release with provenance.
- `list_cities` omits coordinates and elevation.
