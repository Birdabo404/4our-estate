import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <div aria-busy>
      <section className="bg-sky pb-20 pt-[calc(var(--nav-height)+2.5rem)] md:pb-24 md:pt-[calc(var(--nav-height)+4rem)]">
        <Container width="wide">
          <Skeleton className="h-4 w-56 bg-white/60" />
          <div className="mt-6 grid items-end gap-8 md:grid-cols-12 md:gap-10">
            <Skeleton className="h-[clamp(2.5rem,1.4rem+4vw,4.5rem)] w-4/5 max-w-3xl bg-white/60 md:col-span-7" />
            <div className="flex flex-col gap-2.5 md:col-span-5 md:pb-2">
              <Skeleton className="h-4 w-full bg-white/60" />
              <Skeleton className="h-4 w-2/3 bg-white/60" />
            </div>
          </div>
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-24 bg-white/60" />
            ))}
          </div>
        </Container>
      </section>
      <Container width="wide" className="-mt-9 pb-28 md:pb-40">
        <div className="h-[3.75rem] rounded-panel bg-night" />
        <div className="mt-10 flex items-center justify-between md:mt-12">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="mt-8 flex flex-col gap-6 md:mt-10 md:gap-8">
          <PropertyCardSkeleton variant="feature" />
          <div className="grid gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </div>
        </div>
      </Container>
    </div>
  );
}
