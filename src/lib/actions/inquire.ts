"use server";

import type { ActionResult } from "./result";
import { submitInquiry } from "./inquiries";

export async function submitPropertyInquiry(
  prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return submitInquiry(prev, formData);
}
