import type { Role } from "@/lib/domain/types";

export const DASHBOARDS: Record<Role, { href: string; label: string }> = {
  buyer: { href: "/dashboard/buyer", label: "Dashboard" },
  agent: { href: "/dashboard/agent", label: "Agent desk" },
  admin: { href: "/dashboard/admin", label: "Admin" },
};

export function dashboardPath(role: Role): string {
  return DASHBOARDS[role].href;
}

export function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
