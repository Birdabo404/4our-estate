import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FilterBar, ResultsHeader } from "@/components/listings/filter-bar";
import { ListingFiltersProvider, ResultsFrame } from "@/components/listings/filter-state";
import { applyPatch, listingsHref } from "@/components/listings/filters";
import { EmptyResults, Pagination, ResultsGrid } from "@/components/listings/results";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { listCities, listProperties } from "@/lib/data/properties";
import type { ListingFilters, ListingType } from "@/lib/domain/types";
import { parseListingFilters } from "@/lib/validation/filters";

export const metadata: Metadata = {
  title: "Properties",
  description: "Condos, houses and villas for sale and lease across the Philippines, with peso prices and the listing agent one message away.",
};

const HEADING: Record<ListingType | "all", { crumb: string; title: string; lead: string }> = {
  all: {
    crumb: "all",
    title: "Every home on the *board*.",
    lead: "Condos in Makati, houses in Alabang, villas on the islands. Filter by what matters to you, then message the agent straight from the listing.",
  },
  sale: {
    crumb: "for-sale",
    title: "Homes to *buy*.",
    lead: "Houses, villas and condos for sale. Every price in pesos, every listing posted by the agent who has walked through it.",
  },
  rent: {
    crumb: "for-lease",
    title: "Homes to *lease*.",
    lead: "Furnished and bare leases in Makati and BGC, with the monthly rent shown up front.",
  },
};

/** PostgREST rejects a range past the last row, so a stale `?page=9` lands on the last real page instead. */
async function listPage(filters: ListingFilters) {
  if (filters.page === 1) return listProperties(filters);
  try {
    return await listProperties(filters);
  } catch (error) {
    const first = await listProperties({ ...filters, page: 1 });
    const lastPage = Math.max(1, Math.ceil(first.total / first.pageSize));
    if (filters.page <= lastPage) throw error;
    redirect(listingsHref(applyPatch(filters, { page: lastPage })));
  }
}

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const filters = parseListingFilters(await searchParams);
  const [page, cities] = await Promise.all([listPage(filters), listCities()]);

  const heading = HEADING[filters.listingType ?? "all"];

  const topCities = [...cities].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <ListingFiltersProvider filters={filters} total={page.total} cities={cities}>
      <section className="relative isolate overflow-hidden bg-sky pb-20 pt-[calc(var(--nav-height)+2.5rem)] md:pb-24 md:pt-[calc(var(--nav-height)+4rem)]">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,#000_20%,transparent_90%)]" />
        <Container width="wide">
          <p className="font-mono text-[0.75rem] text-ink-muted">
            4our.estate <span aria-hidden>/</span> properties <span aria-hidden>/</span>{" "}
            <span className="text-ink">{heading.crumb}</span>
          </p>
          <header className="mt-6 grid items-end gap-8 md:grid-cols-12 md:gap-10">
            <SplitHeading
              key={heading.title}
              as="h1"
              trigger="mount"
              delay={0.05}
              text={heading.title}
              className="text-display-2 md:col-span-7"
            />
            <Reveal delay={0.25} className="md:col-span-5 md:pb-2">
              <p className="max-w-[44ch] text-body text-ink-soft">{heading.lead}</p>
            </Reveal>
          </header>
          {topCities.length > 0 && (
            <Reveal delay={0.35}>
              <ul aria-label="Popular places" className="mt-8 flex flex-wrap gap-2">
                {topCities.map((city) => {
                  const active = filters.city === city.name;
                  return (
                    <li key={city.name}>
                      <Link
                        href={listingsHref(applyPatch(filters, { city: active ? undefined : city.name }))}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-small font-semibold ring-1 ring-inset transition-[box-shadow,background-color,color] duration-300 ease-settle",
                          active ? "bg-ink text-paper ring-ink" : "bg-paper-raised/80 text-ink ring-ink/10 hover:ring-ink",
                        )}
                      >
                        {city.name}
                        <span className={cn("font-mono text-[0.6875rem] tabular", active ? "text-accent" : "text-ink-muted")}>
                          {city.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          )}
        </Container>
      </section>

      <Container width="wide" className="relative -mt-9 pb-28 md:pb-40">
        <FilterBar />

        <div className="mt-10 md:mt-12">
          <ResultsHeader />
        </div>

        <ResultsFrame className="mt-8 md:mt-10">
          {page.items.length > 0 ? (
            <ResultsGrid items={page.items} page={filters.page} />
          ) : (
            <EmptyResults filters={filters} cities={cities} />
          )}
        </ResultsFrame>

        <div className="mt-16 md:mt-24">
          <Pagination filters={filters} total={page.total} pageSize={page.pageSize} />
        </div>
      </Container>
    </ListingFiltersProvider>
  );
}
