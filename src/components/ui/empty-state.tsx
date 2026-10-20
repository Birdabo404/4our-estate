import {
  Buildings,
  ChatsCircle,
  HeartStraight,
  MagnifyingGlass,
  WarningCircle,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const EMPTY_ICONS = {
  search: MagnifyingGlass,
  listings: Buildings,
  favorites: HeartStraight,
  inquiries: ChatsCircle,
  error: WarningCircle,
} as const satisfies Record<string, Icon>;

export function EmptyState({
  icon = "listings",
  title,
  children,
  action,
  className,
}: {
  icon?: keyof typeof EMPTY_ICONS;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const Glyph = EMPTY_ICONS[icon];
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center", className)}>
      <span className="grid size-16 place-items-center rounded-full ring-1 ring-inset ring-ink/10">
        <Glyph aria-hidden size={26} weight="light" className="text-ink-soft" />
      </span>
      <h3 className="mt-8 font-display text-heading">{title}</h3>
      {children && <div className="mt-3 text-body text-ink-muted">{children}</div>}
      {action && <div className="mt-9">{action}</div>}
    </div>
  );
}
