"use server";

import { inquirySchema, readInquiry } from "@/lib/validation/inquiry";

import { submitInquiry } from "./inquiries";
import { invalid, type ActionResult } from "./result";
import { viewingDateError } from "./viewing-date";

export async function submitPropertyInquiry(
  prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const dateError = viewingDateError(formData.get("preferredViewingDate"));
  if (!dateError) return submitInquiry(prev, formData);

  const parsed = inquirySchema.safeParse(readInquiry(formData));
  const failure = parsed.success ? null : invalid(parsed.error);
  const others = failure && !failure.ok ? failure.fieldErrors : undefined;
  return { ok: false, fieldErrors: { ...others, preferredViewingDate: dateError } };
}
