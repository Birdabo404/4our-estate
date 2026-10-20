import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { dashboardPath } from "@/lib/auth/paths";
import { ROLES, type Role, type Viewer } from "@/lib/domain/types";

import { createClient } from "@/lib/supabase/server";

export type Member = Extract<Viewer, { kind: "member" }>;

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

async function requestPath(): Promise<string> {
  const headerList = await headers();
  const path = headerList.get("x-4our-pathname");
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/dashboard";
}

export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;
  if (error || !user) return { kind: "guest" };

  const profile = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const metadataName = user.user_metadata.full_name;
  const fullName =
    profile.data?.full_name ||
    (typeof metadataName === "string" && metadataName.trim() !== ""
      ? metadataName
      : "Member");
  const role = profile.data && isRole(profile.data.role) ? profile.data.role : "buyer";

  return {
    kind: "member",
    id: user.id,
    email: user.email ?? "",
    role,
    fullName,
    avatarUrl: profile.data?.avatar_url ?? null,
  };
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
