import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE_URL, DEFAULT_HTTP_TIMEOUT_MS, loadConfig } from "../src/config.js";
import { AppError } from "../src/errors.js";

describe("loadConfig", () => {
  it("uses documented defaults", () => {
    expect(loadConfig({})).toEqual({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      httpTimeoutMs: DEFAULT_HTTP_TIMEOUT_MS,
      logLevel: "warn",
    });
  });

  it("reads overrides from the environment", () => {
    expect(
      loadConfig({
        HIJRI_API_BASE_URL: "http://127.0.0.1:8787/",
        HIJRI_MCP_HTTP_TIMEOUT_MS: "2500",
        HIJRI_MCP_LOG_LEVEL: "DEBUG",
      }),
    ).toEqual({
      apiBaseUrl: "http://127.0.0.1:8787",
      httpTimeoutMs: 2500,
      logLevel: "debug",
    });
  });

  it("rejects invalid values", () => {
    expect(() => loadConfig({ HIJRI_API_BASE_URL: "not a url" })).toThrow(AppError);
    expect(() => loadConfig({ HIJRI_MCP_HTTP_TIMEOUT_MS: "0" })).toThrow(AppError);
    expect(() => loadConfig({ HIJRI_MCP_LOG_LEVEL: "trace" })).toThrow(AppError);
  });
});
