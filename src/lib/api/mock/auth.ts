import type { MockUser, Store } from "./types";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

type TokenPayload = {
  sub?: unknown;
  role?: unknown;
  exp?: unknown;
};

export type AuthRead = { ok: true; user: MockUser } | { ok: false; reason: "absent" | "invalid" };

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function readPayload(segment: string): TokenPayload | null {
  try {
    const json: unknown = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
    if (!json || typeof json !== "object") return null;
    return json as TokenPayload;
  } catch {
    return null;
  }
}

export function signToken(user: Pick<MockUser, "id" | "role">, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ sub: user.id, role: user.role, exp: nowSeconds + TOKEN_TTL_SECONDS }),
  );
  return `${header}.${payload}.mock`;
}

export function readAuth(store: Store, token: string | null, nowSeconds = Math.floor(Date.now() / 1000)): AuthRead {
  if (!token) return { ok: false, reason: "absent" };
  if (!token.endsWith(".mock")) return { ok: false, reason: "invalid" };
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return { ok: false, reason: "invalid" };
  const payload = readPayload(parts[1]);
  if (!payload || typeof payload.sub !== "string") return { ok: false, reason: "invalid" };
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds) {
    return { ok: false, reason: "invalid" };
  }
  const user = store.users.find((row) => row.id === payload.sub);
  if (!user) return { ok: false, reason: "invalid" };
  return { ok: true, user };
}

export function memberOf(user: MockUser) {
  return {
    kind: "member" as const,
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}
