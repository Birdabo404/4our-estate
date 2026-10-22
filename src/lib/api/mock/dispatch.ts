import type { ApiSuccess } from "../error";
import { readAuth } from "./auth";
import type { MockUser } from "./types";
import { fail, forbidden, requireUuid, unauthorized } from "./http";
import { matchRoute } from "./routes";
import { getStore } from "./store";

export type MockRequest = {
  json?: unknown;
  form?: FormData;
  token: string | null;
};

function pathnameOf(path: string): { pathname: string; query: URLSearchParams } {
  const url = new URL(path, "http://mock.local");
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
  return { pathname, query: url.searchParams };
}

export async function mockFetch<T>(method: string, path: string, init: MockRequest): Promise<ApiSuccess<T>> {
  const store = await getStore();
  const verb = method.toUpperCase();
  const { pathname, query } = pathnameOf(path);
  const matched = matchRoute(verb, pathname);
  if (!matched) fail(404, "NOT_FOUND", `Cannot ${verb} /api/v1${pathname}`);

  let user: MockUser | null = null;
  if (matched.route.auth !== "public") {
    const auth = readAuth(store, init.token);
    if (!auth.ok && (matched.route.auth === "required" || auth.reason === "invalid")) unauthorized();
    if (auth.ok) user = auth.user;
  }

  const roles = matched.route.roles;
  if (roles && (!user || !roles.includes(user.role))) {
    forbidden("You do not have permission to do that.");
  }

  for (const name of matched.route.uuid ?? []) requireUuid(matched.params[name] ?? "");

  const result = matched.route.handler({
    store,
    params: matched.params,
    query,
    json: init.json,
    form: init.form,
    user,
  });
  return result as ApiSuccess<T>;
}
