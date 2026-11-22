# 02 — MCP Server: Tasks

## 1. Configuration and logging

- [x] Implement `src/config.ts` with the three environment variables and
      defaults. (`MCP-RUN-6`)
- [x] Implement `src/log.ts` with stderr-only JSON logging. (`MCP-LOG-1`–`MCP-LOG-3`)
- [x] Fail fast on invalid configuration. (`MCP-RUN-6`)

## 2. Server construction

- [x] Construct `McpServer` with name `hijri-mcp`, package version, and
      instructions. (`MCP-ID-1`–`MCP-ID-3`)
- [x] Wire `serveStdio`. (`MCP-RUN-1`, `MCP-RUN-2`)
- [x] Add signal handling and clean shutdown. (`MCP-RUN-5`)
- [x] Ensure stdout is protocol-only. (`MCP-RUN-3`, `MCP-RUN-4`)

## 3. Result envelope

- [x] Implement success and error envelope helpers in `src/tools/result.ts`.
      (`MCP-RES-1`–`MCP-RES-6`)
- [x] Implement text fallback formatting. (`MCP-RES-3`, `MCP-RES-5`)
- [x] Implement JSON Schema `oneOf` output schemas. (`MCP-TOOL-2`)

## 4. Tool registration

- [x] Register four tool names with descriptions, schemas, and annotations.
      (`MCP-TOOL-1`–`MCP-TOOL-4`)
- [x] Delegate handlers to milestone 03 implementations. (`MCP-NFR-2`)

## 5. Protocol tests

- [x] Add a local HTTP fixture server for API responses. (`MCP-NFR-1`)
- [x] Spawn the built server with `@modelcontextprotocol/client`. (`MCP-NFR-1`)
- [x] Assert instructions, tool list, schemas, and annotations. (`MCP-ID-2`,
      `MCP-TOOL-1`–`MCP-TOOL-3`)
- [x] Assert success and error envelopes. (`MCP-RES-1`–`MCP-RES-6`)
- [x] Assert stdout contains only protocol messages. (`MCP-NFR-3`)

## 6. Exit criteria

- [x] `npm run lint`, `npm test`, and `npm run build` pass.
- [x] A real host can connect and list four tools.
- [x] No date/coverage logic exists in `src/server.ts`.
