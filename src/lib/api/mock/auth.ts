import type { MockUser, Store } from "./types";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

type TokenProfile = Pick<MockUser, "email" | "fullName" | "phone" | "agency" | "licenseNo" | "createdAt">;

type TokenPayload = {
  sub?: unknown;
  role?: unknown;
  exp?: unknown;
  profile?: unknown;
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

export function signToken(user: MockUser, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const profile: TokenProfile = {
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    agency: user.agency,
    licenseNo: user.licenseNo,
    createdAt: user.createdAt,
  };
  const payload = base64url(
    JSON.stringify({ sub: user.id, role: user.role, exp: nowSeconds + TOKEN_TTL_SECONDS, profile }),
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
  const user = store.users.find((row) => row.id === payload.sub) ?? rehydrate(store, payload.sub, payload);
  if (!user) return { ok: false, reason: "invalid" };
  return { ok: true, user };
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// Serverless hosts run several instances with separate memory, so a member who signed up on one instance
// may reach another that has never seen them. Rebuild buyers and agents from the token; never admins.
function rehydrate(store: Store, id: string, payload: TokenPayload): MockUser | null {
  if (payload.role !== "buyer" && payload.role !== "agent") return null;
  const profile = payload.profile;
  if (!profile || typeof profile !== "object") return null;
  const fields = profile as Record<string, unknown>;
  if (typeof fields.email !== "string" || typeof fields.fullName !== "string") return null;
  if (store.users.some((row) => row.email === fields.email)) return null;
  const createdAt = optionalText(fields.createdAt) ?? new Date().toISOString();
  const user: MockUser = {
    id,
    email: fields.email,
    password: "",
    role: payload.role,
    fullName: fields.fullName,
    phone: optionalText(fields.phone),
    agency: optionalText(fields.agency),
    licenseNo: optionalText(fields.licenseNo),
    bio: null,
    avatarUrl: null,
    createdAt,
    updatedAt: createdAt,
  };
  store.users.push(user);
  return user;
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
