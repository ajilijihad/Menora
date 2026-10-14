import type { MessageCode } from "./messages";

export type AuthField = "name" | "email" | "password" | "confirmPassword";

export type AuthFormValues = Partial<Record<AuthField, string>> & {
  remember?: string;
};

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: MessageCode;
  fieldErrors?: Partial<Record<AuthField, MessageCode>>;
  values?: AuthFormValues;
};

export const idleAuthState: AuthFormState = { status: "idle" };
