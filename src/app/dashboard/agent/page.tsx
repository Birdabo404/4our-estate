import { ArrowUpRight, ChatCircleText, Coins, House, Key } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { firstName, greeting } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { BarChart, Card, CardLink, DataTable, EmptyNote, type Segment, StackedBar, StatCard } from "@/components/dashboard/widgets";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { listAgentInquiries, listAgentListings } from "@/lib/data/agent";
import { requireRole } from "@/lib/data/viewer";
import type { Inquiry, ListingStatus, PropertySummary } from "@/lib/domain/types";
import { formatListingPrice, formatPhp, formatRelativeDate } from "@/lib/format";

export const metadata: Metadata = { title: "Agent desk" };

const LISTING_SWATCH: Record<ListingStatus, { label: string; swatch: string }> = {
  draft: { label: "Draft", swatch: "bg-ink/20" },
  pending: { label: "In review", swatch: "bg-sun" },
  published: { label: "Published", swatch: "bg-accent" },
  sold: { label: "Sold", swatch: "bg-ink" },
  archived: { label: "Archived", swatch: "bg-hatch bg-paper-sunken" },
};

function countBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

function sumPrices(listings: readonly PropertySummary[], type: PropertySummary["listingType"]): number {
  return listings.filter((l) => l.status === "published" && l.listingType === type).reduce((sum, l) => sum + l.pricePhp, 0);
}

function AttentionRow({ kind, title, detail, href, when }: { kind: "inquiry" | "draft"; title: string; detail: string; href: string; when?: string }) {
  return (
    <li>
      <Link href={href} className="group -mx-2 flex items-center gap-3 rounded-md p-2 transition-colors duration-300 ease-settle hover:bg-sky-soft">
        {kind === "inquiry" ? <StatusPill kind="inquiry" status="new" /> : <StatusPill kind="listing" status="draft" />}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-small font-semibold text-ink">{title}</span>
          <span className="truncate font-mono text-[0.6875rem] text-ink-muted">
            {detail}
            {when ? ` · ${when}` : ""}
          </span>
        </span>
        <ArrowUpRight aria-hidden size={14} weight="bold" className="shrink-0 text-ink-muted transition-transform duration-300 ease-settle group-hover:rotate-45 group-hover:text-ink" />
      </Link>
    </li>
  );
}

export default async function AgentHomePage() {
  const member = await requireRole("agent");
  const [listings, inquiries] = await Promise.all([listAgentListings(), listAgentInquiries()]);
  const fresh = inquiries.filter((inquiry) => inquiry.status === "new");
  const drafts = listings.filter((listing) => listing.status === "draft");
  const statusCounts = countBy(listings, (l) => l.status);
  const inquiryCounts = countBy(inquiries, (i: Inquiry) => i.status);
  const perListing = countBy(inquiries, (i: Inquiry) => i.propertyId);
  const published = statusCounts.get("published") ?? 0;

  const pipeline: Segment[] = (Object.keys(LISTING_SWATCH) as ListingStatus[]).map((status) => ({
    label: LISTING_SWATCH[status].label,
    value: statusCounts.get(status) ?? 0,
    swatch: LISTING_SWATCH[status].swatch,
  }));
  const inquiryMix: Segment[] = [
    { label: "New", value: inquiryCounts.get("new") ?? 0, swatch: "bg-accent" },
    { label: "Contacted", value: inquiryCounts.get("contacted") ?? 0, swatch: "bg-sky-deep" },
    { label: "Closed", value: inquiryCounts.get("closed") ?? 0, swatch: "bg-ink" },
  ];
  const ranked = [...listings]
    .filter((l) => l.status !== "archived")
    .sort((a, b) => (perListing.get(b.id) ?? 0) - (perListing.get(a.id) ?? 0) || b.pricePhp - a.pricePhp)
    .slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Agent desk"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede={
          fresh.length > 0
            ? `${fresh.length} ${fresh.length === 1 ? "buyer is" : "buyers are"} waiting on a reply. Here is the rest of your book.`
            : "No one is waiting on you. Here is how your book looks today."
        }
        action={
          <ButtonLink href="/dashboard/agent/inquiries" variant="secondary" size="sm" icon="arrow-right">
            Open inquiries
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Live listings" value={published} icon={House} href="/dashboard/agent/listings" hint={`${listings.length} on your book in total`} />
        <StatCard
          label="New inquiries"
          value={fresh.length}
          icon={ChatCircleText}
          tone="accent"
          href="/dashboard/agent/inquiries"
          hint={`${inquiries.length} received all time`}
        />
        <StatCard label="For sale, live" value={sumPrices(listings, "sale")} format="php-compact" icon={Coins} tone="night" hint="Combined asking price" />
        <StatCard label="Leases, live" value={sumPrices(listings, "rent")} format="php-compact" icon={Key} tone="sky" hint="Combined rent per month" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Listing pipeline" kicker={`${listings.length} listings`} action={<CardLink href="/dashboard/agent/listings">Manage</CardLink>}>
          <StackedBar segments={pipeline} label="Listings by status" />
        </Card>
        <Card title="Inquiry status" kicker={`${inquiries.length} inquiries`} action={<CardLink href="/dashboard/agent/inquiries">Reply</CardLink>}>
          <StackedBar segments={inquiryMix} label="Inquiries by status" />
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <Card title="Inquiries per listing" kicker="ranked" className="lg:col-span-7">
          {ranked.length === 0 ? (
            <EmptyNote>No listings yet. Draft one and it shows up here.</EmptyNote>
          ) : (
            <div className="flex flex-col gap-5">
              <BarChart
                label="Inquiries per listing"
                bars={ranked.map((l, i) => ({ key: l.id, label: String(i + 1).padStart(2, "0"), title: l.title, value: perListing.get(l.id) ?? 0 }))}
              />
              <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {ranked.map((l, i) => (
                  <li key={l.id} className="flex min-w-0 items-baseline gap-2 font-mono text-[0.75rem]">
                    <span className="tabular text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                    <Link href={`/dashboard/agent/listings/${l.id}`} className="truncate text-ink-soft underline decoration-ink/15 underline-offset-4 hover:text-ink hover:decoration-ink">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>

        <Card title="Needs attention" kicker={`${fresh.length + drafts.length} items`} className="lg:col-span-5">
          {fresh.length === 0 && drafts.length === 0 ? (
            <EmptyNote>Nothing is waiting. The desk is clear.</EmptyNote>
          ) : (
            <ul className="flex flex-col gap-1">
              {fresh.slice(0, 5).map((inquiry) => (
                <AttentionRow
                  key={inquiry.id}
                  kind="inquiry"
                  title={inquiry.name}
                  detail={inquiry.propertyTitle}
                  when={formatRelativeDate(inquiry.createdAt)}
                  href="/dashboard/agent/inquiries"
                />
              ))}
              {drafts.slice(0, 4).map((listing) => (
                <AttentionRow key={listing.id} kind="draft" title={listing.title} detail="Ready to submit for review" href={`/dashboard/agent/listings/${listing.id}`} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {listings.length > 0 && (
        <Card title="Your book" kicker="latest six" className="mt-3" action={<CardLink href="/dashboard/agent/listings">All listings</CardLink>}>
          <DataTable head={["Home", "Status", "Type", "Price", "Leads", ""]}>
            {listings.slice(0, 6).map((l) => (
              <tr key={l.id}>
                <td className="max-w-[18rem]">
                  <Link href={`/dashboard/agent/listings/${l.id}`} className="block truncate text-small font-semibold text-ink hover:underline">
                    {l.title}
                  </Link>
                  <span className="block truncate font-mono text-[0.6875rem] text-ink-muted">
                    {l.neighborhood}, {l.city}
                  </span>
                </td>
                <td>
                  <StatusPill kind="listing" status={l.status} />
                </td>
                <td className="font-mono text-[0.75rem] uppercase text-ink-soft">{PROPERTY_TYPE_LABEL[l.propertyType]}</td>
                <td className="tabular whitespace-nowrap text-small font-semibold text-ink" title={formatPhp(l.pricePhp)}>
                  {formatListingPrice(l.pricePhp, l.listingType)}
                </td>
                <td className="tabular font-mono text-[0.75rem] text-ink">{perListing.get(l.id) ?? 0}</td>
                <td>
                  <Link
                    href={`/dashboard/agent/listings/${l.id}`}
                    aria-label={`Edit ${l.title}`}
                    className="inline-grid size-8 place-items-center rounded-md bg-ink text-paper transition-colors duration-300 ease-settle hover:bg-accent hover:text-ink"
                  >
                    <ArrowUpRight aria-hidden size={14} weight="bold" />
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>
      )}
    </>
  );
}
