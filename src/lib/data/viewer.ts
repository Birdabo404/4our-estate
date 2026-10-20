import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, apiFetch, sessionToken } from "@/lib/api/client";
import { dashboardPath } from "@/lib/auth/paths";
import { ROLES, type Role, type Viewer } from "@/lib/domain/types";

export type Member = Extract<Viewer, { kind: "member" }>;

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function asMember(value: unknown): Member | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Member>;
  if (row.kind !== "member") return null;
  if (typeof row.id !== "string" || typeof row.email !== "string" || typeof row.fullName !== "string") return null;
  if (row.avatarUrl !== null && typeof row.avatarUrl !== "string") return null;
  if (typeof row.role !== "string" || !isRole(row.role)) return null;
  return {
    kind: "member",
    id: row.id,
    email: row.email,
    role: row.role,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
  };
}

async function requestPath(): Promise<string> {
  const headerList = await headers();
  const path = headerList.get("x-4our-pathname");
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/dashboard";
}

export const getViewer = cache(async (): Promise<Viewer> => {
  if (!(await sessionToken())) return { kind: "guest" };
  try {
    const { data } = await apiFetch<unknown>("/auth/me");
    return asMember(data) ?? { kind: "guest" };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) return { kind: "guest" };
    throw new Error("Could not load your account.");
  }
});

export async function requireRole(...roles: [Role, ...Role[]]): Promise<Member> {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    const next = await requestPath();
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (!roles.includes(viewer.role)) {
    redirect(dashboardPath(viewer.role));
  }
  return viewer;
}
