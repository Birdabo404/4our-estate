import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { ScrollImage } from "@/components/motion/scroll-image";
import { ScrollText } from "@/components/motion/scroll-text";
import { SplitHeading } from "@/components/motion/split-heading";
import { Price } from "@/components/property/price";
import { PropertyCard } from "@/components/property/property-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import type { MarketStats } from "@/lib/data/types";
import type { PropertySummary } from "@/lib/domain/types";
import { formatLocation } from "@/lib/format";
import { type Photo, photoUrl } from "@/lib/photography/catalog";

export function Kicker({ index, children, tone = "paper" }: { index: number; children: string; tone?: "paper" | "night" }) {
  return (
    <p className={cn("flex items-center gap-3 text-micro uppercase", tone === "night" ? "text-on-night-muted" : "text-ink-muted")}>
      <span className={cn("tabular", tone === "night" ? "text-accent-soft" : "text-accent")}>{String(index).padStart(2, "0")}</span>
      <span aria-hidden className={cn("h-px w-8", tone === "night" ? "bg-on-night/20" : "bg-ink/15")} />
      {children}
    </p>
  );
}

export function Statement() {
  return (
    <section aria-label="About the collection" className="py-28 md:py-44">
      <Container width="wide" className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <Kicker index={1}>The house view</Kicker>
        </div>
        <ScrollText
          text="We keep a *short* list. Every residence is visited, photographed, and written by the agent who will open its door, and priced in pesos before anyone asks."
          className="font-display text-[clamp(1.875rem,1.2rem+2.4vw,3.5rem)] leading-[1.14] tracking-[-0.02em] text-ink md:col-span-9 [--opsz:72]"
        />
      </Container>
    </section>
  );
}

export function FeaturedCollection({ properties }: { properties: readonly PropertySummary[] }) {
  const [lead, ...rest] = properties;
  if (!lead) return null;
  const placement = ["lg:col-span-5", "lg:col-span-6 lg:col-start-7 lg:mt-48", "lg:col-span-4 lg:col-start-2 lg:-mt-24"];

  return (
    <section aria-label="Featured residences" className="pb-28 md:pb-44">
      <Container width="wide" className="flex flex-col gap-16 md:gap-24">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="flex flex-col gap-6 md:col-span-8">
            <Kicker index={2}>Featured</Kicker>
            <SplitHeading as="h2" text="Chosen for the *season*." className="text-display-2 [--opsz:96]" />
          </div>
          <div className="md:col-span-4 md:flex md:justify-end">
            <ButtonLink href="/properties" variant="secondary" icon="arrow-right">
              All residences
            </ButtonLink>
          </div>
        </div>

        <Reveal>
          <PropertyCard property={lead} variant="feature" action={<FavoriteButton propertyId={lead.id} title={lead.title} />} />
        </Reveal>

        {rest.length > 0 && (
          <ul className="grid gap-x-8 gap-y-20 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-10">
            {rest.slice(0, 3).map((property, i) => (
              <Reveal as="li" key={property.id} index={i % 2} className={placement[i]}>
                <PropertyCard property={property} action={<FavoriteButton propertyId={property.id} title={property.title} />} />
              </Reveal>
            ))}
            {rest.length >= 3 && (
              <Reveal as="li" className="hidden self-center lg:col-span-4 lg:col-start-8 lg:block">
                <p className="max-w-[30ch] font-display text-title italic text-ink-soft [--opsz:24]">
                  Featured by the agents who represent them, never by placement fee.
                </p>
              </Reveal>
            )}
          </ul>
        )}
      </Container>
    </section>
  );
}

export function MarketFigures({ stats }: { stats: MarketStats }) {
  const figures = [
    { value: stats.listingCount, format: "integer" as const, label: "Residences on the register", note: "Each one visited before it was published." },
    { value: stats.cityCount, format: "integer" as const, label: "Places", note: "From the Makati villages to Siargao." },
    { value: stats.medianPricePhp, format: "php-compact" as const, label: "Median asking price", note: "For homes offered for sale, in pesos." },
  ];
  return (
    <section aria-label="The collection in figures" className="bg-paper-raised py-24 md:py-36">
      <Container width="wide" className="flex flex-col gap-14 md:gap-20">
        <Kicker index={4}>In figures</Kicker>
        <dl className="grid gap-12 md:grid-cols-3 md:gap-10">
          {figures.map((figure, i) => (
            <Reveal key={figure.label} index={i} distance={24} className="flex flex-col gap-5 border-t border-ink/12 pt-8">
              <dt className="order-2 flex flex-col gap-1.5">
                <span className="text-body text-ink">{figure.label}</span>
                <span className="text-small text-ink-muted">{figure.note}</span>
              </dt>
              <dd className="order-1 font-display text-[clamp(3.5rem,2rem+5vw,7rem)] leading-[0.9] tracking-[-0.03em] [--opsz:144]">
                <CountUp value={figure.value} format={figure.format} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function RecentLedger({ properties }: { properties: readonly PropertySummary[] }) {
  if (properties.length === 0) return null;
  return (
    <section aria-label="Recently listed" className="py-28 md:py-40">
      <Container width="wide" className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Kicker index={5}>Recently listed</Kicker>
          <SplitHeading as="h2" text="New to the *register*." className="text-display-3 [--opsz:72]" />
          <p className="max-w-[34ch] text-body text-ink-soft">The latest residences, in the order their agents published them.</p>
        </div>
        <ol className="border-t border-ink/12 lg:col-span-8">
          {properties.map((property, i) => (
            <Reveal as="li" key={property.id} index={i} distance={16} className="border-b border-ink/12">
              <Link
                href={`/properties/${property.slug}`}
                className="group grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 py-5 outline-none focus-visible:bg-ink/[0.03] md:grid-cols-[2rem_6rem_minmax(0,1fr)_10rem_auto] md:gap-x-6"
              >
                <span aria-hidden className="tabular hidden text-micro text-ink-muted md:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative row-span-2 aspect-[4/3] overflow-hidden rounded-photo bg-paper-sunken md:row-span-1">
                  {property.coverImage && (
                    <Image
                      src={property.coverImage.url}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-[1200ms] ease-reveal group-hover:scale-[1.06]"
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="line-clamp-2 font-display text-title [--opsz:24] md:truncate">{property.title}</span>
                  <span className="line-clamp-1 text-small text-ink-muted md:truncate">
                    {PROPERTY_TYPE_LABEL[property.propertyType]} · {formatLocation(property)}
                  </span>
                </span>
                <span className="col-start-2 text-ink md:col-start-auto md:text-right">
                  <Price amount={property.pricePhp} listingType={property.listingType} style="compact" size="sm" />
                </span>
                <span
                  aria-hidden
                  className="col-start-3 row-span-2 row-start-1 grid size-9 place-items-center rounded-full text-ink-soft ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle group-hover:bg-ink group-hover:text-paper md:col-start-auto md:row-span-1 md:row-start-auto"
                >
                  <ArrowUpRight size={14} weight="light" />
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const PRINCIPLES = [
  { title: "Visited before it is published", body: "An agent walks every room. Nothing is listed from a brochure." },
  { title: "Priced in full, in pesos", body: "The asking price or the monthly rent is on the page, not behind a call." },
  { title: "One agent, door to keys", body: "The person who answers your note is the person who shows you the house." },
];

export function Philosophy({ photo }: { photo: Photo }) {
  return (
    <section aria-label="How we represent" className="pb-28 md:pb-44">
      <Container width="wide" className="grid items-center gap-14 md:grid-cols-12 md:gap-10">
        <ScrollImage
          src={photoUrl(photo, 1600)}
          alt={photo.alt}
          sizes="(min-width: 768px) 45vw, 100vw"
          className="aspect-[4/5] rounded-photo md:col-span-5"
        />
        <div className="flex flex-col gap-10 md:col-span-6 md:col-start-7">
          <Kicker index={6}>Representation</Kicker>
          <SplitHeading as="h2" text="Represented, never *merely* listed." className="text-display-3 [--opsz:72]" />
          <ol className="flex flex-col">
            {PRINCIPLES.map((principle, i) => (
              <Reveal as="li" key={principle.title} index={i} distance={16} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-ink/12 py-6">
                <span className="tabular pt-1 text-micro text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex flex-col gap-1.5">
                  <span className="font-display text-title [--opsz:24]">{principle.title}</span>
                  <span className="text-body text-ink-soft">{principle.body}</span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

export function AgentInvitation({ photo }: { photo: Photo }) {
  return (
    <section data-nav-surface="image" aria-label="For agents" className="relative isolate overflow-hidden bg-night text-white">
      <ScrollImage src={photoUrl(photo, 2400)} alt="" sizes="100vw" className="absolute inset-0 -z-10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(20_18_15/0.78)_0%,rgb(20_18_15/0.45)_55%,rgb(20_18_15/0.2)_100%)]" />
      <Container width="wide" className="flex min-h-[80svh] flex-col justify-end gap-10 py-24 md:py-32">
        <Eyebrow tone="image" className="self-start">
          For agents
        </Eyebrow>
        <SplitHeading as="h2" text="Represent a residence *worth* the walk." className="max-w-[14ch] text-display-2 text-white [--opsz:96]" />
        <Reveal distance={16} className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[44ch] text-lead text-white/85">
            Licensed brokers can list with us after a short review. We ask for honest photographs, a full price, and a reply within a day.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href="/signup?role=agent" variant="on-image" size="lg" icon="arrow-up-right" magnetic>
              Apply to list
            </ButtonLink>
            <Link
              href="/properties"
              className="text-small text-white underline decoration-white/35 underline-offset-[6px] transition-colors duration-300 ease-settle hover:decoration-white"
            >
              Or keep browsing
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
