import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingMoves } from "@/components/dashboard/listing-moves";
import { PageHeader } from "@/components/dashboard/page-header";
import { ImageManager } from "@/components/listing-editor/image-manager";
import { ListingForm } from "@/components/listing-editor/listing-form";
import { StatusPill } from "@/components/ui/status-pill";
import { getEditableProperty } from "@/lib/data/agent";
import { requireRole } from "@/lib/data/viewer";
import { formatLocation } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getEditableProperty(id);
  return { title: property?.title ?? "Listing" };
}

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("agent");
  const { id } = await params;
  const property = await getEditableProperty(id);
  if (!property) notFound();

  const publicRecord = property.status === "published" || property.status === "sold";

  return (
    <div data-listing-slug={property.slug}>
      <PageHeader
        eyebrow={formatLocation(property)}
        title={property.title}
        lede="Keep the copy exact. Status changes are separate from the save."
        action={
          <div className="flex flex-col items-start gap-4">
            <StatusPill kind="listing" status={property.status} />
            <ListingMoves id={property.id} status={property.status} role="agent" />
            {publicRecord ? (
              <Link
                href={`/properties/${property.slug}`}
                className="text-small text-accent underline decoration-accent/30 underline-offset-4"
              >
                View on the site
              </Link>
            ) : null}
          </div>
        }
      />
      <div className="flex flex-col gap-8">
        <ListingForm property={property} />
        <ImageManager property={property} />
      </div>
    </div>
  );
}
