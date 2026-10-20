"use server";

import { z } from "zod";

import { apiFetch, ApiError } from "@/lib/api/client";
import { requireRole } from "@/lib/data/viewer";
import type { ListingStatus, PropertyDetail, PropertyImage } from "@/lib/domain/types";
import {
  imageExtension,
  imageIdSchema,
  imageMetaSchema,
  listingSchema,
  MAX_IMAGE_BYTES,
  readImageId,
  readImageMeta,
  readListing,
  readTransition,
  transitionSchema,
  type ListingInput,
} from "@/lib/validation/listing";

import { failure } from "./failure";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

function listingJson(input: ListingInput) {
  return {
    title: input.title,
    description: input.description,
    listingType: input.listingType,
    propertyType: input.propertyType,
    pricePhp: input.pricePhp,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floorAreaSqm: input.floorAreaSqm,
    lotAreaSqm: input.lotAreaSqm,
    parkingSlots: input.parkingSlots,
    neighborhood: input.neighborhood,
    city: input.city,
    province: input.province,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    amenities: input.amenities,
    yearBuilt: input.yearBuilt,
    ...(input.slug ? { slug: input.slug } : {}),
  };
}

async function listingSlug(id: string): Promise<string | undefined> {
  try {
    const { data } = await apiFetch<PropertyDetail>(`/properties/id/${encodeURIComponent(id)}`);
    return data.slug;
  } catch {
    return undefined;
  }
}

export async function saveListing(
  _prev: ActionResult<{ id: string; slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = listingSchema.safeParse(readListing(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");
  const input = parsed.data;

  try {
    if (input.id) {
      let previous: string | undefined;
      try {
        const current = await apiFetch<PropertyDetail>(`/properties/id/${encodeURIComponent(input.id)}`);
        previous = current.data.slug;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) return fail("Listing not found.");
        throw error;
      }
      const { data } = await apiFetch<{ id: string; slug: string }>(`/properties/${encodeURIComponent(input.id)}`, {
        method: "PATCH",
        json: listingJson(input),
      });
      revalidateListing(previous);
      if (previous !== data.slug) revalidateListing(data.slug);
      return ok(data);
    }

    const { data } = await apiFetch<{ id: string; slug: string }>("/properties", {
      method: "POST",
      json: listingJson(input),
    });
    revalidateListing(data.slug);
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}

export async function uploadListingImage(
  _prev: ActionResult<PropertyImage> | null,
  formData: FormData,
): Promise<ActionResult<PropertyImage>> {
  const parsed = imageMetaSchema.safeParse(readImageMeta(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image.", { file: "Choose an image." });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("Images must be 8 MB or smaller.", { file: "Images must be 8 MB or smaller." });
  }
  if (!imageExtension(file.type)) {
    return fail("Use a JPEG, PNG, WebP, or AVIF image.", {
      file: "Use a JPEG, PNG, WebP, or AVIF image.",
    });
  }

  const body = new FormData();
  body.set("file", file);
  body.set("alt", parsed.data.alt);

  try {
    const { data } = await apiFetch<PropertyImage>(
      `/properties/${encodeURIComponent(parsed.data.propertyId)}/images`,
      { method: "POST", form: body },
    );
    revalidateListing(await listingSlug(parsed.data.propertyId));
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}

function propertyIdFrom(formData: FormData): string | null {
  const parsed = z.uuid().safeParse(formData.get("propertyId"));
  return parsed.success ? parsed.data : null;
}

export async function deleteListingImage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = imageIdSchema.safeParse(readImageId(formData));
  if (!parsed.success) return invalid(parsed.error);
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return fail("Choose a listing.");
  await requireRole("agent", "admin");

  try {
    const slug = await listingSlug(propertyId);
    const { data } = await apiFetch<{ id: string }>(
      `/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(parsed.data.imageId)}`,
      { method: "DELETE" },
    );
    revalidateListing(slug);
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}

export async function setCoverImage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = imageIdSchema.safeParse(readImageId(formData));
  if (!parsed.success) return invalid(parsed.error);
  const propertyId = propertyIdFrom(formData);
  if (!propertyId) return fail("Choose a listing.");
  await requireRole("agent", "admin");

  try {
    await apiFetch<PropertyImage>(
      `/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(parsed.data.imageId)}/cover`,
      { method: "POST" },
    );
    revalidateListing(await listingSlug(propertyId));
    return ok({ id: parsed.data.imageId });
  } catch (error) {
    return failure(error);
  }
}

export async function transitionListing(
  _prev: ActionResult<{ id: string; status: ListingStatus; slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: ListingStatus; slug: string }>> {
  const parsed = transitionSchema.safeParse(readTransition(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  try {
    const { data } = await apiFetch<{ id: string; status: ListingStatus; slug: string }>(
      `/properties/${encodeURIComponent(parsed.data.id)}/transitions`,
      { method: "POST", json: { to: parsed.data.to } },
    );
    revalidateListing(data.slug);
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}
