import { ArrowUpRight, Check, Phone } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import type { ReactNode } from "react";
import { LISTING_TYPE_LABEL, PROPERTY_TYPE_LABEL } from "@/components/listings/filters";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import type { AgentProfile, PropertyDetail } from "@/lib/domain/types";
import { formatArea, formatPhp } from "@/lib/format";
import { splitDescription } from "./photo-meta";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

/** A numbered chapter: a mono index chip and label, then the heading. */
export function Chapter({
  id,
  index,
  label,
  title,
  children,
  className,
}: {
  id: string;
  index: number;
  label: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex scroll-mt-28 flex-col gap-8 md:gap-10", className)}>
      <Reveal as="header" className="flex flex-col gap-4">
        <p className="flex items-center gap-3 text-micro uppercase text-ink-muted">
          <span className="tabular rounded-[0.25rem] bg-ink px-1.5 py-0.5 text-paper">{String(index).padStart(2, "0")}</span>
          <span aria-hidden className="h-px w-8 bg-ink/20" />
          {label}
        </p>
        <h2 id={id} className="max-w-[24ch] text-display-3">
          {title}
        </h2>
      </Reveal>
      {children}
    </section>
  );
}

export function KeyFacts({ property, className }: { property: PropertyDetail; className?: string }) {
  const facts: Array<{ label: string; value: string; unit?: string }> =
    property.propertyType === "lot"
      ? [
          { label: "Lot area", value: (property.lotAreaSqm ?? property.floorAreaSqm).toLocaleString("en-PH"), unit: "m²" },
          { label: "Type", value: PROPERTY_TYPE_LABEL[property.propertyType] },
        ]
      : [
          { label: property.bedrooms === 1 ? "Bedroom" : "Bedrooms", value: property.bedrooms === 0 ? "Studio" : String(property.bedrooms) },
          { label: property.bathrooms === 1 ? "Bathroom" : "Bathrooms", value: String(property.bathrooms) },
          { label: "Floor area", value: property.floorAreaSqm.toLocaleString("en-PH"), unit: "m²" },
          property.lotAreaSqm
            ? { label: "Lot area", value: property.lotAreaSqm.toLocaleString("en-PH"), unit: "m²" }
            : { label: "Parking", value: String(property.parkingSlots) },
        ];
  return (
    <dl
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink",
        facts.length > 2 && "sm:grid-cols-4",
        className,
      )}
    >
      {facts.map((fact, i) => (
        <div
          key={fact.label}
          className={cn(
            "flex flex-col-reverse justify-between gap-6 p-4 md:p-5",
            i % 2 === 1 && "border-l border-ink/15",
            i >= 2 && "border-t border-ink/15 sm:border-t-0",
            i === 2 && "sm:border-l",
          )}
        >
          <dt className="flex items-center justify-between gap-2 text-micro uppercase text-ink-muted">
            {fact.label}
            <span aria-hidden className="tabular text-ink-muted/70">
              {String(i + 1).padStart(2, "0")}
            </span>
          </dt>
          <dd className="condensed tabular font-display text-[clamp(2.5rem,1.8rem+2vw,3.75rem)] font-bold leading-[0.85] tracking-[-0.02em] text-ink">
            {fact.value}
            {fact.unit && <span className="ml-1 font-mono text-[0.35em] font-normal tracking-normal text-ink-muted">{fact.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Overview({ property }: { property: PropertyDetail }) {
  const { lead, body } = splitDescription(property.description);
  return (
    <div className="flex flex-col gap-8">
      <Reveal as="p" className="max-w-[36ch] font-display text-[clamp(1.375rem,1.15rem+0.7vw,1.875rem)] font-medium leading-[1.3] tracking-[-0.015em] text-ink">
        {lead}
      </Reveal>
      {body.map((paragraph, i) => (
        <Reveal
          as="p"
          key={i}
          index={i + 1}
          className="max-w-[64ch] text-body leading-relaxed text-ink-soft"
        >
          {paragraph}
        </Reveal>
      ))}
    </div>
  );
}

export function Amenities({ amenities }: { amenities: readonly string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {amenities.map((amenity, i) => (
        <Reveal
          as="li"
          key={amenity}
          index={i % 2}
          className="flex items-center gap-3 rounded-md bg-paper-raised px-3 py-3 text-body text-ink ring-1 ring-ink/10"
        >
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-[0.25rem] bg-accent text-ink">
            <Check size={14} weight="bold" />
          </span>
          {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
        </Reveal>
      ))}
    </ul>
  );
}

const LISTED = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "Asia/Manila" });

export function DetailsTable({ property }: { property: PropertyDetail }) {
  const rows: Array<[string, string]> = [
    ["Type", PROPERTY_TYPE_LABEL[property.propertyType]],
    ["Offered", property.status === "sold" ? "Sold" : LISTING_TYPE_LABEL[property.listingType]],
    ["Price", property.listingType === "rent" ? `${formatPhp(property.pricePhp)} a month` : formatPhp(property.pricePhp)],
    ["Floor area", formatArea(property.floorAreaSqm)],
  ];
  if (property.lotAreaSqm) rows.push(["Lot area", formatArea(property.lotAreaSqm)]);
  if (property.propertyType !== "lot") {
    rows.push(["Bedrooms", property.bedrooms === 0 ? "Studio" : String(property.bedrooms)], ["Bathrooms", String(property.bathrooms)]);
  }
  rows.push(["Parking", property.parkingSlots === 0 ? "None" : `${property.parkingSlots} ${property.parkingSlots === 1 ? "slot" : "slots"}`]);
  if (property.yearBuilt) rows.push(["Year built", String(property.yearBuilt)]);
  if (property.publishedAt) rows.push(["Listed", LISTED.format(new Date(property.publishedAt))]);

  return (
    <dl className="grid overflow-hidden rounded-panel bg-paper-raised px-5 ring-1 ring-ink/10 sm:grid-cols-2 sm:gap-x-10 md:px-6">
      {rows.map(([term, value]) => (
        <div key={term} className="flex items-baseline justify-between gap-6 border-b border-dashed border-ink/15 py-3.5">
          <dt className="font-mono text-[0.75rem] uppercase tracking-[0.06em] text-ink-muted">{term}</dt>
          <dd className="tabular text-right text-body font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function coordinate(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

export function LocationBlock({ property }: { property: PropertyDetail }) {
  const { latitude, longitude } = property;
  const hasPoint = latitude !== null && longitude !== null;
  const query = hasPoint ? `${latitude},${longitude}` : `${property.address}, ${property.city}, ${property.province}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const place: Array<[string, string]> = [
    ["Neighborhood", property.neighborhood],
    ["City", property.city],
    ["Province", property.province],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col justify-between gap-8 rounded-panel bg-paper-raised p-5 ring-1 ring-ink/10 md:p-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-micro uppercase text-ink-muted">Address</p>
          <p className="text-lead font-semibold text-ink">{property.address}</p>
        </div>
        <dl className="grid grid-cols-3 gap-4">
          {place.map(([term, value]) => (
            <div key={term} className="flex flex-col gap-1">
              <dt className="text-micro uppercase text-ink-muted">{term}</dt>
              <dd className="text-small font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="group relative isolate flex min-h-[15rem] flex-col justify-between overflow-hidden rounded-panel bg-night p-5 text-on-night ring-1 ring-ink transition-[box-shadow] duration-300 ease-settle hover:shadow-block md:p-6"
      >
        <span aria-hidden className="bg-grid-night absolute inset-0 -z-10" />
        <span aria-hidden className="absolute left-1/2 top-0 -z-10 h-full w-px bg-sky/25" />
        <span aria-hidden className="absolute left-0 top-1/2 -z-10 h-px w-full bg-sky/25" />
        <span aria-hidden className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute -inset-5 animate-ping rounded-full bg-accent/25 [animation-duration:2.4s]" />
          <span className="relative block size-3.5 rounded-[0.2rem] bg-accent ring-4 ring-night" />
        </span>
        <span className="flex items-start justify-between gap-4 font-mono text-[0.6875rem] uppercase text-on-night-muted">
          <span>{property.city} / {property.province}</span>
          <span className="tabular text-right">
            {hasPoint ? (
              <>
                {coordinate(latitude, "N", "S")}
                <br />
                {coordinate(longitude, "E", "W")}
              </>
            ) : (
              "pin pending"
            )}
          </span>
        </span>
        <span className="flex items-center justify-between gap-3 text-small font-semibold">
          Open in Google Maps
          <span className="grid size-9 place-items-center rounded-md bg-accent text-ink transition-transform duration-300 ease-settle group-hover:rotate-45">
            <ArrowUpRight aria-hidden size={16} weight="bold" />
          </span>
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </a>
    </div>
  );
}

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AgentAvatar({ agent, size = "md" }: { agent: AgentProfile; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-20" : "size-12";
  if (agent.avatarUrl) {
    return (
      <span className={cn("relative block shrink-0 overflow-hidden rounded-md bg-paper-sunken", box)}>
        <Image src={agent.avatarUrl} alt="" fill sizes={size === "lg" ? "80px" : "48px"} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-night font-mono font-semibold text-accent",
        box,
        size === "lg" ? "text-[1.5rem]" : "text-[1rem]",
      )}
    >
      {initials(agent.fullName)}
    </span>
  );
}

export function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <div className="flex items-center gap-4">
      <AgentAvatar agent={agent} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body font-semibold text-ink">{agent.fullName}</p>
        <p className="truncate text-small text-ink-muted">
          {[agent.agency, agent.licenseNo].filter(Boolean).join(" · ")}
        </p>
      </div>
      {agent.phone && (
        <a
          href={telHref(agent.phone)}
          aria-label={`Call ${agent.fullName} on ${agent.phone}`}
          className="grid size-10 shrink-0 place-items-center rounded-md text-ink ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
        >
          <Phone aria-hidden size={16} weight="bold" />
        </a>
      )}
    </div>
  );
}

export function AgentProfileBlock({ agent }: { agent: AgentProfile }) {
  return (
    <div className="grid gap-6 rounded-panel bg-paper-raised p-5 ring-1 ring-ink/10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8 md:p-6">
      <AgentAvatar agent={agent} size="lg" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-heading font-semibold">{agent.fullName}</p>
          {agent.agency && <p className="text-body text-ink-soft">{agent.agency}</p>}
        </div>
        {agent.bio && <p className="max-w-[58ch] text-body leading-relaxed text-ink-soft">{agent.bio}</p>}
        <dl className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
          {agent.licenseNo && (
            <div className="flex flex-col gap-1">
              <dt className="text-micro uppercase text-ink-muted">PRC license</dt>
              <dd className="tabular text-body text-ink">{agent.licenseNo}</dd>
            </div>
          )}
          {agent.phone && (
            <div className="flex flex-col gap-1">
              <dt className="text-micro uppercase text-ink-muted">Direct line</dt>
              <dd>
                <a href={telHref(agent.phone)} className="tabular text-body text-ink underline decoration-ink/25 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-ink">
                  {agent.phone}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

export function LeaseNote({ property }: { property: PropertyDetail }) {
  const deposit = property.pricePhp * 2;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        { label: "Monthly rent", value: formatPhp(property.pricePhp), note: "Payable by post-dated cheques, as is customary." },
        { label: "Typical deposit", value: formatPhp(deposit), note: "Two months, returned at the end of the lease." },
        { label: "Advance", value: formatPhp(property.pricePhp), note: "One month on signing. Terms are set with the owner." },
      ].map((item, i) => (
        <Reveal key={item.label} index={i} className="flex flex-col gap-3 rounded-panel bg-paper-raised p-5 ring-1 ring-ink/10">
          <p className="text-micro uppercase text-ink-muted">{item.label}</p>
          <p className="tabular font-display text-[1.75rem] font-semibold leading-none tracking-[-0.02em]">{item.value}</p>
          <p className="text-small text-ink-soft">{item.note}</p>
        </Reveal>
      ))}
    </div>
  );
}
