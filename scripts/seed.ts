import { createHash } from "node:crypto";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Database } from "../src/lib/supabase/database.types";
import { ACCOUNTS, DEMO_PASSWORD, type SeedAccount } from "./seed-data/accounts";
import { FAVORITES, INQUIRIES } from "./seed-data/engagement";
import { assignPhotos, loadCatalog, sizedUrl } from "./seed-data/photos";
import { PROPERTIES, type SeedProperty } from "./seed-data/properties";

type Admin = SupabaseClient<Database>;

const BANNED =
  /\b(nestled|boasts?|stunning|breathtaking|world-class|state-of-the-art|hidden gem|seamlessly|vibrant)\b/i;

function stableUuid(name: string): string {
  const chars = createHash("sha256").update(name).digest("hex").slice(0, 32).split("");
  chars[12] = "4";
  const variant = Number.parseInt(chars[16] ?? "0", 16);
  chars[16] = ["8", "9", "a", "b"][variant % 4] ?? "8";
  const hex = chars.join("");
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
    if (banned) {
      throw new Error(`${property.slug} description uses "${banned[0]}".`);
    }
  }
}

function adminClient(): Admin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env. Run with --env-file=.env.local.");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function listAllUsers(admin: Admin): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 200) break;
  }
  return users;
}

async function ensureUser(admin: Admin, account: SeedAccount, users: User[]): Promise<string> {
  const existing = users.find((user) => user.email?.toLowerCase() === account.email);
  const metadata = {
    role: account.role === "admin" ? "buyer" : account.role,
    full_name: account.fullName,
    phone: account.phone,
    agency: account.agency ?? "",
  };

  let id = existing?.id;
  if (!id) {
    const created = await admin.auth.admin.createUser({
      email: account.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? `Could not create ${account.email}`);
    }
    id = created.data.user.id;
  } else {
    const updated = await admin.auth.admin.updateUserById(id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (updated.error) throw new Error(updated.error.message);
  }

  const profile = {
    role: account.role,
    full_name: account.fullName,
    phone: account.phone,
    agency: account.agency ?? null,
    license_no: account.licenseNo ?? null,
    bio: account.bio ?? null,
  };
  const current = await admin
    .from("profiles")
    .select("role, full_name, phone, agency, license_no, bio")
    .eq("id", id)
    .single();
  if (current.error) throw new Error(current.error.message);
  const same =
    current.data.role === profile.role &&
    current.data.full_name === profile.full_name &&
    current.data.phone === profile.phone &&
    current.data.agency === profile.agency &&
    current.data.license_no === profile.license_no &&
    current.data.bio === profile.bio;
  if (!same) {
    const { error } = await admin.from("profiles").update(profile).eq("id", id);
    if (error) throw new Error(error.message);
  }
  return id;
}

function sameInstant(left: string | null, right: string | null): boolean {
  if (left === null || right === null) return left === right;
  return new Date(left).getTime() === new Date(right).getTime();
}

function sameList(left: string[] | null, right: string[]): boolean {
  const current = left ?? [];
  return current.length === right.length && current.every((item, index) => item === right[index]);
}

async function main() {
  assertCopy(PROPERTIES);
  const photos = await loadCatalog();
  const assignments = assignPhotos(PROPERTIES, photos);
  const admin = adminClient();
  const users = await listAllUsers(admin);
  const ids = new Map<string, string>();

  for (const account of ACCOUNTS) {
    ids.set(account.email, await ensureUser(admin, account, users));
  }

  const existing = await admin.from("properties").select("*").in(
    "slug",
    PROPERTIES.map((property) => property.slug),
  );
  if (existing.error) throw new Error(existing.error.message);
  const bySlug = new Map((existing.data ?? []).map((row) => [row.slug, row]));

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  const propertyIds = new Map<string, string>();

  for (const property of PROPERTIES) {
    const agentId = ids.get(property.agentEmail);
    if (!agentId) throw new Error(`Missing agent ${property.agentEmail}`);
    const row = {
      slug: property.slug,
      agent_id: agentId,
      title: property.title,
      description: property.description,
      listing_type: property.listingType,
      property_type: property.propertyType,
      status: property.status,
      price_php: property.pricePhp,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      floor_area_sqm: property.floorAreaSqm,
      lot_area_sqm: property.lotAreaSqm,
      parking_slots: property.parkingSlots,
      neighborhood: property.neighborhood,
      city: property.city,
      province: property.province,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      amenities: property.amenities,
      year_built: property.yearBuilt,
      featured: property.featured,
      published_at: property.publishedAt,
    };
    const current = bySlug.get(property.slug);
    if (!current) {
      const created = await admin
        .from("properties")
        .insert({ ...row, id: stableUuid(`property:${property.slug}`) })
        .select("id")
        .single();
      if (created.error || !created.data) throw new Error(created.error?.message ?? property.slug);
      propertyIds.set(property.slug, created.data.id);
      inserted += 1;
      continue;
    }
    propertyIds.set(property.slug, current.id);
    const lotMatches =
      (current.lot_area_sqm === null && row.lot_area_sqm === null) ||
      Number(current.lot_area_sqm) === Number(row.lot_area_sqm);
    const matches =
      current.agent_id === row.agent_id &&
      current.title === row.title &&
      current.description === row.description &&
      current.listing_type === row.listing_type &&
      current.property_type === row.property_type &&
      current.status === row.status &&
      Number(current.price_php) === row.price_php &&
      current.bedrooms === row.bedrooms &&
      Number(current.bathrooms) === row.bathrooms &&
      Number(current.floor_area_sqm) === row.floor_area_sqm &&
      lotMatches;
    const rest =
      current.parking_slots === row.parking_slots &&
      current.neighborhood === row.neighborhood &&
      current.city === row.city &&
      current.province === row.province &&
      current.address === row.address &&
      Number(current.latitude) === row.latitude &&
      Number(current.longitude) === row.longitude &&
      sameList(current.amenities, row.amenities) &&
      current.year_built === row.year_built &&
      current.featured === row.featured &&
      sameInstant(current.published_at, row.published_at);
    if (matches && rest) {
      unchanged += 1;
      continue;
    }
    const saved = await admin.from("properties").update(row).eq("id", current.id);
    if (saved.error) throw new Error(saved.error.message);
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
      property_id: propertyId,
      url: sizedUrl(photo),
      storage_path: null,
      alt: photo.alt.slice(0, 300),
      position,
    }));
    const current = await admin
      .from("property_images")
      .select("url, alt, position")
      .eq("property_id", propertyId)
      .order("position");
    if (current.error) throw new Error(current.error.message);
    const same =
      (current.data ?? []).length === desired.length &&
      desired.every((image, index) => {
        const row = current.data?.[index];
        return row?.url === image.url && row.alt === image.alt && row.position === image.position;
      });
    if (same) {
      imagesUnchanged += 1;
      continue;
    }
    const removed = await admin.from("property_images").delete().eq("property_id", propertyId);
    if (removed.error) throw new Error(removed.error.message);
    const insertedImages = await admin.from("property_images").insert(desired);
    if (insertedImages.error) throw new Error(insertedImages.error.message);
    imagesReplaced += 1;
  }

  let inquiriesWritten = 0;
  let inquiriesUnchanged = 0;
  for (const inquiry of INQUIRIES) {
    const propertyId = propertyIds.get(inquiry.slug);
    if (!propertyId) throw new Error(`Missing property ${inquiry.slug}`);
    const buyerId = inquiry.buyerEmail ? ids.get(inquiry.buyerEmail) ?? null : null;
    const row = {
      id: stableUuid(`inquiry:${inquiry.key}`),
      property_id: propertyId,
      buyer_id: buyerId,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      preferred_viewing_date: inquiry.preferredViewingDate,
      status: inquiry.status,
    };
    const current = await admin.from("inquiries").select("*").eq("id", row.id).maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (
      current.data &&
      current.data.property_id === row.property_id &&
      current.data.buyer_id === row.buyer_id &&
      current.data.name === row.name &&
      current.data.email === row.email &&
      current.data.phone === row.phone &&
      current.data.message === row.message &&
      current.data.preferred_viewing_date === row.preferred_viewing_date &&
      current.data.status === row.status
    ) {
      inquiriesUnchanged += 1;
      continue;
    }
    const saved = await admin.from("inquiries").upsert(row);
    if (saved.error) throw new Error(saved.error.message);
    inquiriesWritten += 1;
  }

  let favoritesWritten = 0;
  let favoritesUnchanged = 0;
  for (const favorite of FAVORITES) {
    const userId = ids.get(favorite.userEmail);
    const propertyId = propertyIds.get(favorite.slug);
    if (!userId || !propertyId) throw new Error(`Missing favorite ${favorite.slug}`);
    const current = await admin
      .from("favorites")
      .select("user_id")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (current.data) {
      favoritesUnchanged += 1;
      continue;
    }
    const saved = await admin.from("favorites").insert({ user_id: userId, property_id: propertyId });
    if (saved.error) throw new Error(saved.error.message);
    favoritesWritten += 1;
  }

  console.log(`users ensured: ${ACCOUNTS.length}`);
  console.log(`properties inserted: ${inserted}, updated: ${updated}, unchanged: ${unchanged}`);
  console.log(`image sets replaced: ${imagesReplaced}, unchanged: ${imagesUnchanged}`);
  console.log(`inquiries written: ${inquiriesWritten}, unchanged: ${inquiriesUnchanged}`);
  console.log(`favorites written: ${favoritesWritten}, unchanged: ${favoritesUnchanged}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
