"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState icon="error" title="This page did not load" action={<Button onClick={() => retry()}>Try again</Button>}>
      The desk is still here. Try the page once more.
    </EmptyState>
  );
}
