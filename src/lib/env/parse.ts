import type { z } from "zod";

import { EnvConfigError } from "./error";

export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  value: unknown,
): z.infer<Schema> {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new EnvConfigError(
      parsed.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    );
  }

  return parsed.data;
}
