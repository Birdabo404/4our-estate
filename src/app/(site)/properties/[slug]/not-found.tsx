import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function PropertyNotFound() {
  return (
    <div className="pb-28 pt-36 md:pb-44 md:pt-52">
      <Container width="prose" className="flex flex-col items-start gap-8">
        <p className="rounded-[0.25rem] bg-ink px-2 py-1 text-micro uppercase text-paper">404 / listing not found</p>
        <h1 className="text-display-2">
          This home is <em>no longer</em> listed.
        </h1>
        <p className="max-w-[48ch] text-lead text-ink-soft">
          The owner may have taken it down, or the link has a typo. Everything else on the board is still up.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/properties" icon="arrow-right">
            Browse homes
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Back to home
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
