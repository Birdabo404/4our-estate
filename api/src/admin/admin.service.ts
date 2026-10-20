import { Injectable } from '@nestjs/common';

import { conflict, notFound } from '../common/api.exception.js';
import type { AdminStats, DirectoryUser, PropertySummary, Role } from '../common/contracts.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toSummary, type SummaryRow } from '../properties/present.js';

const summaryInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 1 },
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<AdminStats> {
    const [userCount, listingCount, pendingCount, publishedCount, inquiryCount, newInquiryCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.property.count(),
        this.prisma.property.count({ where: { status: 'pending' } }),
        this.prisma.property.count({ where: { status: 'published' } }),
        this.prisma.inquiry.count(),
        this.prisma.inquiry.count({ where: { status: 'new' } }),
      ]);
    return { userCount, listingCount, pendingCount, publishedCount, inquiryCount, newInquiryCount };
  }

  async moderation(): Promise<PropertySummary[]> {
    const rows = await this.prisma.property.findMany({
      where: { status: 'pending' },
      include: summaryInclude,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => toSummary(row as SummaryRow));
  }

  async users(): Promise<DirectoryUser[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.fullName,
      phone: row.phone,
      agency: row.agency,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async setRole(id: string, role: Role): Promise<{ id: string; role: Role }> {
    const saved = await this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id } });
      if (!current) throw notFound('That user was not found.');
      if (current.role === 'admin' && role !== 'admin') {
        const others = await tx.user.count({ where: { role: 'admin', id: { not: id } } });
        if (others === 0) throw conflict('The last admin cannot be removed.');
      }
      return tx.user.update({ where: { id }, data: { role } });
    });
    return { id: saved.id, role: saved.role };
  }
}
