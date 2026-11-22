import { describe, expect, it } from "vitest";
import { AppError, toAppError } from "../src/errors.js";
import { silentLogger } from "../src/log.js";
import { runTool } from "../src/tools/result.js";
import type { ErrorCode } from "../src/types.js";

const codes: ErrorCode[] = [
  "INVALID_INPUT",
  "UNKNOWN_CITY",
  "UNKNOWN_PROFILE",
  "OUT_OF_COVERAGE",
  "NOT_PUBLISHED",
  "PRAYER_DATA_UNAVAILABLE",
  "NETWORK",
  "INVALID_DATA",
  "INTERNAL",
];

describe("error taxonomy", () => {
  for (const code of codes) {
    it(`returns a stable ${code} envelope`, async () => {
      const result = await runTool("test_tool", silentLogger, async () => {
        throw new AppError(code, `${code} detail`);
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        ok: false,
        error: {
          code,
          message: `${code} detail`,
          retryable: code === "NETWORK",
          details: null,
        },
      });
    });
  }

  it("maps unexpected errors to INTERNAL without exposing the cause", () => {
    const error = toAppError(new Error("database password"));
    expect(error.code).toBe("INTERNAL");
    expect(error.retryable).toBe(false);
    expect(error.message).toBe("An unexpected server error occurred.");
    expect(error.message).not.toContain("database password");
  });
});
