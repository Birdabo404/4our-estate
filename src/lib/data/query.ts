import "server-only";

import { ApiError } from "@/lib/api/client";

export function failQuery(label: string, message: string): never {
  console.error(`${label}: ${message}`);
  throw new Error(`Could not load ${label}.`);
}

export function failLoad(label: string, error: unknown): never {
  failQuery(label, error instanceof Error ? error.message : "request failed");
}

export function nullIfMissing(label: string, error: unknown): null {
  if (error instanceof ApiError && error.statusCode === 404) return null;
  return failLoad(label, error);
}
