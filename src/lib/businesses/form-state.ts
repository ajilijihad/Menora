import type { BusinessFieldErrors, BusinessFormValues, BusinessMessageCode } from "./schema";

export type BusinessFormState = {
  status: "idle" | "error" | "success";
  message?: BusinessMessageCode;
  fieldErrors?: BusinessFieldErrors;
  values?: BusinessFormValues;
};

export const idleBusinessState: BusinessFormState = { status: "idle" };

export type DeleteBusinessState = {
  status: "idle" | "error";
  message?: BusinessMessageCode;
  confirmSlug?: string;
};

export const idleDeleteState: DeleteBusinessState = { status: "idle" };
