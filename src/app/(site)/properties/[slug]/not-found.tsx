import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function PropertyNotFound() {
  return (
    <div className="pb-28 pt-36 md:pb-44 md:pt-52">
      <Container width="prose" className="flex flex-col items-start gap-8">
        <p className="text-micro uppercase text-ink-muted">Not on the register</p>
        <h1 className="font-display text-display-2 [--opsz:96]">
          This residence is <em className="italic">no longer</em> listed.
        </h1>
        <p className="max-w-[48ch] text-lead text-ink-soft">
          It may have been withdrawn by its owner, or the address was mistyped. The rest of the collection is as it was.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/properties" icon="arrow-right">
            View the collection
          </ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Return home
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
