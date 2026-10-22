import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import { notFound } from '../common/api.exception.js';
import type { PropertySummary } from '../common/contracts.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toSummary, type SummaryRow } from '../properties/present.js';

const summaryInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 1 },
} as const;

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser): Promise<PropertySummary[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { property: { include: summaryInclude } },
    });
    return rows
      .filter((row) => this.visible(user, row.property.status, row.property.agentId))
      .map((row) => toSummary(row.property as SummaryRow));
  }

  async ids(user: AuthUser): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { propertyId: true },
    });
    return rows.map((row) => row.propertyId);
  }

  async add(user: AuthUser, propertyId: string): Promise<{ favorited: true }> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (!property || (property.status !== 'published' && property.status !== 'sold')) {
      throw notFound('Listing not found.');
    }
    await this.prisma.favorite.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId } },
      create: { userId: user.id, propertyId },
      update: {},
    });
    return { favorited: true };
  }

  async remove(user: AuthUser, propertyId: string): Promise<{ favorited: false }> {
    await this.prisma.favorite.deleteMany({ where: { userId: user.id, propertyId } });
    return { favorited: false };
  }

  private visible(user: AuthUser, status: string, agentId: string): boolean {
    if (status === 'published' || status === 'sold') return true;
    return user.role === 'admin' || user.id === agentId;
  }
}
