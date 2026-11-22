/** Environment configuration with fail-fast validation. */
import { AppError } from "./errors.js";
import type { LogLevel } from "./log.js";

export interface Config {
  apiBaseUrl: string;
  httpTimeoutMs: number;
  logLevel: LogLevel;
}

export const DEFAULT_API_BASE_URL = "https://pakistan-hijri.github.io/hijri-api";
export const DEFAULT_HTTP_TIMEOUT_MS = 10_000;

const LOG_LEVELS: readonly LogLevel[] = ["error", "warn", "info", "debug"];

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiBaseUrl = parseBaseUrl(env.HIJRI_API_BASE_URL);
  const httpTimeoutMs = parseTimeout(env.HIJRI_MCP_HTTP_TIMEOUT_MS);
  const logLevel = parseLogLevel(env.HIJRI_MCP_LOG_LEVEL);

  return { apiBaseUrl, httpTimeoutMs, logLevel };
}

function parseBaseUrl(value: string | undefined): string {
  const raw = value?.trim() || DEFAULT_API_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch (error) {
    throw new AppError("INVALID_INPUT", `HIJRI_API_BASE_URL is not a valid URL: ${raw}`, {
      cause: error,
    });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("INVALID_INPUT", "HIJRI_API_BASE_URL must use http or https.");
  }
  return raw.replace(/\/+$/, "");
}

function parseTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return DEFAULT_HTTP_TIMEOUT_MS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("INVALID_INPUT", "HIJRI_MCP_HTTP_TIMEOUT_MS must be a positive integer.");
  }
  return parsed;
}

function parseLogLevel(value: string | undefined): LogLevel {
  const raw = value?.trim().toLowerCase() || "warn";
  if (!LOG_LEVELS.includes(raw as LogLevel)) {
    throw new AppError(
      "INVALID_INPUT",
      `HIJRI_MCP_LOG_LEVEL must be one of: ${LOG_LEVELS.join(", ")}.`,
    );
  }
  return raw as LogLevel;
}
