import type { Icon } from "@phosphor-icons/react";
import {
  ChatCircleText,
  Heart,
  House,
  ShieldCheck,
  SquaresFour,
  UserCircle,
  Users,
} from "@phosphor-icons/react/ssr";

import type { Role } from "@/lib/domain/types";

export type DashboardLink = {
  href: string;
  label: string;
  icon: Icon;
  exact?: boolean;
};

export const DASHBOARD_NAV: Record<Role, readonly DashboardLink[]> = {
  buyer: [
    { href: "/dashboard/buyer", label: "Saved", icon: Heart, exact: true },
    { href: "/dashboard/buyer/inquiries", label: "Inquiries", icon: ChatCircleText },
    { href: "/dashboard/buyer/profile", label: "Profile", icon: UserCircle },
  ],
  agent: [
    { href: "/dashboard/agent", label: "Overview", icon: SquaresFour, exact: true },
    { href: "/dashboard/agent/listings", label: "Listings", icon: House },
    { href: "/dashboard/agent/inquiries", label: "Inquiries", icon: ChatCircleText },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: SquaresFour, exact: true },
    { href: "/dashboard/admin/moderation", label: "Moderation", icon: ShieldCheck },
    { href: "/dashboard/admin/users", label: "People", icon: Users },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  buyer: "Buyer",
  agent: "Agent",
  admin: "Admin",
};

export const ROLE_DESK: Record<Role, string> = {
  buyer: "Buyer space",
  agent: "Agent desk",
  admin: "Admin console",
};

export function linkActive(pathname: string, link: DashboardLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
