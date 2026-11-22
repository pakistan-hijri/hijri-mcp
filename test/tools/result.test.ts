import { describe, expect, it } from "vitest";
import { AppError } from "../../src/errors.js";
import { createLogger, silentLogger } from "../../src/log.js";
import { failure, runTool, success } from "../../src/tools/result.js";

describe("tool result envelope", () => {
  it("builds a success result with a text fallback", () => {
    expect(success({ value: 1 }, "done")).toEqual({
      structuredContent: { ok: true, data: { value: 1 } },
      content: [{ type: "text", text: "done" }],
    });
  });

  it("marks failures as errors with CODE: message text", () => {
    const result = failure({
      code: "OUT_OF_COVERAGE",
      message: "No data.",
      retryable: false,
      details: null,
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      ok: false,
      error: {
        code: "OUT_OF_COVERAGE",
        message: "No data.",
        retryable: false,
        details: null,
      },
    });
    expect((result.content[0] as { type: "text"; text: string } | undefined)?.text).toBe("OUT_OF_COVERAGE: No data.");
  });

  it("maps AppError without logging tool inputs", async () => {
    const result = await runTool("sample", silentLogger, async () => {
      throw new AppError("UNKNOWN_CITY", "Unknown city 'x'.");
    });
    expect(result.structuredContent).toMatchObject({ ok: false });
    expect((result.content[0] as { type: "text"; text: string } | undefined)?.text).toBe("UNKNOWN_CITY: Unknown city 'x'.");
  });

  it("maps unknown errors to INTERNAL and logs the stack", async () => {
    const lines: string[] = [];
    const logger = createLogger("error", { write: (line: string) => lines.push(line) });
    const result = await runTool("sample", logger, async () => {
      throw new Error("secret detail");
    });
    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: { code: "INTERNAL", message: "An unexpected server error occurred." },
    });
    expect((result.content[0] as { type: "text"; text: string } | undefined)?.text).not.toContain("secret detail");
    expect(lines.join("")).toContain('"stack"');
  });
});
