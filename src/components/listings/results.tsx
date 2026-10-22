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
    <div className="flex flex-col gap-6 md:gap-8">
      {lead && (
        <Reveal>
          <SaveableCard property={lead} variant="feature" priority />
        </Reveal>
      )}
      <ul className="grid gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {grid.map((property, i) => (
          <Reveal as="li" key={property.id} index={i % 3}>
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
  const step =
    "grid size-11 place-items-center rounded-md bg-paper-raised text-ink ring-1 ring-inset ring-ink/15 transition-[box-shadow,background-color,color] duration-300 ease-settle hover:bg-ink hover:text-paper hover:ring-ink";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-6 border-t border-dashed border-ink/20 pt-8">
      <p className="font-mono text-[0.8125rem] text-ink-muted">
        page <span className="tabular font-semibold text-ink">{String(current).padStart(2, "0")}</span> /{" "}
        <span className="tabular">{String(count).padStart(2, "0")}</span>
      </p>
      <ol className="flex items-center gap-1.5">
        <li>
          {current > 1 ? (
            <Link href={href(current - 1)} aria-label="Previous page" className={step}>
              <ArrowLeft aria-hidden size={15} weight="bold" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "pointer-events-none opacity-35")}>
              <ArrowLeft size={15} weight="bold" />
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
                  "grid size-11 place-items-center rounded-md font-mono text-small tabular transition-colors duration-300 ease-settle",
                  slot === current ? "bg-accent font-semibold text-ink" : "text-ink-soft hover:bg-ink/[0.06] hover:text-ink",
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
              <ArrowRight aria-hidden size={15} weight="bold" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "pointer-events-none opacity-35")}>
              <ArrowRight size={15} weight="bold" />
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
    <div className="flex flex-col items-center rounded-panel bg-paper-raised py-6 ring-1 ring-ink/10">
      <EmptyState
        icon="search"
        title="No homes match that, yet"
        action={
          <ButtonLink href={listingsHref(applyPatch(filters, CLEAR_ALL))} variant="secondary" icon="arrow-right">
            Clear all filters
          </ButtonLink>
        }
      >
        Agents add new places every week. Drop one filter, or start from a city that has homes today.
      </EmptyState>
      <div className="grid w-full max-w-2xl gap-10 pb-14 text-center sm:grid-cols-2 sm:text-left">
        {chips.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-micro uppercase text-ink-muted">Try without</p>
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
          <p className="text-micro uppercase text-ink-muted">Or start with a place</p>
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
