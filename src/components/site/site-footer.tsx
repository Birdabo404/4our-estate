import Link from "next/link";
import { DitherImage } from "@/components/motion/dither-image";
import { Wordmark } from "@/components/motion/wordmark";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PHOTOS, photoUrl } from "@/lib/photography/catalog";
import { PHOTOGRAPHER_COUNT, UNSPLASH_HREF } from "@/lib/photography/credits";
import { OFFICES } from "./offices";

type FooterLink = { href: string; label: string; external?: boolean };

const COLUMNS: ReadonlyArray<{ title: string; links: readonly FooterLink[] }> = [
  {
    title: "Browse",
    links: [
      { href: "/properties", label: "All homes" },
      { href: "/properties?listingType=sale", label: "For sale" },
      { href: "/properties?listingType=rent", label: "For lease" },
      { href: "/properties?propertyType=condominium", label: "Condos" },
      { href: "/properties?propertyType=house", label: "Houses" },
    ],
  },
  {
    title: "Members",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create an account" },
      { href: "/dashboard/buyer", label: "Saved homes" },
      { href: "/signup?role=agent", label: "List a property" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "mailto:hello@4our.estate", label: "Contact us", external: true },
      { href: "mailto:letters@4our.estate?subject=Private%20letters", label: "Private letters", external: true },
      { href: "/styleguide", label: "Design system" },
    ],
  },
];

const HORIZON = PHOTOS.find((p) => p.id === "photo-1457195740896-7f345efef228");

const LINK = "text-sky underline-offset-4 transition-colors duration-300 ease-settle hover:text-paper hover:underline";

function ColumnLink({ link }: { link: FooterLink }) {
  return link.external ? (
    <a href={link.href} className={LINK}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={LINK}>
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 -mt-8 overflow-hidden rounded-t-[1.75rem] bg-bay text-paper md:-mt-10 md:rounded-t-[2.5rem] [&_:focus-visible]:shadow-none [&_:focus-visible]:outline-sun">
      <Container width="wide" className="pt-14 md:pt-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5">
            <Link href="/" aria-label="4OUR Estate home" className="w-fit">
              <Wordmark className="text-[2.5rem] md:text-[3.25rem]" />
            </Link>
            <p className="max-w-[30ch] font-display text-heading font-semibold [&_em]:rounded-[0.25rem] [&_em]:bg-accent [&_em]:bg-none [&_em]:px-1.5 [&_em]:text-ink">
              Homes across the archipelago, with the <em>price</em> up front.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/properties" variant="on-image" icon="arrow-up-right">
              Browse homes
            </ButtonLink>
            <ButtonLink href="/signup?role=agent" variant="accent" icon="arrow-right">
              List a property
            </ButtonLink>
          </div>
        </div>

        <nav aria-label="Footer" className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-paper/15 pt-10 md:mt-16 md:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-title font-semibold">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-small">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <ColumnLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-title font-semibold">Offices</h2>
            <ul className="mt-4 flex flex-col gap-3 text-small">
              {OFFICES.map((office) => (
                <li key={office.city} className="flex flex-col">
                  <span>
                    {office.city} <span className="text-sky">· {office.district}</span>
                  </span>
                  <a href={`tel:${office.phone.replace(/\s/g, "")}`} className={`w-fit font-mono text-[0.75rem] ${LINK}`}>
                    {office.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-14 flex flex-col gap-4 text-[0.75rem] text-sky md:mt-16 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="font-mono uppercase tracking-[0.08em] text-paper">4OUR Estate Inc.</p>
            <p>
              Licensed real estate brokerage under Republic Act No. 9646 <span aria-hidden>·</span> © {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex flex-col gap-1 md:items-end">
            <p>
              Photography by <span className="tabular">{PHOTOGRAPHER_COUNT}</span>{" "}
              {PHOTOGRAPHER_COUNT === 1 ? "contributor" : "contributors"} on{" "}
              <a href={UNSPLASH_HREF} className={`underline ${LINK}`}>
                Unsplash
              </a>
              {" · "}
              <Link href="/credits" className={`underline ${LINK}`}>
                Credits
              </Link>
            </p>
            <p aria-hidden className="font-mono">
              14.5547° N, 121.0244° E <span className="text-paper">{"// built in Makati"}</span>
            </p>
          </div>
        </div>
      </Container>

      {HORIZON && (
        <div aria-hidden className="relative mt-10 h-24 [mask-image:linear-gradient(180deg,transparent,#000_55%)] md:h-36">
          <DitherImage
            src={photoUrl(HORIZON, 1600)}
            alt=""
            sizes="100vw"
            reveal="always"
            ink="#cfe9f1"
            paper="#1d44c8"
            cell={3}
            contrast={1.8}
            className="absolute inset-0"
          />
        </div>
      )}
    </footer>
  );
}
