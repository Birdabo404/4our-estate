"use server";

import { getViewer, requireRole } from "@/lib/data/viewer";
import type { InquiryStatus } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";
import {
  inquirySchema,
  inquiryStatusSchema,
  readInquiry,
  readInquiryStatus,
} from "@/lib/validation/inquiry";

import { humanize } from "./errors";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

export async function submitInquiry(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = inquirySchema.safeParse(readInquiry(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const viewer = await getViewer();
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, slug, status")
    .eq("id", parsed.data.propertyId)
    .maybeSingle();
  if (propertyError) return fail(humanize(propertyError));
  if (!property || property.status !== "published") {
    return fail("This listing is not open for inquiries.");
  }

  const id = crypto.randomUUID();
  const { error } = await supabase.from("inquiries").insert({
    id,
    property_id: parsed.data.propertyId,
    buyer_id: viewer.kind === "member" ? viewer.id : null,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
    preferred_viewing_date: parsed.data.preferredViewingDate ?? null,
  });
  if (error) return fail(humanize(error));

  revalidateListing(property.slug);
  return ok({ id });
}

export async function updateInquiryStatus(
  _prev: ActionResult<{ id: string; status: InquiryStatus }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: InquiryStatus }>> {
  const parsed = inquiryStatusSchema.safeParse(readInquiryStatus(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("id, status, properties (slug)")
    .maybeSingle();
  if (error) return fail(humanize(error));
  if (!data) return fail("That inquiry is not on one of your listings.");

  const property = data.properties;
  const slug = Array.isArray(property) ? property[0]?.slug : property?.slug;
  revalidateListing(slug);
  return ok({ id: data.id, status: data.status });
}
