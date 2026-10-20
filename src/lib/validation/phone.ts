import { z } from "zod";

const MOBILE = /^9\d{9}$/;

export function normalizePhPhone(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  let national = "";
  if (compact.startsWith("+63")) national = compact.slice(3);
  else if (compact.startsWith("63") && compact.length === 12) national = compact.slice(2);
  else if (compact.startsWith("0")) national = compact.slice(1);
  else return null;
  if (!MOBILE.test(national)) return null;
  return `+63 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

function asPhone(value: string, ctx: z.RefinementCtx): string {
  const normalized = normalizePhPhone(value);
  if (!normalized) {
    ctx.addIssue({
      code: "custom",
      message: "Use +63 9XX XXX XXXX or 09XXXXXXXXX.",
    });
    return z.NEVER;
  }
  return normalized;
}

export const optionalPhPhone = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().transform(asPhone).optional());
