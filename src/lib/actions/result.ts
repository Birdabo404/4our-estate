import type { ZodError } from "zod";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Partial<Record<string, string>>;
    };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  formError: string,
  fieldErrors?: Partial<Record<string, string>>,
): ActionResult<never> {
  return { ok: false, formError, fieldErrors };
}

function firstIssue(messages: unknown): string | undefined {
  if (!Array.isArray(messages)) return undefined;
  const message = messages[0];
  return typeof message === "string" ? message : undefined;
}

export function invalid(error: ZodError): ActionResult<never> {
  const flat = error.flatten();
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    const message = firstIssue(messages);
    if (message) fieldErrors[key] = message;
  }
  return {
    ok: false,
    fieldErrors,
    formError: flat.formErrors[0],
  };
}
