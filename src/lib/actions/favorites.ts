"use server";

import { getViewer } from "@/lib/data/viewer";
import { createClient } from "@/lib/supabase/server";
import { favoriteSchema, readFavorite } from "@/lib/validation/listing";

import { humanize } from "./errors";
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

  const supabase = await createClient();
  const existing = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", viewer.id)
    .eq("property_id", parsed.data.propertyId)
    .maybeSingle();
  if (existing.error) return fail(humanize(existing.error));

  if (existing.data) {
    const removed = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", viewer.id)
      .eq("property_id", parsed.data.propertyId);
    if (removed.error) return fail(humanize(removed.error));
    revalidateListing();
    return ok({ favorited: false });
  }

  const inserted = await supabase.from("favorites").insert({
    user_id: viewer.id,
    property_id: parsed.data.propertyId,
  });
  if (inserted.error) return fail(humanize(inserted.error));
  revalidateListing();
  return ok({ favorited: true });
}
