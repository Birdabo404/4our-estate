"use server";

import { apiFetch } from "@/lib/api/client";
import { requireRole } from "@/lib/data/viewer";
import { profileSchema, readProfile } from "@/lib/validation/profile";

import { failure } from "./failure";
import { revalidateListing } from "./revalidate";
import { invalid, ok, type ActionResult } from "./result";

export async function updateProfile(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const parsed = profileSchema.safeParse(readProfile(formData));
  if (!parsed.success) return invalid(parsed.error);
  await requireRole("buyer", "agent", "admin");

  const input = parsed.data;
  try {
    const { data } = await apiFetch<{ id: string }>("/me/profile", {
      method: "PATCH",
      json: {
        fullName: input.fullName,
        phone: input.phone ?? null,
        avatarUrl: input.avatarUrl ?? null,
        agency: input.agency ?? null,
        licenseNo: input.licenseNo ?? null,
        bio: input.bio ?? null,
      },
    });
    revalidateListing();
    return ok({ id: data.id });
  } catch (error) {
    return failure(error);
  }
}
