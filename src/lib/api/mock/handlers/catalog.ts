import { canTransition } from "@/lib/domain/types";
import type { ListingSort } from "@/lib/domain/types";
import { slugify } from "@/lib/validation/listing";

import { newId } from "../dataset";
import { conflict, forbidden, notFound, ok, type MockResult } from "../http";
import { parseLimit, parseListQuery } from "../query";
import { canManage, compareIso, toDetail, toSummary } from "../present";
import type { MockProperty, MockUser, Store } from "../types";
import { parseListing, parseTransition } from "../validate";
import type { Handler } from "./context";

const PAGE_SIZE = 12;

function bySort(sort: ListingSort, left: MockProperty, right: MockProperty): number {
  switch (sort) {
    case "newest":
      return compareIso(left.publishedAt, right.publishedAt, "desc") || compareIso(left.createdAt, right.createdAt, "desc");
    case "price_asc":
      return left.pricePhp - right.pricePhp || compareIso(left.createdAt, right.createdAt, "asc");
    case "price_desc":
      return right.pricePhp - left.pricePhp || compareIso(left.createdAt, right.createdAt, "asc");
    case "size_desc":
      return right.floorAreaSqm - left.floorAreaSqm || compareIso(left.createdAt, right.createdAt, "asc");
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

function percentileCont(values: readonly number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = 1 + fraction * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const lowerValue = sorted[lower - 1] ?? sorted[0] ?? 0;
  const upperValue = sorted[upper - 1] ?? lowerValue;
  if (lower === upper) return lowerValue;
  return lowerValue + (upperValue - lowerValue) * (rank - lower);
}

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function requireProperty(store: Store, id: string): MockProperty {
  const property = store.properties.find((row) => row.id === id);
  if (!property) notFound("Listing not found.");
  return property;
}

function applyListing(property: MockProperty, patch: ReturnType<typeof parseListing>): void {
  if (patch.title !== undefined) property.title = patch.title;
  if (patch.description !== undefined) property.description = patch.description;
  if (patch.listingType !== undefined) property.listingType = patch.listingType;
  if (patch.propertyType !== undefined) property.propertyType = patch.propertyType;
  if (patch.pricePhp !== undefined) property.pricePhp = patch.pricePhp;
  if (patch.bedrooms !== undefined) property.bedrooms = patch.bedrooms;
  if (patch.bathrooms !== undefined) property.bathrooms = patch.bathrooms;
  if (patch.floorAreaSqm !== undefined) property.floorAreaSqm = patch.floorAreaSqm;
  if (patch.lotAreaSqm !== undefined) property.lotAreaSqm = patch.lotAreaSqm;
  if (patch.parkingSlots !== undefined) property.parkingSlots = patch.parkingSlots;
  if (patch.neighborhood !== undefined) property.neighborhood = patch.neighborhood;
  if (patch.city !== undefined) property.city = patch.city;
  if (patch.province !== undefined) property.province = patch.province;
  if (patch.address !== undefined) property.address = patch.address;
  if (patch.latitude !== undefined) property.latitude = patch.latitude;
  if (patch.longitude !== undefined) property.longitude = patch.longitude;
  if (patch.amenities !== undefined) property.amenities = patch.amenities;
  if (patch.yearBuilt !== undefined) property.yearBuilt = patch.yearBuilt;
  if (patch.slug !== undefined) property.slug = patch.slug;
  property.updatedAt = new Date().toISOString();
}

export const listProperties: Handler = ({ store, query }) => {
  const parsed = parseListQuery(query);
  const published = store.properties.filter((property) => {
    if (property.status !== "published") return false;
    if (parsed.listingType && property.listingType !== parsed.listingType) return false;
    if (parsed.propertyType && property.propertyType !== parsed.propertyType) return false;
    if (parsed.city && property.city !== parsed.city) return false;
    if (parsed.minBeds !== undefined && property.bedrooms < parsed.minBeds) return false;
    if (parsed.minPrice !== undefined && property.pricePhp < parsed.minPrice) return false;
    if (parsed.maxPrice !== undefined && property.pricePhp > parsed.maxPrice) return false;
    if (!parsed.q) return true;
    return (
      includes(property.title, parsed.q) ||
      includes(property.neighborhood, parsed.q) ||
      includes(property.city, parsed.q) ||
      includes(property.province, parsed.q) ||
      includes(property.description, parsed.q)
    );
  });
  published.sort((left, right) => bySort(parsed.sort, left, right));
  const start = (parsed.page - 1) * PAGE_SIZE;
  return ok(
    published.slice(start, start + PAGE_SIZE).map((property) => toSummary(store, property)),
    { total: published.length, page: parsed.page, pageSize: PAGE_SIZE },
  );
};

export const featuredProperties: Handler = ({ store, query }) => {
  const limit = parseLimit(query, 4);
  const rows = store.properties
    .filter((property) => property.status === "published" && property.featured)
    .sort((left, right) => compareIso(left.publishedAt, right.publishedAt, "desc") || compareIso(left.createdAt, right.createdAt, "desc"));
  return ok(rows.slice(0, limit).map((property) => toSummary(store, property)));
};

export const propertyCities: Handler = ({ store }) => {
  const counts = new Map<string, { name: string; province: string; count: number }>();
  for (const property of store.properties) {
    if (property.status !== "published") continue;
    const key = `${property.city}\u0000${property.province}`;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { name: property.city, province: property.province, count: 1 });
  }
  const rows = [...counts.values()].sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name),
  );
  return ok(rows);
};

export const propertyStats: Handler = ({ store }) => {
  const published = store.properties.filter((property) => property.status === "published");
  const salePrices = published.filter((property) => property.listingType === "sale").map((property) => property.pricePhp);
  return ok({
    listingCount: published.length,
    cityCount: new Set(published.map((property) => property.city)).size,
    medianPricePhp: percentileCont(salePrices, 0.5),
  });
};

export const propertyBySlug: Handler = ({ store, params, user }) => {
  const property = store.properties.find((row) => row.slug === params.slug);
  if (!property) notFound("Listing not found.");
  const isPublic = property.status === "published" || property.status === "sold";
  if (!isPublic && !(user && canManage(user, property.agentId))) notFound("Listing not found.");
  return ok(toDetail(store, property));
};

export const propertyById: Handler = ({ store, params, user }) => {
  const property = store.properties.find((row) => row.id === params.id);
  if (!property || !user || !canManage(user, property.agentId)) notFound("Listing not found.");
  return ok(toDetail(store, property));
};

export const similarProperties: Handler = ({ store, params, query }) => {
  const limit = parseLimit(query, 3);
  const source = store.properties.find((row) => row.slug === params.slug);
  if (!source || (source.status !== "published" && source.status !== "sold")) notFound("Listing not found.");
  const rows = store.properties
    .filter((property) => property.status === "published" && property.city === source.city && property.id !== source.id)
    .sort((left, right) => compareIso(left.publishedAt, right.publishedAt, "desc") || compareIso(left.createdAt, right.createdAt, "desc"));
  const summaries = rows.slice(0, limit * 3).map((property) => toSummary(store, property));
  const sameType = summaries.filter((row) => row.propertyType === source.propertyType);
  const rest = summaries.filter((row) => row.propertyType !== source.propertyType);
  return ok([...sameType, ...rest].slice(0, limit));
};

function slugChoices(requested: string | undefined, title: string): string[] {
  if (requested) return [requested];
  const base = slugify(title);
  return [base, `${base}-2`.slice(0, 80), `${base}-3`.slice(0, 80), `${base}-${newId().slice(0, 6)}`.slice(0, 80)];
}

export const createProperty: Handler = ({ store, json, user }) => {
  if (!user) notFound("Listing not found.");
  const patch = parseListing(json, "create");
  const choices = slugChoices(patch.slug, patch.title);
  for (const slug of choices) {
    if (store.properties.some((property) => property.slug === slug)) {
      if (patch.slug) conflict("A listing with this slug already exists.");
      continue;
    }
    const now = new Date().toISOString();
    const property: MockProperty = {
      id: newId(),
      slug,
      agentId: user.id,
      title: patch.title,
      description: patch.description,
      listingType: patch.listingType,
      propertyType: patch.propertyType,
      status: "draft",
      pricePhp: patch.pricePhp,
      bedrooms: patch.bedrooms,
      bathrooms: patch.bathrooms,
      floorAreaSqm: patch.floorAreaSqm,
      lotAreaSqm: patch.lotAreaSqm,
      parkingSlots: patch.parkingSlots,
      neighborhood: patch.neighborhood,
      city: patch.city,
      province: patch.province,
      address: patch.address,
      latitude: patch.latitude,
      longitude: patch.longitude,
      amenities: patch.amenities,
      yearBuilt: patch.yearBuilt,
      featured: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.properties.push(property);
    return ok({ id: property.id, slug: property.slug });
  }
  conflict("A listing with this slug already exists.");
};

export const updateProperty: Handler = ({ store, params, json, user }) => {
  const patch = parseListing(json, "update");
  const property = requireProperty(store, params.id ?? "");
  if (!user || !canManage(user, property.agentId)) forbidden("You cannot edit this listing.");
  if (patch.slug && patch.slug !== property.slug && store.properties.some((row) => row.slug === patch.slug)) {
    conflict("A listing with this slug already exists.");
  }
  applyListing(property, patch);
  return ok({ id: property.id, slug: property.slug });
};

export const transitionProperty: Handler = ({ store, params, json, user }) => {
  const to = parseTransition(json);
  const property = requireProperty(store, params.id ?? "");
  if (!user || !canManage(user, property.agentId)) forbidden("You cannot change this listing.");
  if (property.status === to) return ok({ id: property.id, status: property.status, slug: property.slug });
  if (!canTransition(property.status, to, user.role)) forbidden("That status change is not allowed.");
  property.status = to;
  if (to === "published" && property.publishedAt === null) property.publishedAt = new Date().toISOString();
  property.updatedAt = new Date().toISOString();
  return ok({ id: property.id, status: property.status, slug: property.slug });
};

export function ownedListings(store: Store, user: MockUser): MockResult {
  const rows = store.properties
    .filter((property) => property.agentId === user.id)
    .sort((left, right) => compareIso(left.updatedAt, right.updatedAt, "desc"));
  return ok(rows.map((property) => toSummary(store, property)));
}
