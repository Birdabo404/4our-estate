import type { Role } from "@/lib/domain/types";

export function dashboardPath(role: Role): string {
  switch (role) {
    case "buyer":
      return "/dashboard/buyer";
    case "agent":
      return "/dashboard/agent";
    case "admin":
      return "/dashboard/admin";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

export function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
