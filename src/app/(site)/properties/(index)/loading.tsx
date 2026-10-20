import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <div className="pb-28 pt-32 md:pb-40 md:pt-44" aria-busy>
      <Container width="wide">
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col gap-7 md:col-span-8">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-[clamp(2.75rem,1.4rem+4.2vw,5.5rem)] w-4/5 max-w-3xl" />
          </div>
          <div className="flex flex-col gap-2.5 md:col-span-4 md:pb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-12 h-[4.5rem] rounded-full md:mt-16" />
        <div className="mt-10 flex items-center justify-between md:mt-12">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <div className="mt-12 flex flex-col gap-20 md:mt-16 md:gap-28">
          <PropertyCardSkeleton variant="feature" />
          <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 md:gap-x-10 md:gap-y-24 xl:grid-cols-3">
            <PropertyCardSkeleton />
            <PropertyCardSkeleton className="xl:mt-28" />
            <PropertyCardSkeleton />
          </div>
        </div>
      </Container>
    </div>
  );
}
