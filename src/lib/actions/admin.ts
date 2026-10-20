"use server";

import { apiFetch } from "@/lib/api/client";
import { requireRole } from "@/lib/data/viewer";
import type { Role } from "@/lib/domain/types";
import { readUserRole, userRoleSchema } from "@/lib/validation/profile";

import { failure } from "./failure";
import { revalidateListing } from "./revalidate";
import { invalid, ok, type ActionResult } from "./result";

export async function setUserRole(
  _prev: ActionResult<{ id: string; role: Role }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string; role: Role }>> {
  const parsed = userRoleSchema.safeParse(readUserRole(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("admin");

  try {
    const { data } = await apiFetch<{ id: string; role: Role }>(
      `/admin/users/${encodeURIComponent(parsed.data.userId)}/role`,
      { method: "PATCH", json: { role: parsed.data.role } },
    );
    revalidateListing();
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}
