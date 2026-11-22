import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { AppError } from "../errors.js";

export function advertisedInput<T extends z.ZodTypeAny>(
  schema: T,
): StandardSchemaWithJSON<z.input<T>, z.input<T>> {
  return {
    "~standard": {
      version: 1,
      vendor: "hijri-mcp",
      validate: (value) => ({ value: value as z.input<T> }),
      jsonSchema: schema["~standard"].jsonSchema,
    },
  };
}

export function parseInput<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  tool: string,
): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError("INVALID_INPUT", `Invalid input for ${tool}.`, {
      details: {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
    });
  }
  return result.data;
}
