import { ApiError } from "../../src/lib/api/error";
import { stableUuid } from "../../src/lib/api/mock/dataset";
import { mockFetch } from "../../src/lib/api/mock/dispatch";
import { getStore } from "../../src/lib/api/mock/store";

import { alignStore } from "./align";

const API = process.env.PARITY_API ?? "http://localhost:4000/api/v1";

type Side = { status: number; body: unknown };

type Call = {
  name: string;
  method?: string;
  path: string;
  json?: unknown;
  token?: "buyer" | "agent" | "admin" | null;
};

const rows: { name: string; ok: boolean; detail: string }[] = [];

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function ignoreToken(path: string): boolean {
  return path === "accessToken" || path.endsWith(".accessToken");
}

function diffValue(actual: unknown, expected: unknown, path: string, out: string[]): void {
  if (ignoreToken(path)) {
    if (typeof actual !== "string" || typeof expected !== "string") {
      out.push(`${path}: accessToken is not a string on both sides`);
    }
    return;
  }
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      out.push(`${path}: array mismatch`);
      return;
    }
    if (actual.length !== expected.length) {
      out.push(`${path}: length ${actual.length} vs ${expected.length}`);
    }
    const count = Math.min(actual.length, expected.length);
    for (let index = 0; index < count; index += 1) diffValue(actual[index], expected[index], `${path}[${index}]`, out);
    return;
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const left = actual as Record<string, unknown>;
    const right = expected as Record<string, unknown>;
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of [...keys].sort()) diffValue(left[key], right[key], path ? `${path}.${key}` : key, out);
    return;
  }
  if (actual !== expected) {
    out.push(`${path}: ${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`);
  }
}

async function live(method: string, path: string, json?: unknown, token?: string | null): Promise<Side> {
  const headers = new Headers();
  if (json !== undefined) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function local(method: string, path: string, json?: unknown, token?: string | null): Promise<Side> {
  try {
    const result = await mockFetch(method, path, { json, token: token ?? null });
    const body = result.meta ? { data: result.data, meta: result.meta } : { data: result.data };
    return { status: 200, body };
  } catch (error) {
    if (error instanceof ApiError) {
      const payload: { statusCode: number; code: string; message: string; fields?: Record<string, string> } = {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      };
      if (error.fields) payload.fields = error.fields;
      return { status: error.statusCode, body: { error: payload } };
    }
    throw error;
  }
}

function record(name: string, mockSide: Side, apiSide: Side): void {
  const gaps: string[] = [];
  if (mockSide.status !== apiSide.status) gaps.push(`status ${mockSide.status} vs ${apiSide.status}`);
  diffValue(mockSide.body, apiSide.body, "", gaps);
  const detail = gaps.length === 0 ? "match" : gaps.slice(0, 4).join(" | ");
  rows.push({ name, ok: gaps.length === 0, detail });
  console.log(`${gaps.length === 0 ? "ok " : "DIFF"}  ${pad(name, 42)} ${detail}`);
}

async function login(email: string): Promise<{ liveToken: string; mockToken: string }> {
  const json = { email, password: "Estate!2026" };
  const apiSide = await live("POST", "/auth/login", json);
  const mockSide = await local("POST", "/auth/login", json);
  record(`login ${email}`, mockSide, apiSide);
  const liveToken = (apiSide.body as { data?: { accessToken?: string } }).data?.accessToken;
  const mockToken = (mockSide.body as { data?: { accessToken?: string } }).data?.accessToken;
  if (!liveToken || !mockToken) throw new Error(`Login failed for ${email}`);
  return { liveToken, mockToken };
}

async function check(call: Call, tokens: Record<"buyer" | "agent" | "admin", { liveToken: string; mockToken: string }>): Promise<void> {
  const method = call.method ?? "GET";
  const pair = call.token ? tokens[call.token] : null;
  const apiSide = await live(method, call.path, call.json, pair?.liveToken);
  const mockSide = await local(method, call.path, call.json, pair?.mockToken);
  record(call.name, mockSide, apiSide);
}

async function main(): Promise<void> {
  const store = await getStore();
  const notes = await alignStore(store);
  for (const note of notes) console.log(`note  ${note}`);

  const adminId = stableUuid("user:admin@4our.estate");
  console.log(`stableUuid user:admin@4our.estate ${adminId}`);

  const calls: Call[] = [
    { name: "list newest page 1", path: "/properties?sort=newest&page=1" },
    { name: "list newest page 2", path: "/properties?sort=newest&page=2" },
    { name: "list Makati sale price desc", path: "/properties?city=Makati&listingType=sale&sort=price_desc&page=1" },
    { name: "list q siargao", path: "/properties?q=siargao" },
    { name: "list rent beds size", path: "/properties?listingType=rent&minBeds=3&sort=size_desc" },
    { name: "list villa price asc", path: "/properties?propertyType=villa&sort=price_asc&minPrice=1000000&maxPrice=500000000" },
    { name: "list price order invalid", path: "/properties?minPrice=100&maxPrice=50" },
    { name: "featured", path: "/properties/featured?limit=4" },
    { name: "featured limit 2", path: "/properties/featured?limit=2" },
    { name: "cities", path: "/properties/cities" },
    { name: "stats", path: "/properties/stats" },
    { name: "published detail", path: "/properties/siargao-cloud-nine-villa" },
    { name: "sold detail", path: "/properties/mactan-newtown-beachfront" },
    { name: "private slug guest", path: "/properties/bgc-grand-hyatt-residence" },
    { name: "similar siargao", path: "/properties/siargao-cloud-nine-villa/similar?limit=3" },
    { name: "similar mactan", path: "/properties/mactan-newtown-beachfront/similar?limit=3" },
    { name: "signup validation", method: "POST", path: "/auth/signup", json: { role: "buyer", fullName: "", email: "nope", password: "short" } },
  ];

  for (const call of calls) await check(call, { buyer: { liveToken: "", mockToken: "" }, agent: { liveToken: "", mockToken: "" }, admin: { liveToken: "", mockToken: "" } });

  const tokens = {
    buyer: await login("camille.uy@4our.estate"),
    agent: await login("isabel.santos@4our.estate"),
    admin: await login("admin@4our.estate"),
  };

  const authed: Call[] = [
    { name: "buyer me", path: "/auth/me", token: "buyer" },
    { name: "agent me", path: "/auth/me", token: "agent" },
    { name: "admin me", path: "/auth/me", token: "admin" },
    { name: "buyer favorite ids", path: "/me/favorites/ids", token: "buyer" },
    { name: "agent listings", path: "/agent/listings", token: "agent" },
    { name: "admin stats", path: "/admin/stats", token: "admin" },
    { name: "admin moderation", path: "/admin/moderation", token: "admin" },
    { name: "admin users", path: "/admin/users", token: "admin" },
    { name: "buyer admin stats", path: "/admin/stats", token: "buyer" },
    { name: "guest agent listings", path: "/agent/listings" },
  ];
  for (const call of authed) await check(call, tokens);

  const me = await local("GET", "/auth/me", undefined, tokens.admin.mockToken);
  const id = (me.body as { data?: { id?: string } }).data?.id;
  const uuidOk = id === adminId;
  rows.push({ name: "stableUuid equals admin id", ok: uuidOk, detail: uuidOk ? "match" : `${id} vs ${adminId}` });
  console.log(`${uuidOk ? "ok " : "DIFF"}  ${pad("stableUuid equals admin id", 42)} ${uuidOk ? "match" : `${id} vs ${adminId}`}`);

  const failed = rows.filter((row) => !row.ok);
  console.log("");
  console.log(`${pad("case", 42)} result`);
  for (const row of rows) console.log(`${pad(row.name, 42)} ${row.ok ? "match" : "DIFF"}`);
  console.log(`${rows.length - failed.length}/${rows.length} match`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
