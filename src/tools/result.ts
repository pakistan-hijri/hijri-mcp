/** Uniform MCP tool result envelope and error mapping. */
import type { CallToolResult } from "@modelcontextprotocol/server";
import { AppError, isAppError } from "../errors.js";
import type { Logger } from "../log.js";
import type { ToolError } from "../types.js";

export interface ToolSuccess<T> {
  data: T;
  text: string;
}

export function success<T>(data: T, text: string): CallToolResult {
  return {
    structuredContent: { ok: true, data },
    content: [{ type: "text", text }],
  };
}

export function failure(error: ToolError): CallToolResult {
  return {
    structuredContent: { ok: false, error },
    content: [{ type: "text", text: `${error.code}: ${error.message}` }],
    isError: true,
  };
}

export async function runTool<T>(
  tool: string,
  logger: Logger,
  execute: () => Promise<ToolSuccess<T>>,
): Promise<CallToolResult> {
  try {
    const result = await execute();
    return success(result.data, result.text);
  } catch (error) {
    return failure(toToolError(tool, logger, error));
  }
}

function toToolError(tool: string, logger: Logger, error: unknown): ToolError {
  if (isAppError(error)) {
    logger.debug("tool call failed", { tool, code: error.code });
    return error.toToolError();
  }

  const stack = error instanceof Error ? error.stack : String(error);
  logger.error("unexpected tool error", { tool, stack });
  return new AppError("INTERNAL", "An unexpected server error occurred.", {
    retryable: false,
    cause: error,
  }).toToolError();
}
