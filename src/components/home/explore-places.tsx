import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { listingsHref } from "@/components/listings/filters";
import { HorizontalPin, PinProgress } from "@/components/motion/horizontal-pin";
import { SplitHeading } from "@/components/motion/split-heading";
import { cn } from "@/lib/cn";
import type { CityCount } from "@/lib/data/types";
import { photoUrl } from "@/lib/photography/catalog";
import { type Place, toPlaces } from "./places";
import { Kicker } from "./sections";

function residences(count: number): string {
  return `${count} ${count === 1 ? "residence" : "residences"}`;
}

function PlaceCard({ place, index }: { place: Place; index: number }) {
  return (
    <li className="w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[min(30vw,30rem)] group-data-[pinned=true]/pin:w-[calc((100dvh-17rem)*0.8)]">
      <Link
        href={listingsHref({ city: place.city, sort: "newest", page: 1 })}
        className="group flex flex-col gap-5 outline-none focus-visible:[&>div]:outline focus-visible:[&>div]:outline-2 focus-visible:[&>div]:outline-offset-4 focus-visible:[&>div]:outline-accent"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-photo bg-night-raised">
          <Image
            src={photoUrl(place.photo, 1000)}
            alt={place.photo.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
            className="object-cover transition-transform duration-[1400ms] ease-reveal group-hover:scale-[1.04]"
          />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_18_15/0)_55%,rgb(20_18_15/0.55)_100%)]" />
          <span className="tabular absolute left-5 top-5 text-micro text-white/85">{String(index + 1).padStart(2, "0")}</span>
          <span className="absolute bottom-5 left-5 rounded-full bg-paper/92 px-3.5 py-1.5 text-small text-ink">{residences(place.count)}</span>
          <span
            aria-hidden
            className="absolute bottom-5 right-5 grid size-10 place-items-center rounded-full bg-paper text-ink opacity-0 transition-opacity duration-500 ease-settle group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <ArrowUpRight size={15} weight="light" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-heading text-on-night [--opsz:48]">{place.name}</h3>
          <p className="text-small text-on-night-muted">
            {place.note}
            <span aria-hidden className="mx-2 opacity-50">/</span>
            {place.province}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function ExplorePlaces({ cities }: { cities: readonly CityCount[] }) {
  const { places, others } = toPlaces(cities);
  if (places.length === 0) return null;

  return (
    <section aria-label="Explore by place" className="bg-night text-on-night">
      <HorizontalPin
        className="py-24 md:py-32 data-[pinned=true]:flex data-[pinned=true]:h-[100dvh] data-[pinned=true]:items-center data-[pinned=true]:py-0"
        viewportClassName="group-data-[pinned=true]/pin:flex-1"
        trackClassName="scroll-px-5 px-5 sm:scroll-px-8 sm:px-8 lg:px-12 group-data-[pinned=true]/pin:px-0 group-data-[pinned=true]/pin:pr-12"
        header={
          <div
            className={cn(
              "mx-auto mb-12 grid w-full max-w-[96rem] gap-8 px-5 sm:px-8 md:mb-16 md:grid-cols-12 md:items-end lg:px-12",
              "group-data-[pinned=true]/pin:mx-0 group-data-[pinned=true]/pin:mb-0 group-data-[pinned=true]/pin:flex group-data-[pinned=true]/pin:w-[min(34vw,34rem)] group-data-[pinned=true]/pin:shrink-0 group-data-[pinned=true]/pin:flex-col group-data-[pinned=true]/pin:items-start group-data-[pinned=true]/pin:gap-10 group-data-[pinned=true]/pin:pr-16",
            )}
          >
            <div className="flex flex-col gap-5 md:col-span-7">
              <Kicker index={3} tone="night">
                Explore by place
              </Kicker>
              <SplitHeading
                as="h2"
                text="From the villages to the *islands*."
                className="text-display-2 text-on-night [--opsz:96] group-data-[pinned=true]/pin:text-display-3"
              />
            </div>
            <p className="max-w-[40ch] text-lead text-on-night-muted md:col-span-4 md:col-start-9">
              Each place is a short list, kept by agents who live there. Choose one and the collection narrows to it.
            </p>
            <div className="hidden w-full flex-col gap-3 group-data-[pinned=true]/pin:flex">
              <PinProgress className="w-full" />
              <p className="tabular text-micro uppercase text-on-night-muted">{places.length} places · scroll to travel</p>
            </div>
          </div>
        }
      >
        {places.map((place, i) => (
          <PlaceCard key={place.city} place={place} index={i} />
        ))}
        {others.length > 0 && (
          <li className="flex w-[70vw] shrink-0 snap-start flex-col justify-end gap-4 border-l border-on-night/15 pb-2 pl-8 sm:w-[36vw] lg:w-[22rem]">
            <p className="text-micro uppercase text-on-night-muted">Also</p>
            <ul className="flex flex-col gap-3">
              {others.map((city) => (
                <li key={city.name}>
                  <Link
                    href={listingsHref({ city: city.name, sort: "newest", page: 1 })}
                    className="font-display text-title text-on-night underline decoration-on-night/20 underline-offset-[6px] transition-colors duration-300 ease-settle hover:decoration-on-night"
                  >
                    {city.name}
                  </Link>
                  <span className="ml-3 text-small text-on-night-muted">{residences(city.count)}</span>
                </li>
              ))}
            </ul>
          </li>
        )}
      </HorizontalPin>
    </section>
  );
}
