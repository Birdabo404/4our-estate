"use client";

import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react/ssr";
import { useEffect, useId, useState } from "react";
import { SegmentedControl } from "@/components/ui/field";
import { LISTING_SORTS, type ListingType, PROPERTY_TYPES, type PropertyType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { useListingFilters } from "./filter-state";
import {
  MIN_BEDS_OPTIONS,
  parsePriceKey,
  PRICE_PRESETS,
  priceKey,
  priceLabel,
  PROPERTY_TYPE_OPTIONS,
  SORT_OPTIONS,
} from "./filters";

export type SelectSpec = {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value);
}

export function useSelectControls(): SelectSpec[] {
  const { filters, cities, update } = useListingFilters();
  const listingType = filters.listingType;
  const current = { min: filters.minPrice, max: filters.maxPrice };
  const presets = listingType ? PRICE_PRESETS[listingType] : [];
  const currentKey = priceKey(current);
  const priceOptions = [
    { value: ":", label: listingType ? "Any price" : "Buy or lease first" },
    ...presets.map((preset) => ({ value: priceKey(preset), label: priceLabel(preset, listingType) })),
  ];
  if (!priceOptions.some((option) => option.value === currentKey)) {
    priceOptions.push({ value: currentKey, label: priceLabel(current, listingType) });
  }

  return [
    {
      id: "propertyType",
      label: "Type",
      value: filters.propertyType ?? "",
      options: [{ value: "", label: "Any type" }, ...PROPERTY_TYPE_OPTIONS],
      onChange: (value) => update({ propertyType: isPropertyType(value) ? value : undefined }),
    },
    {
      id: "city",
      label: "Place",
      value: filters.city ?? "",
      options: [
        { value: "", label: "Anywhere" },
        ...cities.map((city) => ({ value: city.name, label: `${city.name} (${city.count})` })),
      ],
      onChange: (value) => update({ city: value || undefined }),
    },
    {
      id: "price",
      label: listingType === "rent" ? "Monthly rent" : "Price",
      value: currentKey,
      options: priceOptions,
      disabled: !listingType && currentKey === ":",
      onChange: (value) => {
        const { min, max } = parsePriceKey(value);
        update({ minPrice: min, maxPrice: max });
      },
    },
    {
      id: "minBeds",
      label: "Bedrooms",
      value: filters.minBeds ? String(filters.minBeds) : "",
      options: [{ value: "", label: "Any" }, ...MIN_BEDS_OPTIONS.map((n) => ({ value: String(n), label: `${n}+` }))],
      onChange: (value) => update({ minBeds: value ? Number(value) : undefined }),
    },
  ];
}

const LISTING_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "sale", label: "Buy" },
  { value: "rent", label: "Lease" },
] as const;

type ListingTypeChoice = (typeof LISTING_TYPE_OPTIONS)[number]["value"];

export function ListingTypeControl({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  const { filters, update } = useListingFilters();
  return (
    <SegmentedControl<ListingTypeChoice>
      name="listingType"
      aria-label="Listing type"
      size={size}
      options={LISTING_TYPE_OPTIONS}
      value={filters.listingType ?? "all"}
      onValueChange={(value) => update({ listingType: value === "all" ? undefined : (value satisfies ListingType) })}
      className={className}
    />
  );
}

const KEYWORD_DEBOUNCE_MS = 400;

export function KeywordSearch({ className, inputClassName }: { className?: string; inputClassName?: string }) {
  const { filters, update } = useListingFilters();
  const id = useId();
  const committed = filters.q ?? "";
  const [draft, setDraft] = useState(committed);
  const [focused, setFocused] = useState(false);
  const [seen, setSeen] = useState(committed);

  if (seen !== committed) {
    setSeen(committed);
    if (!focused) setDraft(committed);
  }

  useEffect(() => {
    const next = draft.trim();
    if (next === committed) return;
    const timer = window.setTimeout(() => update({ q: next || undefined }), KEYWORD_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, committed, update]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        update({ q: draft.trim() || undefined });
      }}
      className={cn("relative flex items-center", className)}
    >
      <label htmlFor={id} className="sr-only">
        Search residences
      </label>
      <MagnifyingGlass aria-hidden size={18} weight="regular" className="pointer-events-none absolute left-4 text-ink-muted" />
      <input
        id={id}
        name="q"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Place or residence"
        autoComplete="off"
        enterKeyHint="search"
        className={cn(
          "h-12 w-full rounded-full bg-transparent pl-11 pr-10 text-small text-ink placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden",
          "focus-visible:shadow-none focus-visible:outline-none",
          inputClassName,
        )}
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            update({ q: undefined });
          }}
          className="absolute right-2 grid size-8 place-items-center rounded-full text-ink-muted transition-colors duration-300 ease-settle hover:bg-ink/5 hover:text-ink"
        >
          <X size={13} weight="regular" />
        </button>
      )}
    </form>
  );
}

/** A label-over-value select for the filter bar: the micro caption names it, the value reads at body size. */
export function QuietSelect({ spec, className }: { spec: SelectSpec; className?: string }) {
  const id = useId();
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-center rounded-full px-5 py-1.5 transition-colors duration-300 ease-settle",
        "has-[:focus-visible]:bg-ink/[0.04] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-ink",
        spec.disabled ? "opacity-55" : "hover:bg-ink/[0.035]",
        className,
      )}
    >
      <label htmlFor={id} className="text-[0.625rem] font-medium uppercase leading-4 tracking-[0.22em] text-ink-muted">
        {spec.label}
      </label>
      <select
        id={id}
        value={spec.value}
        disabled={spec.disabled}
        onChange={(event) => spec.onChange(event.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-5 text-small text-ink focus-visible:shadow-none focus-visible:outline-none disabled:cursor-not-allowed"
      >
        {spec.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown aria-hidden size={12} weight="regular" className="pointer-events-none absolute bottom-3 right-5 text-ink-muted" />
    </div>
  );
}

export function SortSelect({ className }: { className?: string }) {
  const { filters, update } = useListingFilters();
  const id = useId();
  return (
    <div className={cn("relative flex items-center gap-3", className)}>
      <label htmlFor={id} className="text-micro font-medium uppercase text-ink-muted">
        Sort
      </label>
      <select
        id={id}
        value={filters.sort}
        onChange={(event) => {
          const sort = LISTING_SORTS.find((value) => value === event.target.value);
          if (sort) update({ sort });
        }}
        className="h-10 cursor-pointer appearance-none rounded-full bg-transparent pl-4 pr-9 text-small text-ink ring-1 ring-inset ring-ink/12 transition-[box-shadow] duration-300 ease-settle hover:ring-ink/25"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown aria-hidden size={12} weight="regular" className="pointer-events-none absolute right-4 text-ink-muted" />
    </div>
  );
}
