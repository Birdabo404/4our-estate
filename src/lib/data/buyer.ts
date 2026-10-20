import "server-only";

import type { Inquiry, PropertySummary } from "@/lib/domain/types";

import { createClient } from "@/lib/supabase/server";

import { toInquiry, toSummary } from "./mappers";
import { failQuery } from "./query";
import { requireRole } from "./viewer";

const SUMMARY =
  "id, slug, title, listing_type, property_type, status, price_php, bedrooms, bathrooms, floor_area_sqm, lot_area_sqm, neighborhood, city, province, featured, published_at, property_images (id, url, alt, position)";

export async function listFavorites(): Promise<PropertySummary[]> {
  const viewer = await requireRole("buyer", "agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(`created_at, properties (${SUMMARY})`)
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false });
  if (error) failQuery("favorites", error.message);

  return (data ?? []).flatMap((row) => {
    const property = row.properties;
    if (!property || Array.isArray(property)) {
      const first = Array.isArray(property) ? property[0] : null;
      return first ? [toSummary(first)] : [];
    }
    return [toSummary(property)];
  });
}

export async function getFavoriteIds(): Promise<string[]> {
  const viewer = await requireRole("buyer", "agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", viewer.id);
  if (error) failQuery("favorites", error.message);
  return (data ?? []).map((row) => row.property_id);
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  const viewer = await requireRole("buyer", "agent", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("visible_inquiries");
  if (error) failQuery("inquiries", error.message);
  return (data ?? [])
    .filter((row) => row.buyer_id === viewer.id)
    .map((row) => toInquiry(row));
}
