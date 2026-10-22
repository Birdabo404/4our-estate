import "server-only";

import { cookies } from "next/headers";

import { ApiError, UNREACHABLE_MESSAGE, type ApiErrorBody, type ApiMeta, type ApiSuccess } from "./error";
import { mockFetch } from "./mock/dispatch";
import { jwtExpired, SESSION_COOKIE, sessionMaxAge } from "./token";

export { ApiError, type ApiErrorBody, type ApiMeta, type ApiSuccess } from "./error";

const COOKIE_WRITE = "Cookies can only be modified";

type ApiInit = {
  method?: string;
  json?: unknown;
  form?: FormData;
  auth?: boolean;
};

function apiBase(): string {
  const raw = process.env.API_URL ?? "http://localhost:4000/api/v1";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

function apiUrl(path: string): string {
  const relative = path.startsWith("/") ? path.slice(1) : path;
  return new URL(relative, apiBase()).toString();
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function setSession(token: string): Promise<void> {
  const maxAge = sessionMaxAge(token);
  if (maxAge === null) return;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(maxAge));
}

export async function clearSession(): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, "", cookieOptions(0));
  } catch (error) {
    if (error instanceof Error && error.message.includes(COOKIE_WRITE)) return;
    throw error;
  }
}

export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (jwtExpired(token)) {
    await clearSession();
    return null;
  }
  return token;
}

function readFields(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const fields: Record<string, string> = {};
  for (const [key, message] of Object.entries(value)) {
    if (typeof message === "string") fields[key] = message;
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

function readError(payload: unknown, status: number): ApiErrorBody {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error: unknown }).error;
    if (error && typeof error === "object") {
      const row = error as Partial<ApiErrorBody>;
      const fields = readFields(row.fields);
      return {
        statusCode: typeof row.statusCode === "number" ? row.statusCode : status,
        code: typeof row.code === "string" ? row.code : "INTERNAL",
        message: typeof row.message === "string" && row.message ? row.message : "Something went wrong. Please try again.",
        ...(fields ? { fields } : {}),
      };
    }
  }
  return {
    statusCode: status,
    code: status === 0 ? "NETWORK" : "INTERNAL",
    message: status === 0 ? UNREACHABLE_MESSAGE : "Something went wrong. Please try again.",
  };
}

async function parseSuccess<T>(response: Response): Promise<ApiSuccess<T>> {
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) throw new ApiError(readError(payload, response.status));
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError({
      statusCode: response.status,
      code: "INTERNAL",
      message: "Something went wrong. Please try again.",
    });
  }
  const body = payload as { data: T; meta?: ApiMeta };
  return body.meta ? { data: body.data, meta: body.meta } : { data: body.data };
}

export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<ApiSuccess<T>> {
  const sendAuth = init.auth !== false;
  const token = sendAuth ? await sessionToken() : null;
  return call<T>(path, init, token, true);
}

function usesMockData(): boolean {
  const env = process.env;
  return env.DATA_MODE === "mock";
}

async function call<T>(path: string, init: ApiInit, token: string | null, allowRetry: boolean): Promise<ApiSuccess<T>> {
  if (usesMockData()) {
    try {
      return await mockFetch<T>(init.method ?? "GET", path, {
        json: init.json,
        form: init.form,
        token,
      });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401 && token && allowRetry) {
        await clearSession();
        return call<T>(path, init, null, false);
      }
      throw error;
    }
  }

  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  let body: BodyInit | undefined;
  if (init.form) {
    body = init.form;
  } else if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: init.method ?? "GET",
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw ApiError.unreachable();
  }

  if (response.status === 401 && token && allowRetry) {
    await clearSession();
    return call<T>(path, init, null, false);
  }
  return parseSuccess<T>(response);
}
