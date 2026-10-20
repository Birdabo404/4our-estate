import "server-only";

import { unstable_rethrow } from "next/navigation";

import { ApiError } from "@/lib/api/client";

export function failQuery(label: string, message: string): never {
  console.error(`${label}: ${message}`);
  throw new Error(`Could not load ${label}.`);
}

export function failLoad(label: string, error: unknown): never {
  unstable_rethrow(error);
  failQuery(label, error instanceof Error ? error.message : "request failed");
}

export function nullIfMissing(label: string, error: unknown): null {
  unstable_rethrow(error);
  if (error instanceof ApiError && error.statusCode === 404) return null;
  return failLoad(label, error);
}
