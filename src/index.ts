#!/usr/bin/env node
/** Entry point for the hijri-mcp stdio server. */
import { loadConfig } from "./config.js";
import { createLogger } from "./log.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);

logger.warn("hijri-mcp scaffold is not serving tools yet", {
  apiBaseUrl: config.apiBaseUrl,
});
