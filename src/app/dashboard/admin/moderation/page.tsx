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
import { formatArea, formatListingPrice, formatLocation } from "@/lib/format";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";

export const metadata: Metadata = { title: "Moderation" };

function localSrc(url: string): boolean {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
}

function QueueItem({ property }: { property: PropertySummary }) {
  return (
    <li className="grid overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink/10 md:grid-cols-12">
      <div className="relative aspect-[16/10] bg-paper-sunken md:col-span-5 md:aspect-auto md:min-h-[14rem]">
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
      <div className="flex flex-col items-start gap-3 p-5 md:col-span-7 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill kind="listing" status={property.status} />
          <span className="rounded-[0.25rem] bg-ink/[0.06] px-2 py-0.5 font-mono text-[0.6875rem] uppercase text-ink-soft">
            {PROPERTY_TYPE_LABEL[property.propertyType]}
          </span>
        </div>
        <h2 className="font-display text-heading font-semibold">{property.title}</h2>
        <p className="font-mono text-[0.75rem] text-ink-muted">
          {formatLocation(property)}, {property.province}
        </p>
        <dl className="grid w-full grid-cols-3 gap-3 border-y border-dashed border-ink/15 py-3 font-mono text-[0.75rem]">
          <div>
            <dt className="uppercase text-ink-muted">Price</dt>
            <dd className="tabular font-semibold text-ink">{formatListingPrice(property.pricePhp, property.listingType)}</dd>
          </div>
          <div>
            <dt className="uppercase text-ink-muted">Area</dt>
            <dd className="tabular font-semibold text-ink">{formatArea(property.floorAreaSqm || property.lotAreaSqm || 0)}</dd>
          </div>
          <div>
            <dt className="uppercase text-ink-muted">Rooms</dt>
            <dd className="tabular font-semibold text-ink">
              {property.propertyType === "lot" ? "—" : `${property.bedrooms} bd / ${property.bathrooms} ba`}
            </dd>
          </div>
        </dl>
        <div className="mt-auto pt-1">
          <ListingMoves id={property.id} status={property.status} role="admin" />
        </div>
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
        lede="Listings waiting for a decision. Publish one, or send it back to the agent as a draft."
      />
      {queue.length === 0 ? (
        <EmptyState icon="listings" title="The queue is clear">
          Nothing is waiting for review.
        </EmptyState>
      ) : (
        <ul aria-label="Listings in review" className="flex flex-col gap-3">
          {queue.map((property) => (
            <QueueItem key={property.id} property={property} />
          ))}
        </ul>
      )}
    </>
  );
}
