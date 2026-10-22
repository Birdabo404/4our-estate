import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { PropertyCardVariant } from "./property-card";

const MEDIA: Record<PropertyCardVariant, string> = {
  grid: "aspect-[4/3] rounded-none",
  feature: "aspect-[4/3] rounded-none md:col-span-7 md:aspect-auto md:min-h-[26rem]",
  compact: "aspect-square",
};

const ROOT: Record<PropertyCardVariant, string> = {
  grid: "flex flex-col overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink/10",
  feature: "grid overflow-hidden rounded-panel bg-paper-raised ring-1 ring-ink/10 md:grid-cols-12",
  compact: "grid grid-cols-[6.5rem_1fr] items-center gap-5",
};

export function PropertyCardSkeleton({ variant = "grid", className }: { variant?: PropertyCardVariant; className?: string }) {
  return (
    <div role="status" aria-label="Loading home" className={cn(ROOT[variant], className)}>
      <Skeleton className={MEDIA[variant]} />
      <div
        className={cn(
          "flex flex-col gap-3",
          variant === "grid" && "p-5",
          variant === "feature" && "p-6 md:col-span-5 md:justify-end md:p-10",
        )}
      >
        {variant !== "compact" && <Skeleton className="h-3 w-28" />}
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <div className={cn("flex items-center justify-between gap-6", variant !== "compact" && "mt-2 border-t border-dashed border-ink/20 pt-4")}>
          <Skeleton className="h-7 w-36" />
          {variant !== "compact" && <Skeleton className="size-9" />}
        </div>
      </div>
    </div>
  );
}
