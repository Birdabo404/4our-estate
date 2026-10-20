import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Wordmark } from "@/components/motion/wordmark";
import { Container } from "@/components/ui/container";
import { PHOTOGRAPHER_COUNT, UNSPLASH_HREF } from "@/lib/photography/credits";
import { OFFICES } from "./offices";

const EXPLORE = [
  { href: "/properties", label: "All residences" },
  { href: "/properties?listingType=sale", label: "For sale" },
  { href: "/properties?listingType=rent", label: "For lease" },
  { href: "/signup", label: "List with us" },
] as const;

const CREDIT_LINK =
  "underline decoration-on-night/25 underline-offset-4 transition-colors duration-500 ease-settle hover:text-on-night hover:decoration-on-night/60";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-night text-on-night">
      <Container width="wide" className="pb-10 pt-24 md:pt-36">
        <div className="grid gap-16 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-6">
            <p className="max-w-[18ch] font-display text-display-3 text-on-night">
              Residences across the archipelago, introduced with <em className="text-accent-soft">discretion</em>.
            </p>
            <a
              href="mailto:letters@4our.estate?subject=Private%20letters"
              className="group mt-10 inline-flex items-center gap-4 border-b border-on-night/20 pb-2 text-small transition-colors duration-500 ease-settle hover:border-accent-soft"
            >
              <span>
                <span className="text-on-night">Private letters.</span>{" "}
                <span className="text-on-night-muted">A quarterly note on homes before they reach the market.</span>
              </span>
              <ArrowUpRight
                aria-hidden
                size={16}
                weight="light"
                className="shrink-0 transition-transform duration-500 ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </Reveal>

          <nav aria-label="Footer" className="md:col-span-2 md:col-start-8">
            <h2 className="font-sans text-micro font-medium uppercase text-on-night-muted">Explore</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {EXPLORE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-small text-on-night/85 transition-colors duration-500 ease-settle hover:text-on-night"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="font-sans text-micro font-medium uppercase text-on-night-muted">Offices</h2>
            <ul className="mt-6 flex flex-col gap-6">
              {OFFICES.map((office) => (
                <li key={office.city} className="flex flex-col gap-1 text-small">
                  <span className="text-on-night">
                    {office.city} <span className="text-on-night-muted">· {office.district}</span>
                  </span>
                  <span className="text-on-night-muted">{office.address}</span>
                  <a
                    href={`tel:${office.phone.replace(/\s/g, "")}`}
                    className="w-fit text-on-night-muted transition-colors duration-500 ease-settle hover:text-on-night"
                  >
                    {office.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div aria-hidden className="mt-24 select-none leading-none text-on-night/90 md:mt-32">
          <Wordmark label={false} className="w-full [&>svg]:h-auto [&>svg]:w-full" />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-on-night/10 pt-6 text-[0.75rem] text-on-night-muted">
          <p>
            Photography by <span className="tabular">{PHOTOGRAPHER_COUNT}</span>{" "}
            {PHOTOGRAPHER_COUNT === 1 ? "contributor" : "contributors"} on{" "}
            <a href={UNSPLASH_HREF} className={CREDIT_LINK}>
              Unsplash
            </a>
            {" · "}
            <Link href="/credits" className={CREDIT_LINK}>
              Credits
            </Link>
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} 4OUR Estate. Licensed real estate brokerage under Republic Act No. 9646.</p>
            <p>Makati · BGC · Cebu</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
