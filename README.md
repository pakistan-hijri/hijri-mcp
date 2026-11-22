# hijri-mcp

A local, read-only [Model Context Protocol](https://modelcontextprotocol.io)
server for Pakistan Hijri dates and calculated prayer times. It is a thin MCP
surface over [`hijri-api`](https://github.com/pakistan-hijri/hijri-api), which is
the source of truth for all calendar data.

`hijri-mcp` is **not** a moon-sighting authority, a congregation prayer-time
service, an offline calculator, or a general Islamic calendar library. It does
not ship a runtime dependency on `hijri-cli`. All dates and times are for
`Asia/Karachi`, and the server communicates only over stdio.

Version: `0.1.0`.

## Quick start

Node.js 20 or newer is required.

```bash
npx -y hijri-mcp
```

The process speaks MCP on stdin/stdout. Logs go to stderr only.

## Host configuration

### Claude Desktop

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

### Cursor

Use `.cursor/mcp.json` or `~/.cursor/mcp.json`:

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

### VS Code

Use `.vscode/mcp.json`:

```json
{
  "servers": {
    "hijri": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "hijri-mcp"]
    }
  }
}
```

Optional environment overrides can be added under `env`:

```json
{
  "env": {
    "HIJRI_API_BASE_URL": "https://pakistan-hijri.github.io/hijri-api"
  }
}
```

## Tools

All tools return a structured envelope:

```json
{ "ok": true, "data": {} }
```

Errors return `{ "ok": false, "error": { "code", "message", "retryable", "details" } }`
and set the MCP `isError` flag.

### `list_cities`

Lists supported cities, prayer-time profiles, and the upstream coverage window.
It takes no input. City records intentionally omit coordinates and elevation.

### `get_hijri_date`

Resolves a Gregorian date to a published Hijri date.

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `date` | `YYYY-MM-DD` | today in Karachi | Explicit dates skip Maghrib rollover. |
| `city` | string | `karachi` | One of `karachi`, `lahore`, `peshawar`, `quetta`. |
| `profile` | string | `sunni_hanafi` | One of `sunni_hanafi`, `sunni_asr1`, `shia_jafari`. |
| `after_maghrib` | boolean | `true` | Used only when `date` is omitted. |

The result includes the civil date, effective Gregorian date, Hijri date and
month name, confidence, announcement status, sources, uncertainty, estimated
range, rollover status, timezone, and coverage window.

### `get_month_start`

Returns the Gregorian start date of a Hijri month.

| Input | Type | Required |
| --- | --- | --- |
| `hijri_year` | integer | yes |
| `hijri_month` | integer 1–12 | yes |

Missing or unpublished months return `NOT_PUBLISHED`.

### `get_prayer_times`

Returns calculated prayer start times for one day.

| Input | Type | Default |
| --- | --- | --- |
| `city` | string | required |
| `profile` | string | `sunni_hanafi` |
| `date` | `YYYY-MM-DD` | today in Karachi |

No Maghrib rollover is applied. During Ramadan, the result also includes Sehri
and Iftar offsets. Times are calculated starts, not congregation times.

## Date, confidence, and announcement semantics

- `confidence` is copied from `hijri-api`: `confirmed`, `estimated`, `predicted`,
  or `unconfirmed`.
- `announcement` is derived: `confirmed` on or before upstream
  `confirmed_through`, otherwise `awaiting_announcement`.
- **Dates after `confirmed_through` are awaiting announcement and must not be
  presented as confirmed.**
- When upstream supplies `uncertainty_days`, tools return an `estimate_range`
  spanning that many days before and after the date. The server never invents an
  uncertainty range.
- Coverage failures return `OUT_OF_COVERAGE`; missing calendar or prayer records
  return `NOT_PUBLISHED`.

## Prayer-time disclaimer

Prayer times are calculated by the upstream dataset, not announced by a local
authority. Always defer to your local mosque or imambargah for congregation
times. For religious obligations, follow your local moon-sighting authority.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `HIJRI_API_BASE_URL` | `https://pakistan-hijri.github.io/hijri-api` | Override the upstream JSON base URL. |
| `HIJRI_MCP_HTTP_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds. |
| `HIJRI_MCP_LOG_LEVEL` | `warn` | One of `error`, `warn`, `info`, `debug`. |

Logs are JSON lines on stderr. Tool results never contain stack traces,
environment values, or raw upstream bodies.

## Development

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run pack:check
```

Engineering rules are in `specs/agent-practices.md`; architecture and tool
contracts are in `specs/`. Reports are milestone-scoped under `reports/`.

## License

MIT
