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

export const metadata: Metadata = { title: "Listings" };

function localSrc(url: string): boolean {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost");
}

function ListingRow({ property }: { property: PropertySummary }) {
  return (
    <li className="border-t border-ink/10 py-8">
      <article className="grid gap-5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center">
        <div className="relative aspect-square overflow-hidden rounded-photo bg-paper-sunken">
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
            <StatusPill kind="listing" status={property.status} />
            <h2 className="mt-3 font-display text-title">
              <Link href={`/dashboard/agent/listings/${property.id}`} className="underline decoration-ink/15 underline-offset-4">
                {property.title}
              </Link>
            </h2>
            <p className="mt-1 text-small text-ink-muted">{formatLocation(property)}</p>
            <p className="mt-2 text-small tabular text-ink">{formatListingPrice(property.pricePhp, property.listingType)}</p>
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
        lede="Every residence on your book, from draft to sold."
        action={<ButtonLink href="/dashboard/agent/listings/new">New listing</ButtonLink>}
      />
      {listings.length === 0 ? (
        <EmptyState
          icon="listings"
          title="The book is empty"
          action={<ButtonLink href="/dashboard/agent/listings/new">New listing</ButtonLink>}
        >
          A draft stays private until you submit it for review.
        </EmptyState>
      ) : (
        <ul aria-label="Your listings">
          {listings.map((property) => (
            <ListingRow key={property.id} property={property} />
          ))}
        </ul>
      )}
    </>
  );
}
