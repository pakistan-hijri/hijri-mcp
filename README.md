# hijri-mcp

A local read-only MCP server for Pakistan Hijri dates and calculated prayer
times, backed by `hijri-api`.

> Status: work in progress. The specification is stable; tool implementation is
> being delivered milestone by milestone.

## What it will expose

- `list_cities` — supported cities, profiles, and coverage.
- `get_hijri_date` — Gregorian-to-Hijri conversion for a city, with optional
  Maghrib rollover.
- `get_month_start` — first Gregorian day of a Hijri month.
- `get_prayer_times` — daily prayer times for a city and Sunni/Shia profile.

The server is stdio-only. It never reads local timezone settings: all dates and
prayer times are interpreted in `Asia/Karachi`.

## Requirements

- Node.js 20 or newer.

## Install and run

Once published:

```json
{
  "mcpServers": {
    "hijri": {
      "command": "npx",
      "args": ["-y", "hijri-mcp"]
    }
  }
}
```

For an already installed package:

```json
{
  "mcpServers": {
    "hijri": {
      "command": "hijri-mcp"
    }
  }
}
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HIJRI_API_BASE_URL` | `https://pakistan-hijri.github.io/hijri-api` | Override the upstream JSON base URL. |
| `HIJRI_MCP_HTTP_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds. |
| `HIJRI_MCP_LOG_LEVEL` | `warn` | One of `error`, `warn`, `info`, `debug`. Logs go to stderr only. |

## Confidence and announcement

Every Hijri date carries upstream `confidence` and a derived `announcement`
field:

- `announcement: "confirmed"` means the date is on or before upstream
  `confirmed_through`.
- `announcement: "awaiting_announcement"` means the date is beyond
  `confirmed_through`; treat it as provisional until a local authority
  announces.

When upstream supplies `uncertainty_days`, tools also return an
`estimate_range` of possible Gregorian dates.

## Disclaimer

Prayer times are calculated, not announced by a local authority. Hijri dates
after `confirmed_through` are estimates and are labelled accordingly. Always
follow your local moon-sighting authority for religious obligations.

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

The full engineering rules live in `specs/agent-practices.md`. Architecture and
tool contracts live in `specs/`.

## License

MIT
