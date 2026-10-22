import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { Asterisk } from "@/components/home/stamp";
import { DitherImage } from "@/components/motion/dither-image";
import { Wordmark } from "@/components/motion/wordmark";
import { cn } from "@/lib/cn";
import { photoUrl, photosBy, type Photo } from "@/lib/photography/catalog";

type Scene = { photo: Photo; kicker: string; line: string; points: readonly string[] };

const SCENES: Record<"login" | "signup", Scene> = {
  login: {
    photo: photosBy("hero")[2]!,
    kicker: "Members",
    line: "Your saved homes are right where you left them.",
    points: ["Saved homes, synced to your account", "Every inquiry and every reply in one place", "Agents: listings and leads on one board"],
  },
  signup: {
    photo: photosBy("hero")[1]!,
    kicker: "Free for buyers",
    line: "Save homes, message agents, keep track of replies.",
    points: ["No fees to browse, save or enquire", "Agents list after a short license check", "Your details go only to the agent you message"],
  },
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const path = headerList.get("x-4our-pathname") ?? "";
  const compact = path.startsWith("/signup");
  const scene = compact ? SCENES.signup : SCENES.login;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative h-64 overflow-hidden bg-sky sm:h-80 lg:sticky lg:top-0 lg:h-dvh">
        <DitherImage
          src={photoUrl(scene.photo, 1800)}
          alt={scene.photo.alt}
          sizes="(min-width: 1024px) 50vw, 100vw"
          preload
          reveal="fade-top"
          paper="#cfe9f1"
          ink="#1f5f7a"
          cell={3}
          className="absolute inset-0"
        />
        <div aria-hidden className="bg-grid absolute inset-0 [mask-image:linear-gradient(180deg,#000_0%,transparent_45%)]" />
        <p className="absolute left-5 top-5 rounded-[0.25rem] bg-paper-raised/90 px-2 py-1 font-mono text-[0.6875rem] text-ink-soft sm:left-10 sm:top-8 lg:left-12">
          {scene.photo.photographer} <span aria-hidden>/</span> unsplash
        </p>
        <div className="absolute inset-x-5 bottom-5 sm:inset-x-10 sm:bottom-8 lg:inset-x-12 lg:bottom-12">
          <div className="inline-block max-w-[30rem] rounded-panel bg-paper-raised px-3 py-2 shadow-float ring-1 ring-ink/10 sm:block sm:p-5 md:p-6">
            <p className="flex items-center gap-2 text-micro uppercase text-accent-ink">
              <Asterisk className="size-3.5 text-accent" />
              {scene.kicker}
            </p>
            <p className="mt-3 hidden font-display text-heading font-semibold text-ink sm:block">{scene.line}</p>
            <ul className="mt-5 hidden flex-col gap-2 border-t border-dashed border-ink/20 pt-4 font-mono text-[0.75rem] text-ink-soft lg:flex">
              {scene.points.map((point, i) => (
                <li key={point} className="flex gap-3">
                  <span aria-hidden className="tabular text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className={cn("flex flex-col px-5 sm:px-10 lg:px-16", compact ? "py-5 lg:py-6" : "py-8 lg:py-10")}>
        <header className="flex items-center justify-between gap-6">
          <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
            <Wordmark className="text-[1.65rem]" />
          </Link>
          <Link
            href="/"
            className="font-mono text-[0.75rem] text-ink-soft underline decoration-ink/20 underline-offset-4 transition-colors duration-300 ease-settle hover:text-ink hover:decoration-ink"
          >
            ← back to the site
          </Link>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className={cn(
            "mx-auto flex w-full max-w-[28rem] flex-1 flex-col outline-none",
            compact ? "justify-start py-2" : "justify-center py-8 lg:py-10",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
