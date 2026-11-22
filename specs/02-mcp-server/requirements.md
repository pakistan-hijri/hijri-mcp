# 02 — MCP Server: Requirements

## 1. Purpose

Provide the MCP process, server identity, stdio transport, tool registration
surface, and uniform result envelope. This milestone does not implement the four
tool contracts; milestone 03 does.

## 2. Scope

**In scope**

- `McpServer` construction with server instructions.
- stdio transport via `serveStdio`.
- Tool registration for the four named tools.
- Uniform success/error envelope.
- stderr-only logging.
- Environment configuration and graceful shutdown.
- Protocol test harness.

**Out of scope**

- Tool input schemas and descriptions (milestone 03).
- Domain and API behavior (milestone 01).
- README and release (milestone 05).

Requirement IDs use `MCP-<AREA>-<n>`.

## 3. Functional requirements

### 3.1 Process and transport

- **MCP-RUN-1** — THE SYSTEM SHALL run as a local stdio MCP server and SHALL NOT
  open an HTTP listener.
- **MCP-RUN-2** — THE SYSTEM SHALL use `@modelcontextprotocol/server` v2 with
  `McpServer` and `serveStdio`.
- **MCP-RUN-3** — THE SYSTEM SHALL write only MCP protocol data to stdout.
- **MCP-RUN-4** — THE SYSTEM SHALL write diagnostics and errors to stderr.
- **MCP-RUN-5** — THE SYSTEM SHALL handle `SIGINT` and `SIGTERM` by closing the
  transport and exiting cleanly.
- **MCP-RUN-6** — THE SYSTEM SHALL read `HIJRI_API_BASE_URL`,
  `HIJRI_MCP_HTTP_TIMEOUT_MS`, and `HIJRI_MCP_LOG_LEVEL` with documented
  defaults.

### 3.2 Server identity

- **MCP-ID-1** — THE SYSTEM SHALL expose the server name `hijri-mcp` and the
  package version.
- **MCP-ID-2** — THE SYSTEM SHALL expose instructions telling the model not to
  answer Hijri dates from memory, to report confidence and announcement status,
  and not to invent fallback data.
- **MCP-ID-3** — THE SYSTEM SHALL treat instructions as advisory and SHALL still
  make each tool result self-explanatory.

### 3.3 Tool registration

- **MCP-TOOL-1** — THE SYSTEM SHALL register exactly four tools:
  `list_cities`, `get_hijri_date`, `get_month_start`, `get_prayer_times`.
- **MCP-TOOL-2** — EVERY tool SHALL declare a description, input schema, output
  schema, and read-only annotations.
- **MCP-TOOL-3** — EVERY tool SHALL be annotated with `readOnlyHint: true`,
  `destructiveHint: false`, `idempotentHint: true`, and `openWorldHint: true`.
- **MCP-TOOL-4** — WHEN a tool is called with invalid input, THE SYSTEM SHALL
  return `INVALID_INPUT` rather than throwing an unhandled exception.

### 3.4 Result envelope

- **MCP-RES-1** — EVERY successful tool result SHALL contain
  `structuredContent: { ok: true, data: ... }` matching its output schema.
- **MCP-RES-2** — EVERY failed tool result SHALL set `isError: true` and contain
  `structuredContent: { ok: false, error: ... }`.
- **MCP-RES-3** — EVERY result SHALL include a short text block as a fallback.
- **MCP-RES-4** — Error objects SHALL contain `code`, `message`, `retryable`, and
  `details` (nullable).
- **MCP-RES-5** — Error text SHALL use the form `CODE: message`.
- **MCP-RES-6** — Tool results SHALL NOT contain stack traces, environment
  values, or raw upstream bodies.

### 3.5 Logging and privacy

- **MCP-LOG-1** — Logs SHALL be structured and written to stderr.
- **MCP-LOG-2** — THE SYSTEM SHALL NOT log tool inputs containing dates or cities
  at levels above `debug`.
- **MCP-LOG-3** — THE SYSTEM SHALL NOT expose secrets, tokens, or environment
  values in results or logs.

## 4. Non-functional requirements

- **MCP-NFR-1** — Protocol tests SHALL spawn the built server over stdio and
  assert discovery, schemas, annotations, and envelopes.
- **MCP-NFR-2** — The server module SHALL NOT contain date or coverage logic.
- **MCP-NFR-3** — A protocol test SHALL fail if anything other than MCP messages
  appears on stdout.

## 5. Traceability

Tool-specific schemas and descriptions are in milestone 03. Tasks are in
`tasks.md`; rationale and interfaces are in `design.md`.
