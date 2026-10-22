import {
  LISTING_SORTS,
  LISTING_TYPES,
  PROPERTY_TYPES,
  type ListingSort,
  type ListingType,
  type PropertyType,
} from "@/lib/domain/types";

import { validation } from "./http";

export type ListQuery = {
  q?: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  sort: ListingSort;
  page: number;
};

const LIST_KEYS = ["q", "listingType", "propertyType", "city", "minPrice", "maxPrice", "minBeds", "sort", "page"];

function take(query: URLSearchParams, key: string): string | undefined {
  const value = query.get(key);
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function rejectUnknown(query: URLSearchParams, allowed: readonly string[], fields: Record<string, string>): void {
  for (const key of new Set(query.keys())) {
    if (!allowed.includes(key)) fields[key] = "This field is not allowed.";
  }
}

function integer(
  raw: string | undefined,
  key: string,
  bounds: { min?: number; max?: number },
  fields: Record<string, string>,
): number | undefined {
  if (raw === undefined) return undefined;
  if (!/^-?\d+$/.test(raw)) {
    fields[key] = `${key} must be a number.`;
    return undefined;
  }
  const value = Number(raw);
  if (bounds.min !== undefined && value < bounds.min) {
    fields[key] = `${key} must not be less than ${bounds.min}.`;
    return undefined;
  }
  if (bounds.max !== undefined && value > bounds.max) {
    fields[key] = `${key} must not be greater than ${bounds.max}.`;
    return undefined;
  }
  return value;
}

function oneOf<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  key: string,
  fields: Record<string, string>,
): T | undefined {
  if (raw === undefined) return undefined;
  if (!allowed.includes(raw as T)) {
    fields[key] = `${key} must be one of the following values: ${allowed.join(", ")}`;
    return undefined;
  }
  return raw as T;
}

export function parseListQuery(query: URLSearchParams): ListQuery {
  const fields: Record<string, string> = {};
  rejectUnknown(query, LIST_KEYS, fields);
  const qRaw = take(query, "q");
  const cityRaw = take(query, "city");
  if (cityRaw && cityRaw.length > 80) fields.city = "city must be shorter than or equal to 80 characters";
  const listingType = oneOf(take(query, "listingType"), LISTING_TYPES, "listingType", fields);
  const propertyType = oneOf(take(query, "propertyType"), PROPERTY_TYPES, "propertyType", fields);
  const minPrice = integer(take(query, "minPrice"), "minPrice", { min: 0 }, fields);
  const maxPrice = integer(take(query, "maxPrice"), "maxPrice", { min: 0 }, fields);
  const minBeds = integer(take(query, "minBeds"), "minBeds", { min: 0, max: 30 }, fields);
  const sort = oneOf(take(query, "sort"), LISTING_SORTS, "sort", fields) ?? "newest";
  const page = integer(take(query, "page"), "page", { min: 1 }, fields) ?? 1;
  if (
    fields.maxPrice === undefined &&
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    fields.maxPrice = "Maximum price must be at least the minimum price.";
  }
  if (Object.keys(fields).length > 0) validation(fields);
  const parsed: ListQuery = { sort, page };
  if (qRaw) parsed.q = qRaw.slice(0, 120);
  if (listingType) parsed.listingType = listingType;
  if (propertyType) parsed.propertyType = propertyType;
  if (cityRaw && cityRaw.length <= 80) parsed.city = cityRaw;
  if (minPrice !== undefined) parsed.minPrice = minPrice;
  if (maxPrice !== undefined && fields.maxPrice === undefined) parsed.maxPrice = maxPrice;
  if (minBeds !== undefined) parsed.minBeds = minBeds;
  return parsed;
}

export function parseLimit(query: URLSearchParams, fallback: number): number {
  const fields: Record<string, string> = {};
  rejectUnknown(query, ["limit"], fields);
  const limit = integer(take(query, "limit"), "limit", { min: 1, max: 24 }, fields);
  if (Object.keys(fields).length > 0) validation(fields);
  return limit ?? fallback;
}
