import { cn } from "@/lib/cn";

/** A sunken well with a slow light sweep. The sweep is a transform, never a background-position. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden rounded-photo bg-paper-sunken", className)}>
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.45),transparent)]" />
    </div>
  );
}
