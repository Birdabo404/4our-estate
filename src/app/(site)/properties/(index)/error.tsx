"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";

export default function PropertiesError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.warn(error);
  }, [error]);

  return (
    <div className="pb-28 pt-36 md:pb-40 md:pt-48">
      <Container width="default">
        <h1 className="sr-only">Properties</h1>
        <div className="border-y border-ink/10">
          <EmptyState
            icon="error"
            title="The collection didn't load"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => retry()} icon="arrow-right">
                  Try again
                </Button>
                <ButtonLink href="/" variant="ghost">
                  Return home
                </ButtonLink>
              </div>
            }
          >
            Something interrupted the connection to our listings. Nothing you chose has been lost.
          </EmptyState>
        </div>
      </Container>
    </div>
  );
}
