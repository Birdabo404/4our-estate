import type { ListingType } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { formatListingPrice, formatPhp, PRICE_SUFFIX, type PriceStyle } from "@/lib/format";

export type PriceSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<PriceSize, string> = {
  sm: "text-[1.125rem]",
  md: "text-[1.625rem]",
  lg: "text-[2.25rem]",
  xl: "text-[clamp(2.5rem,1.6rem+2.6vw,4rem)]",
};

/**
 * A bold figure with the peso sign set slightly smaller, and the rent
 * cadence in mono so `/mo` reads as a unit rather than part of the number.
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
    <span className={cn("tabular font-display font-semibold leading-none tracking-[-0.03em]", SIZE[size], className)}>
      <span className="sr-only">{formatListingPrice(amount, listingType, style)}</span>
      <span aria-hidden className="inline-flex items-baseline">
        <span className="mr-[0.04em] text-[0.78em] font-medium">₱</span>
        {figure}
        {suffix && <span className="ml-1 font-mono text-[0.45em] font-normal tracking-normal text-ink-muted">{suffix}</span>}
      </span>
    </span>
  );
}
