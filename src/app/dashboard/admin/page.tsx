import { ArrowUpRight, ChatCircleText, House, ShieldCheck, Users } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { firstName, greeting } from "@/components/dashboard/copy";
import { ROLE_LABEL } from "@/components/dashboard/nav";
import { BarChart, Card, CardLink, DataTable, EmptyNote, MeterRow, type Segment, StackedBar, StatCard } from "@/components/dashboard/widgets";
import { PageHeader } from "@/components/dashboard/page-header";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { ButtonLink } from "@/components/ui/button";
import { getAdminStats, listModerationQueue, listUsers } from "@/lib/data/admin";
import { listCities } from "@/lib/data/properties";
import { requireRole } from "@/lib/data/viewer";
import type { Role } from "@/lib/domain/types";
import { formatListingPrice, formatRelativeDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

const ROLE_SWATCH: Record<Role, string> = { buyer: "bg-sky-deep", agent: "bg-accent", admin: "bg-ink" };

export default async function AdminHomePage() {
  const member = await requireRole("admin");
  const [stats, queue, users, cities] = await Promise.all([getAdminStats(), listModerationQueue(), listUsers(), listCities()]);

  const other = Math.max(0, stats.listingCount - stats.pendingCount - stats.publishedCount);
  const catalog: Segment[] = [
    { label: "Published", value: stats.publishedCount, swatch: "bg-accent" },
    { label: "In review", value: stats.pendingCount, swatch: "bg-sun" },
    { label: "Draft, sold, archived", value: other, swatch: "bg-hatch bg-paper-sunken" },
  ];
  const roles: Segment[] = (["buyer", "agent", "admin"] as const).map((role) => ({
    label: `${ROLE_LABEL[role]}s`,
    value: users.filter((u) => u.role === role).length,
    swatch: ROLE_SWATCH[role],
  }));
  const answered = stats.inquiryCount - stats.newInquiryCount;
  const answeredShare = stats.inquiryCount ? Math.round((answered / stats.inquiryCount) * 100) : 0;
  const topCities = [...cities].sort((a, b) => b.count - a.count).slice(0, 8);
  const newest = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const agents = users.filter((u) => u.role === "agent");
  const agencies = new Map<string, number>();
  for (const agent of agents) agencies.set(agent.agency ?? "Independent", (agencies.get(agent.agency ?? "Independent") ?? 0) + 1);
  const agencyRows = [...agencies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title={
          <>
            {greeting()}, <em>{firstName(member.fullName)}</em>
          </>
        }
        lede={
          stats.pendingCount > 0
            ? `${stats.pendingCount} ${stats.pendingCount === 1 ? "listing needs" : "listings need"} a decision. Everything else is counted below.`
            : "The review queue is empty. Everything else is counted below."
        }
        action={
          <ButtonLink href="/dashboard/admin/users" variant="secondary" size="sm" icon="arrow-right">
            People
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Members" value={stats.userCount} icon={Users} href="/dashboard/admin/users" hint={`${agents.length} agents, ${roles[0]?.value ?? 0} buyers`} />
        <StatCard label="Listings" value={stats.listingCount} icon={House} tone="sky" hint={`${stats.publishedCount} live on the site`} />
        <StatCard
          label="In review"
          value={stats.pendingCount}
          icon={ShieldCheck}
          tone={stats.pendingCount > 0 ? "accent" : "paper"}
          href="/dashboard/admin/moderation"
          hint={stats.pendingCount > 0 ? "Waiting for a publish decision" : "Nothing waiting"}
        />
        <StatCard label="New inquiries" value={stats.newInquiryCount} icon={ChatCircleText} tone="night" hint={`${stats.inquiryCount} sent all time`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Catalog by status" kicker={`${stats.listingCount} listings`}>
          <StackedBar segments={catalog} label="Listings by status" />
        </Card>
        <Card title="Members by role" kicker={`${users.length} accounts`} action={<CardLink href="/dashboard/admin/users">Directory</CardLink>}>
          <StackedBar segments={roles} label="Members by role" />
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <Card title="Live homes per city" kicker="published only" className="lg:col-span-7">
          {topCities.length === 0 ? (
            <EmptyNote>No published homes yet.</EmptyNote>
          ) : (
            <BarChart label="Live homes per city" height="h-64" bars={topCities.map((c) => ({ key: c.name, label: c.name, value: c.count }))} />
          )}
        </Card>
        <Card title="Inquiry handling" kicker="all time" className="lg:col-span-5" bodyClassName="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <p className="condensed tabular font-display text-[3.75rem] font-bold leading-[0.85] tracking-[-0.02em]">
              {answeredShare}
              <span className="font-mono text-[0.35em] font-normal tracking-normal text-ink-muted">%</span>
            </p>
            <p className="max-w-[18ch] text-right text-[0.8125rem] text-ink-soft">of inquiries have had a first reply from the agent.</p>
          </div>
          <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-[3px] bg-paper-sunken">
            <span className="rounded-[2px] bg-positive" style={{ width: `${answeredShare}%` }} />
          </div>
          <div className="flex flex-col gap-1 border-t border-dashed border-ink/15 pt-3">
            <p className="text-micro uppercase text-ink-muted">Agents by agency</p>
            {agencyRows.map(([agency, count]) => (
              <MeterRow key={agency} label={agency} value={count} max={agencyRows[0]?.[1] ?? 1} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <Card title="Review queue" kicker={`${queue.length} waiting`} className="lg:col-span-7" action={<CardLink href="/dashboard/admin/moderation">Moderate</CardLink>}>
          {queue.length === 0 ? (
            <EmptyNote>Nothing to review. New submissions land here.</EmptyNote>
          ) : (
            <DataTable head={["Home", "Type", "Price", ""]}>
              {queue.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-[0.25rem] bg-paper-sunken">
                        {p.coverImage ? <Image src={p.coverImage.url} alt="" fill sizes="40px" unoptimized={p.coverImage.url.startsWith("http://localhost")} className="object-cover" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-small font-semibold text-ink">{p.title}</span>
                        <span className="block truncate font-mono text-[0.6875rem] text-ink-muted">
                          {p.neighborhood}, {p.city}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="font-mono text-[0.75rem] uppercase text-ink-soft">{PROPERTY_TYPE_LABEL[p.propertyType]}</td>
                  <td className="tabular whitespace-nowrap text-small font-semibold">{formatListingPrice(p.pricePhp, p.listingType)}</td>
                  <td>
                    <Link
                      href="/dashboard/admin/moderation"
                      aria-label={`Review ${p.title}`}
                      className="inline-grid size-8 place-items-center rounded-md bg-ink text-paper transition-colors duration-300 ease-settle hover:bg-accent hover:text-ink"
                    >
                      <ArrowUpRight aria-hidden size={14} weight="bold" />
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>
        <Card title="Newest members" kicker="by join date" className="lg:col-span-5" action={<CardLink href="/dashboard/admin/users">All</CardLink>}>
          <ul className="flex flex-col">
            {newest.map((u) => (
              <li key={u.id} className="flex items-center gap-3 border-b border-dashed border-ink/10 py-2.5 last:border-0">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[0.3rem] bg-ink font-mono text-[0.6875rem] font-semibold text-accent">
                  {u.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-semibold text-ink">{u.fullName}</span>
                  <span className="block truncate font-mono text-[0.6875rem] text-ink-muted">{u.agency ?? u.email}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="rounded-[0.25rem] bg-sky px-1.5 py-0.5 font-mono text-[0.625rem] uppercase text-ink">{ROLE_LABEL[u.role]}</span>
                  <span className="font-mono text-[0.625rem] text-ink-muted">{formatRelativeDate(u.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
