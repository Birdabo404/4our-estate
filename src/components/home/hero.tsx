import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { DitherImage } from "@/components/motion/dither-image";
import { SplitHeading } from "@/components/motion/split-heading";
import { Price } from "@/components/property/price";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { CityCount } from "@/lib/data/types";
import type { PropertySummary } from "@/lib/domain/types";
import { formatLocation } from "@/lib/format";
import { type Photo, photoUrl } from "@/lib/photography/catalog";
import { HeroSearch } from "./hero-search";
import { Stamp } from "./stamp";

function LivePill({ listingCount, cityCount }: { listingCount: number; cityCount: number }) {
  return (
    <p className="inline-flex items-center gap-3 rounded-md bg-paper-raised/70 px-3 py-1.5 font-mono text-[0.75rem] text-ink-soft ring-1 ring-ink/10">
      <span className="relative flex size-2">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
        <span className="relative size-2 rounded-full bg-accent" />
      </span>
      <span>
        <span className="tabular font-semibold text-ink">{listingCount}</span> homes live
        <span aria-hidden className="mx-2 text-ink-muted">/</span>
        <span className="tabular font-semibold text-ink">{cityCount}</span> places
      </span>
    </p>
  );
}

function Spotlight({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex w-full max-w-[22rem] items-center gap-3 rounded-panel bg-paper-raised p-2 pr-3 shadow-float ring-1 ring-ink/10 transition-[box-shadow] duration-300 ease-settle hover:shadow-block hover:ring-ink"
    >
      <span className="relative size-16 shrink-0 overflow-hidden rounded-[0.25rem] bg-paper-sunken">
        {property.coverImage && <Image src={property.coverImage.url} alt="" fill sizes="64px" className="object-cover" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-[0.6875rem] uppercase text-accent-ink">Pick of the week</span>
        <span className="truncate text-small font-semibold text-ink">{property.title}</span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[0.8125rem] text-ink-muted">{formatLocation(property)}</span>
          <Price amount={property.pricePhp} listingType={property.listingType} style="compact" size="sm" className="shrink-0 text-[0.9375rem]" />
        </span>
      </span>
      <ArrowUpRight aria-hidden size={16} weight="bold" className="shrink-0 text-ink-muted transition-colors duration-300 ease-settle group-hover:text-ink" />
    </Link>
  );
}

export function HomeHero({
  photo,
  listingCount,
  cityCount,
  cities,
  spotlight,
}: {
  photo: Photo;
  listingCount: number;
  cityCount: number;
  cities: readonly CityCount[];
  spotlight?: PropertySummary;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-sky pt-(--nav-height)">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10 [mask-image:linear-gradient(180deg,#000_30%,transparent_75%)]" />

      <Container width="wide" className="relative pt-10 md:pt-16">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-7 lg:col-span-8">
            <LivePill listingCount={listingCount} cityCount={cityCount} />
            <SplitHeading
              as="h1"
              trigger="mount"
              delay={0.1}
              text="Homes that *fit*, from Makati to Siargao."
              className="max-w-[13ch] text-display-1 text-ink"
            />
            <p className="max-w-[46ch] text-lead text-ink-soft">
              Condos near the office, houses near the good schools, and a few villas near the waves. Real photos, prices in
              pesos, and an agent who actually replies.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/properties" size="lg" icon="arrow-up-right">
                Browse all homes
              </ButtonLink>
              <ButtonLink href="/properties?listingType=rent" size="lg" variant="ghost" icon="arrow-right">
                Looking to lease
              </ButtonLink>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-6 pb-2 lg:col-span-4 lg:flex">
            <Stamp text="Real photos ✱ Peso prices ✱ Agents who reply ✱ " className="text-ink" />
            {spotlight && <Spotlight property={spotlight} />}
          </div>
        </div>
      </Container>

      <div className="relative mt-10 md:mt-14">
        <Container width="wide" className="relative">
          <DitherImage
            src={photoUrl(photo, 2400, 75)}
            alt={photo.alt}
            sizes="(min-width: 1536px) 1440px, 100vw"
            preload
            reveal="fade-top"
            paper="#cfe9f1"
            ink="#1f5f7a"
            cell={3}
            className="h-[22rem] rounded-t-panel sm:h-[26rem] lg:h-[30rem]"
          />
          <p aria-hidden className="absolute bottom-24 right-8 hidden font-mono text-[0.6875rem] uppercase text-white/85 md:block lg:right-16">
            fig. 01 — a house that gets the light right
          </p>
        </Container>
        <div className="relative -mt-20 bg-[linear-gradient(180deg,transparent_5rem,var(--color-paper)_5rem)] pb-4">
          <Container width="wide">
            <div className="mx-auto max-w-[78rem] px-0 md:px-6">
              <HeroSearch cities={cities} />
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
