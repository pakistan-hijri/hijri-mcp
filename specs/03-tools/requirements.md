# 03 — Tools: Requirements

## 1. Purpose

Define and implement the four public MCP tools: `list_cities`,
`get_hijri_date`, `get_month_start`, and `get_prayer_times`.

## 2. Scope

**In scope**

- Tool descriptions and input/output schemas.
- Handler behavior for the four tools.
- Defaults for city, profile, and `after_maghrib`.
- Ramadan fields in prayer results.
- Projection rules: what is exposed and what is omitted.

**Out of scope**

- API transport and domain algorithms (milestone 01).
- MCP transport and envelope plumbing (milestone 02).
- README and release (milestone 05).

Requirement IDs use `TOOL-<NAME>-<n>`.

## 3. Functional requirements

### 3.1 `list_cities`

- **TOOL-CITIES-1** — THE TOOL SHALL return the published cities with `id`,
  `name`, `province`, and `timezone`, and SHALL omit coordinates and elevation.
- **TOOL-CITIES-2** — THE TOOL SHALL return the three published profiles with
  `id` and `label`.
- **TOOL-CITIES-3** — THE TOOL SHALL return coverage metadata:
  `start`, `confirmed_through`, `hijri_years`, and `confirmed_days`.
- **TOOL-CITIES-4** — THE TOOL SHALL return `baseline` and `generated_at`.

### 3.2 `get_hijri_date`

- **TOOL-DATE-1** — THE TOOL SHALL accept optional `date`, `city`, `profile`,
  and `after_maghrib`.
- **TOOL-DATE-2** — Defaults SHALL be `city: karachi`, `profile: sunni_hanafi`,
  and `after_maghrib: true`.
- **TOOL-DATE-3** — WHEN `date` is present, THE TOOL SHALL perform an explicit
  civil-day lookup and SHALL NOT apply rollover.
- **TOOL-DATE-4** — WHEN `date` is absent, THE TOOL SHALL use today in
  `Asia/Karachi` and apply rollover when requested.
- **TOOL-DATE-5** — THE TOOL SHALL return `query`, `civil_date`, `gregorian`,
  `hijri` (date, year, month, day, month_name), `confidence`, `announcement`,
  `sources`, `uncertainty_days`, `estimate_range`, `rollover_applied`,
  `timezone`, and `coverage`.
- **TOOL-DATE-6** — `gregorian` SHALL be the effective date; `civil_date` SHALL
  be the pre-rollover date.

### 3.3 `get_month_start`

- **TOOL-MONTH-1** — THE TOOL SHALL require `hijri_year` and `hijri_month`.
- **TOOL-MONTH-2** — THE TOOL SHALL return `hijri_year`, `hijri_month`,
  `month_name`, `start_gregorian`, `confidence`, `announcement`, `sources`,
  `uncertainty_days`, `estimate_range`, and `coverage`.
- **TOOL-MONTH-3** — WHEN the month is not published, THE TOOL SHALL return
  `NOT_PUBLISHED`.

### 3.4 `get_prayer_times`

- **TOOL-PRAY-1** — THE TOOL SHALL require `city` and accept optional `profile`
  and `date`.
- **TOOL-PRAY-2** — Defaults SHALL be `profile: sunni_hanafi` and today in
  Pakistan for `date`.
- **TOOL-PRAY-3** — THE TOOL SHALL return city metadata, profile metadata, date,
  timezone, six times, Ramadan fields, a Hijri summary, disclaimer, and
  `generated_at`.
- **TOOL-PRAY-4** — WHEN the Hijri month is Ramadan, `ramadan` SHALL contain
  `sehri_ends` and `iftar`; otherwise it SHALL be `null`.
- **TOOL-PRAY-5** — Prayer times SHALL NOT roll over at Maghrib.

### 3.5 Shared behavior

- **TOOL-COMMON-1** — EVERY tool SHALL validate input with zod and return
  `INVALID_INPUT` on failure.
- **TOOL-COMMON-2** — EVERY success SHALL use the milestone 02 envelope.
- **TOOL-COMMON-3** — EVERY result SHALL include `coverage` with `start` and
  `confirmed_through`, except where the tool has no date context.
- **TOOL-COMMON-4** — Optional absent values SHALL be explicit `null`.
- **TOOL-COMMON-5** — Tool descriptions SHALL tell the model when to use the tool
  and what not to infer.

## 4. Non-functional requirements

- **TOOL-NFR-1** — Tool handlers SHALL contain orchestration, not date
  algorithms or HTTP details.
- **TOOL-NFR-2** — Tool schemas SHALL be the single source for MCP input and
  output validation.
- **TOOL-NFR-3** — Tool results SHALL be small; no raw calendar files or
  month-wide dumps.

## 5. Traceability

Schemas, descriptions, and result examples are in `design.md`. Tasks are in
`tasks.md`.
