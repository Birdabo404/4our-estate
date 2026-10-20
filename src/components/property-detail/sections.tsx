import { ArrowUpRight, Phone } from "@phosphor-icons/react/ssr";
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

/** A numbered chapter rule: `02 · Residence`, then the heading. */
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
    <section aria-labelledby={id} className={cn("flex flex-col gap-10 border-t border-ink/10 pt-10 md:gap-12 md:pt-12", className)}>
      <Reveal as="header" distance={24} className="flex flex-col gap-4">
        <p className="flex items-center gap-3 text-micro uppercase text-ink-muted">
          <span className="tabular text-accent">{String(index).padStart(2, "0")}</span>
          <span aria-hidden className="h-px w-8 bg-ink/15" />
          {label}
        </p>
        <h2 id={id} className="max-w-[22ch] font-display text-display-3 [--opsz:72]">
          {title}
        </h2>
      </Reveal>
      {children}
    </section>
  );
}

export function KeyFacts({ property, className }: { property: PropertyDetail; className?: string }) {
  const facts: Array<{ label: string; value: string }> =
    property.propertyType === "lot"
      ? [
          { label: "Lot area", value: formatArea(property.lotAreaSqm ?? property.floorAreaSqm) },
          { label: "Type", value: PROPERTY_TYPE_LABEL[property.propertyType] },
        ]
      : [
          { label: property.bedrooms === 1 ? "Bedroom" : "Bedrooms", value: property.bedrooms === 0 ? "Studio" : String(property.bedrooms) },
          { label: property.bathrooms === 1 ? "Bathroom" : "Bathrooms", value: String(property.bathrooms) },
          { label: "Floor area", value: formatArea(property.floorAreaSqm) },
          property.lotAreaSqm
            ? { label: "Lot area", value: formatArea(property.lotAreaSqm) }
            : { label: "Parking", value: String(property.parkingSlots) },
        ];
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4", className)}>
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col-reverse gap-1.5 bg-paper py-1 pr-4">
          <dt className="text-micro uppercase text-ink-muted">{fact.label}</dt>
          <dd className="tabular font-display text-[1.75rem] leading-none [--opsz:24]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Overview({ property }: { property: PropertyDetail }) {
  const { lead, body } = splitDescription(property.description);
  return (
    <div className="flex flex-col gap-8">
      <Reveal as="p" distance={24} className="max-w-[34ch] font-display text-[clamp(1.375rem,1.1rem+0.9vw,2rem)] leading-[1.32] text-ink [--opsz:36]">
        {lead}
      </Reveal>
      {body.map((paragraph, i) => (
        <Reveal
          as="p"
          key={i}
          index={i + 1}
          distance={16}
          className="max-w-[62ch] text-lead leading-relaxed text-ink-soft md:columns-2 md:gap-10 lg:columns-1 xl:columns-2"
        >
          {paragraph}
        </Reveal>
      ))}
    </div>
  );
}

export function Amenities({ amenities }: { amenities: readonly string[] }) {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2">
      {amenities.map((amenity, i) => (
        <Reveal as="li" key={amenity} index={i % 2} distance={12} className="flex items-baseline gap-4 border-b border-ink/10 py-4 text-body text-ink">
          <span aria-hidden className="tabular text-micro text-ink-muted">
            {String(i + 1).padStart(2, "0")}
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
    <dl className="grid gap-x-10 sm:grid-cols-2">
      {rows.map(([term, value]) => (
        <div key={term} className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-4">
          <dt className="text-small text-ink-muted">{term}</dt>
          <dd className="tabular text-right text-body text-ink">{value}</dd>
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

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="col-span-2 flex flex-col gap-1.5">
          <dt className="text-micro uppercase text-ink-muted">Address</dt>
          <dd className="text-lead text-ink">{property.address}</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-micro uppercase text-ink-muted">Neighborhood</dt>
          <dd className="text-body text-ink">{property.neighborhood}</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-micro uppercase text-ink-muted">City</dt>
          <dd className="text-body text-ink">{property.city}</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-micro uppercase text-ink-muted">Province</dt>
          <dd className="text-body text-ink">{property.province}</dd>
        </div>
        {hasPoint && (
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
            <dt className="text-micro uppercase text-ink-muted">Coordinates</dt>
            <dd className="tabular whitespace-nowrap text-body text-ink">
              {coordinate(latitude, "N", "S")}, {coordinate(longitude, "E", "W")}
            </dd>
          </div>
        )}
      </dl>
      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex items-center gap-3 self-start text-small text-ink md:self-end"
      >
        <span className="underline decoration-ink/25 underline-offset-[6px] transition-colors duration-300 ease-settle group-hover:decoration-ink">
          Open in Google Maps
        </span>
        <span className="grid size-9 place-items-center rounded-full ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle group-hover:bg-ink group-hover:text-paper">
          <ArrowUpRight aria-hidden size={14} weight="light" />
        </span>
        <span className="sr-only">(opens in a new tab)</span>
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
      <span className={cn("relative block shrink-0 overflow-hidden rounded-full bg-paper-sunken", box)}>
        <Image src={agent.avatarUrl} alt="" fill sizes={size === "lg" ? "80px" : "48px"} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-night font-display text-on-night [--opsz:24]",
        box,
        size === "lg" ? "text-[1.75rem]" : "text-[1.125rem]",
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
        <p className="truncate text-body text-ink">{agent.fullName}</p>
        <p className="truncate text-small text-ink-muted">
          {[agent.agency, agent.licenseNo].filter(Boolean).join(" · ")}
        </p>
      </div>
      {agent.phone && (
        <a
          href={telHref(agent.phone)}
          aria-label={`Call ${agent.fullName} on ${agent.phone}`}
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
        >
          <Phone aria-hidden size={16} weight="light" />
        </a>
      )}
    </div>
  );
}

export function AgentProfileBlock({ agent }: { agent: AgentProfile }) {
  return (
    <div className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
      <AgentAvatar agent={agent} size="lg" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-heading">{agent.fullName}</p>
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
    <div className="grid gap-8 md:grid-cols-3 md:gap-10">
      {[
        { label: "Monthly rent", value: formatPhp(property.pricePhp), note: "Payable by post-dated cheques, as is customary." },
        { label: "Typical deposit", value: formatPhp(deposit), note: "Two months, returned at the end of the lease." },
        { label: "Advance", value: formatPhp(property.pricePhp), note: "One month on signing. Terms are set with the owner." },
      ].map((item, i) => (
        <Reveal key={item.label} index={i} distance={16} className="flex flex-col gap-3 border-t border-ink/10 pt-5">
          <p className="text-micro uppercase text-ink-muted">{item.label}</p>
          <p className="tabular font-display text-[1.75rem] leading-none [--opsz:24]">{item.value}</p>
          <p className="text-small text-ink-soft">{item.note}</p>
        </Reveal>
      ))}
    </div>
  );
}
