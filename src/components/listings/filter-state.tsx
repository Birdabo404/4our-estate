"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useOptimistic, useTransition } from "react";
import type { ListingFilters } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import type { CityCount } from "@/lib/data/types";
import { applyPatch, type FilterPatch, toQueryString } from "./filters";

type FilterApi = {
  filters: ListingFilters;
  total: number;
  cities: readonly CityCount[];
  pending: boolean;
  update: (patch: FilterPatch) => void;
};

const FilterContext = createContext<FilterApi | null>(null);

export function useListingFilters(): FilterApi {
  const api = useContext(FilterContext);
  if (!api) throw new Error("useListingFilters must be used inside <ListingFiltersProvider>");
  return api;
}

export function ListingFiltersProvider({
  filters,
  total,
  cities,
  children,
}: {
  filters: ListingFilters;
  total: number;
  cities: readonly CityCount[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(filters);

  const update = useCallback(
    (patch: FilterPatch) => {
      const next = applyPatch(shown, patch);
      startTransition(() => {
        setShown(next);
        router.replace(`${pathname}${toQueryString(next)}`, { scroll: false });
      });
    },
    [shown, setShown, router, pathname],
  );

  const api = useMemo(() => ({ filters: shown, total, cities, pending, update }), [shown, total, cities, pending, update]);
  return <FilterContext.Provider value={api}>{children}</FilterContext.Provider>;
}

/** Holds the previous results, dimmed, while the next set streams in. */
export function ResultsFrame({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useListingFilters();
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-500 ease-settle", pending && "pointer-events-none opacity-45", className)}
    >
      {children}
    </div>
  );
}
