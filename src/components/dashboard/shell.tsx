"use client";

import { ArrowUpRight, List, SignOut } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { signOut } from "@/lib/actions/auth";
import type { Role } from "@/lib/domain/types";
import { Wordmark } from "@/components/motion/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

import { DASHBOARD_NAV, linkActive, ROLE_DESK, ROLE_LABEL } from "./nav";

export type DashboardAccount = {
  fullName: string;
  email: string;
  role: Role;
};

const QUICK_ACTION: Record<Role, { href: string; label: string; icon: "plus" | "arrow-up-right" }> = {
  agent: { href: "/dashboard/agent/listings/new", label: "New listing", icon: "plus" },
  admin: { href: "/dashboard/admin/moderation", label: "Review queue", icon: "arrow-up-right" },
  buyer: { href: "/properties", label: "Browse homes", icon: "arrow-up-right" },
};

const TODAY = new Intl.DateTimeFormat("en-PH", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Manila" });

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavLinks({ account, pathname, onNavigate }: { account: DashboardAccount; pathname: string; onNavigate?: () => void }) {
  const links = DASHBOARD_NAV[account.role];
  return (
    <nav aria-label="Dashboard">
      <p className="px-2 text-micro uppercase text-ink-muted">Menu</p>
      <ul className="mt-3 flex flex-col gap-1">
        {links.map((link) => {
          const active = linkActive(pathname, link);
          const Glyph = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-md p-1.5 pr-3 text-small font-semibold transition-[background-color,box-shadow,color] duration-300 ease-settle",
                  active ? "bg-paper-raised text-ink shadow-lift ring-1 ring-ink/10" : "text-ink-soft hover:bg-paper-raised/60 hover:text-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-8 place-items-center rounded-[0.3rem] transition-colors duration-300 ease-settle",
                    active ? "bg-accent text-ink" : "bg-ink/[0.06] text-ink-soft group-hover:text-ink",
                  )}
                >
                  <Glyph size={16} weight={active ? "fill" : "bold"} />
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <form
      action={async (formData) => {
        await signOut(null, formData);
      }}
    >
      <button
        type="submit"
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-small font-semibold text-ink ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper hover:ring-ink",
          className,
        )}
      >
        <SignOut aria-hidden size={15} weight="bold" />
        Sign out
      </button>
    </form>
  );
}

function AccountCard({ account, signOutControl = true }: { account: DashboardAccount; signOutControl?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-panel bg-paper-raised p-3 ring-1 ring-ink/10">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-md bg-ink font-mono text-small font-semibold text-accent">
          {initials(account.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-ink">{account.fullName}</p>
          <p className="truncate font-mono text-[0.6875rem] text-ink-muted">{account.email}</p>
        </div>
      </div>
      {signOutControl ? <SignOutButton className="w-full justify-center" /> : null}
    </div>
  );
}

export function DashboardShell({ account, children }: { account: DashboardAccount; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const quick = QUICK_ACTION[account.role];
  const trail = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);

  return (
    <div className="min-h-dvh bg-paper-sunken lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 px-4 py-5 lg:flex">
        <div className="flex flex-col gap-4 px-2">
          <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
            <Wordmark className="text-[1.45rem]" />
          </Link>
          <p className="inline-flex items-center gap-2 self-start rounded-[0.25rem] bg-ink px-2 py-1 text-micro uppercase text-paper">
            <span aria-hidden className="size-1.5 rounded-[1px] bg-accent" />
            {ROLE_DESK[account.role]}
          </p>
        </div>
        <ButtonLink href={quick.href} variant="accent" size="sm" icon={quick.icon} className="mx-1 justify-between">
          {quick.label}
        </ButtonLink>
        <NavLinks account={account} pathname={pathname} />
        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/"
            className="group flex items-center justify-between rounded-md px-3 py-2 text-small font-semibold text-ink-soft transition-colors duration-300 ease-settle hover:bg-paper-raised/60 hover:text-ink"
          >
            View site
            <ArrowUpRight aria-hidden size={14} weight="bold" className="transition-transform duration-300 ease-settle group-hover:rotate-45" />
          </Link>
          <AccountCard account={account} />
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:py-2 lg:pr-2">
        <header className="flex items-center justify-between gap-4 border-b border-ink/10 bg-paper px-5 py-3 lg:hidden">
          <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
            <Wordmark className="text-[1.35rem]" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-md text-ink ring-1 ring-inset ring-ink/15 transition-colors duration-300 ease-settle hover:bg-ink hover:text-paper"
          >
            <List size={18} weight="bold" />
          </button>
        </header>
        <Sheet
          open={open}
          side="right"
          onClose={() => setOpen(false)}
          title="Menu"
          description={ROLE_DESK[account.role]}
          footer={
            <div className="flex w-full items-center justify-between gap-4">
              <Link href="/" className="text-small font-semibold text-ink-soft underline decoration-ink/20 underline-offset-4">
                View site
              </Link>
              <SignOutButton />
            </div>
          }
        >
          <div className="flex flex-col gap-8">
            <ButtonLink href={quick.href} variant="accent" size="sm" icon={quick.icon} className="justify-between" onClick={() => setOpen(false)}>
              {quick.label}
            </ButtonLink>
            <NavLinks account={account} pathname={pathname} onNavigate={() => setOpen(false)} />
            <AccountCard account={account} signOutControl={false} />
          </div>
        </Sheet>

        <div className="flex flex-1 flex-col bg-paper lg:rounded-panel lg:shadow-lift lg:ring-1 lg:ring-ink/10">
          <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-3 sm:px-8 lg:px-10">
            <p className="min-w-0 truncate font-mono text-[0.75rem] text-ink-muted">
              <span aria-hidden>~/</span>dashboard
              {trail.map((part, i) => (
                <span key={`${part}-${i}`}>
                  <span aria-hidden className="mx-1">/</span>
                  <span className={cn(i === trail.length - 1 && "text-ink")}>{part}</span>
                </span>
              ))}
            </p>
            <div className="flex shrink-0 items-center gap-3 font-mono text-[0.75rem] text-ink-muted">
              <span className="hidden sm:inline" suppressHydrationWarning>
                {TODAY.format(new Date())}
              </span>
              <span className="rounded-[0.25rem] bg-sky px-2 py-0.5 uppercase text-ink">{ROLE_LABEL[account.role]}</span>
            </div>
          </div>
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[80rem] flex-1 px-5 py-8 outline-none sm:px-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
