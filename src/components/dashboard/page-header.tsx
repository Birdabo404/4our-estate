import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

export function PageHeader({
  eyebrow,
  title,
  lede,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[44rem]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-display-3">{title}</h1>
        {lede ? <p className="mt-3 max-w-[52ch] text-body text-ink-soft">{lede}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}
