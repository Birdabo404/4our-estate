import {
  LISTING_SORTS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  type ListingFilters,
  type ListingSort,
  type ListingType,
  type PropertyType,
} from "@/lib/domain/types";

export const LISTING_PAGE_SIZE = 12;

type SearchParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function first(source: SearchParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }
  const value = source[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function oneOf<T extends string>(
  allowed: readonly T[],
  value: string | undefined,
): T | undefined {
  if (!value) return undefined;
  return allowed.find((item) => item === value);
}

function optionalNumber(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function parseListingFilters(searchParams: SearchParamSource): ListingFilters {
  const q = (first(searchParams, "q") ?? "").trim().slice(0, 120);
  const typeValue = first(searchParams, "type");
  const typeAsListing = oneOf<ListingType>(LISTING_TYPES, typeValue);
  const typeAsProperty = oneOf<PropertyType>(PROPERTY_TYPES, typeValue);
  const listingType =
    oneOf<ListingType>(LISTING_TYPES, first(searchParams, "listingType")) ??
    typeAsListing;
  const propertyType =
    oneOf<PropertyType>(PROPERTY_TYPES, first(searchParams, "propertyType")) ??
    (typeAsListing ? undefined : typeAsProperty);
  const city = (first(searchParams, "city") ?? "").trim().slice(0, 80);
  const minPrice = optionalNumber(first(searchParams, "minPrice"));
  let maxPrice = optionalNumber(first(searchParams, "maxPrice"));
  const minBeds = optionalNumber(first(searchParams, "minBeds"));
  const sort: ListingSort =
    oneOf<ListingSort>(LISTING_SORTS, first(searchParams, "sort")) ?? "newest";
  const pageRaw = optionalNumber(first(searchParams, "page"));
  const page = pageRaw !== undefined && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    maxPrice = undefined;
  }

  const filters: ListingFilters = { sort, page };
  if (q) filters.q = q;
  if (listingType) filters.listingType = listingType;
  if (propertyType) filters.propertyType = propertyType;
  if (city) filters.city = city;
  if (minPrice !== undefined && minPrice >= 0) filters.minPrice = minPrice;
  if (maxPrice !== undefined && maxPrice >= 0) filters.maxPrice = maxPrice;
  if (minBeds !== undefined && minBeds >= 0) filters.minBeds = Math.floor(minBeds);
  return filters;
}
