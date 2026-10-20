import "server-only";

import { apiFetch } from "@/lib/api/client";
import type { ListingFilters, Page, PropertyDetail, PropertySummary } from "@/lib/domain/types";
import { LISTING_PAGE_SIZE } from "@/lib/validation/filters";

import { failLoad, nullIfMissing } from "./query";
import type { CityCount, MarketStats } from "./types";

function listingQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.city) params.set("city", filters.city);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minBeds !== undefined) params.set("minBeds", String(filters.minBeds));
  params.set("sort", filters.sort);
  params.set("page", String(filters.page));
  return params.toString();
}

export async function listProperties(filters: ListingFilters): Promise<Page<PropertySummary>> {
  try {
    const { data, meta } = await apiFetch<PropertySummary[]>(`/properties?${listingQuery(filters)}`);
    const items = Array.isArray(data) ? data : [];
    return {
      items,
      total: meta?.total ?? items.length,
      page: meta?.page ?? filters.page,
      pageSize: meta?.pageSize ?? LISTING_PAGE_SIZE,
    };
  } catch (error) {
    return failLoad("listings", error);
  }
}

export async function getFeaturedProperties(limit = 4): Promise<PropertySummary[]> {
  try {
    const { data } = await apiFetch<PropertySummary[]>(`/properties/featured?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("featured listings", error);
  }
}

export async function getPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  try {
    const { data } = await apiFetch<PropertyDetail>(`/properties/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    return nullIfMissing("listing", error);
  }
}

export async function getSimilarProperties(detail: PropertyDetail, limit = 3): Promise<PropertySummary[]> {
  try {
    const { data } = await apiFetch<PropertySummary[]>(
      `/properties/${encodeURIComponent(detail.slug)}/similar?limit=${limit}`,
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("similar listings", error);
  }
}

export async function listCities(): Promise<CityCount[]> {
  try {
    const { data } = await apiFetch<CityCount[]>("/properties/cities");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return failLoad("cities", error);
  }
}

export async function getMarketStats(): Promise<MarketStats> {
  try {
    const { data } = await apiFetch<MarketStats>("/properties/stats");
    return data;
  } catch (error) {
    return failLoad("market stats", error);
  }
}
