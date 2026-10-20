import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/domain/types";

import { failQuery } from "./query";
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
  const viewer = await requireRole("buyer", "agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, agency, license_no, bio")
    .eq("id", viewer.id)
    .maybeSingle();
  if (error) failQuery("profile", error.message);
  if (!data) failQuery("profile", "missing profile");

  return {
    id: viewer.id,
    email: viewer.email,
    role: viewer.role,
    fullName: data.full_name,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    agency: data.agency,
    licenseNo: data.license_no,
    bio: data.bio,
  };
}
