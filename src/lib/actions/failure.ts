import "server-only";

import { unstable_rethrow } from "next/navigation";

import { ApiError } from "@/lib/api/client";

import { fail, type ActionResult } from "./result";

export function failure(error: unknown): ActionResult<never> {
  unstable_rethrow(error);
  if (error instanceof ApiError) {
    return error.fields ? fail(error.message, error.fields) : fail(error.message);
  }
  return fail("We couldn't reach the server. Try again in a moment.");
}
