"use client";

import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Wordmark } from "@/components/motion/wordmark";
import { Eyebrow } from "@/components/ui/eyebrow";
import { StatusPill } from "@/components/ui/status-pill";
import type { PropertySummary, PropertyType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatLocation, propertyFacts } from "@/lib/format";
import { duration, ease, spring } from "@/lib/motion";
import { Price, type PriceSize } from "./price";

export type PropertyCardVariant = "grid" | "feature" | "compact";

const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  house: "House",
  condominium: "Condominium",
  townhouse: "Townhouse",
  villa: "Villa",
  penthouse: "Penthouse",
  lot: "Lot",
};

const VARIANT: Record<
  PropertyCardVariant,
  { root: string; media: string; body: string; title: string; sizes: string; price: PriceSize; detail: boolean }
> = {
  grid: {
    root: "flex flex-col gap-6",
    media: "aspect-[4/5]",
    body: "flex flex-col gap-3",
    title: "text-title",
    sizes: "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw",
    price: "md",
    detail: true,
  },
  feature: {
    root: "grid gap-8 md:grid-cols-12 md:items-end md:gap-10",
    media: "aspect-[4/3] md:col-span-8 md:aspect-[16/10]",
    body: "flex flex-col gap-4 md:col-span-4 md:pb-2",
    title: "text-heading",
    sizes: "(min-width: 768px) 66vw, 100vw",
    price: "lg",
    detail: true,
  },
  compact: {
    root: "grid grid-cols-[6.5rem_1fr] items-center gap-5",
    media: "aspect-square",
    body: "flex min-w-0 flex-col gap-1.5",
    title: "text-[1.0625rem] leading-snug [--opsz:18]",
    sizes: "104px",
    price: "sm",
    detail: false,
  },
};

const card: Variants = { rest: {}, active: {} };
const media: Variants = {
  rest: { scale: 1 },
  active: { scale: 1.045, transition: { duration: duration.cinematic, ease: ease.settle } },
};
const detail: Variants = {
  rest: { opacity: 0, y: 10 },
  active: { opacity: 1, y: 0, transition: spring.ui },
};
const arrow: Variants = {
  rest: { x: 0, y: 0 },
  active: { x: 3, y: -3, transition: spring.ui },
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
  const facts = propertyFacts(property);
  const typeLabel = `${PROPERTY_TYPE_LABEL[property.propertyType]} · For ${property.listingType === "rent" ? "lease" : "sale"}`;

  return (
    <motion.article
      initial="rest"
      animate={focused ? "active" : "rest"}
      whileHover="active"
      variants={card}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn("group relative", spec.root, className)}
    >
      <div className={cn("relative isolate overflow-hidden rounded-photo bg-paper-sunken", spec.media)}>
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

        {variant !== "compact" && (
          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {property.status !== "published" && <StatusPill kind="listing" status={property.status} className="bg-paper-raised" />}
              {property.featured && property.status === "published" && <Eyebrow tone="image">Featured</Eyebrow>}
            </div>
            {action && <div className="relative z-10">{action}</div>}
          </div>
        )}

        {spec.detail && (
          <motion.div
            aria-hidden
            variants={detail}
            className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-paper py-1.5 pl-5 pr-1.5 text-small text-ink shadow-float"
          >
            <span>View residence</span>
            <span className="grid size-8 place-items-center rounded-full bg-ink text-paper">
              <motion.span variants={arrow}>
                <ArrowUpRight size={14} weight="light" />
              </motion.span>
            </span>
          </motion.div>
        )}
      </div>

      <div className={spec.body}>
        {variant !== "compact" && <p className="text-micro font-medium uppercase text-ink-muted">{typeLabel}</p>}
        <h3 className={cn("font-display text-balance", spec.title)}>
          <Link href={href} className="outline-none focus-visible:shadow-none after:absolute after:inset-0 after:rounded-photo after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent">
            {property.title}
          </Link>
        </h3>
        <p className="text-small text-ink-muted">{formatLocation(property)}</p>
        <div
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2",
            variant === "compact" ? "mt-0.5" : "mt-2 border-t border-ink/10 pt-4",
          )}
        >
          <Price amount={property.pricePhp} listingType={property.listingType} size={spec.price} style={variant === "compact" ? "compact" : "full"} />
          {variant !== "compact" && (
            <ul className="flex gap-3 text-small text-ink-soft">
              {facts.map((fact, i) => (
                <li key={fact} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden className="size-0.5 rounded-full bg-ink-muted" />}
                  {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
        {variant === "compact" && <p className="text-[0.8125rem] text-ink-muted">{facts.join(" · ")}</p>}
      </div>
    </motion.article>
  );
}
