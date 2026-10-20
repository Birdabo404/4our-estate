"use client";

import { List } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { signOut } from "@/lib/actions/auth";
import type { Role } from "@/lib/domain/types";
import { Wordmark } from "@/components/motion/wordmark";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

import { DASHBOARD_NAV, linkActive, ROLE_LABEL } from "./nav";

export type DashboardAccount = {
  fullName: string;
  email: string;
  role: Role;
};

function NavLinks({ account, pathname, onNavigate }: { account: DashboardAccount; pathname: string; onNavigate?: () => void }) {
  const links = DASHBOARD_NAV[account.role];
  return (
    <nav aria-label="Dashboard">
      <ul className="flex flex-col gap-1">
        {links.map((link) => {
          const active = linkActive(pathname, link);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2.5 text-small transition-colors duration-300 ease-settle",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", active ? "bg-accent" : "bg-transparent")} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function AccountBlock({ account, signOutControl = true }: { account: DashboardAccount; signOutControl?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-display text-title">{account.fullName}</p>
        <p className="mt-1 truncate text-small text-ink-muted">{account.email}</p>
        <p className="mt-2 text-micro font-medium uppercase text-ink-muted">{ROLE_LABEL[account.role]}</p>
      </div>
      {signOutControl ? (
        <form
          action={async (formData) => {
            await signOut(null, formData);
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function DashboardShell({ account, children }: { account: DashboardAccount; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/10 px-6 py-8 lg:flex">
        <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
          <Wordmark className="text-[1.45rem]" />
        </Link>
        <div className="mt-12">
          <NavLinks account={account} pathname={pathname} />
        </div>
        <div className="mt-auto flex flex-col gap-8 pt-10">
          <Link
            href="/"
            className="px-3 text-small text-ink-soft underline decoration-ink/15 underline-offset-4 transition-colors duration-300 ease-settle hover:text-ink"
          >
            View site
          </Link>
          <AccountBlock account={account} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 lg:hidden">
          <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
            <Wordmark className="text-[1.35rem]" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-11 place-items-center rounded-full text-ink ring-1 ring-inset ring-ink/15"
          >
            <List size={18} weight="light" />
          </button>
        </header>
        <Sheet
          open={open}
          side="right"
          onClose={() => setOpen(false)}
          title="Menu"
          description={ROLE_LABEL[account.role]}
          footer={
            <div className="flex w-full items-center justify-between gap-4">
              <Link href="/" className="text-small text-ink-soft underline decoration-ink/20 underline-offset-4">
                View site
              </Link>
              <form
                action={async (formData) => {
                  await signOut(null, formData);
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          }
        >
          <div className="flex flex-col gap-10">
            <NavLinks account={account} pathname={pathname} onNavigate={() => setOpen(false)} />
            <AccountBlock account={account} signOutControl={false} />
          </div>
        </Sheet>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[72rem] flex-1 px-5 py-12 outline-none sm:px-8 lg:px-14 lg:py-16">
          {children}
        </main>
      </div>
    </div>
  );
}
