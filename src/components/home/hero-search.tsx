"use client";

import { CaretDown, MagnifyingGlass, MapPin } from "@phosphor-icons/react/ssr";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import {
  applyPatch,
  listingsHref,
  parsePriceKey,
  PRICE_PRESETS,
  priceKey,
  priceLabel,
  PROPERTY_TYPE_OPTIONS,
} from "@/components/listings/filters";
import type { CityCount } from "@/lib/data/types";
import { type ListingType, PROPERTY_TYPES, type PropertyType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

const TABS: ReadonlyArray<{ value: ListingType; label: string }> = [
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Lease" },
];

function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

function Slot({ label, htmlFor, icon, children, className }: { label: string; htmlFor: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-center gap-1 px-5 py-3 transition-colors duration-300 ease-settle hover:bg-ink/[0.03]",
        "has-[:focus-visible]:bg-sky-soft",
        className,
      )}
    >
      <label htmlFor={htmlFor} className="text-micro uppercase text-ink-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {children}
        {icon}
      </div>
    </div>
  );
}

const control =
  "w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-small font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted focus-visible:shadow-none focus-visible:outline-none";

/** The hero's search: one GET to the listings page with the same params the filter bar writes. */
export function HeroSearch({ cities, className }: { cities: readonly CityCount[]; className?: string }) {
  const router = useRouter();
  const id = useId();
  const [listingType, setListingType] = useState<ListingType>("sale");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState(":");
  const [q, setQ] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const { min, max } = parsePriceKey(price);
    router.push(
      listingsHref(
        applyPatch(
          { sort: "newest", page: 1 },
          {
            listingType,
            propertyType: isPropertyType(propertyType) ? propertyType : undefined,
            city: city || undefined,
            q: q.trim() || undefined,
            minPrice: min,
            maxPrice: max,
          },
        ),
      ),
    );
  }

  return (
    <form role="search" aria-label="Find a home" onSubmit={submit} className={cn("w-full", className)}>
      <div role="radiogroup" aria-label="Buy or lease" className="flex">
        {TABS.map((tab) => {
          const checked = tab.value === listingType;
          return (
            <label
              key={tab.value}
              className={cn(
                "cursor-pointer select-none px-5 py-2.5 font-mono text-[0.75rem] font-medium uppercase tracking-[0.08em] transition-colors duration-300 ease-settle first:rounded-tl-md last:rounded-tr-md",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-ink",
                checked ? "bg-ink text-paper" : "bg-paper-raised/80 text-ink-soft hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="listingType"
                value={tab.value}
                checked={checked}
                onChange={() => {
                  setListingType(tab.value);
                  setPrice(":");
                }}
                className="sr-only"
              />
              {tab.label}
            </label>
          );
        })}
      </div>
      <div className="grid rounded-b-md rounded-tr-md bg-paper-raised shadow-float ring-1 ring-ink/10 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.2fr_1.1fr_auto] lg:divide-x lg:divide-ink/10">
        <Slot label="Looking for" htmlFor={`${id}-type`} icon={<CaretDown aria-hidden size={14} className="shrink-0 text-ink-muted" />}>
          <select id={`${id}-type`} value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={control}>
            <option value="">Any home</option>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Slot>
        <Slot label="Location" htmlFor={`${id}-city`} icon={<MapPin aria-hidden size={16} className="shrink-0 text-ink-muted" />}>
          <select id={`${id}-city`} value={city} onChange={(e) => setCity(e.target.value)} className={control}>
            <option value="">Anywhere in the PH</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}, {c.province}
              </option>
            ))}
          </select>
        </Slot>
        <Slot label="Keyword" htmlFor={`${id}-q`}>
          <input
            id={`${id}-q`}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="pool, loft, near BGC…"
            autoComplete="off"
            className={cn(control, "cursor-text [&::-webkit-search-cancel-button]:hidden")}
          />
        </Slot>
        <Slot label={listingType === "rent" ? "Monthly rent" : "Price range"} htmlFor={`${id}-price`} icon={<CaretDown aria-hidden size={14} className="shrink-0 text-ink-muted" />}>
          <select id={`${id}-price`} value={price} onChange={(e) => setPrice(e.target.value)} className={control}>
            <option value=":">Any price</option>
            {PRICE_PRESETS[listingType].map((preset) => (
              <option key={priceKey(preset)} value={priceKey(preset)}>
                {priceLabel(preset, listingType)}
              </option>
            ))}
          </select>
        </Slot>
        <div className="p-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="flex h-full min-h-14 w-full items-center justify-center gap-3 rounded-md bg-accent px-6 font-semibold text-ink transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper lg:aspect-square lg:w-auto lg:px-0"
          >
            <MagnifyingGlass aria-hidden size={22} weight="bold" />
            <span className="lg:sr-only">Search homes</span>
          </button>
        </div>
      </div>
    </form>
  );
}
