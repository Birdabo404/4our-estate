import type {
  InquiryStatus,
  ListingStatus,
  ListingType,
  PropertyType,
  Role,
} from "@/lib/domain/types";

export type MockUser = {
  id: string;
  email: string;
  password: string;
  role: Role;
  fullName: string;
  phone: string | null;
  agency: string | null;
  licenseNo: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockProperty = {
  id: string;
  slug: string;
  agentId: string;
  title: string;
  description: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: ListingStatus;
  pricePhp: number;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number;
  lotAreaSqm: number | null;
  parkingSlots: number;
  neighborhood: string;
  city: string;
  province: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  yearBuilt: number | null;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockImage = {
  id: string;
  propertyId: string;
  url: string;
  alt: string;
  position: number;
};

export type MockFavorite = {
  userId: string;
  propertyId: string;
  createdAt: string;
};

export type MockInquiry = {
  id: string;
  propertyId: string;
  buyerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferredViewingDate: string | null;
  status: InquiryStatus;
  createdAt: string;
};

export type Store = {
  users: MockUser[];
  properties: MockProperty[];
  images: MockImage[];
  favorites: MockFavorite[];
  inquiries: MockInquiry[];
};
