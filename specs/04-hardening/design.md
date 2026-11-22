# 04 — Hardening: Design

## 1. Rationale

The server handles religious dates. Silent fallbacks are worse than errors. This
milestone makes every failure explicit, keeps error text actionable, and proves
the protocol boundary does not leak diagnostics.

## 2. Error mapping

| Condition | Code | Retryable |
|---|---|---|
| Malformed or impossible date | `INVALID_INPUT` | No |
| Unknown city | `UNKNOWN_CITY` | No |
| Unknown profile | `UNKNOWN_PROFILE` | No |
| Date before coverage or absent from all years | `OUT_OF_COVERAGE` | No |
| Hijri year/month or prayer year/day missing | `NOT_PUBLISHED` | No |
| Maghrib needed but prayer data missing | `PRAYER_DATA_UNAVAILABLE` | No |
| Timeout, DNS, connection, non-2xx | `NETWORK` | Yes |
| Invalid JSON or schema mismatch | `INVALID_DATA` | No |
| Unexpected exception | `INTERNAL` | No |

Error messages:

- `OUT_OF_COVERAGE`: “No calendar data covers YYYY-MM-DD. Coverage starts
  YYYY-MM-DD.”
- `NOT_PUBLISHED`: “Hijri month 9 of 1448 is not published.” or “Prayer data for
  karachi/sunni_hanafi/2027 is not published.”
- `PRAYER_DATA_UNAVAILABLE`: “Maghrib is unavailable for karachi on YYYY-MM-DD;
  use after_maghrib: false for a civil-date lookup.”
- `NETWORK`: “Could not reach pakistan-hijri.github.io for /hijri/index.json
  (HTTP 503).”

No stack traces, no raw response bodies, no environment values.

## 3. Test strategy

### Unit

- Boundary table around `coverage_start` and `confirmed_through`.
- Explicit dates before, on, and after the confirmed window.
- Rollover before, at, and after Maghrib.
- Missing prayer data for rollover.
- Gregorian year boundary and Hijri year boundary.
- Impossible dates and extra input properties.
- Timeout and oversized response.
- Malformed JSON and schema mismatch.
- Cache error eviction.

### Protocol

Spawn `node dist/index.js` with a local HTTP fixture server. For each tool:

- success result: `isError` absent/false, `ok: true`, schema-valid data;
- error result: `isError: true`, `ok: false`, stable code;
- text fallback present;
- stdout contains only protocol frames.

### Privacy

- Grep the test output for fixture secrets and environment values.
- Assert error text does not include stack frames or raw upstream bodies.

## 4. Logging

- `error`: startup failures and `INTERNAL`.
- `warn`: configuration warnings and unexpected upstream contradictions.
- `info`: server start/stop and tool name at debug only.
- `debug`: request route and timing; never full payloads.
- Logs are JSON lines on stderr.

## 5. Open decisions

- **OD-04-1 — Retry.** Resolved: no automatic retry. `NETWORK` is marked
  retryable for the caller.
- **OD-04-2 — Internal error detail.** Resolved: generic message to caller,
  stack to stderr.
- **OD-04-3 — Test HTTP server.** Resolved: local Node HTTP server with
  fixtures; no live API in CI.
