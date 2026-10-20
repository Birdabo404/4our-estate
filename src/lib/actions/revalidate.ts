import { revalidatePath } from "next/cache";

export function revalidateListing(slug?: string) {
  revalidatePath("/");
  revalidatePath("/properties");
  if (slug) revalidatePath(`/properties/${slug}`);
  revalidatePath("/dashboard/buyer");
  revalidatePath("/dashboard/agent");
  revalidatePath("/dashboard/admin");
}
