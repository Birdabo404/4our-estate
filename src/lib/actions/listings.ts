"use server";

import { requireRole } from "@/lib/data/viewer";
import { canTransition, type ListingStatus, type PropertyImage } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";
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
  slugify,
  transitionSchema,
} from "@/lib/validation/listing";

import { humanize } from "./errors";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

function withSuffix(slug: string): string {
  return `${slug}-${crypto.randomUUID().slice(0, 6)}`.slice(0, 80);
}

export async function saveListing(
  _prev: ActionResult<{ id: string; slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const parsed = listingSchema.safeParse(readListing(formData));
  if (!parsed.success) return invalid(parsed.error);
  const viewer = await requireRole("agent", "admin");
  const supabase = await createClient();
  const input = parsed.data;

  const payload = {
    title: input.title,
    description: input.description,
    listing_type: input.listingType,
    property_type: input.propertyType,
    price_php: input.pricePhp,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floor_area_sqm: input.floorAreaSqm,
    lot_area_sqm: input.lotAreaSqm,
    parking_slots: input.parkingSlots,
    neighborhood: input.neighborhood,
    city: input.city,
    province: input.province,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    amenities: input.amenities,
    year_built: input.yearBuilt,
  };

  if (input.id) {
    const existing = await supabase
      .from("properties")
      .select("id, slug")
      .eq("id", input.id)
      .maybeSingle();
    if (existing.error) return fail(humanize(existing.error));
    if (!existing.data) return fail("Listing not found.");

    const updated = await supabase
      .from("properties")
      .update({
        ...payload,
        ...(input.slug ? { slug: input.slug } : {}),
      })
      .eq("id", input.id)
      .select("id, slug")
      .maybeSingle();
    if (updated.error) return fail(humanize(updated.error));
    if (!updated.data) return fail("You cannot edit this listing.");
    revalidateListing(existing.data.slug);
    revalidateListing(updated.data.slug);
    return ok({ id: updated.data.id, slug: updated.data.slug });
  }

  let slug = input.slug || slugify(input.title);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const created = await supabase
      .from("properties")
      .insert({
        ...payload,
        slug,
        agent_id: viewer.id,
        status: "draft",
        featured: false,
      })
      .select("id, slug")
      .single();
    if (!created.error && created.data) {
      revalidateListing(created.data.slug);
      return ok({ id: created.data.id, slug: created.data.slug });
    }
    if (created.error?.code === "23505" && attempt === 0) {
      slug = withSuffix(slugify(input.title));
      continue;
    }
    return fail(humanize(created.error ?? { message: "insert failed" }));
  }

  return fail("A listing with this slug already exists.");
}

export async function uploadListingImage(
  _prev: ActionResult<PropertyImage> | null,
  formData: FormData,
): Promise<ActionResult<PropertyImage>> {
  const parsed = imageMetaSchema.safeParse(readImageMeta(formData));
  if (!parsed.success) return invalid(parsed.error);
  const viewer = await requireRole("agent", "admin");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image.", { file: "Choose an image." });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("Images must be 8 MB or smaller.", { file: "Images must be 8 MB or smaller." });
  }
  const extension = imageExtension(file.type);
  if (!extension) {
    return fail("Use a JPEG, PNG, WebP, or AVIF image.", {
      file: "Use a JPEG, PNG, WebP, or AVIF image.",
    });
  }

  const supabase = await createClient();
  const property = await supabase
    .from("properties")
    .select("id, slug")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();
  if (property.error) return fail(humanize(property.error));
  if (!property.data) return fail("Listing not found.");

  const positions = await supabase
    .from("property_images")
    .select("position")
    .eq("property_id", parsed.data.propertyId)
    .order("position", { ascending: false })
    .limit(1);
  if (positions.error) return fail(humanize(positions.error));
  const position = positions.data?.[0] ? positions.data[0].position + 1 : 0;
  const storagePath = `${viewer.id}/${parsed.data.propertyId}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const uploaded = await supabase.storage.from("property-images").upload(storagePath, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return fail(humanize(uploaded.error));

  const url = supabase.storage.from("property-images").getPublicUrl(storagePath).data.publicUrl;
  const inserted = await supabase
    .from("property_images")
    .insert({
      property_id: parsed.data.propertyId,
      url,
      storage_path: storagePath,
      alt: parsed.data.alt,
      position,
    })
    .select("id, url, alt, position")
    .single();
  if (inserted.error || !inserted.data) {
    await supabase.storage.from("property-images").remove([storagePath]);
    return fail(humanize(inserted.error ?? { message: "insert failed" }));
  }

  revalidateListing(property.data.slug);
  return ok(inserted.data);
}

export async function deleteListingImage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = imageIdSchema.safeParse(readImageId(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  const supabase = await createClient();
  const image = await supabase
    .from("property_images")
    .select("id, storage_path, properties (slug)")
    .eq("id", parsed.data.imageId)
    .maybeSingle();
  if (image.error) return fail(humanize(image.error));
  if (!image.data) return fail("Photo not found.");

  const removed = await supabase.from("property_images").delete().eq("id", parsed.data.imageId);
  if (removed.error) return fail(humanize(removed.error));
  if (image.data.storage_path) {
    await supabase.storage.from("property-images").remove([image.data.storage_path]);
  }

  const property = image.data.properties;
  const slug = Array.isArray(property) ? property[0]?.slug : property?.slug;
  revalidateListing(slug);
  return ok({ id: parsed.data.imageId });
}

export async function setCoverImage(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = imageIdSchema.safeParse(readImageId(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  const supabase = await createClient();
  const image = await supabase
    .from("property_images")
    .select("id, properties (slug)")
    .eq("id", parsed.data.imageId)
    .maybeSingle();
  if (image.error) return fail(humanize(image.error));
  if (!image.data) return fail("Photo not found.");

  const { error } = await supabase.rpc("set_cover_image", {
    target_image: parsed.data.imageId,
  });
  if (error) return fail(humanize(error));

  const property = image.data.properties;
  const slug = Array.isArray(property) ? property[0]?.slug : property?.slug;
  revalidateListing(slug);
  return ok({ id: parsed.data.imageId });
}

export async function transitionListing(
  _prev: ActionResult<{ id: string; status: ListingStatus; slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: ListingStatus; slug: string }>> {
  const parsed = transitionSchema.safeParse(readTransition(formData));
  if (!parsed.success) return invalid(parsed.error);
  const viewer = await requireRole("agent", "admin");

  const supabase = await createClient();
  const current = await supabase
    .from("properties")
    .select("id, status, slug")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (current.error) return fail(humanize(current.error));
  if (!current.data) return fail("Listing not found.");
  if (current.data.status === parsed.data.to) {
    return ok({
      id: current.data.id,
      status: current.data.status,
      slug: current.data.slug,
    });
  }
  if (!canTransition(current.data.status, parsed.data.to, viewer.role)) {
    return fail("That status change is not allowed.");
  }

  const updated = await supabase
    .from("properties")
    .update({ status: parsed.data.to })
    .eq("id", parsed.data.id)
    .select("id, status, slug")
    .maybeSingle();
  if (updated.error) return fail(humanize(updated.error));
  if (!updated.data) return fail("You cannot change this listing.");

  revalidateListing(updated.data.slug);
  return ok({
    id: updated.data.id,
    status: updated.data.status,
    slug: updated.data.slug,
  });
}
