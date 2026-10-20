import type { ListingType, PropertySummary } from "@/lib/domain/types";

const PHP_FULL = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const PHP_COMPACT = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumSignificantDigits: 3,
});

const GROUPED = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 1 });

export const PRICE_SUFFIX: Record<ListingType, string> = {
  sale: "",
  rent: "/mo",
};

export type PriceStyle = "full" | "compact";

/** `₱48,500,000` in full, `₱48.5M` or `₱1.2B` compact. */
export function formatPhp(amount: number, style: PriceStyle = "full"): string {
  return (style === "compact" ? PHP_COMPACT : PHP_FULL).format(amount);
}

/** Price with the cadence its listing type implies: `₱285,000/mo` for rentals. */
export function formatListingPrice(
  amount: number,
  listingType: ListingType,
  style: PriceStyle = "full",
): string {
  return `${formatPhp(amount, style)}${PRICE_SUFFIX[listingType]}`;
}

export function formatArea(sqm: number): string {
  return `${GROUPED.format(sqm)} sqm`;
}

function plural(count: number, one: string, many: string): string {
  return `${GROUPED.format(count)} ${count === 1 ? one : many}`;
}

export function formatBeds(count: number): string {
  return count === 0 ? "Studio" : plural(count, "bed", "beds");
}

export function formatBaths(count: number): string {
  return plural(count, "bath", "baths");
}

/** `Rockwell, Makati`. */
export function formatLocation(p: Pick<PropertySummary, "neighborhood" | "city">): string {
  return p.neighborhood === p.city ? p.city : `${p.neighborhood}, ${p.city}`;
}

/**
 * The short facts line under a listing. Land has no rooms, so a lot reads as
 * its area alone instead of "Studio · 0 baths".
 */
export function propertyFacts(
  p: Pick<PropertySummary, "propertyType" | "bedrooms" | "bathrooms" | "floorAreaSqm" | "lotAreaSqm">,
): string[] {
  if (p.propertyType === "lot") {
    return [`Lot ${formatArea(p.lotAreaSqm ?? p.floorAreaSqm)}`];
  }
  return [formatBeds(p.bedrooms), formatBaths(p.bathrooms), formatArea(p.floorAreaSqm)];
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const RELATIVE_STEPS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** `3 days ago`, `yesterday`, `just now`. Pass `now` for deterministic output. */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const seconds = (new Date(iso).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) {
      return RELATIVE.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}
