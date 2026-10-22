import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-12 w-2/3 max-w-md" />
        <Skeleton className="h-5 w-1/2 max-w-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[10.5rem] rounded-panel" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-panel" />
        <Skeleton className="h-44 rounded-panel" />
      </div>
    </div>
  );
}
