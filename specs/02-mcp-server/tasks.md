# 02 — MCP Server: Tasks

## 1. Configuration and logging

- [ ] Implement `src/config.ts` with the three environment variables and
      defaults. (`MCP-RUN-6`)
- [ ] Implement `src/log.ts` with stderr-only JSON logging. (`MCP-LOG-1`–`MCP-LOG-3`)
- [ ] Fail fast on invalid configuration. (`MCP-RUN-6`)

## 2. Server construction

- [ ] Construct `McpServer` with name `hijri-mcp`, package version, and
      instructions. (`MCP-ID-1`–`MCP-ID-3`)
- [ ] Wire `serveStdio`. (`MCP-RUN-1`, `MCP-RUN-2`)
- [ ] Add signal handling and clean shutdown. (`MCP-RUN-5`)
- [ ] Ensure stdout is protocol-only. (`MCP-RUN-3`, `MCP-RUN-4`)

## 3. Result envelope

- [ ] Implement success and error envelope helpers in `src/tools/result.ts`.
      (`MCP-RES-1`–`MCP-RES-6`)
- [ ] Implement text fallback formatting. (`MCP-RES-3`, `MCP-RES-5`)
- [ ] Implement JSON Schema `oneOf` output schemas. (`MCP-TOOL-2`)

## 4. Tool registration

- [ ] Register four tool names with descriptions, schemas, and annotations.
      (`MCP-TOOL-1`–`MCP-TOOL-4`)
- [ ] Delegate handlers to milestone 03 implementations. (`MCP-NFR-2`)

## 5. Protocol tests

- [ ] Add a local HTTP fixture server for API responses. (`MCP-NFR-1`)
- [ ] Spawn the built server with `@modelcontextprotocol/client`. (`MCP-NFR-1`)
- [ ] Assert instructions, tool list, schemas, and annotations. (`MCP-ID-2`,
      `MCP-TOOL-1`–`MCP-TOOL-3`)
- [ ] Assert success and error envelopes. (`MCP-RES-1`–`MCP-RES-6`)
- [ ] Assert stdout contains only protocol messages. (`MCP-NFR-3`)

## 6. Exit criteria

- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] A real host can connect and list four tools.
- [ ] No date/coverage logic exists in `src/server.ts`.
