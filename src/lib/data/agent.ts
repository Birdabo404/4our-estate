import "server-only";

import type { Inquiry, PropertyDetail, PropertySummary } from "@/lib/domain/types";

import { createClient } from "@/lib/supabase/server";

import { toDetail, toInquiry, toSummary, type DetailSource } from "./mappers";
import { failQuery } from "./query";
import { requireRole } from "./viewer";

const SUMMARY =
  "id, slug, title, listing_type, property_type, status, price_php, bedrooms, bathrooms, floor_area_sqm, lot_area_sqm, neighborhood, city, province, featured, published_at, property_images (id, url, alt, position)";

const DETAIL = `${SUMMARY}, description, address, parking_slots, year_built, amenities, latitude, longitude, agent:profiles!properties_agent_id_fkey (id, full_name, avatar_url, phone, agency, license_no, bio)`;

export async function listAgentListings(): Promise<PropertySummary[]> {
  const viewer = await requireRole("agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(SUMMARY)
    .eq("agent_id", viewer.id)
    .order("updated_at", { ascending: false });
  if (error) failQuery("listings", error.message);
  return (data ?? []).map((row) => toSummary(row));
}

export async function listAgentInquiries(): Promise<Inquiry[]> {
  const viewer = await requireRole("agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("visible_inquiries");
  if (error) failQuery("inquiries", error.message);
  return (data ?? [])
    .filter((row) => row.agent_id === viewer.id)
    .map((row) => toInquiry(row));
}

export async function getEditableProperty(id: string): Promise<PropertyDetail | null> {
  await requireRole("agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(DETAIL)
    .eq("id", id)
    .maybeSingle();
  if (error) failQuery("listing", error.message);
  if (!data) return null;
  return toDetail(data as DetailSource);
}
