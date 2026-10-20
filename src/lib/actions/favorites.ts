"use server";

import { apiFetch } from "@/lib/api/client";
import { getViewer } from "@/lib/data/viewer";
import { favoriteSchema, readFavorite } from "@/lib/validation/listing";

import { failure } from "./failure";
import { revalidateListing } from "./revalidate";
import { fail, invalid, ok, type ActionResult } from "./result";

export async function toggleFavorite(
  _prev: ActionResult<{ favorited: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ favorited: boolean }>> {
  const parsed = favoriteSchema.safeParse(readFavorite(formData));
  if (!parsed.success) return invalid(parsed.error);

  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    return fail("Sign in to save a listing.");
  }

  try {
    const { data: ids } = await apiFetch<string[]>("/me/favorites/ids");
    const saved = Array.isArray(ids) && ids.includes(parsed.data.propertyId);
    const { data } = await apiFetch<{ favorited: boolean }>(
      `/me/favorites/${encodeURIComponent(parsed.data.propertyId)}`,
      { method: saved ? "DELETE" : "PUT" },
    );
    revalidateListing();
    return ok({ favorited: data.favorited });
  } catch (error) {
    return failure(error);
  }
}
