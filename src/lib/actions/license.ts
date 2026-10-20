"use server";

import { z } from "zod";

import { requireRole } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";

import { humanize } from "./errors";
import { fail, invalid, ok, type ActionResult } from "./result";

const licenseSchema = z.object({
  licenseNo: z
    .string()
    .trim()
    .min(4, { error: "Enter your PRC license number." })
    .max(40),
});

export async function saveOwnLicense(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = licenseSchema.safeParse({ licenseNo: formData.get("licenseNo") });
  if (!parsed.success) return invalid(parsed.error);

  const viewer = await requireRole("agent");
  const supabase = await createClient();
  const current = await supabase
    .from("profiles")
    .select("license_no")
    .eq("id", viewer.id)
    .maybeSingle();
  if (current.error) return fail(humanize(current.error));
  if (current.data?.license_no) return ok({ id: viewer.id });

  const { error } = await supabase
    .from("profiles")
    .update({ license_no: parsed.data.licenseNo })
    .eq("id", viewer.id);
  if (error) return fail(humanize(error));
  return ok({ id: viewer.id });
}
