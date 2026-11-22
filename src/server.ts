/** MCP server construction and stdio process wiring. */
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createCache } from "./api/cache.js";
import { createHijriApi } from "./api/client.js";
import { createHttpClient } from "./api/http.js";
import type { Config } from "./config.js";
import { loadConfig } from "./config.js";
import { createLogger, type Logger } from "./log.js";
import type { ToolDeps } from "./tools/deps.js";
import { registerTools } from "./tools/register.js";
import { VERSION } from "./version.js";

export const SERVER_INSTRUCTIONS = `This server provides Pakistan Hijri calendar dates and calculated prayer times from the Pakistan Hijri dataset.

Rules:
- Do not answer Hijri dates from memory. Call get_hijri_date or get_month_start.
- Always report the returned confidence and announcement status. Never present an awaiting_announcement date as confirmed.
- Include sources when present and uncertainty_days when present.
- Prayer times are calculated start times for the selected city and profile, not congregation times.
- Use list_cities when the city or profile is unknown.
- Dates and times are for Asia/Karachi.
- If a tool returns an error, explain it. Do not invent a fallback date or time.`;

export interface ServerOptions {
  config?: Config;
  logger?: Logger;
  deps?: Partial<ToolDeps>;
}

export function createServer(options: ServerOptions = {}): McpServer {
  const config = options.config ?? loadConfig();
  const logger = options.logger ?? createLogger(config.logLevel);
  const api =
    options.deps?.api ??
    createHijriApi({
      baseUrl: config.apiBaseUrl,
      http: createHttpClient({ timeoutMs: config.httpTimeoutMs }),
      cache: createCache(),
    });
  const clock = options.deps?.clock ?? (() => new Date());

  const server = new McpServer(
    { name: "hijri-mcp", version: VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server, { api, clock, logger });
  return server;
}

export async function startStdio(options: ServerOptions = {}): Promise<void> {
  const server = createServer(options);
  const handle = serveStdio(() => server);
  let closing = false;

  const shutdown = (): void => {
    if (closing) return;
    closing = true;
    void handle.close().finally(() => process.exit(0));
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
