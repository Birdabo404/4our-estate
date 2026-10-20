import {
  LISTING_SORTS,
  PROPERTY_TYPES,
  type ListingFilters,
  type ListingSort,
  type ListingType,
  type PropertyType,
} from "@/lib/domain/types";
import { formatPhp } from "@/lib/format";

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  house: "House",
  condominium: "Condominium",
  townhouse: "Townhouse",
  villa: "Villa",
  penthouse: "Penthouse",
  lot: "Lot",
};

export const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((value) => ({ value, label: PROPERTY_TYPE_LABEL[value] }));

export const LISTING_TYPE_LABEL: Record<ListingType, string> = { sale: "For sale", rent: "For lease" };

export const SORT_LABEL: Record<ListingSort, string> = {
  newest: "Newest first",
  price_asc: "Price, low to high",
  price_desc: "Price, high to low",
  size_desc: "Largest first",
};

export const SORT_OPTIONS = LISTING_SORTS.map((value) => ({ value, label: SORT_LABEL[value] }));

export const MIN_BEDS_OPTIONS = [1, 2, 3, 4, 5] as const;

export type PricePreset = { min?: number; max?: number };

const M = 1_000_000;
const K = 1_000;

/** Sale prices and monthly rents live in one column, so each listing type gets its own bands. */
export const PRICE_PRESETS: Record<ListingType, readonly PricePreset[]> = {
  sale: [{ max: 50 * M }, { min: 50 * M, max: 100 * M }, { min: 100 * M, max: 250 * M }, { min: 250 * M }],
  rent: [{ max: 200 * K }, { min: 200 * K, max: 400 * K }, { min: 400 * K }],
};

const short = (n: number) => formatPhp(n, "compact");

export function priceLabel({ min, max }: PricePreset, listingType?: ListingType): string {
  const cadence = listingType === "rent" ? "/mo" : "";
  if (min !== undefined && max !== undefined) return `${short(min)} to ${short(max)}${cadence}`;
  if (max !== undefined) return `Under ${short(max)}${cadence}`;
  if (min !== undefined) return `${short(min)}${cadence} and above`;
  return "Any price";
}

export function priceKey({ min, max }: PricePreset): string {
  return `${min ?? ""}:${max ?? ""}`;
}

export function parsePriceKey(key: string): PricePreset {
  const [min, max] = key.split(":").map((part) => (part === "" ? undefined : Number(part)));
  return { min, max };
}

export type FilterPatch = { [K in keyof ListingFilters]?: ListingFilters[K] | undefined };

/** Any change other than paging returns to page one; switching sale and rent drops the price band. */
export function applyPatch(filters: ListingFilters, patch: FilterPatch): ListingFilters {
  const merged: FilterPatch = { ...filters, page: 1, ...patch };
  if ("listingType" in patch && patch.listingType !== filters.listingType) {
    merged.minPrice = undefined;
    merged.maxPrice = undefined;
  }
  const next: ListingFilters = { sort: merged.sort ?? "newest", page: merged.page ?? 1 };
  if (merged.q) next.q = merged.q;
  if (merged.listingType) next.listingType = merged.listingType;
  if (merged.propertyType) next.propertyType = merged.propertyType;
  if (merged.city) next.city = merged.city;
  if (merged.minPrice !== undefined) next.minPrice = merged.minPrice;
  if (merged.maxPrice !== undefined) next.maxPrice = merged.maxPrice;
  if (merged.minBeds !== undefined && merged.minBeds > 0) next.minBeds = merged.minBeds;
  return next;
}

export function toQueryString(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.city) params.set("city", filters.city);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minBeds !== undefined) params.set("minBeds", String(filters.minBeds));
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listingsHref(filters: ListingFilters): string {
  return `/properties${toQueryString(filters)}`;
}

export type FilterChip = { id: string; label: string; clear: FilterPatch };

type ChipRule = (filters: ListingFilters) => FilterChip | null;

const CHIP_RULES: readonly ChipRule[] = [
  (f) => (f.q ? { id: "q", label: `“${f.q}”`, clear: { q: undefined } } : null),
  (f) => (f.listingType ? { id: "listingType", label: LISTING_TYPE_LABEL[f.listingType], clear: { listingType: undefined } } : null),
  (f) => (f.propertyType ? { id: "propertyType", label: PROPERTY_TYPE_LABEL[f.propertyType], clear: { propertyType: undefined } } : null),
  (f) => (f.city ? { id: "city", label: f.city, clear: { city: undefined } } : null),
  (f) =>
    f.minPrice !== undefined || f.maxPrice !== undefined
      ? {
          id: "price",
          label: priceLabel({ min: f.minPrice, max: f.maxPrice }, f.listingType),
          clear: { minPrice: undefined, maxPrice: undefined },
        }
      : null,
  (f) => (f.minBeds !== undefined ? { id: "minBeds", label: `${f.minBeds}+ bedrooms`, clear: { minBeds: undefined } } : null),
];

export function activeChips(filters: ListingFilters): FilterChip[] {
  return CHIP_RULES.flatMap((rule) => rule(filters) ?? []);
}

export const CLEAR_ALL: FilterPatch = {
  q: undefined,
  listingType: undefined,
  propertyType: undefined,
  city: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minBeds: undefined,
};
