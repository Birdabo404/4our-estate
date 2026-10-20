import "server-only";

import { ApiError } from "@/lib/api/client";

import { fail, type ActionResult } from "./result";

export function failure(error: unknown): ActionResult<never> {
  if (error instanceof Error && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_")) {
    throw error;
  }
  if (error instanceof ApiError) {
    return error.fields ? fail(error.message, error.fields) : fail(error.message);
  }
  return fail("We couldn't reach the server. Try again in a moment.");
}
