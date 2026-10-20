import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { photoUrl } from "@/lib/photography/catalog";
import { photographerCredits, UNSPLASH_LICENSE_HREF } from "@/lib/photography/credits";

export const metadata: Metadata = {
  title: "Photography credits",
  description: "The Unsplash photographers behind the pictures on 4OUR Estate.",
};

export default function PhotographyCreditsPage() {
  const credits = photographerCredits();

  return (
    <div className="pb-28 pt-32 md:pb-40 md:pt-44">
      <Container width="wide">
        <header className="max-w-[44rem]">
          <Eyebrow>Credits</Eyebrow>
          <h1 className="mt-7 text-display-2">Photography</h1>
          <p className="mt-6 max-w-[48ch] text-lead text-ink-soft">
            These photographs are from Unsplash, under the{" "}
            <a
              href={UNSPLASH_LICENSE_HREF}
              className="text-accent underline decoration-accent/30 underline-offset-4 transition-colors duration-300 ease-settle hover:decoration-accent"
            >
              Unsplash License
            </a>
            .
          </p>
          <p className="mt-4 max-w-[48ch] text-small text-ink-muted">
            Photos uploaded by agents belong to their listing agents.
          </p>
        </header>

        <ul className="mt-20 flex flex-col gap-16 md:mt-28 md:gap-20">
          {credits.map((person) => (
            <li key={person.name} className="border-t border-ink/10 pt-8">
              <h2 className="text-heading">{person.name}</h2>
              <p className="mt-2 text-small text-ink-muted">
                {person.count} {person.count === 1 ? "photo" : "photos"}
              </p>
              <div className="mt-8 flex flex-col gap-8">
                {person.categories.map((group) => (
                  <div key={group.category}>
                    <h3 className="font-sans text-micro font-medium uppercase text-ink-muted">{group.label}</h3>
                    <ul className="mt-4 flex flex-wrap gap-3">
                      {group.photos.map((photo) => (
                        <li key={photo.id}>
                          <div className="relative h-20 w-28 overflow-hidden rounded-photo bg-paper-sunken">
                            <Image
                              src={photoUrl(photo, 240)}
                              alt={photo.alt}
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
