import type { Metadata } from "next";
import Link from "next/link";

import { firstName, greeting } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { ButtonLink } from "@/components/ui/button";
import { listAgentInquiries, listAgentListings } from "@/lib/data/agent";
import { requireRole } from "@/lib/data/viewer";
import { LISTING_STATUSES } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Agent desk" };

const STATUS_LABEL = {
  draft: "Draft",
  pending: "In review",
  published: "Published",
  sold: "Sold",
  archived: "Archived",
} as const;

export default async function AgentHomePage() {
  const member = await requireRole("agent");
  const [listings, inquiries] = await Promise.all([listAgentListings(), listAgentInquiries()]);
  const fresh = inquiries.filter((inquiry) => inquiry.status === "new");
  const drafts = listings.filter((listing) => listing.status === "draft");

  return (
    <>
      <PageHeader
        eyebrow="Agent desk"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede="A quiet count of the book, and the few things asking for you."
        action={<ButtonLink href="/dashboard/agent/listings/new">New listing</ButtonLink>}
      />
      <dl className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
        {LISTING_STATUSES.map((status) => (
          <div key={status}>
            <dt className="text-micro font-medium uppercase text-ink-muted">{STATUS_LABEL[status]}</dt>
            <dd className="mt-3 font-display text-display-3 tabular">
              {listings.filter((listing) => listing.status === status).length}
            </dd>
          </div>
        ))}
      </dl>
      <section className="mt-20" aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="font-display text-heading">
          Needs attention
        </h2>
        {fresh.length === 0 && drafts.length === 0 ? (
          <p className="mt-6 max-w-[36ch] text-body text-ink-muted">Nothing is waiting. The desk is clear.</p>
        ) : (
          <ul className="mt-8 flex flex-col">
            {fresh.slice(0, 4).map((inquiry) => (
              <li key={inquiry.id} className="border-t border-ink/10 py-5">
                <Link href="/dashboard/agent/inquiries" className="group flex flex-col gap-1">
                  <span className="text-small text-ink-muted">New inquiry</span>
                  <span className="font-display text-title group-hover:text-accent">{inquiry.name}</span>
                  <span className="text-small text-ink-soft">{inquiry.propertyTitle}</span>
                </Link>
              </li>
            ))}
            {drafts.slice(0, 4).map((listing) => (
              <li key={listing.id} className="border-t border-ink/10 py-5">
                <Link href={`/dashboard/agent/listings/${listing.id}`} className="group flex flex-col gap-1">
                  <span className="text-small text-ink-muted">Draft</span>
                  <span className="font-display text-title group-hover:text-accent">{listing.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
