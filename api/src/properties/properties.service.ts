import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { AuthUser } from '../auth/auth-user.js';
import { conflict, forbidden, notFound } from '../common/api.exception.js';
import {
  LISTING_PAGE_SIZE,
  type CityCount,
  type ListingSort,
  type MarketStats,
  type PropertyDetail,
  type PropertySummary,
} from '../common/contracts.js';
import { PageResult } from '../common/page.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { canManageListing } from './access.js';
import type { ListPropertiesQuery, PropertyContentDto, UpdatePropertyDto } from './dto/property.dto.js';
import { canTransition } from './listing-transitions.js';
import { percentileCont } from './median.js';
import { toDetail, toSummary, type DetailRow, type SummaryRow } from './present.js';
import { slugify } from './slug.js';

const summaryInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 1 },
} satisfies Prisma.PropertyInclude;

const detailInclude = {
  images: { orderBy: { position: 'asc' as const } },
  agent: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      phone: true,
      agency: true,
      licenseNo: true,
      bio: true,
    },
  },
} satisfies Prisma.PropertyInclude;

function orderFor(sort: ListingSort): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
    case 'price_asc':
      return [{ pricePhp: 'asc' }];
    case 'price_desc':
      return [{ pricePhp: 'desc' }];
    case 'size_desc':
      return [{ floorAreaSqm: 'desc' }];
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

function contentData(dto: PropertyContentDto | UpdatePropertyDto): Prisma.PropertyUncheckedUpdateInput {
  const data: Prisma.PropertyUncheckedUpdateInput = {};
  if (dto.title !== undefined) data.title = dto.title;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.listingType !== undefined) data.listingType = dto.listingType;
  if (dto.propertyType !== undefined) data.propertyType = dto.propertyType;
  if (dto.pricePhp !== undefined) data.pricePhp = dto.pricePhp;
  if (dto.bedrooms !== undefined) data.bedrooms = dto.bedrooms;
  if (dto.bathrooms !== undefined) data.bathrooms = dto.bathrooms;
  if (dto.floorAreaSqm !== undefined) data.floorAreaSqm = dto.floorAreaSqm;
  if (dto.lotAreaSqm !== undefined) data.lotAreaSqm = dto.lotAreaSqm;
  if (dto.parkingSlots !== undefined) data.parkingSlots = dto.parkingSlots;
  if (dto.neighborhood !== undefined) data.neighborhood = dto.neighborhood;
  if (dto.city !== undefined) data.city = dto.city;
  if (dto.province !== undefined) data.province = dto.province;
  if (dto.address !== undefined) data.address = dto.address;
  if (dto.latitude !== undefined) data.latitude = dto.latitude;
  if (dto.longitude !== undefined) data.longitude = dto.longitude;
  if (dto.amenities !== undefined) data.amenities = dto.amenities;
  if (dto.yearBuilt !== undefined) data.yearBuilt = dto.yearBuilt;
  if (dto.slug !== undefined) data.slug = dto.slug;
  return data;
}

function isSlugConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const known = error as { code?: string; meta?: { target?: unknown } };
  return known.code === 'P2002' && JSON.stringify(known.meta?.target ?? '').includes('slug');
}

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPropertiesQuery): Promise<PageResult<PropertySummary>> {
    const page = query.page ?? 1;
    const sort = query.sort ?? 'newest';
    const where: Prisma.PropertyWhereInput = { status: 'published' };
    if (query.listingType) where.listingType = query.listingType;
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.city) where.city = query.city;
    if (query.minBeds != null) where.bedrooms = { gte: query.minBeds };
    if (query.minPrice != null || query.maxPrice != null) {
      where.pricePhp = {
        ...(query.minPrice != null ? { gte: query.minPrice } : {}),
        ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { neighborhood: { contains: query.q, mode: 'insensitive' } },
        { city: { contains: query.q, mode: 'insensitive' } },
        { province: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        include: summaryInclude,
        orderBy: orderFor(sort),
        skip: (page - 1) * LISTING_PAGE_SIZE,
        take: LISTING_PAGE_SIZE,
      }),
    ]);
    return new PageResult(rows.map((row) => toSummary(row as SummaryRow)), total, page, LISTING_PAGE_SIZE);
  }

  async featured(limit = 4): Promise<PropertySummary[]> {
    const rows = await this.prisma.property.findMany({
      where: { status: 'published', featured: true },
      include: summaryInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return rows.map((row) => toSummary(row as SummaryRow));
  }

  async cities(): Promise<CityCount[]> {
    const rows = await this.prisma.property.groupBy({
      by: ['city', 'province'],
      where: { status: 'published' },
      _count: { _all: true },
    });
    return rows
      .map((row) => ({ name: row.city, province: row.province, count: row._count._all }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }

  async stats(): Promise<MarketStats> {
    const rows = await this.prisma.property.findMany({
      where: { status: 'published' },
      select: { city: true, listingType: true, pricePhp: true },
    });
    const salePrices = rows
      .filter((row) => row.listingType === 'sale')
      .map((row) => Number(row.pricePhp));
    return {
      listingCount: rows.length,
      cityCount: new Set(rows.map((row) => row.city)).size,
      medianPricePhp: percentileCont(salePrices, 0.5),
    };
  }

  async bySlug(slug: string, user?: AuthUser): Promise<PropertyDetail> {
    const row = await this.prisma.property.findUnique({ where: { slug }, include: detailInclude });
    if (!row) throw notFound('Listing not found.');
    const isPublic = row.status === 'published' || row.status === 'sold';
    if (!isPublic && !(user && canManageListing(user, row.agentId))) {
      throw notFound('Listing not found.');
    }
    return toDetail(row as DetailRow);
  }

  async byId(id: string, user: AuthUser): Promise<PropertyDetail> {
    const row = await this.prisma.property.findUnique({ where: { id }, include: detailInclude });
    if (!row || !canManageListing(user, row.agentId)) throw notFound('Listing not found.');
    return toDetail(row as DetailRow);
  }

  async similar(slug: string, limit = 3): Promise<PropertySummary[]> {
    const source = await this.prisma.property.findUnique({ where: { slug } });
    if (!source || (source.status !== 'published' && source.status !== 'sold')) {
      throw notFound('Listing not found.');
    }
    const rows = await this.prisma.property.findMany({
      where: { status: 'published', city: source.city, id: { not: source.id } },
      include: summaryInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3,
    });
    const summaries = rows.map((row) => toSummary(row as SummaryRow));
    const sameType = summaries.filter((row) => row.propertyType === source.propertyType);
    const rest = summaries.filter((row) => row.propertyType !== source.propertyType);
    return [...sameType, ...rest].slice(0, limit);
  }

  async create(user: AuthUser, dto: PropertyContentDto): Promise<{ id: string; slug: string }> {
    const base = dto.slug ?? slugify(dto.title);
    const slugs = dto.slug
      ? [dto.slug]
      : [base, `${base}-2`.slice(0, 80), `${base}-3`.slice(0, 80), `${base}-${randomUUID().slice(0, 6)}`.slice(0, 80)];
    for (const slug of slugs) {
      try {
        const created = await this.prisma.property.create({
          data: {
            ...(contentData(dto) as Prisma.PropertyUncheckedCreateInput),
            slug,
            agentId: user.id,
            status: 'draft',
            featured: false,
            amenities: dto.amenities ?? [],
          },
        });
        return { id: created.id, slug: created.slug };
      } catch (error) {
        if (!isSlugConflict(error)) throw error;
        if (dto.slug) throw conflict('A listing with this slug already exists.');
      }
    }
    throw conflict('A listing with this slug already exists.');
  }

  async update(id: string, user: AuthUser, dto: UpdatePropertyDto): Promise<{ id: string; slug: string }> {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound('Listing not found.');
    if (!canManageListing(user, property.agentId)) throw forbidden('You cannot edit this listing.');
    try {
      const saved = await this.prisma.property.update({
        where: { id },
        data: contentData(dto),
      });
      return { id: saved.id, slug: saved.slug };
    } catch (error) {
      if (isSlugConflict(error)) throw conflict('A listing with this slug already exists.');
      throw error;
    }
  }

  async transition(id: string, user: AuthUser, to: PropertySummary['status']): Promise<{ id: string; status: PropertySummary['status']; slug: string }> {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw notFound('Listing not found.');
    if (!canManageListing(user, property.agentId)) throw forbidden('You cannot change this listing.');
    if (property.status === to) {
      return { id: property.id, status: property.status, slug: property.slug };
    }
    if (!canTransition(property.status, to, user.role)) {
      throw forbidden('That status change is not allowed.');
    }
    const saved = await this.prisma.property.update({
      where: { id },
      data: {
        status: to,
        ...(to === 'published' && property.publishedAt === null ? { publishedAt: new Date() } : {}),
      },
    });
    return { id: saved.id, status: saved.status, slug: saved.slug };
  }

  async listMine(user: AuthUser): Promise<PropertySummary[]> {
    const rows = await this.prisma.property.findMany({
      where: { agentId: user.id },
      include: summaryInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => toSummary(row as SummaryRow));
  }

  async setFeatured(id: string, featured: boolean): Promise<{ id: string; featured: boolean }> {
    const property = await this.prisma.property.findUnique({ where: { id }, select: { id: true } });
    if (!property) throw notFound('Listing not found.');
    const saved = await this.prisma.property.update({ where: { id }, data: { featured } });
    return { id: saved.id, featured: saved.featured };
  }
}
