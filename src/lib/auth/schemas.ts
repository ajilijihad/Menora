import { z } from "zod";

import type { AuthField } from "./form-state";
import type { MessageCode } from "./messages";
import { isLocale, type Locale } from "../i18n/locales";

export type FieldErrors = Partial<Record<AuthField, MessageCode>>;

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validateEmail(value: unknown): MessageCode | null {
  if (typeof value !== "string") {
    return "email_invalid";
  }

  const parsed = z.email().safeParse(value.trim());
  return parsed.success ? null : "email_invalid";
}

const commonPasswords = new Set([
  "password1",
  "password123",
  "qwerty123",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou1",
  "changeme1",
  "12345678",
  "123456789",
  "abcd1234",
  "passw0rd",
]);

export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    letter: /\p{L}/u.test(password),
    number: /\p{N}/u.test(password),
    uncommon: password.length > 0 && !commonPasswords.has(password.toLowerCase()),
  };
}

function validatePassword(value: unknown): MessageCode | null {
  if (typeof value !== "string") {
    return "password_short";
  }

  if (value.length < 8) {
    return "password_short";
  }

  if (value.length > 72) {
    return "password_long";
  }

  const checks = passwordChecks(value);
  if (!checks.letter || !checks.number) {
    return "password_weak";
  }

  if (!checks.uncommon) {
    return "password_common";
  }

  return null;
}

function validateName(value: unknown): MessageCode | null {
  if (typeof value !== "string") {
    return "name_required";
  }

  const name = value.trim();
  if (name.length === 0) {
    return "name_required";
  }

  if (name.length > 120 || /[\u0000-\u001F]/.test(name)) {
    return "name_too_long";
  }

  return null;
}

export function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" && isLocale(value) ? value : null;
}

export function parseRegister(input: {
  name: unknown;
  email: unknown;
  password: unknown;
  confirmPassword: unknown;
}): ParseResult<{ name: string; email: string; password: string }> {
  const fieldErrors: FieldErrors = {};
  const nameError = validateName(input.name);
  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);

  if (nameError) {
    fieldErrors.name = nameError;
  }

  if (emailError) {
    fieldErrors.email = emailError;
  }

  if (passwordError) {
    fieldErrors.password = passwordError;
  }

  if (
    !passwordError &&
    text(input.password) !== text(input.confirmPassword)
  ) {
    fieldErrors.confirmPassword = "password_mismatch";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      name: text(input.name).trim(),
      email: text(input.email).trim(),
      password: text(input.password),
    },
  };
}

export function parseLogin(input: {
  email: unknown;
  password: unknown;
}): ParseResult<{ email: string; password: string }> {
  const fieldErrors: FieldErrors = {};
  const emailError = validateEmail(input.email);

  if (emailError) {
    fieldErrors.email = emailError;
  }

  if (typeof input.password !== "string" || input.password.length === 0) {
    fieldErrors.password = "password_short";
  } else if (input.password.length > 72) {
    fieldErrors.password = "password_long";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      email: text(input.email).trim(),
      password: text(input.password),
    },
  };
}

export function parseForgot(input: {
  email: unknown;
}): ParseResult<{ email: string }> {
  const emailError = validateEmail(input.email);
  if (emailError) {
    return { ok: false, fieldErrors: { email: emailError } };
  }

  return { ok: true, data: { email: text(input.email).trim() } };
}

export function parseReset(input: {
  password: unknown;
  confirmPassword: unknown;
}): ParseResult<{ password: string }> {
  const fieldErrors: FieldErrors = {};
  const passwordError = validatePassword(input.password);

  if (passwordError) {
    fieldErrors.password = passwordError;
  }

  if (!passwordError && text(input.password) !== text(input.confirmPassword)) {
    fieldErrors.confirmPassword = "password_mismatch";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: { password: text(input.password) } };
}

export function parseProfile(input: {
  name: unknown;
}): ParseResult<{ name: string }> {
  const nameError = validateName(input.name);
  if (nameError) {
    return { ok: false, fieldErrors: { name: nameError } };
  }

  return { ok: true, data: { name: text(input.name).trim() } };
}
