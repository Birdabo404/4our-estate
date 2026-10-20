import type { Role } from "@/lib/domain/types";

export type DashboardLink = {
  href: string;
  label: string;
  exact?: boolean;
};

export const DASHBOARD_NAV: Record<Role, readonly DashboardLink[]> = {
  buyer: [
    { href: "/dashboard/buyer", label: "Saved", exact: true },
    { href: "/dashboard/buyer/inquiries", label: "Inquiries" },
    { href: "/dashboard/buyer/profile", label: "Profile" },
  ],
  agent: [
    { href: "/dashboard/agent", label: "Overview", exact: true },
    { href: "/dashboard/agent/listings", label: "Listings" },
    { href: "/dashboard/agent/inquiries", label: "Inquiries" },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", exact: true },
    { href: "/dashboard/admin/moderation", label: "Moderation" },
    { href: "/dashboard/admin/users", label: "People" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  buyer: "Buyer",
  agent: "Agent",
  admin: "Admin",
};

export function linkActive(pathname: string, link: DashboardLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
