import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { Role } from "@/lib/domain/types";

import { failLoad } from "./query";
import { requireRole } from "./viewer";

export type OwnProfile = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
};

export async function getOwnProfile(): Promise<OwnProfile> {
  await requireRole("buyer", "agent", "admin");
  try {
    const { data } = await apiFetch<OwnProfile>("/me/profile");
    return data;
  } catch (error) {
    return failLoad("profile", error);
  }
}
