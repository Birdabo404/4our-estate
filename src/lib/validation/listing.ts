import { z } from "zod";

import { LISTING_STATUSES, LISTING_TYPES, PROPERTY_TYPES } from "@/lib/domain/types";

import { emptyToUndefined, optionalNumber, requiredNumber } from "./fields";

function readAmenities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => readAmenities(item));
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export const listingSchema = z
  .object({
    id: z.preprocess(emptyToUndefined, z.uuid().optional()),
    slug: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Use lowercase words separated by hyphens." })
        .max(80)
        .optional(),
    ),
    title: z.string().trim().min(4, { error: "Enter a title." }).max(140),
    description: z.string().trim().min(1, { error: "Enter a description." }).max(8000),
    listingType: z.enum(LISTING_TYPES),
    propertyType: z.enum(PROPERTY_TYPES),
    pricePhp: requiredNumber(1, 10_000_000_000, true),
    bedrooms: requiredNumber(0, 30, true),
    bathrooms: requiredNumber(0, 30),
    floorAreaSqm: requiredNumber(0, 100_000),
    lotAreaSqm: optionalNumber(1, 1_000_000),
    parkingSlots: requiredNumber(0, 40, true),
    neighborhood: z.string().trim().min(1).max(80),
    city: z.string().trim().min(1).max(80),
    province: z.string().trim().min(1).max(80),
    address: z.string().trim().min(1).max(200),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
    amenities: z.preprocess(
      readAmenities,
      z.array(z.string().trim().min(1).max(40)).max(30),
    ),
    yearBuilt: optionalNumber(1800, 2100, true),
  })
  .refine((value) => (value.latitude === null) === (value.longitude === null), {
    path: ["latitude"],
    error: "Enter both latitude and longitude.",
  });

export const transitionSchema = z.object({
  id: z.uuid({ error: "Choose a listing." }),
  to: z.enum(LISTING_STATUSES),
});

export const imageMetaSchema = z.object({
  propertyId: z.uuid({ error: "Choose a listing." }),
  alt: z.string().trim().min(3, { error: "Describe the photo." }).max(300),
});

export const imageIdSchema = z.object({
  imageId: z.uuid({ error: "Choose a photo." }),
});

export const favoriteSchema = z.object({
  propertyId: z.uuid({ error: "Choose a listing." }),
});

export type ListingInput = z.infer<typeof listingSchema>;

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "listing";
}

export function readListing(formData: FormData) {
  return {
    id: formData.get("id"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description"),
    listingType: formData.get("listingType"),
    propertyType: formData.get("propertyType"),
    pricePhp: formData.get("pricePhp"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    floorAreaSqm: formData.get("floorAreaSqm"),
    lotAreaSqm: formData.get("lotAreaSqm"),
    parkingSlots: formData.get("parkingSlots"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    province: formData.get("province"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    amenities: formData.getAll("amenities"),
    yearBuilt: formData.get("yearBuilt"),
  };
}

export function readTransition(formData: FormData) {
  return {
    id: formData.get("id"),
    to: formData.get("to"),
  };
}

export function readImageMeta(formData: FormData) {
  return {
    propertyId: formData.get("propertyId"),
    alt: formData.get("alt"),
  };
}

export function readImageId(formData: FormData) {
  return { imageId: formData.get("imageId") };
}

export function readFavorite(formData: FormData) {
  return { propertyId: formData.get("propertyId") };
}

const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type ImageExtension = (typeof IMAGE_EXTENSIONS)[keyof typeof IMAGE_EXTENSIONS];

export function imageExtension(type: string): ImageExtension | null {
  if (type in IMAGE_EXTENSIONS) {
    return IMAGE_EXTENSIONS[type as keyof typeof IMAGE_EXTENSIONS];
  }
  return null;
}

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
