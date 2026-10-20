import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-14 w-2/3 max-w-md" />
        <Skeleton className="h-6 w-1/2 max-w-sm" />
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <Skeleton className="aspect-[4/5]" />
        <Skeleton className="aspect-[4/5]" />
      </div>
    </div>
  );
}
