import { ApiError, type ApiMeta, type ApiSuccess } from "../error";

export type MockResult = ApiSuccess<unknown>;

export function ok(data: unknown, meta?: ApiMeta): MockResult {
  return meta ? { data, meta } : { data };
}

export function fail(statusCode: number, code: string, message: string, fields?: Record<string, string>): never {
  throw new ApiError({
    statusCode,
    code,
    message,
    ...(fields && Object.keys(fields).length > 0 ? { fields } : {}),
  });
}

export function validation(fields: Record<string, string>): never {
  return fail(400, "VALIDATION_FAILED", "Check the highlighted fields.", fields);
}

export function unauthorized(message = "Sign in to continue."): never {
  return fail(401, "UNAUTHORIZED", message);
}

export function forbidden(message: string): never {
  return fail(403, "FORBIDDEN", message);
}

export function notFound(message: string): never {
  return fail(404, "NOT_FOUND", message);
}

export function conflict(message: string): never {
  return fail(409, "CONFLICT", message);
}

export function badRequest(message: string, fields?: Record<string, string>): never {
  return fail(400, "BAD_REQUEST", message, fields);
}

export function tooMany(message: string): never {
  return fail(429, "TOO_MANY_REQUESTS", message);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(value: string): void {
  if (!UUID.test(value)) badRequest("Validation failed (uuid is expected)");
}
