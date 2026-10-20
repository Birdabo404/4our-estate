"use server";

import { apiFetch } from "@/lib/api/client";
import { requireRole } from "@/lib/data/viewer";
import type { Inquiry, InquiryStatus } from "@/lib/domain/types";
import {
  inquirySchema,
  inquiryStatusSchema,
  readInquiry,
  readInquiryStatus,
} from "@/lib/validation/inquiry";

import { failure } from "./failure";
import { revalidateListing } from "./revalidate";
import { invalid, ok, type ActionResult } from "./result";

export async function submitInquiry(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = inquirySchema.safeParse(readInquiry(formData));
  if (!parsed.success) return invalid(parsed.error);

  const input = parsed.data;
  try {
    const { data } = await apiFetch<{ id: string }>("/inquiries", {
      method: "POST",
      json: {
        propertyId: input.propertyId,
        name: input.name,
        email: input.email,
        message: input.message,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.preferredViewingDate ? { preferredViewingDate: input.preferredViewingDate } : {}),
      },
    });
    revalidateListing();
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateInquiryStatus(
  _prev: ActionResult<{ id: string; status: InquiryStatus }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; status: InquiryStatus }>> {
  const parsed = inquiryStatusSchema.safeParse(readInquiryStatus(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("agent", "admin");

  try {
    const { data } = await apiFetch<{ id: string; status: InquiryStatus }>(
      `/inquiries/${encodeURIComponent(parsed.data.id)}/status`,
      { method: "PATCH", json: { status: parsed.data.status } },
    );
    let slug: string | undefined;
    try {
      const listed = await apiFetch<Inquiry[]>("/agent/inquiries");
      slug = listed.data.find((row) => row.id === data.id)?.propertySlug;
    } catch {
      slug = undefined;
    }
    revalidateListing(slug);
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}
