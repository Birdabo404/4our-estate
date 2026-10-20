import type { ZodError, ZodType } from "zod";

import { manilaToday } from "@/lib/actions/viewing-date";
import {
  INQUIRY_STATUSES,
  LISTING_STATUSES,
  ROLES,
  type InquiryStatus,
  type ListingStatus,
  type Role,
} from "@/lib/domain/types";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validation/auth";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry";
import { listingSchema, type ListingInput } from "@/lib/validation/listing";
import { profileSchema } from "@/lib/validation/profile";

import { validation } from "./http";

const LISTING_KEYS = [
  "slug",
  "title",
  "description",
  "listingType",
  "propertyType",
  "pricePhp",
  "bedrooms",
  "bathrooms",
  "floorAreaSqm",
  "lotAreaSqm",
  "parkingSlots",
  "neighborhood",
  "city",
  "province",
  "address",
  "latitude",
  "longitude",
  "amenities",
  "yearBuilt",
] as const;

type ListingKey = (typeof LISTING_KEYS)[number];

const PROFILE_KEYS = ["fullName", "phone", "avatarUrl", "agency", "licenseNo", "bio"] as const;
const PROFILE_NULLABLE = ["phone", "avatarUrl", "agency", "licenseNo", "bio"] as const;

export type ProfilePatch = {
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  agency?: string | null;
  licenseNo?: string | null;
  bio?: string | null;
};

export type ListingPatch = Partial<ListingInput>;

function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (!key || fields[key] !== undefined) continue;
    fields[key] = issue.message;
  }
  return fields;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function unknownFields(record: Record<string, unknown>, allowed: readonly string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) fields[key] = "This field is not allowed.";
  }
  return fields;
}

function parseWith<T>(schema: ZodType<T>, value: unknown, allowed: readonly string[]): T {
  const record = asRecord(value);
  const extra = unknownFields(record, allowed);
  const parsed = schema.safeParse(record);
  const fields = parsed.success ? extra : { ...extra, ...zodFields(parsed.error) };
  if (!parsed.success || Object.keys(extra).length > 0) validation(fields);
  return parsed.data;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], key: string): T {
  const record = asRecord(value);
  const extra = unknownFields(record, [key]);
  const raw = record[key];
  const fields = { ...extra };
  if (typeof raw !== "string" || !allowed.includes(raw as T)) {
    fields[key] = `${key} must be one of the following values: ${allowed.join(", ")}`;
  }
  if (Object.keys(fields).length > 0) validation(fields);
  return raw as T;
}

function readListingField<K extends ListingKey>(
  record: Record<string, unknown>,
  key: K,
  fields: Record<string, string>,
): ListingInput[K] | undefined {
  if (!(key in record)) return undefined;
  const parsed = listingSchema.shape[key].safeParse(record[key]);
  if (!parsed.success) {
    fields[key] = parsed.error.issues[0]?.message ?? "Check this field.";
    return undefined;
  }
  return parsed.data as ListingInput[K];
}

export function parseSignup(value: unknown): SignupInput {
  const input = parseWith(signupSchema, value, ["role", "fullName", "email", "password", "phone", "agency", "licenseNo"]);
  return { ...input, email: input.email.toLowerCase() };
}

export function parseLogin(value: unknown): LoginInput {
  const input = parseWith(loginSchema, value, ["email", "password"]);
  return { ...input, email: input.email.toLowerCase() };
}

export function parseListing(value: unknown, mode: "create"): ListingInput;
export function parseListing(value: unknown, mode: "update"): ListingPatch;
export function parseListing(value: unknown, mode: "create" | "update"): ListingInput | ListingPatch {
  const record = asRecord(value);
  const extra = unknownFields(record, LISTING_KEYS);
  if (mode === "create") {
    const parsed = listingSchema.safeParse(record);
    const fields = parsed.success ? extra : { ...extra, ...zodFields(parsed.error) };
    if (!parsed.success || Object.keys(extra).length > 0) validation(fields);
    return parsed.data;
  }

  const fields = { ...extra };
  const patch: ListingPatch = {};
  const written = patch as Record<string, unknown>;
  for (const key of LISTING_KEYS) {
    const parsed = readListingField(record, key, fields);
    if (parsed !== undefined) written[key] = parsed;
  }
  if ("latitude" in record || "longitude" in record) {
    const latitudeMissing = patch.latitude === undefined || patch.latitude === null;
    const longitudeMissing = patch.longitude === undefined || patch.longitude === null;
    if (latitudeMissing !== longitudeMissing && fields.latitude === undefined) {
      fields.latitude = "Enter both latitude and longitude.";
    }
  }
  if (Object.keys(fields).length > 0) validation(fields);
  return patch;
}

export function parseInquiry(value: unknown): InquiryInput {
  const record = asRecord(value);
  const input: Record<string, unknown> = { ...record };
  if (input.phone === null || input.phone === "") delete input.phone;
  if (input.preferredViewingDate === null || input.preferredViewingDate === "") delete input.preferredViewingDate;
  const parsed = parseWith(inquirySchema, input, [
    "propertyId",
    "name",
    "email",
    "phone",
    "message",
    "preferredViewingDate",
  ]);
  if (parsed.preferredViewingDate && parsed.preferredViewingDate < manilaToday()) {
    validation({ preferredViewingDate: "Choose a date that has not passed." });
  }
  return { ...parsed, email: parsed.email.toLowerCase() };
}

export function parseProfile(value: unknown): ProfilePatch {
  const record = asRecord(value);
  const input: Record<string, unknown> = { ...record };
  for (const key of PROFILE_NULLABLE) {
    if (input[key] === null) delete input[key];
  }
  const parsed = parseWith(profileSchema, input, PROFILE_KEYS);
  const patch: ProfilePatch = { fullName: parsed.fullName };
  for (const key of PROFILE_NULLABLE) {
    if (record[key] === null) {
      patch[key] = null;
      continue;
    }
    const next = parsed[key];
    if (next !== undefined) patch[key] = next;
  }
  return patch;
}

export function parseRole(value: unknown): Role {
  return oneOf(value, ROLES, "role");
}

export function parseInquiryStatus(value: unknown): InquiryStatus {
  return oneOf(value, INQUIRY_STATUSES, "status");
}

export function parseTransition(value: unknown): ListingStatus {
  return oneOf(value, LISTING_STATUSES, "to");
}
