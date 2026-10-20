export const ROLES = ["buyer", "agent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const SIGNUP_ROLES = ["buyer", "agent"] as const satisfies readonly Role[];
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export type Viewer =
  | { kind: "guest" }
  | {
      kind: "member";
      id: string;
      email: string;
      role: Role;
      fullName: string;
      avatarUrl: string | null;
    };

export const LISTING_TYPES = ["sale", "rent"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const PROPERTY_TYPES = [
  "house",
  "condominium",
  "townhouse",
  "villa",
  "penthouse",
  "lot",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUSES = [
  "draft",
  "pending",
  "published",
  "sold",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/**
 * Listing lifecycle. Keys are the current status, inner keys the next status,
 * values the roles allowed to make that move. Agents act only on their own
 * listings; that ownership check lives in RLS, not here.
 * The database trigger `enforce_listing_transition` mirrors this table.
 */
export const LISTING_TRANSITIONS = {
  draft: { pending: ["agent", "admin"], archived: ["agent", "admin"] },
  pending: { published: ["admin"], draft: ["agent", "admin"] },
  published: { sold: ["agent", "admin"], archived: ["agent", "admin"] },
  sold: { archived: ["agent", "admin"] },
  archived: { draft: ["agent", "admin"] },
} as const satisfies Record<
  ListingStatus,
  Partial<Record<ListingStatus, readonly Role[]>>
>;

export function nextStatuses(from: ListingStatus, role: Role): ListingStatus[] {
  const moves: Partial<Record<ListingStatus, readonly Role[]>> =
    LISTING_TRANSITIONS[from];
  return LISTING_STATUSES.filter((to) => moves[to]?.includes(role) ?? false);
}

export function canTransition(
  from: ListingStatus,
  to: ListingStatus,
  role: Role,
): boolean {
  return nextStatuses(from, role).includes(to);
}

export type PropertyImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export type AgentProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
};

export type PropertySummary = {
  id: string;
  slug: string;
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: ListingStatus;
  pricePhp: number;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number;
  lotAreaSqm: number | null;
  neighborhood: string;
  city: string;
  province: string;
  coverImage: PropertyImage | null;
  featured: boolean;
  publishedAt: string | null;
};

export type PropertyDetail = PropertySummary & {
  description: string;
  address: string;
  parkingSlots: number;
  yearBuilt: number | null;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  images: PropertyImage[];
  agent: AgentProfile;
};

export const INQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export type Inquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  buyerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferredViewingDate: string | null;
  status: InquiryStatus;
  createdAt: string;
};

export const LISTING_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "size_desc",
] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export type ListingFilters = {
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

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
