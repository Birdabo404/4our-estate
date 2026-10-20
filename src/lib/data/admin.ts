import "server-only";

import type { PropertySummary } from "@/lib/domain/types";

import { createClient } from "@/lib/supabase/server";

import { toDirectoryUser, toSummary } from "./mappers";
import { failQuery } from "./query";
import type { AdminStats, DirectoryUser } from "./types";
import { requireRole } from "./viewer";

const SUMMARY =
  "id, slug, title, listing_type, property_type, status, price_php, bedrooms, bathrooms, floor_area_sqm, lot_area_sqm, neighborhood, city, province, featured, published_at, property_images (id, url, alt, position)";

export async function listModerationQueue(): Promise<PropertySummary[]> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(SUMMARY)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) failQuery("moderation queue", error.message);
  return (data ?? []).map((row) => toSummary(row));
}

export async function listUsers(): Promise<DirectoryUser[]> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) failQuery("users", error.message);
  return (data ?? []).map((row) => toDirectoryUser(row));
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireRole("admin");
  const supabase = await createClient();
  const [users, properties, inquiries] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("status"),
    supabase.from("inquiries").select("status"),
  ]);
  if (users.error) failQuery("stats", users.error.message);
  if (properties.error) failQuery("stats", properties.error.message);
  if (inquiries.error) failQuery("stats", inquiries.error.message);

  const listings = properties.data ?? [];
  const inquiryRows = inquiries.data ?? [];
  return {
    userCount: users.count ?? 0,
    listingCount: listings.length,
    pendingCount: listings.filter((row) => row.status === "pending").length,
    publishedCount: listings.filter((row) => row.status === "published").length,
    inquiryCount: inquiryRows.length,
    newInquiryCount: inquiryRows.filter((row) => row.status === "new").length,
  };
}
