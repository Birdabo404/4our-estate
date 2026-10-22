import { ArrowUpRight, ChatCircleText, ChatsCircle, Heart, MapPin } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { firstName, greeting } from "@/components/dashboard/copy";
import { PageHeader } from "@/components/dashboard/page-header";
import { SavedResidences } from "@/components/dashboard/saved-residences";
import { Card, CardLink, EmptyNote, StatCard } from "@/components/dashboard/widgets";
import { StatusPill } from "@/components/ui/status-pill";
import { listFavorites, listMyInquiries } from "@/lib/data/buyer";
import { requireRole } from "@/lib/data/viewer";
import { formatPhp, formatRelativeDate } from "@/lib/format";

export const metadata: Metadata = { title: "Saved homes" };

export default async function BuyerHomePage() {
  const member = await requireRole("buyer");
  const [favorites, inquiries] = await Promise.all([listFavorites(), listMyInquiries()]);
  const replied = inquiries.filter((i) => i.status !== "new").length;
  const places = new Set(favorites.map((p) => p.city));
  const forSale = favorites.filter((p) => p.listingType === "sale");
  const cheapest = forSale.length > 0 ? Math.min(...forSale.map((p) => p.pricePhp)) : null;

  return (
    <>
      <PageHeader
        eyebrow="Buyer space"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede={
          favorites.length > 0
            ? `You have ${favorites.length} ${favorites.length === 1 ? "home" : "homes"} saved across ${places.size} ${places.size === 1 ? "place" : "places"}.`
            : "Save homes as you browse and they collect here."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Saved homes" value={favorites.length} icon={Heart} tone="sky" hint={cheapest ? `From ${formatPhp(cheapest, "compact")} for sale` : "Nothing saved yet"} />
        <StatCard label="Places" value={places.size} icon={MapPin} hint={[...places].slice(0, 3).join(", ") || "Anywhere you like"} />
        <StatCard label="Inquiries sent" value={inquiries.length} icon={ChatCircleText} href="/dashboard/buyer/inquiries" hint="Notes to listing agents" />
        <StatCard
          label="Replies in"
          value={replied}
          icon={ChatsCircle}
          tone={replied > 0 ? "accent" : "night"}
          href="/dashboard/buyer/inquiries"
          hint={inquiries.length - replied > 0 ? `${inquiries.length - replied} still waiting` : "No one is waiting on an agent"}
        />
      </div>

      <Card
        title="Latest inquiries"
        kicker={`${inquiries.length} sent`}
        className="mt-3"
        action={inquiries.length > 0 ? <CardLink href="/dashboard/buyer/inquiries">All</CardLink> : undefined}
      >
        {inquiries.length === 0 ? (
          <EmptyNote>Message an agent from any listing and the thread shows up here.</EmptyNote>
        ) : (
          <ul className="grid gap-2 md:grid-cols-3">
            {inquiries.slice(0, 3).map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href={`/properties/${inquiry.propertySlug}`}
                  className="group flex h-full flex-col gap-3 rounded-md p-3 ring-1 ring-inset ring-ink/10 transition-[background-color,box-shadow] duration-300 ease-settle hover:bg-sky-soft hover:ring-ink"
                >
                  <span className="flex items-center justify-between gap-3">
                    <StatusPill kind="inquiry" status={inquiry.status} />
                    <ArrowUpRight aria-hidden size={14} weight="bold" className="text-ink-muted transition-transform duration-300 ease-settle group-hover:rotate-45 group-hover:text-ink" />
                  </span>
                  <span className="truncate text-small font-semibold text-ink">{inquiry.propertyTitle}</span>
                  <span className="line-clamp-2 text-[0.8125rem] text-ink-soft">{inquiry.message}</span>
                  <span className="mt-auto font-mono text-[0.6875rem] text-ink-muted">{formatRelativeDate(inquiry.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section aria-labelledby="saved-heading" className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="saved-heading" className="font-display text-heading font-semibold">
            Saved homes
          </h2>
          <span className="font-mono text-[0.75rem] text-ink-muted">{favorites.length} total</span>
        </div>
        <SavedResidences properties={favorites} />
      </section>
    </>
  );
}
