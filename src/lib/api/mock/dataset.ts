import { createHash, randomUUID } from "node:crypto";

import { ACCOUNTS, DEMO_PASSWORD } from "../../../../api/prisma/seed-data/accounts";
import { FAVORITES, INQUIRIES } from "../../../../api/prisma/seed-data/engagement";
import { assignPhotos, sizedUrl } from "../../../../api/prisma/seed-data/photos";
import { PROPERTIES } from "../../../../api/prisma/seed-data/properties";
import { PHOTOS } from "@/lib/photography/catalog";

import type { MockImage, MockProperty, MockUser, Store } from "./types";

// Same derivation as the unexported helper in api/prisma/seed.ts. That file pulls Prisma, so this copy stays here. scripts/mock/parity.ts checks the ids against the live API.
export function stableUuid(name: string): string {
  const chars = createHash("sha256").update(name).digest("hex").slice(0, 32).split("");
  chars[12] = "4";
  const variant = Number.parseInt(chars[16] ?? "0", 16);
  chars[16] = ["8", "9", "a", "b"][variant % 4] ?? "8";
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function newId(): string {
  return randomUUID();
}

function clock(start: number): () => string {
  let tick = start;
  return () => {
    const value = new Date(tick).toISOString();
    tick += 1;
    return value;
  };
}

export async function buildDataset(): Promise<Store> {
  const next = clock(Date.parse("2026-01-01T00:00:00.000Z"));
  const users: MockUser[] = ACCOUNTS.map((account) => {
    const email = account.email.toLowerCase();
    const createdAt = next();
    return {
      id: stableUuid(`user:${email}`),
      email,
      // Seeded rows share the demo password in plain text. Signups keep the password they sent. This process does not hash.
      password: DEMO_PASSWORD,
      role: account.role,
      fullName: account.fullName,
      phone: account.phone,
      agency: account.agency ?? null,
      licenseNo: account.licenseNo ?? null,
      bio: account.bio ?? null,
      avatarUrl: null,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const userId = new Map(users.map((user) => [user.email, user.id]));

  const assignments = assignPhotos(PROPERTIES, [...PHOTOS]);
  const properties: MockProperty[] = [];
  const images: MockImage[] = [];

  for (const property of PROPERTIES) {
    const agentId = userId.get(property.agentEmail);
    if (!agentId) throw new Error(`Missing agent ${property.agentEmail}`);
    const createdAt = next();
    const id = stableUuid(`property:${property.slug}`);
    properties.push({
      id,
      slug: property.slug,
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
      amenities: [...property.amenities],
      yearBuilt: property.yearBuilt,
      featured: property.featured,
      publishedAt: property.publishedAt,
      createdAt,
      updatedAt: createdAt,
    });
    const frames = assignments.get(property.slug);
    if (!frames) throw new Error(`Missing images for ${property.slug}`);
    frames.forEach((photo, position) => {
      images.push({
        id: stableUuid(`image:${property.slug}:${position}`),
        propertyId: id,
        url: sizedUrl(photo),
        alt: photo.alt.slice(0, 300),
        position,
      });
    });
  }

  const propertyId = new Map(properties.map((property) => [property.slug, property.id]));
  const inquiries = INQUIRIES.map((inquiry) => {
    const id = propertyId.get(inquiry.slug);
    if (!id) throw new Error(`Missing property ${inquiry.slug}`);
    return {
      id: stableUuid(`inquiry:${inquiry.key}`),
      propertyId: id,
      buyerId: inquiry.buyerEmail ? (userId.get(inquiry.buyerEmail.toLowerCase()) ?? null) : null,
      name: inquiry.name,
      email: inquiry.email.toLowerCase(),
      phone: inquiry.phone,
      message: inquiry.message,
      preferredViewingDate: inquiry.preferredViewingDate,
      status: inquiry.status,
      createdAt: next(),
    };
  });

  const favorites = FAVORITES.map((favorite) => {
    const owner = userId.get(favorite.userEmail.toLowerCase());
    const listing = propertyId.get(favorite.slug);
    if (!owner || !listing) throw new Error(`Missing favorite ${favorite.slug}`);
    return { userId: owner, propertyId: listing, createdAt: next() };
  });

  return { users, properties, images, favorites, inquiries };
}
