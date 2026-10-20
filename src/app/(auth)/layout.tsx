import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/motion/wordmark";
import { photoUrl, photosBy, type Photo } from "@/lib/photography/catalog";

const SCENES: Record<"login" | "signup", { photo: Photo; kicker: string; line: string }> = {
  login: {
    photo: photosBy("hero")[2]!,
    kicker: "Makati to the islands",
    line: "Blue hour on the hill",
  },
  signup: {
    photo: photosBy("hero")[1]!,
    kicker: "A private collection",
    line: "Late light on still water",
  },
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const path = headerList.get("x-4our-pathname") ?? "";
  const scene = path.startsWith("/signup") ? SCENES.signup : SCENES.login;
  const src = photoUrl(scene.photo, 1800);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative h-64 sm:h-80 lg:sticky lg:top-0 lg:h-dvh">
        <Image
          src={src}
          alt={scene.photo.alt}
          fill
          preload
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_18_15/0.18)_0%,rgb(20_18_15/0.05)_42%,rgb(20_18_15/0.72)_100%)]"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:p-12">
          <p className="text-micro font-medium uppercase text-white/80">{scene.kicker}</p>
          <p className="mt-3 max-w-[14ch] font-display text-heading text-white">{scene.line}</p>
          <p className="mt-4 text-small text-white/75">{scene.photo.photographer}</p>
        </div>
      </div>
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-10">
        <header className="flex items-center justify-between gap-6">
          <Link href="/" className="text-ink" aria-label="4OUR Estate, home">
            <Wordmark className="text-[1.65rem]" />
          </Link>
          <Link
            href="/"
            className="text-small text-ink-soft underline decoration-ink/15 underline-offset-4 transition-colors duration-300 ease-settle hover:text-ink"
          >
            Back to the site
          </Link>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col justify-center py-12 outline-none lg:py-16">
          {children}
        </main>
      </div>
    </div>
  );
}
