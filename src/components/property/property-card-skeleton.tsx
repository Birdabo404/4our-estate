import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { PropertyCardVariant } from "./property-card";

const MEDIA: Record<PropertyCardVariant, string> = {
  grid: "aspect-[4/5]",
  feature: "aspect-[4/3] md:col-span-8 md:aspect-[16/10]",
  compact: "aspect-square",
};

const ROOT: Record<PropertyCardVariant, string> = {
  grid: "flex flex-col gap-6",
  feature: "grid gap-8 md:grid-cols-12 md:items-end md:gap-10",
  compact: "grid grid-cols-[6.5rem_1fr] items-center gap-5",
};

export function PropertyCardSkeleton({ variant = "grid", className }: { variant?: PropertyCardVariant; className?: string }) {
  return (
    <div role="status" aria-label="Loading residence" className={cn(ROOT[variant], className)}>
      <Skeleton className={MEDIA[variant]} />
      <div className={cn("flex flex-col gap-3", variant === "feature" && "md:col-span-4")}>
        {variant !== "compact" && <Skeleton className="h-3 w-28" />}
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <div className={cn("flex justify-between gap-6", variant !== "compact" && "mt-2 border-t border-ink/10 pt-4")}>
          <Skeleton className="h-6 w-32" />
          {variant !== "compact" && <Skeleton className="h-4 w-36" />}
        </div>
      </div>
    </div>
  );
}
