import { z } from "zod";

export function requiredValue(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => !/^your-/i.test(value), {
      message: `${label} is still a placeholder`,
    });
}
