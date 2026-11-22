/** Stable application errors shared by the API, domain, and tool layers. */
import type { ErrorCode, ToolError } from "./types.js";

export interface AppErrorOptions {
  retryable?: boolean;
  details?: Record<string, unknown> | null;
  cause?: unknown;
}

export class AppError extends Error {
  override readonly name = "AppError";
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | null;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.code = code;
    this.retryable = options.retryable ?? code === "NETWORK";
    this.details = options.details ?? null;
  }

  toToolError(): ToolError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  return new AppError("INTERNAL", "An unexpected server error occurred.", {
    retryable: false,
    cause: error,
  });
}
