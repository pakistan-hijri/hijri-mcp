/** Stderr-only structured logging for the stdio server. */

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface Logger {
  error(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  debug(message: string, fields?: Record<string, unknown>): void;
}

export interface Sink {
  write(chunk: string): unknown;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export function createLogger(level: LogLevel, sink: Sink = process.stderr): Logger {
  const threshold = LEVEL_WEIGHT[level];

  function emit(entryLevel: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (LEVEL_WEIGHT[entryLevel] > threshold) return;
    const line = JSON.stringify({
      level: entryLevel,
      msg: message,
      ts: new Date().toISOString(),
      ...fields,
    });
    sink.write(`${line}\n`);
  }

  return {
    error: (message, fields) => emit("error", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    info: (message, fields) => emit("info", message, fields),
    debug: (message, fields) => emit("debug", message, fields),
  };
}

export const silentLogger: Logger = {
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  debug: () => undefined,
};
