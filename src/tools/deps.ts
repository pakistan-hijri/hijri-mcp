/** Dependencies injected into tool handlers. */
import type { HijriApi } from "../api/client.js";
import type { Clock } from "../domain/date.js";
import type { Logger } from "../log.js";

export interface ToolDeps {
  api: HijriApi;
  clock: Clock;
  logger: Logger;
}
