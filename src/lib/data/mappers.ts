import "server-only";

import {
  INQUIRY_STATUSES,
  LISTING_STATUSES,
  LISTING_TYPES,
  PROPERTY_TYPES,
  ROLES,
  type AgentProfile,
  type Inquiry,
  type InquiryStatus,
  type ListingStatus,
  type ListingType,
  type PropertyDetail,
  type PropertyImage,
  type PropertySummary,
  type PropertyType,
  type Role,
} from "@/lib/domain/types";

import type { DirectoryUser } from "./types";

type ImageSource = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

type SummarySource = {
  id: string;
  slug: string;
  title: string;
  listing_type: string;
  property_type: string;
  status: string;
  price_php: number | string;
  bedrooms: number;
  bathrooms: number | string;
  floor_area_sqm: number | string;
  lot_area_sqm: number | string | null;
  neighborhood: string;
  city: string;
  province: string;
  featured: boolean;
  published_at: string | null;
  property_images?: ImageSource[] | ImageSource | null;
};

type AgentSource = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  agency: string | null;
  license_no: string | null;
  bio: string | null;
};

export type DetailSource = SummarySource & {
  description: string;
  address: string;
  parking_slots: number;
  year_built: number | null;
  amenities: string[] | null;
  latitude: number | string | null;
  longitude: number | string | null;
  agent?: AgentSource | AgentSource[] | null;
};

type InquirySource = {
  id: string;
  property_id: string;
  property_title: string;
  property_slug: string;
  buyer_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferred_viewing_date: string | null;
  status: string;
  created_at: string;
};

function asNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function requiredNumber(value: number | string | null): number {
  const parsed = asNumber(value);
  if (parsed === null) {
    throw new Error("Could not load listings.");
  }
  return parsed;
}

function oneOf<T extends string>(allowed: readonly T[], value: string): T {
  const match = allowed.find((item) => item === value);
  if (!match) throw new Error("Could not load listings.");
  return match;
}

function many<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function one<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toImage(row: ImageSource): PropertyImage {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    position: row.position,
  };
}

function toImages(value: ImageSource[] | ImageSource | null | undefined): PropertyImage[] {
  return many(value)
    .map(toImage)
    .sort((left, right) => left.position - right.position);
}

function cover(images: PropertyImage[]): PropertyImage | null {
  return images[0] ?? null;
}

export function toSummary(row: SummarySource): PropertySummary {
  const images = toImages(row.property_images);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    listingType: oneOf<ListingType>(LISTING_TYPES, row.listing_type),
    propertyType: oneOf<PropertyType>(PROPERTY_TYPES, row.property_type),
    status: oneOf<ListingStatus>(LISTING_STATUSES, row.status),
    pricePhp: requiredNumber(row.price_php),
    bedrooms: row.bedrooms,
    bathrooms: requiredNumber(row.bathrooms),
    floorAreaSqm: requiredNumber(row.floor_area_sqm),
    lotAreaSqm: asNumber(row.lot_area_sqm),
    neighborhood: row.neighborhood,
    city: row.city,
    province: row.province,
    coverImage: cover(images),
    featured: row.featured,
    publishedAt: row.published_at,
  };
}

function toAgent(row: AgentSource): AgentProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    agency: row.agency,
    licenseNo: row.license_no,
    bio: row.bio,
  };
}

export function toDetail(row: DetailSource): PropertyDetail | null {
  const agent = one(row.agent);
  if (!agent) return null;
  const images = toImages(row.property_images);
  return {
    ...toSummary(row),
    description: row.description,
    address: row.address,
    parkingSlots: row.parking_slots,
    yearBuilt: row.year_built,
    amenities: row.amenities ?? [],
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    images,
    coverImage: cover(images),
    agent: toAgent(agent),
  };
}

export function toInquiry(row: InquirySource): Inquiry {
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    propertySlug: row.property_slug,
    buyerId: row.buyer_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    preferredViewingDate: row.preferred_viewing_date,
    status: oneOf<InquiryStatus>(INQUIRY_STATUSES, row.status),
    createdAt: row.created_at,
  };
}

export function toDirectoryUser(row: {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone: string | null;
  agency: string | null;
  created_at: string;
}): DirectoryUser {
  return {
    id: row.id,
    email: row.email,
    role: oneOf<Role>(ROLES, row.role),
    fullName: row.full_name,
    phone: row.phone,
    agency: row.agency,
    createdAt: row.created_at,
  };
}
