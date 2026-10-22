import { ArrowUpRight, ChatCircleText, HouseLine, Key, MagnifyingGlass } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { SaveableCard } from "@/components/favorites/saveable-card";
import { PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { CountUp } from "@/components/motion/count-up";
import { DitherImage } from "@/components/motion/dither-image";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Price } from "@/components/property/price";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import type { MarketStats } from "@/lib/data/types";
import type { PropertySummary } from "@/lib/domain/types";
import { formatArea, formatListingPrice, formatLocation } from "@/lib/format";
import { type Photo, photoUrl } from "@/lib/photography/catalog";
import { AsciiPlan } from "./ascii-plan";
import { Asterisk } from "./stamp";

/** `[01] — Featured`: the section index in mono, like a drawing number. */
export function Kicker({ index, children, tone = "paper" }: { index: number; children: string; tone?: "paper" | "night" }) {
  return (
    <p className={cn("flex items-center gap-3 font-mono text-[0.75rem] uppercase", tone === "night" ? "text-on-night-muted" : "text-ink-muted")}>
      <span className={cn("tabular rounded-[0.25rem] px-1.5 py-0.5", tone === "night" ? "bg-accent text-ink" : "bg-ink text-paper")}>
        {String(index).padStart(2, "0")}
      </span>
      <span aria-hidden className={cn("h-px w-6", tone === "night" ? "bg-on-night/25" : "bg-ink/25")} />
      {children}
    </p>
  );
}

/** A slow tape of what was just listed. Decorative; the same homes are linked in the table below. */
export function Ticker({ properties }: { properties: readonly PropertySummary[] }) {
  if (properties.length === 0) return null;
  const run = (
    <span className="flex shrink-0 items-center">
      {properties.map((p) => (
        <span key={p.id} className="flex items-center gap-4 px-6">
          <span className="rounded-[0.2rem] bg-accent px-1.5 py-0.5 text-ink">{p.listingType === "rent" ? "LEASE" : "SALE"}</span>
          <span className="text-on-night">{p.title}</span>
          <span className="text-accent">{formatListingPrice(p.pricePhp, p.listingType, "compact")}</span>
          <span className="text-on-night-muted">{p.city.toUpperCase()}</span>
          <Asterisk className="ml-2 size-3 text-on-night-muted/60" />
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden className="group overflow-hidden border-y border-ink bg-ink py-3 font-mono text-[0.8125rem]">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {run}
        {run}
      </div>
    </div>
  );
}

export function FeaturedCollection({ properties, total }: { properties: readonly PropertySummary[]; total: number }) {
  if (properties.length === 0) return null;
  return (
    <section aria-label="Featured homes" className="py-20 md:py-28">
      <Container width="wide" className="flex flex-col gap-10 md:gap-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Kicker index={1}>Featured this week</Kicker>
            <SplitHeading as="h2" text="Fresh picks from our *agents*." className="max-w-[18ch] text-display-2" />
          </div>
          <div className="flex items-center gap-5">
            <p className="font-mono text-[0.75rem] text-ink-muted">
              Showing <span className="tabular text-ink">{properties.length}</span> of <span className="tabular text-ink">{total}</span> homes
            </p>
            <ButtonLink href="/properties" variant="secondary" icon="arrow-right">
              See all
            </ButtonLink>
          </div>
        </div>
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {properties.map((property, i) => (
            <Reveal as="li" key={property.id} index={i} className="h-full">
              <SaveableCard property={property} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function RecentLedger({ properties }: { properties: readonly PropertySummary[] }) {
  if (properties.length === 0) return null;
  const head = "font-mono text-[0.6875rem] font-medium uppercase text-ink-muted";
  return (
    <section aria-labelledby="recent-heading" className="pb-20 md:pb-28">
      <Container width="wide" className="flex flex-col gap-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5">
            <Kicker index={3}>Just listed</Kicker>
            <h2 id="recent-heading" className="text-display-3">
              New on the <em>board</em>.
            </h2>
          </div>
          <p className="max-w-[36ch] text-small text-ink-soft">Sorted newest first, straight from the agents who published them.</p>
        </div>
        <div className="overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink/10">
          <div aria-hidden className="hidden grid-cols-[3rem_5rem_minmax(0,1fr)_8rem_7rem_9rem_3rem] items-center gap-5 border-b border-ink/10 bg-paper-sunken/60 px-5 py-3 md:grid">
            <span className={head}>#</span>
            <span className={head}>Photo</span>
            <span className={head}>Home</span>
            <span className={head}>Type</span>
            <span className={head}>Size</span>
            <span className={cn(head, "text-right")}>Price</span>
            <span />
          </div>
          <ol>
            {properties.map((property, i) => (
              <li key={property.id} className="border-b border-ink/10 last:border-b-0">
                <Link
                  href={`/properties/${property.slug}`}
                  className="group grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 outline-none transition-colors duration-300 ease-settle hover:bg-sky-soft focus-visible:bg-sky-soft md:grid-cols-[3rem_5rem_minmax(0,1fr)_8rem_7rem_9rem_3rem] md:gap-5 md:px-5"
                >
                  <span aria-hidden className="tabular hidden font-mono text-[0.75rem] text-ink-muted md:block">
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span className="relative row-span-2 aspect-[4/3] overflow-hidden rounded-[0.25rem] bg-paper-sunken md:row-span-1">
                    {property.coverImage && <Image src={property.coverImage.url} alt="" fill sizes="80px" className="object-cover" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-ink">{property.title}</span>
                    <span className="truncate text-small text-ink-muted">{formatLocation(property)}</span>
                  </span>
                  <span className="hidden font-mono text-[0.75rem] uppercase text-ink-soft md:block">{PROPERTY_TYPE_LABEL[property.propertyType]}</span>
                  <span className="tabular hidden font-mono text-[0.75rem] text-ink-soft md:block">{formatArea(property.floorAreaSqm)}</span>
                  <span className="col-start-2 md:col-start-auto md:text-right">
                    <Price amount={property.pricePhp} listingType={property.listingType} style="compact" size="sm" />
                  </span>
                  <span
                    aria-hidden
                    className="col-start-3 row-span-2 row-start-1 grid size-9 place-items-center rounded-md text-ink ring-1 ring-inset ring-ink/20 transition-colors duration-300 ease-settle group-hover:bg-ink group-hover:text-paper md:col-start-auto md:row-span-1 md:row-start-auto"
                  >
                    <ArrowUpRight size={15} weight="bold" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

export function MarketFigures({ stats }: { stats: MarketStats }) {
  const figures = [
    { value: stats.listingCount, format: "integer" as const, label: "Homes live", note: "Each one visited by its agent before it went up." },
    { value: stats.cityCount, format: "integer" as const, label: "Places", note: "From the Makati villages to the Siargao coast." },
    { value: stats.medianPricePhp, format: "php-compact" as const, label: "Median asking price", note: "For homes offered for sale, in pesos." },
  ];
  return (
    <section aria-label="The market in figures" className="pb-20 md:pb-28">
      <Container width="wide">
        <div className="grid overflow-hidden rounded-panel ring-1 ring-ink lg:grid-cols-12">
          <div className="bg-grid-night relative flex flex-col justify-between gap-10 bg-ink p-6 text-on-night md:p-10 lg:col-span-6">
            <Kicker index={4} tone="night">
              By the numbers
            </Kicker>
            <AsciiPlan />
          </div>
          <div className="flex flex-col bg-paper-raised lg:col-span-6">
            <div className="flex flex-col gap-3 border-b border-ink/10 p-6 md:p-10">
              <h2 className="max-w-[16ch] text-display-3">
                The market, <em>counted</em> honestly.
              </h2>
              <p className="max-w-[44ch] text-small text-ink-soft">Live from the listings on this site. Nothing rounded up for the brochure.</p>
            </div>
            <dl className="grid flex-1 divide-y divide-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {figures.map((figure, i) => (
                <Reveal key={figure.label} index={i} className="flex flex-col justify-between gap-6 p-6 md:p-8">
                  <dt className="order-2 flex flex-col gap-1.5">
                    <span className="font-mono text-[0.75rem] uppercase text-ink">{figure.label}</span>
                    <span className="text-small text-ink-muted">{figure.note}</span>
                  </dt>
                  <dd className="condensed order-1 font-display text-[clamp(3rem,2rem+3vw,5rem)] font-bold leading-[0.85] tracking-[-0.03em]">
                    <CountUp value={figure.value} format={figure.format} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}

const STEPS = [
  { icon: MagnifyingGlass, title: "Filter like you mean it", body: "Buy or lease, place, price band, bedrooms. The count updates as you go, so you never hit a dead end." },
  { icon: ChatCircleText, title: "Message the actual agent", body: "Your note goes to the person who walked the house, not a call centre. Most reply within the day." },
  { icon: Key, title: "Visit, then decide", body: "Pick a viewing date in the form. Bring the family, open the cabinets, check the water pressure." },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-sky-soft py-20 md:py-28">
      <Container width="wide" className="flex flex-col gap-10 md:gap-14">
        <div className="flex flex-col gap-5">
          <Kicker index={5}>How it works</Kicker>
          <h2 id="how-heading" className="max-w-[18ch] text-display-2">
            Three steps. No <em>runaround</em>.
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} index={i} className="flex flex-col gap-10 rounded-panel bg-paper-raised p-6 ring-1 ring-ink/10 md:p-8">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-md bg-accent text-ink">
                  <step.icon aria-hidden size={24} weight="bold" />
                </span>
                <span className="condensed font-display text-[3.5rem] font-bold leading-none text-ink/10">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-heading">{step.title}</h3>
                <p className="text-body text-ink-soft">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function AgentInvitation({ photo }: { photo: Photo }) {
  return (
    <section aria-labelledby="agents-heading" className="py-20 md:py-28">
      <Container width="wide">
        <div className="grid overflow-hidden rounded-panel bg-accent text-ink lg:grid-cols-12">
          <div className="flex flex-col justify-between gap-10 p-6 sm:p-10 lg:col-span-7 lg:p-14">
            <p className="flex items-center gap-3 font-mono text-[0.75rem] uppercase">
              <HouseLine aria-hidden size={18} weight="bold" />
              For agents and owners
            </p>
            <h2 id="agents-heading" className="max-w-[12ch] text-[clamp(2.75rem,1.4rem+4.4vw,6rem)] leading-[0.92] tracking-[-0.045em] [--em-mark:var(--color-paper)]">
              Got a place? <em>List</em> it here.
            </h2>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-[40ch] text-body text-ink">
                Licensed brokers can list after a short review. We ask for honest photos, a full price, and a reply within a day.
                That&apos;s the whole deal.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/signup?role=agent" size="lg" icon="arrow-up-right">
                  Apply to list
                </ButtonLink>
              </div>
            </div>
          </div>
          <DitherImage
            src={photoUrl(photo, 1400)}
            alt={photo.alt}
            sizes="(min-width: 1024px) 40vw, 100vw"
            reveal="always"
            ink="#151411"
            paper="#ff5a1f"
            cell={3}
            contrast={1.4}
            className="min-h-[18rem] lg:col-span-5"
          />
        </div>
      </Container>
    </section>
  );
}
