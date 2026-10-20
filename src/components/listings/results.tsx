import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { SaveableCard } from "@/components/favorites/saveable-card";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CityCount } from "@/lib/data/types";
import type { ListingFilters, PropertySummary } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { activeChips, applyPatch, CLEAR_ALL, listingsHref } from "./filters";

export function ResultsGrid({ items, page }: { items: PropertySummary[]; page: number }) {
  const lead = page === 1 && items.length >= 4 ? items[0] : undefined;
  const grid = lead ? items.slice(1) : items;

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      {lead && (
        <Reveal>
          <SaveableCard property={lead} variant="feature" priority />
        </Reveal>
      )}
      <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2 md:gap-x-10 md:gap-y-24 xl:grid-cols-3">
        {grid.map((property, i) => (
          <Reveal as="li" key={property.id} index={i % 3} className={cn(i % 3 === 1 && "xl:mt-28")}>
            <SaveableCard property={property} priority={!lead && i < 3} />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

type PageSlot = number | "gap-start" | "gap-end";

function pageSlots(current: number, count: number): PageSlot[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const middle = [current - 1, current, current + 1].filter((n) => n > 1 && n < count);
  const first = middle[0] ?? count;
  const last = middle.at(-1) ?? 1;
  return [
    1,
    ...(first > 2 ? (["gap-start"] as const) : []),
    ...middle,
    ...(last < count - 1 ? (["gap-end"] as const) : []),
    count,
  ];
}

export function Pagination({ filters, total, pageSize }: { filters: ListingFilters; total: number; pageSize: number }) {
  const count = Math.ceil(total / pageSize);
  if (count <= 1) return null;
  const current = Math.min(filters.page, count);
  const href = (page: number) => listingsHref(applyPatch(filters, { page }));
  const step = "grid size-11 place-items-center rounded-full ring-1 ring-inset ring-ink/12 transition-[box-shadow,background-color] duration-300 ease-settle hover:ring-ink/30";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-6 border-t border-ink/10 pt-8">
      <p className="text-small text-ink-muted">
        Page <span className="tabular text-ink">{current}</span> of <span className="tabular">{count}</span>
      </p>
      <ol className="flex items-center gap-1.5">
        <li>
          {current > 1 ? (
            <Link href={href(current - 1)} aria-label="Previous page" className={step}>
              <ArrowLeft aria-hidden size={15} weight="regular" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "opacity-35 hover:ring-ink/12")}>
              <ArrowLeft size={15} weight="regular" />
            </span>
          )}
        </li>
        {pageSlots(current, count).map((slot) =>
          typeof slot === "number" ? (
            <li key={slot} className="hidden sm:block">
              <Link
                href={href(slot)}
                aria-label={`Page ${slot}`}
                aria-current={slot === current ? "page" : undefined}
                className={cn(
                  "grid size-11 place-items-center rounded-full text-small tabular transition-colors duration-300 ease-settle",
                  slot === current ? "bg-ink text-paper" : "text-ink-soft hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                {slot}
              </Link>
            </li>
          ) : (
            <li key={slot} aria-hidden className="hidden w-6 text-center text-ink-muted sm:block">
              …
            </li>
          ),
        )}
        <li>
          {current < count ? (
            <Link href={href(current + 1)} aria-label="Next page" className={step}>
              <ArrowRight aria-hidden size={15} weight="regular" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "opacity-35 hover:ring-ink/12")}>
              <ArrowRight size={15} weight="regular" />
            </span>
          )}
        </li>
      </ol>
    </nav>
  );
}

export function EmptyResults({ filters, cities }: { filters: ListingFilters; cities: readonly CityCount[] }) {
  const chips = activeChips(filters);
  const places = [...cities].sort((a, b) => b.count - a.count).slice(0, 3);
  const link = "text-small text-accent-ink underline decoration-accent-ink/30 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-accent-ink";

  return (
    <div className="flex flex-col items-center border-y border-ink/10 py-6">
      <EmptyState
        icon="search"
        title="Nothing in the collection matches, yet"
        action={
          <ButtonLink href={listingsHref(applyPatch(filters, CLEAR_ALL))} variant="secondary" icon="arrow-right">
            Clear all filters
          </ButtonLink>
        }
      >
        New residences arrive quietly. Loosen one detail, or let us show you what is available today.
      </EmptyState>
      <div className="grid w-full max-w-2xl gap-10 pb-14 text-center sm:grid-cols-2 sm:text-left">
        {chips.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-micro font-medium uppercase text-ink-muted">Try without</p>
            <ul className="flex flex-col gap-2">
              {chips.map((chip) => (
                <li key={chip.id}>
                  <Link href={listingsHref(applyPatch(filters, chip.clear))} className={link}>
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <p className="text-micro font-medium uppercase text-ink-muted">Or begin with a place</p>
          <ul className="flex flex-col gap-2">
            {places.map((city) => (
              <li key={city.name}>
                <Link href={listingsHref(applyPatch({ sort: "newest", page: 1 }, { city: city.name }))} className={link}>
                  {city.name}, {city.province}
                  <span className="ml-2 text-ink-muted no-underline">{city.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
