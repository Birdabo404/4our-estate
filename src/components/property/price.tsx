import type { ListingType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatListingPrice, formatPhp, PRICE_SUFFIX, type PriceStyle } from "@/lib/format";

export type PriceSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<PriceSize, string> = {
  sm: "text-[1.125rem]",
  md: "text-[1.5rem]",
  lg: "text-[2.25rem]",
  xl: "text-[clamp(2.5rem,1.6rem+2.6vw,4rem)]",
};

/**
 * Typographic price: a set-down peso sign, Bodoni figures, and the rent
 * cadence in small sans so `/mo` reads as a unit, not part of the number.
 */
export function Price({
  amount,
  listingType,
  style = "full",
  size = "md",
  className,
}: {
  amount: number;
  listingType: ListingType;
  style?: PriceStyle;
  size?: PriceSize;
  className?: string;
}) {
  const figure = formatPhp(amount, style).replace("₱", "");
  const suffix = PRICE_SUFFIX[listingType];
  return (
    <span className={cn("font-display leading-none tracking-[-0.01em] [--opsz:24]", SIZE[size], className)}>
      <span className="sr-only">{formatListingPrice(amount, listingType, style)}</span>
      <span aria-hidden className="inline-flex items-baseline">
        <span className="mr-[0.06em] text-[0.7em]">₱</span>
        {figure}
        {suffix && <span className="ml-1.5 font-sans text-[0.5em] tracking-[0.04em] opacity-70">{suffix}</span>}
      </span>
    </span>
  );
}
