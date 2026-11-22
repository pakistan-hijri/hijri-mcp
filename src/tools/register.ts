/** Registers the four public tools on an MCP server. */
import type { McpServer } from "@modelcontextprotocol/server";
import { registerGetHijriDate } from "./getHijriDate.js";
import { registerGetMonthStart } from "./getMonthStart.js";
import { registerGetPrayerTimes } from "./getPrayerTimes.js";
import { registerListCities } from "./listCities.js";
import type { ToolDeps } from "./deps.js";

export function registerTools(server: McpServer, deps: ToolDeps): void {
  registerListCities(server, deps);
  registerGetHijriDate(server, deps);
  registerGetMonthStart(server, deps);
  registerGetPrayerTimes(server, deps);
}
