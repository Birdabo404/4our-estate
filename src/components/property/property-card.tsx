"use client";

import type { Icon } from "@phosphor-icons/react";
import { ArrowUpRight, Bathtub, Bed, Ruler, Star } from "@phosphor-icons/react/ssr";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Wordmark } from "@/components/motion/wordmark";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatusPill } from "@/components/ui/status-pill";
import type { PropertySummary, PropertyType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatArea, formatLocation, formatPhp } from "@/lib/format";
import { duration, ease, spring } from "@/lib/motion";
import { Price, type PriceSize } from "./price";

export type PropertyCardVariant = "grid" | "feature" | "compact";

const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  house: "House",
  condominium: "Condo",
  townhouse: "Townhouse",
  villa: "Villa",
  penthouse: "Penthouse",
  lot: "Lot",
};

const VARIANT: Record<
  PropertyCardVariant,
  { root: string; media: string; body: string; title: string; sizes: string; price: PriceSize }
> = {
  grid: {
    root: "flex flex-col",
    media: "aspect-[4/3]",
    body: "flex flex-1 flex-col gap-2 p-5",
    title: "text-title",
    sizes: "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
    price: "md",
  },
  feature: {
    root: "grid md:grid-cols-12",
    media: "aspect-[4/3] md:col-span-7 md:aspect-auto md:min-h-[26rem]",
    body: "flex flex-col gap-3 p-6 md:col-span-5 md:p-10",
    title: "text-heading",
    sizes: "(min-width: 768px) 58vw, 100vw",
    price: "lg",
  },
  compact: {
    root: "grid grid-cols-[6.5rem_1fr] items-center gap-4 p-2",
    media: "aspect-square rounded-[0.25rem]",
    body: "flex min-w-0 flex-col gap-1 pr-2",
    title: "text-[1rem] leading-snug",
    sizes: "104px",
    price: "sm",
  },
};

type Fact = { icon: Icon; label: string; value: string };

function facts(p: PropertySummary): Fact[] {
  if (p.propertyType === "lot") {
    return [{ icon: Ruler, label: "Lot area", value: formatArea(p.lotAreaSqm ?? p.floorAreaSqm) }];
  }
  return [
    { icon: Ruler, label: "Floor area", value: formatArea(p.floorAreaSqm) },
    { icon: Bed, label: "Bedrooms", value: p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed` },
    { icon: Bathtub, label: "Bathrooms", value: `${p.bathrooms} bath` },
  ];
}

const LISTED = new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric", timeZone: "Asia/Manila" });

function specSheet(p: PropertySummary): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Offer", p.listingType === "rent" ? "Lease, monthly" : "Sale, freehold"],
    ["Province", p.province],
  ];
  if (p.lotAreaSqm && p.propertyType !== "lot") rows.push(["Lot", formatArea(p.lotAreaSqm)]);
  if (p.floorAreaSqm > 0 && p.propertyType !== "lot") {
    rows.push(["Per sqm", formatPhp(Math.round(p.pricePhp / p.floorAreaSqm), "compact")]);
  }
  if (p.publishedAt) rows.push(["Listed", LISTED.format(new Date(p.publishedAt))]);
  return rows;
}

const card: Variants = {
  rest: { boxShadow: "0px 0px 0 0 rgb(21 20 17)" },
  active: { boxShadow: "5px 5px 0 0 rgb(21 20 17)", transition: spring.ui },
};
const media: Variants = {
  rest: { scale: 1 },
  active: { scale: 1.04, transition: { duration: duration.slow, ease: ease.settle } },
};
const tile: Variants = {
  rest: { rotate: 0 },
  active: { rotate: 45, transition: spring.ui },
};

export function PropertyCard({
  property,
  variant = "grid",
  action,
  priority = false,
  className,
}: {
  property: PropertySummary;
  variant?: PropertyCardVariant;
  /** Rendered over the image, above the card link. The favorite toggle goes here. */
  action?: ReactNode;
  /** Preload the cover image. Use for the first row above the fold only. */
  priority?: boolean;
  className?: string;
}) {
  const spec = VARIANT[variant];
  const [focused, setFocused] = useState(false);
  const href = `/properties/${property.slug}`;
  const list = facts(property);
  const offer = property.listingType === "rent" ? "For lease" : "For sale";
  const compact = variant === "compact";

  return (
    <motion.article
      initial="rest"
      animate={focused ? "active" : "rest"}
      whileHover="active"
      variants={compact ? undefined : card}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        "group relative h-full overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink/10 transition-[box-shadow] duration-300 ease-settle hover:ring-ink",
        spec.root,
        className,
      )}
    >
      <div className={cn("relative isolate overflow-hidden bg-paper-sunken", spec.media)}>
        {property.coverImage ? (
          <motion.div variants={media} className="absolute inset-0">
            <Image
              src={property.coverImage.url}
              alt={property.coverImage.alt}
              fill
              sizes={spec.sizes}
              preload={priority}
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[2.5rem] text-ink/20">
            <Wordmark variant="monogram" label={false} />
          </div>
        )}

        {!compact && (
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {property.status !== "published" ? (
                <span className="inline-flex rounded-[0.25rem] bg-paper-raised">
                  <StatusPill kind="listing" status={property.status} />
                </span>
              ) : (
                <Eyebrow tone="image" dot={false}>
                  {offer}
                </Eyebrow>
              )}
              {property.featured && property.status === "published" && (
                <Eyebrow tone="accent" dot={false}>
                  <Star aria-hidden size={11} weight="fill" />
                  Featured
                </Eyebrow>
              )}
            </div>
            {action && <div className="relative z-10">{action}</div>}
          </div>
        )}
      </div>

      <div className={spec.body}>
        {!compact && (
          <p className="text-micro font-medium uppercase text-ink-muted">
            {PROPERTY_TYPE_LABEL[property.propertyType]} <span aria-hidden>/</span> {property.city}
          </p>
        )}
        <h3 className={cn("font-display font-semibold text-balance", spec.title)}>
          <Link
            href={href}
            className="outline-none focus-visible:shadow-none after:absolute after:inset-0 after:rounded-panel after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent-ink"
          >
            {property.title}
          </Link>
        </h3>
        <p className={cn("text-ink-muted", compact ? "truncate text-[0.8125rem]" : "text-small")}>{formatLocation(property)}</p>

        {compact ? (
          <div className="mt-0.5 flex items-baseline justify-between gap-3">
            <Price amount={property.pricePhp} listingType={property.listingType} size={spec.price} style="compact" />
            <span className="truncate font-mono text-[0.6875rem] text-ink-muted">{list.map((f) => f.value).join(" · ")}</span>
          </div>
        ) : (
          <>
            <ul className="mb-4 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.75rem] text-ink-soft">
              {list.map((fact) => (
                <li key={fact.label} className="flex items-center gap-1.5">
                  <fact.icon aria-hidden size={16} weight="regular" className="text-ink-muted" />
                  <span className="sr-only">{fact.label}: </span>
                  {fact.value}
                </li>
              ))}
            </ul>
            {variant === "feature" && (
              <dl className="mb-6 hidden divide-y divide-dashed divide-ink/15 border-y border-dashed border-ink/15 font-mono text-[0.75rem] md:block">
                {specSheet(property).map(([term, value]) => (
                  <div key={term} className="flex items-baseline justify-between gap-4 py-2">
                    <dt className="uppercase tracking-[0.06em] text-ink-muted">{term}</dt>
                    <dd className="tabular text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-auto flex items-end justify-between gap-4 border-t border-dashed border-ink/20 pt-4">
              <Price amount={property.pricePhp} listingType={property.listingType} size={spec.price} />
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-md bg-ink text-paper transition-colors duration-300 ease-settle group-hover:bg-accent group-hover:text-ink"
              >
                <motion.span variants={tile} className="grid place-items-center">
                  <ArrowUpRight size={18} weight="bold" />
                </motion.span>
              </span>
            </div>
          </>
        )}
      </div>
    </motion.article>
  );
}
