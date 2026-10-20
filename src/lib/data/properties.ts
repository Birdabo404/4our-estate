import "server-only";

import type { ListingFilters, ListingSort, Page, PropertyDetail, PropertySummary } from "@/lib/domain/types";
import { LISTING_PAGE_SIZE } from "@/lib/validation/filters";

import { createClient } from "@/lib/supabase/server";

import { toDetail, toSummary, type DetailSource } from "./mappers";
import { failQuery } from "./query";
import type { CityCount, MarketStats } from "./types";

const SUMMARY =
  "id, slug, title, listing_type, property_type, status, price_php, bedrooms, bathrooms, floor_area_sqm, lot_area_sqm, neighborhood, city, province, featured, published_at, property_images (id, url, alt, position)";

const DETAIL = `${SUMMARY}, description, address, parking_slots, year_built, amenities, latitude, longitude, agent:profiles!properties_agent_id_fkey (id, full_name, avatar_url, phone, agency, license_no, bio)`;

function applySort<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sort: ListingSort,
): T {
  switch (sort) {
    case "newest":
      return query.order("published_at", { ascending: false });
    case "price_asc":
      return query.order("price_php", { ascending: true });
    case "price_desc":
      return query.order("price_php", { ascending: false });
    case "size_desc":
      return query.order("floor_area_sqm", { ascending: false });
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

export async function listProperties(
  filters: ListingFilters,
): Promise<Page<PropertySummary>> {
  const supabase = await createClient();
  const from = (filters.page - 1) * LISTING_PAGE_SIZE;
  const to = from + LISTING_PAGE_SIZE - 1;

  let query = supabase
    .from("properties")
    .select(SUMMARY, { count: "exact" })
    .eq("status", "published");

  if (filters.q) {
    query = query.textSearch("search", filters.q, {
      type: "websearch",
      config: "simple",
    });
  }
  if (filters.listingType) query = query.eq("listing_type", filters.listingType);
  if (filters.propertyType) query = query.eq("property_type", filters.propertyType);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.minPrice !== undefined) query = query.gte("price_php", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price_php", filters.maxPrice);
  if (filters.minBeds !== undefined) query = query.gte("bedrooms", filters.minBeds);

  const { data, error, count } = await applySort(query, filters.sort).range(from, to);
  if (error) {
    if (filters.q && /syntax|tsquery/i.test(error.message)) {
      return { items: [], total: 0, page: filters.page, pageSize: LISTING_PAGE_SIZE };
    }
    failQuery("listings", error.message);
  }

  return {
    items: (data ?? []).map((row) => toSummary(row)),
    total: count ?? 0,
    page: filters.page,
    pageSize: LISTING_PAGE_SIZE,
  };
}

export async function getFeaturedProperties(limit = 4): Promise<PropertySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(SUMMARY)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) failQuery("featured listings", error.message);
  return (data ?? []).map((row) => toSummary(row));
}

export async function getPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(DETAIL)
    .eq("slug", slug)
    .maybeSingle();
  if (error) failQuery("listing", error.message);
  if (!data) return null;
  return toDetail(data as DetailSource);
}

export async function getSimilarProperties(
  detail: PropertyDetail,
  limit = 3,
): Promise<PropertySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select(SUMMARY)
    .eq("status", "published")
    .eq("city", detail.city)
    .neq("id", detail.id)
    .order("published_at", { ascending: false })
    .limit(limit * 3);
  if (error) failQuery("similar listings", error.message);

  const rows = (data ?? []).map((row) => toSummary(row));
  const sameType = rows.filter((row) => row.propertyType === detail.propertyType);
  const rest = rows.filter((row) => row.propertyType !== detail.propertyType);
  return [...sameType, ...rest].slice(0, limit);
}

export async function listCities(): Promise<CityCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_cities");
  if (error) failQuery("cities", error.message);
  return (data ?? []).map((row) => ({
    name: row.name,
    province: row.province,
    count: Number(row.count),
  }));
}

export async function getMarketStats(): Promise<MarketStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("market_stats");
  if (error) failQuery("market stats", error.message);
  const row = data?.[0];
  return {
    listingCount: Number(row?.listing_count ?? 0),
    cityCount: Number(row?.city_count ?? 0),
    medianPricePhp: Number(row?.median_price_php ?? 0),
  };
}
