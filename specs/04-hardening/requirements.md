# 04 — Hardening: Requirements

## 1. Purpose

Make the server predictable under bad input, upstream failures, coverage gaps,
and protocol misuse. This milestone adds no new product tools.

## 2. Scope

**In scope**

- Complete error taxonomy and mapping.
- Coverage edge cases.
- Input validation edge cases.
- HTTP timeout, size limit, and malformed payload handling.
- Protocol tests over stdio.
- Logging and privacy checks.
- No stdout pollution.

**Out of scope**

- New tools or result fields.
- Disk cache or offline mode.
- Release automation.

Requirement IDs use `HARD-<AREA>-<n>`.

## 3. Functional requirements

### 3.1 Errors

- **HARD-ERR-1** — EVERY expected failure SHALL map to a stable code from
  `architecture.md` §11.
- **HARD-ERR-2** — Errors SHALL be actionable: name the input, route, coverage
  boundary, or accepted values.
- **HARD-ERR-3** — `NETWORK` SHALL be retryable; all validation and coverage
  errors SHALL be non-retryable.
- **HARD-ERR-4** — Unexpected exceptions SHALL map to `INTERNAL`, log the stack
  to stderr, and return no stack to the caller.
- **HARD-ERR-5** — Error results SHALL set `isError: true`.

### 3.2 Coverage and dates

- **HARD-COV-1** — THE SYSTEM SHALL test the boundary on `coverage_start`.
- **HARD-COV-2** — THE SYSTEM SHALL test the boundary on `confirmed_through`.
- **HARD-COV-3** — THE SYSTEM SHALL test dates before coverage and dates in
  unpublished years.
- **HARD-COV-4** — THE SYSTEM SHALL test explicit dates across Gregorian and
  Hijri year boundaries.
- **HARD-COV-5** — THE SYSTEM SHALL test rollover before, at, and after
  Maghrib, including missing prayer data.

### 3.3 Input validation

- **HARD-IN-1** — Impossible dates, malformed dates, unknown cities, unknown
  profiles, invalid months, and non-integer years SHALL return
  `INVALID_INPUT`/`UNKNOWN_*`.
- **HARD-IN-2** — Extra input properties SHALL be rejected.
- **HARD-IN-3** — Missing required inputs SHALL return `INVALID_INPUT`.

### 3.4 Transport and data

- **HARD-HTTP-1** — Timeout, DNS, connection, and non-2xx responses SHALL return
  `NETWORK`.
- **HARD-HTTP-2** — Oversized responses SHALL be rejected.
- **HARD-HTTP-3** — Invalid JSON and schema mismatches SHALL return
  `INVALID_DATA`.
- **HARD-HTTP-4** — No partial data SHALL be returned.

### 3.5 Protocol and privacy

- **HARD-PROTO-1** — Protocol tests SHALL spawn the built server and exercise
  all four tools.
- **HARD-PROTO-2** — stdout SHALL contain only MCP protocol messages.
- **HARD-PROTO-3** — Tool results SHALL NOT contain stack traces, environment
  values, or raw upstream bodies.
- **HARD-PROTO-4** — The server SHALL exit cleanly on transport close and
  signals.

## 4. Non-functional requirements

- **HARD-NFR-1** — Tests SHALL be deterministic and offline.
- **HARD-NFR-2** — Error tests SHALL assert both `isError` and the structured
  code.
- **HARD-NFR-3** — No new runtime dependency SHALL be added for hardening.

## 5. Traceability

Tasks are in `tasks.md`; error mapping and test strategy are in `design.md`.
