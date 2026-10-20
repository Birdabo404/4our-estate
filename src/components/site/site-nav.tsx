"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/motion/wordmark";
import { ButtonLink } from "@/components/ui/button";
import type { Role, Viewer } from "@/lib/domain/types";
import { cn } from "@/lib/cn";
import { duration, ease, spring, stagger, tween } from "@/lib/motion";
import { OFFICES } from "./offices";

type NavLink = { href: string; label: string };

const PUBLIC_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
];

const DASHBOARD: Record<Role, NavLink> = {
  buyer: { href: "/dashboard/buyer", label: "Dashboard" },
  agent: { href: "/dashboard/agent", label: "Agent desk" },
  admin: { href: "/dashboard/admin", label: "Admin" },
};

function linksFor(viewer: Viewer): NavLink[] {
  switch (viewer.kind) {
    case "guest":
      return [...PUBLIC_LINKS];
    case "member":
      return [...PUBLIC_LINKS, DASHBOARD[viewer.role]];
    default: {
      const unhandled: never = viewer;
      return unhandled;
    }
  }
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** True while the nav's own strip overlaps a region marked `data-nav-surface="image"`. */
function useOverImage(pathname: string): boolean {
  const [state, setState] = useState({ pathname, over: false });
  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setState({ pathname, over: visible.size > 0 });
      },
      { rootMargin: "0px 0px -92% 0px" },
    );
    document.querySelectorAll("[data-nav-surface='image']").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);
  return state.pathname === pathname && state.over;
}

function useScrolledPast(sentinel: RefObject<HTMLElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinel]);
  return scrolled;
}

/** Makes everything outside the header inert and locks scroll while the menu is open. */
function useMenuIsolation(open: boolean, header: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    if (!open) return;
    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && !el.contains(header.current),
    );
    siblings.forEach((el) => (el.inert = true));
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => {
      siblings.forEach((el) => (el.inert = false));
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, header, onEscape]);
}

export function SiteNav({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast(sentinel);
  const overImage = useOverImage(pathname);
  const links = linksFor(viewer);

  const closeMenu = useCallback(() => {
    setOpen(false);
    toggle.current?.focus();
  }, []);
  useMenuIsolation(open, header, closeMenu);

  const light = overImage && !scrolled && !open;
  const showBar = scrolled && !open;

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6" />
      <header
        ref={header}
        className={cn(
          "fixed inset-x-0 top-0 z-(--z-nav) transition-colors duration-700 ease-settle",
          light ? "text-white" : "text-ink",
        )}
      >
        <AnimatePresence>{open && <MenuOverlay links={links} viewer={viewer} pathname={pathname} onNavigate={() => setOpen(false)} />}</AnimatePresence>

        <div className="relative mx-auto max-w-[96rem] px-3 pt-3 sm:px-5 lg:px-8">
          <motion.div
            aria-hidden
            initial={false}
            animate={showBar ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -10, scale: 0.985 }}
            transition={spring.panel}
            className="absolute inset-x-3 bottom-0 top-3 rounded-full bg-paper/80 shadow-lift ring-1 ring-ink/[0.07] backdrop-blur-xl sm:inset-x-5 lg:inset-x-8"
          />
          <nav aria-label="Primary" className="relative flex h-16 items-center justify-between pl-4 pr-2 sm:pl-6 sm:pr-2.5">
            <Link href="/" aria-label="4OUR Estate, home" className="rounded-full py-2 text-[1.3rem]">
              <Wordmark animated />
            </Link>

            <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative block rounded-full px-4 py-2 text-small tracking-[0.02em] transition-opacity duration-500 ease-settle",
                        active ? "opacity-100" : "opacity-70 hover:opacity-100",
                      )}
                    >
                      {link.label}
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          transition={spring.ui}
                          className="absolute inset-x-4 -bottom-0.5 h-px bg-current"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              <span className="hidden md:block">
                <AccountControl viewer={viewer} light={light} />
              </span>
              <button
                ref={toggle}
                type="button"
                aria-expanded={open}
                aria-controls="site-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "relative grid size-11 place-items-center rounded-full ring-1 ring-inset transition-colors duration-500 ease-settle md:hidden",
                  light ? "ring-white/35" : "ring-ink/15",
                )}
              >
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={open ? { y: 0, rotate: 45 } : { y: -3.5, rotate: 0 }}
                  transition={spring.ui}
                  className="absolute h-px w-[1.125rem] bg-current"
                />
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={open ? { y: 0, rotate: -45 } : { y: 3.5, rotate: 0 }}
                  transition={spring.ui}
                  className="absolute h-px w-[1.125rem] bg-current"
                />
              </button>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

function AccountControl({ viewer, light }: { viewer: Viewer; light: boolean }) {
  switch (viewer.kind) {
    case "guest":
      return (
        <ButtonLink href="/login" size="sm" variant={light ? "on-image" : "primary"}>
          Sign in
        </ButtonLink>
      );
    case "member":
      return (
        <Link
          href={DASHBOARD[viewer.role].href}
          aria-label={`${viewer.fullName}, open your ${DASHBOARD[viewer.role].label.toLowerCase()}`}
          className={cn(
            "grid size-11 place-items-center rounded-full text-[0.75rem] font-medium tracking-[0.12em] transition-colors duration-500 ease-settle",
            light ? "bg-white text-ink" : "bg-ink text-paper",
          )}
        >
          {initials(viewer.fullName)}
        </Link>
      );
    default: {
      const unhandled: never = viewer;
      return unhandled;
    }
  }
}

const curtain = {
  closed: { clipPath: "inset(0% 0% 100% 0%)" },
  open: { clipPath: "inset(0% 0% 0% 0%)" },
};

function MenuOverlay({
  links,
  viewer,
  pathname,
  onNavigate,
}: {
  links: NavLink[];
  viewer: Viewer;
  pathname: string;
  onNavigate: () => void;
}) {
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => first.current?.focus({ preventScroll: true }), []);
  const account: NavLink =
    viewer.kind === "guest" ? { href: "/login", label: "Sign in" } : DASHBOARD[viewer.role];
  const items = viewer.kind === "guest" ? [...links, account] : links;

  return (
    <motion.div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial="closed"
      animate="open"
      exit="closed"
      variants={curtain}
      transition={{ duration: duration.slow, ease: ease.reveal }}
      className="fixed inset-0 -z-10 flex flex-col overflow-y-auto bg-paper/92 px-6 pb-10 pt-28 text-ink backdrop-blur-2xl md:hidden"
    >
      <ul className="flex flex-col gap-1">
        {items.map((link, i) => (
          <li key={link.href} className="overflow-hidden">
            <motion.span
              className="block"
              variants={{ closed: { y: "110%" }, open: { y: "0%" } }}
              transition={{ ...tween.reveal, delay: 0.12 + i * stagger.items }}
            >
              <Link
                ref={i === 0 ? first : undefined}
                href={link.href}
                onClick={onNavigate}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className="flex items-baseline gap-4 py-1 font-display text-[3.25rem] leading-[1.05] tracking-[-0.03em] aria-[current=page]:italic"
              >
                <span className="font-sans text-micro tracking-[0.2em] text-ink-muted">0{i + 1}</span>
                {link.label}
              </Link>
            </motion.span>
          </li>
        ))}
      </ul>
      <motion.div
        variants={{ closed: { opacity: 0, y: 16 }, open: { opacity: 1, y: 0 } }}
        transition={{ ...tween.reveal, delay: 0.12 + items.length * stagger.items }}
        className="mt-auto flex flex-col border-t border-ink/10 pt-2"
      >
        {OFFICES.map((office) => (
          <a
            key={office.city}
            href={`tel:${office.phone.replace(/\s/g, "")}`}
            className="flex items-baseline justify-between border-b border-ink/[0.07] py-3.5"
          >
            <span className="text-micro font-medium uppercase text-ink-muted">{office.city}</span>
            <span className="tabular text-small text-ink-soft">{office.phone}</span>
          </a>
        ))}
      </motion.div>
    </motion.div>
  );
}
