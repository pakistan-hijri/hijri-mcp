# 03 — Tools: Tasks

## 1. Shared schemas

- [ ] Add shared zod pieces: date string, city enum, profile enum, coverage,
      sources, uncertainty, estimate range. (`TOOL-COMMON-1`, `TOOL-COMMON-4`)
- [ ] Add success/error envelope schemas for each tool. (`TOOL-COMMON-2`)
- [ ] Define read-only annotations once. (`MCP-TOOL-3`)

## 2. `list_cities`

- [ ] Implement description and empty input schema. (`TOOL-CITIES-1`)
- [ ] Project cities without coordinates/elevation. (`TOOL-CITIES-1`)
- [ ] Add profiles and coverage metadata. (`TOOL-CITIES-2`–`TOOL-CITIES-4`)
- [ ] Add unit and protocol tests. (`TOOL-COMMON-1`, `TOOL-COMMON-2`)

## 3. `get_hijri_date`

- [ ] Implement input schema and defaults. (`TOOL-DATE-1`, `TOOL-DATE-2`)
- [ ] Implement explicit-date path with no rollover. (`TOOL-DATE-3`)
- [ ] Implement today path with optional rollover. (`TOOL-DATE-4`)
- [ ] Build the full result shape. (`TOOL-DATE-5`, `TOOL-DATE-6`)
- [ ] Add tests for explicit, today, before/after Maghrib, coverage, and
      awaiting. (`TOOL-COMMON-1`–`TOOL-COMMON-4`)

## 4. `get_month_start`

- [ ] Implement input schema. (`TOOL-MONTH-1`)
- [ ] Build month-start result. (`TOOL-MONTH-2`)
- [ ] Return `NOT_PUBLISHED` for missing months. (`TOOL-MONTH-3`)
- [ ] Add tests for confirmed and awaiting month starts. (`TOOL-COMMON-2`)

## 5. `get_prayer_times`

- [ ] Implement input schema and defaults. (`TOOL-PRAY-1`, `TOOL-PRAY-2`)
- [ ] Build prayer result with Hijri summary. (`TOOL-PRAY-3`)
- [ ] Add Ramadan Sehri/Iftar. (`TOOL-PRAY-4`)
- [ ] Ensure no Maghrib rollover. (`TOOL-PRAY-5`)
- [ ] Add tests for Ramadan and non-Ramadan days. (`TOOL-COMMON-2`)

## 6. Exit criteria

- [ ] All four tools listed with descriptions, schemas, and annotations.
- [ ] Tool results are small and match `design.md`.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
