"use server";

import { requireRole } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, readProfile } from "@/lib/validation/profile";

import { humanize } from "./errors";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

export async function updateProfile(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = profileSchema.safeParse(readProfile(formData));
  if (!parsed.success) return invalid(parsed.error);
  const viewer = await requireRole("buyer", "agent", "admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      avatar_url: parsed.data.avatarUrl ?? null,
      agency: parsed.data.agency ?? null,
      license_no: parsed.data.licenseNo ?? null,
      bio: parsed.data.bio ?? null,
    })
    .eq("id", viewer.id);
  if (error) return fail(humanize(error));

  revalidateListing();
  return ok({ id: viewer.id });
}
