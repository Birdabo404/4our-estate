import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { listingsHref } from "@/components/listings/filters";
import { DitherImage } from "@/components/motion/dither-image";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import type { CityCount } from "@/lib/data/types";
import { photoUrl } from "@/lib/photography/catalog";
import { type Place, toPlaces } from "./places";
import { Kicker } from "./sections";

function homes(count: number): string {
  return `${count} ${count === 1 ? "home" : "homes"}`;
}

function coordinate(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N ${lng.toFixed(4)}°E`;
}

function PlaceTile({ place, index, lead }: { place: Place; index: number; lead: boolean }) {
  return (
    <Link
      href={listingsHref({ city: place.city, sort: "newest", page: 1 })}
      className="group relative flex h-full min-h-[15rem] flex-col overflow-hidden rounded-panel bg-sky ring-1 ring-ink/10 transition-[box-shadow] duration-300 ease-settle hover:shadow-block hover:ring-ink focus-visible:shadow-block"
    >
      <DitherImage
        src={photoUrl(place.photo, lead ? 1400 : 800)}
        alt={place.photo.alt}
        sizes={lead ? "(min-width: 1024px) 48vw, 100vw" : "(min-width: 1024px) 24vw, (min-width: 640px) 50vw, 100vw"}
        reveal="hover"
        cell={lead ? 5 : 4}
        ink="#1f5f7a"
        contrast={1.1}
        className="absolute inset-0"
      />
      <div className="relative flex items-start justify-between gap-3 p-3">
        <span className="rounded-[0.25rem] bg-ink px-2 py-1 font-mono text-[0.6875rem] text-paper">[{String(index + 1).padStart(2, "0")}]</span>
        <span className="rounded-[0.25rem] bg-paper-raised/90 px-2 py-1 font-mono text-[0.6875rem] text-ink-soft">{coordinate(place.lat, place.lng)}</span>
      </div>
      <div className="relative mt-auto flex items-end justify-between gap-3 bg-paper-raised p-4">
        <div className="min-w-0">
          <h3 className={cn("truncate font-display font-semibold", lead ? "text-heading" : "text-title")}>{place.name}</h3>
          <p className="truncate text-small text-ink-muted">{place.note}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="tabular rounded-[0.25rem] bg-sky px-2 py-1 font-mono text-[0.75rem] text-ink">{homes(place.count)}</span>
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-md bg-ink text-paper transition-colors duration-300 ease-settle group-hover:bg-accent group-hover:text-ink"
          >
            <ArrowUpRight size={15} weight="bold" />
          </span>
        </span>
      </div>
    </Link>
  );
}

export function ExplorePlaces({ cities }: { cities: readonly CityCount[] }) {
  const { places, others } = toPlaces(cities);
  if (places.length === 0) return null;

  return (
    <section id="places" aria-label="Explore by place" className="scroll-mt-24 py-20 md:py-28">
      <Container width="wide" className="flex flex-col gap-10 md:gap-14">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="flex flex-col gap-5 md:col-span-7">
            <Kicker index={2}>Explore by place</Kicker>
            <SplitHeading as="h2" text="Start with *where* you want to wake up." className="max-w-[16ch] text-display-2" />
          </div>
          <p className="max-w-[40ch] text-body text-ink-soft md:col-span-4 md:col-start-9">
            Every tile is a filter. Hover one to swap the dither for the real photo, then click through to the homes listed
            there.
          </p>
        </div>

        <ul className="grid auto-rows-[15rem] gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {places.map((place, i) => (
            <Reveal as="li" key={place.city} index={i % 4} className={cn(i === 0 && "sm:col-span-2 sm:row-span-2")}>
              <PlaceTile place={place} index={i} lead={i === 0} />
            </Reveal>
          ))}
          {others.length > 0 && (
            <li className="flex flex-col justify-between gap-4 rounded-panel bg-ink p-5 text-on-night">
              <p className="font-mono text-[0.75rem] uppercase text-on-night-muted">+ {others.length} more places</p>
              <ul className="flex flex-col gap-2">
                {others.map((city) => (
                  <li key={city.name}>
                    <Link
                      href={listingsHref({ city: city.name, sort: "newest", page: 1 })}
                      className="flex items-baseline justify-between gap-3 border-b border-on-night/15 pb-2 text-small transition-colors duration-300 ease-settle hover:text-accent"
                    >
                      <span className="truncate font-semibold">{city.name}</span>
                      <span className="tabular shrink-0 font-mono text-[0.75rem] text-on-night-muted">{homes(city.count)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </Container>
    </section>
  );
}
