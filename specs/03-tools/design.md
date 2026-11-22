# 03 — Tools: Design

## 1. Rationale

Four tools cover the useful questions without turning the server into a generic
API proxy:

- What cities and profiles are supported?
- What is the Hijri date for a Gregorian date, or today?
- When does a Hijri month start?
- What are the prayer times for a city/profile/date?

Each result is a focused projection. The server never returns a full calendar
file or a month of rows.

## 2. Shared conventions

- Dates are strict `YYYY-MM-DD` in `Asia/Karachi`.
- Hijri dates include numeric fields and `month_name: { en, ur }`.
- Times are ISO 8601 with `+05:00`.
- `confidence` is passed through: `confirmed`, `estimated`, `predicted`,
  `unconfirmed`.
- `announcement` is `confirmed` or `awaiting_announcement`.
- `sources` is an array or `null`.
- `uncertainty_days` is an integer or `null`.
- `estimate_range` is `{ earliest, latest }` or `null`.
- Absent optional values are explicit `null`.

## 3. `list_cities`

Description:

```text
List the supported Pakistani cities, prayer-time profiles, and the Hijri dataset
coverage window. Use this before asking the user to choose a city or profile.
```

Input: empty object.

Success data:

```json
{
  "cities": [
    {
      "id": "karachi",
      "name": "Karachi",
      "province": "Sindh",
      "timezone": "Asia/Karachi"
    }
  ],
  "profiles": [
    { "id": "sunni_hanafi", "label": "Sunni (Hanafi)" },
    { "id": "sunni_asr1", "label": "Sunni (Asr 1)" },
    { "id": "shia_jafari", "label": "Shia (Jafari)" }
  ],
  "coverage": {
    "start": "2025-06-27",
    "confirmed_through": "2026-12-10",
    "hijri_years": [1447, 1448, 1449],
    "confirmed_days": 532
  },
  "baseline": "islamic-umalqura (Intl)",
  "generated_at": "2026-11-21T09:22:41.389Z"
}
```

Coordinates and elevation are omitted.

## 4. `get_hijri_date`

Description:

```text
Resolve a Gregorian civil date, or today in Pakistan, to the published Hijri
date. When date is omitted, applies the Maghrib rollover by default using the
selected city and profile. Returns confidence, announcement status, sources,
uncertainty, and coverage. Never use this tool to answer dates outside the
returned coverage.
```

Input:

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "date": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Optional Gregorian civil date in Asia/Karachi. Explicit dates never roll over at Maghrib."
    },
    "city": {
      "type": "string",
      "enum": ["karachi", "lahore", "peshawar", "quetta"],
      "default": "karachi",
      "description": "City used for the Maghrib rollover when date is omitted."
    },
    "profile": {
      "type": "string",
      "enum": ["sunni_hanafi", "sunni_asr1", "shia_jafari"],
      "default": "sunni_hanafi",
      "description": "Prayer profile used only to determine Maghrib for rollover."
    },
    "after_maghrib": {
      "type": "boolean",
      "default": true,
      "description": "When date is omitted, advance to the next Hijri day if the current instant is at or after Maghrib."
    }
  }
}
```

Success data:

```json
{
  "query": {
    "date": null,
    "city": "karachi",
    "profile": "sunni_hanafi",
    "after_maghrib": true
  },
  "civil_date": "YYYY-MM-DD",
  "gregorian": "YYYY-MM-DD",
  "hijri": {
    "date": "YYYY-MM-DD",
    "year": 1448,
    "month": 6,
    "day": 10,
    "month_name": { "en": "Month name", "ur": "Urdu month name" }
  },
  "confidence": "confirmed",
  "announcement": "confirmed",
  "sources": ["https://example.com/source"],
  "uncertainty_days": null,
  "estimate_range": null,
  "rollover_applied": false,
  "timezone": "Asia/Karachi",
  "coverage": {
    "start": "2025-06-27",
    "confirmed_through": "2026-12-10"
  }
}
```

`profile` is part of the input because Maghrib can differ by calculation
profile. It has no effect when `date` is supplied.

## 5. `get_month_start`

Description:

```text
Return the Gregorian start date of a Hijri month, with confidence and
announcement status. Use for Ramadan, Eid, or month-boundary questions.
```

Input:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["hijri_year", "hijri_month"],
  "properties": {
    "hijri_year": {
      "type": "integer",
      "minimum": 1,
      "description": "Hijri year, for example 1448."
    },
    "hijri_month": {
      "type": "integer",
      "minimum": 1,
      "maximum": 12,
      "description": "Hijri month number, 1-12. Ramadan is 9."
    }
  }
}
```

Success data:

```json
{
  "hijri_year": 1448,
  "hijri_month": 9,
  "month_name": { "en": "Ramadan", "ur": "رمضان" },
  "start_gregorian": "YYYY-MM-DD",
  "confidence": "predicted",
  "announcement": "awaiting_announcement",
  "sources": null,
  "uncertainty_days": 2,
  "estimate_range": { "earliest": "YYYY-MM-DD", "latest": "YYYY-MM-DD" },
  "coverage": {
    "start": "2025-06-27",
    "confirmed_through": "2026-12-10"
  }
}
```

If the month is not published, return `NOT_PUBLISHED`.

## 6. `get_prayer_times`

Description:

```text
Return calculated prayer start times for a Pakistani city and profile on a
Gregorian date. Includes Sehri and Iftar during Ramadan. Times are calculated,
not congregation times.
```

Input:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["city"],
  "properties": {
    "city": {
      "type": "string",
      "enum": ["karachi", "lahore", "peshawar", "quetta"],
      "description": "Published city id."
    },
    "profile": {
      "type": "string",
      "enum": ["sunni_hanafi", "sunni_asr1", "shia_jafari"],
      "default": "sunni_hanafi",
      "description": "Prayer calculation profile."
    },
    "date": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "Optional Gregorian civil date in Asia/Karachi. Defaults to today in Pakistan."
    }
  }
}
```

Success data:

```json
{
  "city": "karachi",
  "city_name": "Karachi",
  "province": "Sindh",
  "profile": "sunni_hanafi",
  "profile_label": "Sunni (Hanafi)",
  "date": "YYYY-MM-DD",
  "timezone": "Asia/Karachi",
  "times": {
    "fajr": "YYYY-MM-DDT05:00:00+05:00",
    "sunrise": "YYYY-MM-DDT06:00:00+05:00",
    "dhuhr": "YYYY-MM-DDT12:00:00+05:00",
    "asr": "YYYY-MM-DDT15:00:00+05:00",
    "maghrib": "YYYY-MM-DDT18:00:00+05:00",
    "isha": "YYYY-MM-DDT19:00:00+05:00"
  },
  "ramadan": null,
  "hijri": {
    "date": "YYYY-MM-DD",
    "year": 1448,
    "month": 6,
    "day": 10,
    "month_name": { "en": "Month name", "ur": "Urdu month name" },
    "confidence": "confirmed",
    "announcement": "confirmed"
  },
  "disclaimer": "Calculated times, not congregation times.",
  "generated_at": "2026-11-21T09:22:41.389Z"
}
```

During Ramadan:

```json
{
  "sehri_ends": "YYYY-MM-DDT05:00:00+05:00",
  "iftar": "YYYY-MM-DDT18:00:00+05:00"
}
```

Prayer times never roll over at Maghrib; the date is the civil date.

## 7. Output schema strategy

Define zod schemas for each `data` shape, then convert to JSON Schema for MCP
`outputSchema`. Wrap each in the success/error `oneOf` from milestone 02.

Use `z.null()` for explicit nullable fields. Do not use `.optional()` for public
result fields; emit `null` so the model sees a stable shape.

## 8. Handler shape

```ts
export function registerGetHijriDate(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "get_hijri_date",
    {
      description: GET_HIJRI_DATE_DESCRIPTION,
      inputSchema: getHijriDateInput,
      outputSchema: getHijriDateOutput,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async (input) => getHijriDate(input, deps),
  );
}
```

Handlers validate input, call the API/domain, and return `success(data)` or
`failure(error)`. They do not catch and swallow unknown errors; the server’s
wrapper maps them to `INTERNAL`.

## 9. Testing

- Table-driven tests for defaults, explicit dates, rollover, coverage,
  announcement, month starts, Ramadan, and errors.
- Protocol tests assert descriptions, schemas, and result shapes.
- Fixtures include confirmed, estimated, predicted, unconfirmed, Ramadan, and
  out-of-coverage cases.

## 10. Open decisions

- **OD-03-1 — `profile` on `get_hijri_date`.** Resolved: include it; Maghrib
  depends on profile.
- **OD-03-2 — Hijri summary in prayer results.** Resolved: include it; it lets
  the model identify Ramadan and report confidence.
- **OD-03-3 — Omit coordinates.** Resolved: omit; not needed by the model.
- **OD-03-4 — Explicit nulls.** Resolved: use explicit `null` for stable schemas.
