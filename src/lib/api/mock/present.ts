import type { MockImage, MockInquiry, MockProperty, MockUser, Store } from "./types";

function imagesFor(store: Store, propertyId: string): MockImage[] {
  return store.images
    .filter((image) => image.propertyId === propertyId)
    .sort((left, right) => left.position - right.position);
}

function toImage(image: MockImage) {
  return {
    id: image.id,
    url: image.url,
    alt: image.alt,
    position: image.position,
  };
}

export function toSummary(store: Store, property: MockProperty) {
  const images = imagesFor(store, property.id).map(toImage);
  return {
    id: property.id,
    slug: property.slug,
    title: property.title,
    listingType: property.listingType,
    propertyType: property.propertyType,
    status: property.status,
    pricePhp: property.pricePhp,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floorAreaSqm: property.floorAreaSqm,
    lotAreaSqm: property.lotAreaSqm,
    neighborhood: property.neighborhood,
    city: property.city,
    province: property.province,
    coverImage: images[0] ?? null,
    featured: property.featured,
    publishedAt: property.publishedAt,
  };
}

function toAgent(user: MockUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    agency: user.agency,
    licenseNo: user.licenseNo,
    bio: user.bio,
  };
}

export function toDetail(store: Store, property: MockProperty) {
  const agent = store.users.find((user) => user.id === property.agentId);
  if (!agent) throw new Error(`Missing agent for ${property.slug}`);
  const images = imagesFor(store, property.id).map(toImage);
  return {
    ...toSummary(store, property),
    description: property.description,
    address: property.address,
    parkingSlots: property.parkingSlots,
    yearBuilt: property.yearBuilt,
    amenities: property.amenities,
    latitude: property.latitude,
    longitude: property.longitude,
    images,
    coverImage: images[0] ?? null,
    agent: toAgent(agent),
  };
}

export function toInquiry(store: Store, inquiry: MockInquiry) {
  const property = store.properties.find((row) => row.id === inquiry.propertyId);
  return {
    id: inquiry.id,
    propertyId: inquiry.propertyId,
    propertyTitle: property?.title ?? "",
    propertySlug: property?.slug ?? "",
    buyerId: inquiry.buyerId,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    message: inquiry.message,
    preferredViewingDate: inquiry.preferredViewingDate,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
  };
}

export function toProfile(user: MockUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    agency: user.agency,
    licenseNo: user.licenseNo,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}

export function canManage(user: MockUser, agentId: string): boolean {
  return user.role === "admin" || user.id === agentId;
}

export function compareIso(left: string | null, right: string | null, direction: "asc" | "desc"): number {
  if (left === right) return 0;
  if (left === null) return direction === "desc" ? -1 : 1;
  if (right === null) return direction === "desc" ? 1 : -1;
  const leftFirst = left < right;
  if (direction === "asc") return leftFirst ? -1 : 1;
  return leftFirst ? 1 : -1;
}
