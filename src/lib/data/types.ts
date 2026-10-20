import type { Role } from "@/lib/domain/types";

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
