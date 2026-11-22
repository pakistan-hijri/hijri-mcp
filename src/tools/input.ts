import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import type { z } from "zod";
import { AppError } from "../errors.js";
import { cityIdSchema, profileIdSchema } from "./common.js";

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
    const specific = result.error.issues.find(
      (issue) => issue.path[0] === "city" || issue.path[0] === "profile",
    );
    if (specific) {
      const field = specific.path[0] as "city" | "profile";
      const raw = (value as Record<string, unknown>)[field];
      throw new AppError(
        field === "city" ? "UNKNOWN_CITY" : "UNKNOWN_PROFILE",
        `Unknown ${field} '${String(raw)}'. Use list_cities to see accepted values.`,
        {
          details: {
            field,
            value: raw,
            accepted: field === "city" ? cityIdSchema.options : profileIdSchema.options,
          },
        },
      );
    }
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
