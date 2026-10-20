import type {
  AgentProfile,
  PropertyDetail,
  PropertyImage,
  PropertySummary,
} from '../common/contracts.js';

type Numeric = { toNumber(): number } | number | bigint;

export type ImageRow = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export type AgentRow = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
};

export type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  listingType: PropertySummary['listingType'];
  propertyType: PropertySummary['propertyType'];
  status: PropertySummary['status'];
  pricePhp: bigint | number;
  bedrooms: number;
  bathrooms: Numeric;
  floorAreaSqm: Numeric;
  lotAreaSqm: Numeric | null;
  neighborhood: string;
  city: string;
  province: string;
  featured: boolean;
  publishedAt: Date | null;
  images: ImageRow[];
};

export type DetailRow = SummaryRow & {
  description: string;
  address: string;
  parkingSlots: number;
  yearBuilt: number | null;
  amenities: string[];
  latitude: Numeric | null;
  longitude: Numeric | null;
  agent: AgentRow;
};

function asNumber(value: Numeric | null): number | null {
  if (value === null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}

function requiredNumber(value: Numeric): number {
  const parsed = asNumber(value);
  if (parsed === null) throw new Error('Could not load listings.');
  return parsed;
}

function toImages(rows: ImageRow[]): PropertyImage[] {
  return [...rows]
    .sort((left, right) => left.position - right.position)
    .map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      position: image.position,
    }));
}

export function toSummary(row: SummaryRow): PropertySummary {
  const images = toImages(row.images);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    listingType: row.listingType,
    propertyType: row.propertyType,
    status: row.status,
    pricePhp: requiredNumber(row.pricePhp),
    bedrooms: row.bedrooms,
    bathrooms: requiredNumber(row.bathrooms),
    floorAreaSqm: requiredNumber(row.floorAreaSqm),
    lotAreaSqm: asNumber(row.lotAreaSqm),
    neighborhood: row.neighborhood,
    city: row.city,
    province: row.province,
    coverImage: images[0] ?? null,
    featured: row.featured,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
  };
}

function toAgent(row: AgentRow): AgentProfile {
  return {
    id: row.id,
    fullName: row.fullName,
    avatarUrl: row.avatarUrl,
    phone: row.phone,
    agency: row.agency,
    licenseNo: row.licenseNo,
    bio: row.bio,
  };
}

export function toDetail(row: DetailRow): PropertyDetail {
  const images = toImages(row.images);
  return {
    ...toSummary(row),
    description: row.description,
    address: row.address,
    parkingSlots: row.parkingSlots,
    yearBuilt: row.yearBuilt,
    amenities: row.amenities,
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    images,
    coverImage: images[0] ?? null,
    agent: toAgent(row.agent),
  };
}
