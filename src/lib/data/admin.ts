import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { PropertySummary } from "@/lib/domain/types";

import { failLoad } from "./query";
import type { AdminStats, DirectoryUser } from "./types";
import { requireRole } from "./viewer";

export async function listModerationQueue(): Promise<PropertySummary[]> {
  await requireRole("admin");
  try {
    const { data } = await apiFetch<PropertySummary[]>("/admin/moderation");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("moderation queue", error);
  }
}

export async function listUsers(): Promise<DirectoryUser[]> {
  await requireRole("admin");
  try {
    const { data } = await apiFetch<DirectoryUser[]>("/admin/users");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("users", error);
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireRole("admin");
  try {
    const { data } = await apiFetch<AdminStats>("/admin/stats");
    return data;
  } catch (error) {
    return failLoad("stats", error);
  }
}
