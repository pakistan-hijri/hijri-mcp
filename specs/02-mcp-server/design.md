# 02 — MCP Server: Design

## 1. Rationale

The server layer should be boring: construct an `McpServer`, attach instructions,
register four handlers, and serve stdio. Date and coverage decisions belong in
the API/domain layers. Keeping the server thin makes protocol behavior easy to
test and prevents MCP concerns from leaking into domain code.

## 2. Server instructions

The server is constructed with these instructions:

```text
This server provides Pakistan Hijri calendar dates and calculated prayer times
from the Pakistan Hijri dataset.

Rules:
- Do not answer Hijri dates from memory. Call get_hijri_date or get_month_start.
- Always report the returned confidence and announcement status. Never present an
  awaiting_announcement date as confirmed.
- Include sources when present and uncertainty_days when present.
- Prayer times are calculated start times for the selected city and profile, not
  congregation times.
- Use list_cities when the city or profile is unknown.
- Dates and times are for Asia/Karachi.
- If a tool returns an error, explain it. Do not invent a fallback date or time.
```

Instructions are advisory. Each tool description and result must stand alone.

## 3. Construction

```ts
const server = new McpServer(
  { name: "hijri-mcp", version: VERSION },
  { instructions: SERVER_INSTRUCTIONS },
);

registerListCities(server, deps);
registerGetHijriDate(server, deps);
registerGetMonthStart(server, deps);
registerGetPrayerTimes(server, deps);

await serveStdio(() => server);
```

The exact SDK call shape is verified against the installed
`@modelcontextprotocol/server` v2 types during implementation. Pin the SDK
version.

## 4. Result envelope

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

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

The MCP result:

```ts
{
  structuredContent: envelope,
  content: [{ type: "text", text: fallback }],
  ...(envelope.ok ? {} : { isError: true }),
}
```

`outputSchema` is a JSON Schema `oneOf` of the success and error shapes. The text
fallback is short: a sentence for success, `CODE: message` for errors.

## 5. Error mapping

| Code | Source |
|---|---|
| `INVALID_INPUT` | Tool input schema |
| `UNKNOWN_CITY` | City validation |
| `UNKNOWN_PROFILE` | Profile validation |
| `OUT_OF_COVERAGE` | Calendar lookup |
| `NOT_PUBLISHED` | Year/month/prayer lookup |
| `PRAYER_DATA_UNAVAILABLE` | Rollover |
| `NETWORK` | HTTP transport |
| `INVALID_DATA` | Schema validation |
| `INTERNAL` | Unexpected exception |

`INTERNAL` logs the stack to stderr and returns a generic message. It never
includes the stack in the tool result.

## 6. Configuration

```ts
interface Config {
  apiBaseUrl: string;
  httpTimeoutMs: number;
  logLevel: "error" | "warn" | "info" | "debug";
}
```

Defaults:

- `HIJRI_API_BASE_URL=https://pakistan-hijri.github.io/hijri-api`
- `HIJRI_MCP_HTTP_TIMEOUT_MS=10000`
- `HIJRI_MCP_LOG_LEVEL=warn`

Invalid values fail fast at startup with a stderr message and a non-zero exit.

## 7. Logging

`src/log.ts` writes JSON lines to stderr:

```json
{ "level": "info", "msg": "server started", "ts": "2026-11-21T..." }
```

No `console.log`. ESLint forbids it in `src/` except the logger’s
`process.stderr.write`.

## 8. Testing

- Start the built server with `@modelcontextprotocol/client` over stdio.
- Assert server name/version, instructions, four tool names, annotations, and
  input/output schemas.
- Call each tool with a fixture-backed API or a local HTTP fixture server.
- Assert `isError` and the envelope on failure.
- Assert stdout contains only protocol frames.

## 9. Open decisions

- **OD-02-1 — Output schema union.** Resolved: use `oneOf` for success and error.
  It keeps one envelope contract across all tools.
- **OD-02-2 — Text fallback detail.** Resolved: short human sentence for success;
  `CODE: message` for errors. Structured content is canonical.
- **OD-02-3 — SDK version.** Resolved: pin the exact installed v2 version.
- **OD-02-4 — HTTP fixture server.** Resolved: use a local Node HTTP server in
  protocol tests, not live network.
