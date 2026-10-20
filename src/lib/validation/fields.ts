import { z } from "zod";

export function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

export function emptyToNull(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    return Number(trimmed);
  }
  return value;
}

export function optionalText(max: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(max).optional(),
  );
}

export function requiredNumber(min: number, max: number, integer = false) {
  let schema = z.number().min(min).max(max);
  if (integer) schema = schema.int();
  return z.preprocess((value) => {
    if (typeof value === "string") return Number(value.trim());
    return value;
  }, schema);
}

export function optionalNumber(min: number, max: number, integer = false) {
  let schema = z.number().min(min).max(max);
  if (integer) schema = schema.int();
  return z.preprocess(emptyToNull, schema.nullable());
}
