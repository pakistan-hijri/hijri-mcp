#!/usr/bin/env node
/** Entry point for the hijri-mcp stdio server. */
import { loadConfig } from "./config.js";
import { isAppError } from "./errors.js";
import { createLogger } from "./log.js";
import { startStdio } from "./server.js";
import { VERSION } from "./version.js";

try {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  logger.info("starting hijri-mcp", { version: VERSION });
  await startStdio({ config, logger });
} catch (error) {
  process.stderr.write(
    `${JSON.stringify({
      level: "error",
      msg: "server startup failed",
      code: isAppError(error) ? error.code : "INTERNAL",
      ts: new Date().toISOString(),
    })}\n`,
  );
  process.exitCode = 1;
}
