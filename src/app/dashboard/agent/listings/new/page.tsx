import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { ListingForm } from "@/components/listing-editor/listing-form";
import { requireRole } from "@/lib/data/viewer";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  await requireRole("agent");

  return (
    <>
      <PageHeader
        eyebrow="Draft"
        title="A new listing"
        lede="Save the draft first. Photographs are added on the next step."
      />
      <ListingForm property={null} />
    </>
  );
}
