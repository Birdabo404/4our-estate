import type { Metadata } from "next";
import Image from "next/image";

import { firstName } from "@/components/dashboard/copy";
import { ListingMoves } from "@/components/dashboard/listing-moves";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { listModerationQueue } from "@/lib/data/admin";
import { requireRole } from "@/lib/data/viewer";
import type { PropertySummary } from "@/lib/domain/types";
import { formatListingPrice, formatLocation } from "@/lib/format";

export const metadata: Metadata = { title: "Moderation" };

function localSrc(url: string): boolean {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
}

function QueueItem({ property }: { property: PropertySummary }) {
  return (
    <li className="grid gap-6 border-t border-ink/10 py-12 md:grid-cols-12 md:items-center">
      <div className="relative aspect-[16/10] overflow-hidden rounded-photo bg-paper-sunken md:col-span-5">
        {property.coverImage ? (
          <Image
            src={property.coverImage.url}
            alt={property.coverImage.alt}
            fill
            sizes="(min-width: 768px) 36vw, 100vw"
            unoptimized={localSrc(property.coverImage.url)}
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-4 md:col-span-6 md:col-start-7">
        <StatusPill kind="listing" status={property.status} />
        <h2 className="font-display text-heading">{property.title}</h2>
        <p className="text-small text-ink-muted">{formatLocation(property)}</p>
        <p className="text-small tabular text-ink">{formatListingPrice(property.pricePhp, property.listingType)}</p>
        <ListingMoves id={property.id} status={property.status} role="admin" />
      </div>
    </li>
  );
}

export default async function ModerationPage() {
  const member = await requireRole("admin");
  const queue = await listModerationQueue();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="Moderation"
        lede="Listings waiting for a decision. Publish, or send one back to its draft."
      />
      {queue.length === 0 ? (
        <EmptyState icon="listings" title="The queue is clear">
          Nothing is waiting for review.
        </EmptyState>
      ) : (
        <ul aria-label="Listings in review">
          {queue.map((property) => (
            <QueueItem key={property.id} property={property} />
          ))}
        </ul>
      )}
    </>
  );
}
