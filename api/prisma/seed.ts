import { createHash } from 'node:crypto';

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { BCRYPT_COST } from '../src/auth/password.js';
import { ACCOUNTS, DEMO_PASSWORD } from './seed-data/accounts.js';
import { FAVORITES, INQUIRIES } from './seed-data/engagement.js';
import { assignPhotos, loadCatalog, sizedUrl } from './seed-data/photos.js';
import { PROPERTIES, type SeedProperty } from './seed-data/properties.js';

const BANNED =
  /\b(nestled|boasts?|stunning|breathtaking|world-class|state-of-the-art|hidden gem|seamlessly|vibrant)\b/i;

function stableUuid(name: string): string {
  const chars = createHash('sha256').update(name).digest('hex').slice(0, 32).split('');
  chars[12] = '4';
  const variant = Number.parseInt(chars[16] ?? '0', 16);
  chars[16] = ['8', '9', 'a', 'b'][variant % 4] ?? '8';
  const hex = chars.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function assertCopy(properties: SeedProperty[]) {
  for (const property of properties) {
    const count = words(property.description);
    if (count < 120 || count > 200) {
      throw new Error(`${property.slug} description is ${count} words. Keep it between 120 and 200.`);
    }
    const banned = property.description.match(BANNED);
    if (banned) throw new Error(`${property.slug} description uses "${banned[0]}".`);
  }
}

function sameInstant(left: Date | null, right: string | null): boolean {
  if (left === null || right === null) return left === right;
  return left.getTime() === new Date(right).getTime();
}

function sameList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function sameNumber(left: { toNumber(): number } | number | null, right: number | null): boolean {
  if (left === null || right === null) return left === right;
  const value = typeof left === 'number' ? left : left.toNumber();
  return value === right;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed.');
  assertCopy(PROPERTIES);
  const photos = await loadCatalog();
  const assignments = assignPhotos(PROPERTIES, photos);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);

  try {
    const ids = new Map<string, string>();
    for (const account of ACCOUNTS) {
      const email = account.email.toLowerCase();
      const saved = await prisma.user.upsert({
        where: { email },
        create: {
          id: stableUuid(`user:${email}`),
          email,
          passwordHash,
          role: account.role,
          fullName: account.fullName,
          phone: account.phone,
          agency: account.agency ?? null,
          licenseNo: account.licenseNo ?? null,
          bio: account.bio ?? null,
        },
        update: {
          passwordHash,
          role: account.role,
          fullName: account.fullName,
          phone: account.phone,
          agency: account.agency ?? null,
          licenseNo: account.licenseNo ?? null,
          bio: account.bio ?? null,
        },
      });
      ids.set(email, saved.id);
    }

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;
    const propertyIds = new Map<string, string>();

    for (const property of PROPERTIES) {
      const agentId = ids.get(property.agentEmail);
      if (!agentId) throw new Error(`Missing agent ${property.agentEmail}`);
      const current = await prisma.property.findUnique({ where: { slug: property.slug } });
      const data = {
        agentId,
        title: property.title,
        description: property.description,
        listingType: property.listingType,
        propertyType: property.propertyType,
        status: property.status,
        pricePhp: property.pricePhp,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorAreaSqm: property.floorAreaSqm,
        lotAreaSqm: property.lotAreaSqm,
        parkingSlots: property.parkingSlots,
        neighborhood: property.neighborhood,
        city: property.city,
        province: property.province,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        amenities: property.amenities,
        yearBuilt: property.yearBuilt,
        featured: property.featured,
        publishedAt: property.publishedAt ? new Date(property.publishedAt) : null,
      };
      if (!current) {
        const created = await prisma.property.create({
          data: { ...data, id: stableUuid(`property:${property.slug}`), slug: property.slug },
        });
        propertyIds.set(property.slug, created.id);
        inserted += 1;
        continue;
      }
      propertyIds.set(property.slug, current.id);
      const matches =
        current.agentId === agentId &&
        current.title === data.title &&
        current.description === data.description &&
        current.listingType === data.listingType &&
        current.propertyType === data.propertyType &&
        current.status === data.status &&
        Number(current.pricePhp) === data.pricePhp &&
        current.bedrooms === data.bedrooms &&
        sameNumber(current.bathrooms, data.bathrooms) &&
        sameNumber(current.floorAreaSqm, data.floorAreaSqm) &&
        sameNumber(current.lotAreaSqm, data.lotAreaSqm) &&
        current.parkingSlots === data.parkingSlots &&
        current.neighborhood === data.neighborhood &&
        current.city === data.city &&
        current.province === data.province &&
        current.address === data.address &&
        sameNumber(current.latitude, data.latitude) &&
        sameNumber(current.longitude, data.longitude) &&
        sameList(current.amenities, data.amenities) &&
        current.yearBuilt === data.yearBuilt &&
        current.featured === data.featured &&
        sameInstant(current.publishedAt, property.publishedAt);
      if (matches) {
        unchanged += 1;
        continue;
      }
      await prisma.property.update({ where: { id: current.id }, data });
      updated += 1;
    }

    let imagesReplaced = 0;
    let imagesUnchanged = 0;
    for (const property of PROPERTIES) {
      const propertyId = propertyIds.get(property.slug);
      const frames = assignments.get(property.slug);
      if (!propertyId || !frames) throw new Error(`Missing images for ${property.slug}`);
      const desired = frames.map((photo, position) => ({
        id: stableUuid(`image:${property.slug}:${position}`),
        propertyId,
        url: sizedUrl(photo),
        storagePath: null,
        alt: photo.alt.slice(0, 300),
        position,
      }));
      const current = await prisma.propertyImage.findMany({
        where: { propertyId },
        orderBy: { position: 'asc' },
      });
      const same =
        current.length === desired.length &&
        desired.every((image, index) => {
          const row = current[index];
          return row?.url === image.url && row.alt === image.alt && row.position === image.position;
        });
      if (same) {
        imagesUnchanged += 1;
        continue;
      }
      await prisma.$transaction([
        prisma.propertyImage.deleteMany({ where: { propertyId } }),
        prisma.propertyImage.createMany({ data: desired }),
      ]);
      imagesReplaced += 1;
    }

    let inquiriesWritten = 0;
    let inquiriesUnchanged = 0;
    for (const inquiry of INQUIRIES) {
      const propertyId = propertyIds.get(inquiry.slug);
      if (!propertyId) throw new Error(`Missing property ${inquiry.slug}`);
      const buyerId = inquiry.buyerEmail ? (ids.get(inquiry.buyerEmail) ?? null) : null;
      const id = stableUuid(`inquiry:${inquiry.key}`);
      const current = await prisma.inquiry.findUnique({ where: { id } });
      const viewing = inquiry.preferredViewingDate
        ? new Date(`${inquiry.preferredViewingDate}T00:00:00.000Z`)
        : null;
      const same =
        current &&
        current.propertyId === propertyId &&
        current.buyerId === buyerId &&
        current.name === inquiry.name &&
        current.email === inquiry.email &&
        current.phone === inquiry.phone &&
        current.message === inquiry.message &&
        dateOnly(current.preferredViewingDate) === inquiry.preferredViewingDate &&
        current.status === inquiry.status;
      if (same) {
        inquiriesUnchanged += 1;
        continue;
      }
      await prisma.inquiry.upsert({
        where: { id },
        create: {
          id,
          propertyId,
          buyerId,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          message: inquiry.message,
          preferredViewingDate: viewing,
          status: inquiry.status,
        },
        update: {
          propertyId,
          buyerId,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          message: inquiry.message,
          preferredViewingDate: viewing,
          status: inquiry.status,
        },
      });
      inquiriesWritten += 1;
    }

    let favoritesWritten = 0;
    let favoritesUnchanged = 0;
    for (const favorite of FAVORITES) {
      const userId = ids.get(favorite.userEmail);
      const propertyId = propertyIds.get(favorite.slug);
      if (!userId || !propertyId) throw new Error(`Missing favorite ${favorite.slug}`);
      const current = await prisma.favorite.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
      });
      if (current) {
        favoritesUnchanged += 1;
        continue;
      }
      await prisma.favorite.create({ data: { userId, propertyId } });
      favoritesWritten += 1;
    }

    console.log(`users ensured: ${ACCOUNTS.length}`);
    console.log(`properties inserted: ${inserted}, updated: ${updated}, unchanged: ${unchanged}`);
    console.log(`image sets replaced: ${imagesReplaced}, unchanged: ${imagesUnchanged}`);
    console.log(`inquiries written: ${inquiriesWritten}, unchanged: ${inquiriesUnchanged}`);
    console.log(`favorites written: ${favoritesWritten}, unchanged: ${favoritesUnchanged}`);
  } finally {
    await prisma.$disconnect();
  }
}

function dateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
