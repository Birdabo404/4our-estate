import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import type {
  ErrorCode,
  InquiryStatus,
  ListingStatus,
  ListingType,
  PropertyType,
  Role,
} from '../common/contracts.js';

export class PropertyImage {
  id!: string;
  url!: string;
  alt!: string;
  position!: number;
}

export class AgentProfile {
  id!: string;
  fullName!: string;
  avatarUrl!: string | null;
  phone!: string | null;
  agency!: string | null;
  licenseNo!: string | null;
  bio!: string | null;
}

export class PropertySummary {
  id!: string;
  slug!: string;
  title!: string;
  listingType!: ListingType;
  propertyType!: PropertyType;
  status!: ListingStatus;
  pricePhp!: number;
  bedrooms!: number;
  bathrooms!: number;
  floorAreaSqm!: number;
  lotAreaSqm!: number | null;
  neighborhood!: string;
  city!: string;
  province!: string;
  coverImage!: PropertyImage | null;
  featured!: boolean;
  publishedAt!: string | null;
}

export class PropertyDetail extends PropertySummary {
  description!: string;
  address!: string;
  parkingSlots!: number;
  yearBuilt!: number | null;
  amenities!: string[];
  latitude!: number | null;
  longitude!: number | null;
  images!: PropertyImage[];
  agent!: AgentProfile;
}

export class Inquiry {
  id!: string;
  propertyId!: string;
  propertyTitle!: string;
  propertySlug!: string;
  buyerId!: string | null;
  name!: string;
  email!: string;
  phone!: string | null;
  message!: string;
  preferredViewingDate!: string | null;
  status!: InquiryStatus;
  createdAt!: string;
}

export class CityCount {
  name!: string;
  province!: string;
  count!: number;
}

export class MarketStats {
  listingCount!: number;
  cityCount!: number;
  medianPricePhp!: number;
}

export class DirectoryUser {
  id!: string;
  email!: string;
  role!: Role;
  fullName!: string;
  phone!: string | null;
  agency!: string | null;
  createdAt!: string;
}

export class AdminStats {
  userCount!: number;
  listingCount!: number;
  pendingCount!: number;
  publishedCount!: number;
  inquiryCount!: number;
  newInquiryCount!: number;
}

export class Profile {
  id!: string;
  email!: string;
  role!: Role;
  fullName!: string;
  phone!: string | null;
  agency!: string | null;
  licenseNo!: string | null;
  bio!: string | null;
  avatarUrl!: string | null;
}

export class MemberViewer {
  kind!: 'member';
  id!: string;
  email!: string;
  role!: Role;
  fullName!: string;
  avatarUrl!: string | null;
}

export class AuthSession {
  accessToken!: string;
  user!: MemberViewer;
}

export class PageMeta {
  total!: number;
  page!: number;
  pageSize!: number;
}

@ApiSchema({
  description:
    'Success body. Each operation replaces data with a concrete schema.',
})
export class SuccessEnvelope {
  @ApiProperty({ description: 'Operation payload.' })
  data!: unknown;
}

@ApiSchema({
  description:
    'Paginated success body. data is the page of results and meta is the page position.',
})
export class PaginatedEnvelope {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Page of results.',
  })
  data!: unknown[];

  @ApiProperty({ type: () => PageMeta })
  meta!: PageMeta;
}

export class ErrorBody {
  statusCode!: number;
  code!: ErrorCode;
  message!: string;

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
    description:
      'DTO property name to one sentence. Present on validation errors.',
  })
  fields?: Record<string, string>;
}

@ApiSchema({ name: 'ApiErrorEnvelope' })
export class ApiErrorEnvelope {
  error!: ErrorBody;
}

export class HealthStatus {
  status!: 'ok';
  db!: 'up';
}

export class IdSlug {
  id!: string;
  slug!: string;
}

export class IdOnly {
  id!: string;
}

export class ListingTransitionResult {
  id!: string;
  status!: ListingStatus;
  slug!: string;
}

export class FeaturedFlag {
  id!: string;
  featured!: boolean;
}

export class Favorited {
  favorited!: boolean;
}

export class InquiryStatusResult {
  id!: string;
  status!: InquiryStatus;
}

export class RoleChange {
  id!: string;
  role!: Role;
}
