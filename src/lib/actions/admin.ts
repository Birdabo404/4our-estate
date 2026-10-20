"use server";

import { requireRole } from "@/lib/data/viewer";
import type { Role } from "@/lib/domain/types";
import { createClient } from "@/lib/supabase/server";
import { readUserRole, userRoleSchema } from "@/lib/validation/profile";

import { humanize } from "./errors";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

export async function setUserRole(
  _prev: ActionResult<{ id: string; role: Role }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; role: Role }>> {
  const parsed = userRoleSchema.safeParse(readUserRole(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("admin");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id, role")
    .maybeSingle();
  if (error) return fail(humanize(error));
  if (!data) return fail("That user was not found.");

  revalidateListing();
  return ok({ id: data.id, role: data.role });
}
