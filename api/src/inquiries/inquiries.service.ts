import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../auth/auth-user.js';
import { forbidden, notFound, tooMany } from '../common/api.exception.js';
import type { Inquiry, InquiryStatus } from '../common/contracts.js';
import { PrismaService } from '../prisma/prisma.service.js';

const HOUR_MS = 60 * 60 * 1000;

type InquiryRow = {
  id: string;
  propertyId: string;
  buyerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferredViewingDate: Date | null;
  status: InquiryStatus;
  createdAt: Date;
  property: { title: string; slug: string };
};

function dateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    propertyId: row.propertyId,
    propertyTitle: row.property.title,
    propertySlug: row.property.slug,
    buyerId: row.buyerId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    preferredViewingDate: dateOnly(row.preferredViewingDate),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: {
    propertyId: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    preferredViewingDate?: string;
  }, user?: AuthUser): Promise<{ id: string }> {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: { id: true, status: true },
    });
    if (!property || property.status !== 'published') {
      throw notFound('This listing is not open for inquiries.');
    }
    const email = dto.email.toLowerCase();
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email})::bigint)`;
      const recent = await tx.inquiry.count({
        where: {
          email: { equals: email, mode: 'insensitive' },
          createdAt: { gt: new Date(Date.now() - HOUR_MS) },
        },
      });
      if (recent >= 5) {
        throw tooMany('You have sent too many inquiries this hour. Try again later.');
      }
      return tx.inquiry.create({
        data: {
          propertyId: dto.propertyId,
          buyerId: user?.id ?? null,
          name: dto.name,
          email,
          phone: dto.phone ?? null,
          message: dto.message,
          preferredViewingDate: dto.preferredViewingDate
            ? new Date(`${dto.preferredViewingDate}T00:00:00.000Z`)
            : null,
        },
        select: { id: true },
      });
    });
    return { id: created.id };
  }

  async mine(user: AuthUser): Promise<Inquiry[]> {
    const rows = await this.prisma.inquiry.findMany({
      where: { buyerId: user.id },
      include: { property: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toInquiry(row));
  }

  async forAgent(user: AuthUser): Promise<Inquiry[]> {
    const rows = await this.prisma.inquiry.findMany({
      where: { property: { agentId: user.id } },
      include: { property: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => toInquiry(row));
  }

  async setStatus(id: string, user: AuthUser, status: InquiryStatus): Promise<{ id: string; status: InquiryStatus }> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { property: { select: { agentId: true } } },
    });
    if (!inquiry) throw notFound('That inquiry was not found.');
    if (user.role !== 'admin' && inquiry.property.agentId !== user.id) {
      throw forbidden('That inquiry is not on one of your listings.');
    }
    const saved = await this.prisma.inquiry.update({ where: { id }, data: { status } });
    return { id: saved.id, status: saved.status };
  }
}
