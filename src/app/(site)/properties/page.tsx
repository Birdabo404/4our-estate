import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilterBar, ResultsHeader } from "@/components/listings/filter-bar";
import { ListingFiltersProvider, ResultsFrame } from "@/components/listings/filter-state";
import { applyPatch, listingsHref } from "@/components/listings/filters";
import { EmptyResults, Pagination, ResultsGrid } from "@/components/listings/results";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { listCities, listProperties } from "@/lib/data/properties";
import type { ListingFilters, ListingType } from "@/lib/domain/types";
import { parseListingFilters } from "@/lib/validation/filters";

export const metadata: Metadata = {
  title: "Properties",
  description: "Houses, villas, and residences for sale and lease across the Philippines, each represented by the agent who knows it.",
};

const HEADING: Record<ListingType | "all", { eyebrow: string; title: string; lead: string }> = {
  all: {
    eyebrow: "The collection",
    title: "Residences, *chosen* slowly.",
    lead: "Houses, villas, and apartments from Forbes Park to Siargao. Each one visited, photographed, and written by the agent who represents it.",
  },
  sale: {
    eyebrow: "For sale",
    title: "Homes to *keep*.",
    lead: "Freehold houses, villas, and residences, priced in pesos and represented with discretion.",
  },
  rent: {
    eyebrow: "For lease",
    title: "Homes to *live in* now.",
    lead: "Furnished and unfurnished leases in Makati and BGC, with monthly rents shown before any conversation.",
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

  return (
    <ListingFiltersProvider filters={filters} total={page.total} cities={cities}>
      <div className="pb-28 pt-32 md:pb-40 md:pt-44">
        <Container width="wide">
          <header className="grid items-end gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-8">
              <Reveal distance={16}>
                <Eyebrow>{heading.eyebrow}</Eyebrow>
              </Reveal>
              <SplitHeading key={heading.title} as="h1" trigger="mount" delay={0.1} text={heading.title} className="mt-7 text-display-2" />
            </div>
            <Reveal delay={0.35} distance={16} className="md:col-span-4 md:pb-3">
              <p className="max-w-[40ch] text-body text-ink-soft">{heading.lead}</p>
            </Reveal>
          </header>

          <div className="mt-12 md:mt-16">
            <FilterBar />
          </div>

          <div className="mt-10 md:mt-12">
            <ResultsHeader />
          </div>

          <ResultsFrame className="mt-12 md:mt-16">
            {page.items.length > 0 ? (
              <ResultsGrid items={page.items} page={filters.page} />
            ) : (
              <EmptyResults filters={filters} cities={cities} />
            )}
          </ResultsFrame>

          <div className="mt-24 md:mt-32">
            <Pagination filters={filters} total={page.total} pageSize={page.pageSize} />
          </div>
        </Container>
      </div>
    </ListingFiltersProvider>
  );
}
