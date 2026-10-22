export const ROLES = ['buyer', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const SIGNUP_ROLES = ['buyer', 'agent'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const LISTING_TYPES = ['sale', 'rent'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const PROPERTY_TYPES = [
  'house',
  'condominium',
  'townhouse',
  'villa',
  'penthouse',
  'lot',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUSES = ['draft', 'pending', 'published', 'sold', 'archived'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const INQUIRY_STATUSES = ['new', 'contacted', 'closed'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const LISTING_SORTS = ['newest', 'price_asc', 'price_desc', 'size_desc'] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'BAD_REQUEST',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type MemberViewer = {
  kind: 'member';
  id: string;
  email: string;
  role: Role;
  fullName: string;
  avatarUrl: string | null;
};

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

export type CityCount = {
  name: string;
  province: string;
  count: number;
};

export type MarketStats = {
  listingCount: number;
  cityCount: number;
  medianPricePhp: number;
};

export type DirectoryUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  phone: string | null;
  agency: string | null;
  createdAt: string;
};

export type AdminStats = {
  userCount: number;
  listingCount: number;
  pendingCount: number;
  publishedCount: number;
  inquiryCount: number;
  newInquiryCount: number;
};

export type Profile = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  phone: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type AuthSession = {
  accessToken: string;
  user: MemberViewer;
};

export type ErrorBody = {
  statusCode: number;
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
};

export const LISTING_PAGE_SIZE = 12;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const PUBLIC_LISTING_STATUSES = ['published', 'sold'] as const;
