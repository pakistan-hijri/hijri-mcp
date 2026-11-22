# 03 — Tools: Tasks

## 1. Shared schemas

- [x] Add shared zod pieces: date string, city enum, profile enum, coverage,
      sources, uncertainty, estimate range. (`TOOL-COMMON-1`, `TOOL-COMMON-4`)
- [x] Add success/error envelope schemas for each tool. (`TOOL-COMMON-2`)
- [x] Define read-only annotations once. (`MCP-TOOL-3`)

## 2. `list_cities`

- [x] Implement description and empty input schema. (`TOOL-CITIES-1`)
- [x] Project cities without coordinates/elevation. (`TOOL-CITIES-1`)
- [x] Add profiles and coverage metadata. (`TOOL-CITIES-2`–`TOOL-CITIES-4`)
- [x] Add unit and protocol tests. (`TOOL-COMMON-1`, `TOOL-COMMON-2`)

## 3. `get_hijri_date`

- [x] Implement input schema and defaults. (`TOOL-DATE-1`, `TOOL-DATE-2`)
- [x] Implement explicit-date path with no rollover. (`TOOL-DATE-3`)
- [x] Implement today path with optional rollover. (`TOOL-DATE-4`)
- [x] Build the full result shape. (`TOOL-DATE-5`, `TOOL-DATE-6`)
- [x] Add tests for explicit, today, before/after Maghrib, coverage, and
      awaiting. (`TOOL-COMMON-1`–`TOOL-COMMON-4`)

## 4. `get_month_start`

- [x] Implement input schema. (`TOOL-MONTH-1`)
- [x] Build month-start result. (`TOOL-MONTH-2`)
- [x] Return `NOT_PUBLISHED` for missing months. (`TOOL-MONTH-3`)
- [x] Add tests for confirmed and awaiting month starts. (`TOOL-COMMON-2`)

## 5. `get_prayer_times`

- [x] Implement input schema and defaults. (`TOOL-PRAY-1`, `TOOL-PRAY-2`)
- [x] Build prayer result with Hijri summary. (`TOOL-PRAY-3`)
- [x] Add Ramadan Sehri/Iftar. (`TOOL-PRAY-4`)
- [x] Ensure no Maghrib rollover. (`TOOL-PRAY-5`)
- [x] Add tests for Ramadan and non-Ramadan days. (`TOOL-COMMON-2`)

## 6. Exit criteria

- [x] All four tools listed with descriptions, schemas, and annotations.
- [x] Tool results are small and match `design.md`.
- [x] `npm run lint`, `npm test`, and `npm run build` pass.
