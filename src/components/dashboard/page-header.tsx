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
    <header className="mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[40rem]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 text-display-3">{title}</h1>
        {lede ? <p className="mt-4 max-w-[42ch] text-lead text-ink-soft">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
