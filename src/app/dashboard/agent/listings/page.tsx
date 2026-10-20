import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { firstName } from "@/components/dashboard/copy";
import { ListingMoves } from "@/components/dashboard/listing-moves";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { listAgentListings } from "@/lib/data/agent";
import { requireRole } from "@/lib/data/viewer";
import type { PropertySummary } from "@/lib/domain/types";
import { formatListingPrice, formatLocation } from "@/lib/format";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { LISTING_STATUSES } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Listings" };

function localSrc(url: string): boolean {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
}

function ListingRow({ property }: { property: PropertySummary }) {
  return (
    <li className="px-4 py-4 transition-colors duration-300 ease-settle hover:bg-sky-soft md:px-5">
      <article className="grid gap-4 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-center">
        <div className="relative aspect-square overflow-hidden rounded-md bg-paper-sunken">
          {property.coverImage ? (
            <Image
              src={property.coverImage.url}
              alt={property.coverImage.alt}
              fill
              sizes="88px"
              unoptimized={localSrc(property.coverImage.url)}
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill kind="listing" status={property.status} />
              <span className="font-mono text-[0.6875rem] uppercase text-ink-muted">{PROPERTY_TYPE_LABEL[property.propertyType]}</span>
            </div>
            <h2 className="mt-2 font-display text-title font-semibold">
              <Link href={`/dashboard/agent/listings/${property.id}`} className="underline decoration-ink/15 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-ink">
                {property.title}
              </Link>
            </h2>
            <p className="mt-1 font-mono text-[0.75rem] text-ink-muted">
              {formatLocation(property)} <span aria-hidden>·</span>{" "}
              <span className="tabular font-semibold text-ink">{formatListingPrice(property.pricePhp, property.listingType)}</span>
            </p>
          </div>
          <ListingMoves id={property.id} status={property.status} role="agent" />
        </div>
      </article>
    </li>
  );
}

export default async function AgentListingsPage() {
  const member = await requireRole("agent");
  const listings = await listAgentListings();

  return (
    <>
      <PageHeader
        eyebrow={firstName(member.fullName)}
        title="Listings"
        lede="Everything on your book, from draft to sold. Drafts stay private until you submit them."
        action={<ButtonLink href="/dashboard/agent/listings/new">New listing</ButtonLink>}
      />
      {listings.length === 0 ? (
        <EmptyState
          icon="listings"
          title="No listings yet"
          action={<ButtonLink href="/dashboard/agent/listings/new">New listing</ButtonLink>}
        >
          A draft stays private until you submit it for review.
        </EmptyState>
      ) : (
        <>
          <ul aria-label="Listings by status" className="mb-3 flex flex-wrap gap-2">
            {LISTING_STATUSES.map((status) => {
              const count = listings.filter((l) => l.status === status).length;
              return (
                <li key={status} className="inline-flex items-center gap-2 rounded-md bg-paper-raised py-1 pl-1 pr-3 ring-1 ring-ink/10">
                  <StatusPill kind="listing" status={status} />
                  <span className="tabular font-mono text-[0.75rem] font-semibold text-ink">{count}</span>
                </li>
              );
            })}
          </ul>
          <ul aria-label="Your listings" className="divide-y divide-dashed divide-ink/10 rounded-panel bg-paper-raised ring-1 ring-ink/10">
          {listings.map((property) => (
            <ListingRow key={property.id} property={property} />
          ))}
          </ul>
        </>
      )}
    </>
  );
}
