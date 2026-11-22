# 04 — Hardening: Tasks

## 1. Errors

- [ ] Complete `AppError` mapping for every code. (`HARD-ERR-1`–`HARD-ERR-4`)
- [ ] Ensure failures set `isError: true`. (`HARD-ERR-5`)
- [ ] Add actionable messages for coverage, publication, and prayer gaps.
      (`HARD-ERR-2`)

## 2. Coverage and dates

- [ ] Add boundary tests around `coverage_start` and `confirmed_through`.
      (`HARD-COV-1`, `HARD-COV-2`)
- [ ] Add before-coverage and unpublished-year tests. (`HARD-COV-3`)
- [ ] Add Gregorian and Hijri year-boundary tests. (`HARD-COV-4`)
- [ ] Add rollover before/at/after Maghrib and missing-prayer tests.
      (`HARD-COV-5`)

## 3. Input validation

- [ ] Add impossible-date, malformed-date, unknown-city/profile, and
      invalid-month tests. (`HARD-IN-1`)
- [ ] Reject extra properties. (`HARD-IN-2`)
- [ ] Reject missing required properties. (`HARD-IN-3`)

## 4. Transport and data

- [ ] Add timeout, connection, and non-2xx tests. (`HARD-HTTP-1`)
- [ ] Add oversized response test. (`HARD-HTTP-2`)
- [ ] Add invalid JSON and schema-mismatch tests. (`HARD-HTTP-3`)
- [ ] Assert no partial data. (`HARD-HTTP-4`)

## 5. Protocol and privacy

- [ ] Add stdio protocol tests for all four tools. (`HARD-PROTO-1`)
- [ ] Assert stdout is protocol-only. (`HARD-PROTO-2`)
- [ ] Assert no stack traces, env values, or raw bodies. (`HARD-PROTO-3`)
- [ ] Assert clean shutdown. (`HARD-PROTO-4`)

## 6. Exit criteria

- [ ] Every error code has a test.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] Protocol tests pass against the built server.
