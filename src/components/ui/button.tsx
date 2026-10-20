"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import {
  type HTMLMotionProps,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import type { ComponentProps, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "on-image";
export type ButtonSize = "sm" | "md" | "lg";

/** Icons are named, not passed as components, so Server Components can render buttons. */
export const BUTTON_ICONS = {
  "arrow-up-right": ArrowUpRight,
  "arrow-right": ArrowRight,
  "arrow-down": ArrowDown,
  plus: Plus,
  search: MagnifyingGlass,
} as const satisfies Record<string, Icon>;

export type ButtonIcon = keyof typeof BUTTON_ICONS;

const VARIANT: Record<ButtonVariant, { shell: string; well: string }> = {
  primary: {
    shell: "bg-ink text-paper hover:bg-[#2b2620]",
    well: "bg-paper/12 text-paper",
  },
  secondary: {
    shell: "bg-paper-raised text-ink shadow-lift ring-1 ring-inset ring-ink/10 hover:ring-ink/20",
    well: "bg-ink text-paper",
  },
  ghost: {
    shell: "text-ink ring-1 ring-inset ring-ink/15 hover:bg-ink/[0.04] hover:ring-ink/30",
    well: "bg-ink/[0.06] text-ink",
  },
  "on-image": {
    shell: "bg-paper text-ink shadow-float hover:bg-white",
    well: "bg-ink text-paper",
  },
};

const SIZE: Record<ButtonSize, { shell: string; withIcon: string; well: string; glyph: number }> = {
  sm: { shell: "h-10 px-5 text-small gap-3", withIcon: "pl-5 pr-1.5", well: "size-7", glyph: 13 },
  md: { shell: "h-12 px-6 text-small gap-4", withIcon: "pl-6 pr-1.5", well: "size-9", glyph: 15 },
  lg: { shell: "h-14 px-8 text-body gap-5", withIcon: "pl-8 pr-2", well: "size-10", glyph: 16 },
};

const shellMotion: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1 },
  press: { scale: 0.975 },
};

const wellMotion: Variants = {
  rest: { x: 0, y: 0, scale: 1 },
  hover: { x: 2, y: -1, scale: 1.06 },
  press: { x: 2, y: -1, scale: 0.98 },
};

/** The glyph leaves up-right while its twin arrives from below-left. */
const glyphOut: Variants = {
  rest: { x: 0, y: 0, opacity: 1 },
  hover: { x: "130%", y: "-130%", opacity: 0 },
};
const glyphIn: Variants = {
  rest: { x: "-130%", y: "130%", opacity: 0 },
  hover: { x: 0, y: 0, opacity: 1 },
};

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ButtonIcon;
  /** The shell drifts toward the pointer. Reserve for one hero CTA per view. */
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
};

function useMagnet(enabled: boolean) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.magnetic);
  const sy = useSpring(y, spring.magnetic);
  const active = enabled && !reduced;

  return {
    style: active ? { x: sx, y: sy } : undefined,
    onPointerMove: active
      ? (e: PointerEvent<HTMLElement>) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - (r.left + r.width / 2)) * 0.22);
          y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
        }
      : undefined,
    onPointerLeave: active
      ? () => {
          x.set(0);
          y.set(0);
        }
      : undefined,
  };
}

function Inner({ icon, size, variant, children }: Required<Pick<OwnProps, "size" | "variant">> & Pick<OwnProps, "icon" | "children">) {
  if (!icon) return <span className="relative">{children}</span>;
  const Glyph = BUTTON_ICONS[icon];
  const { well, glyph } = SIZE[size];
  return (
    <>
      <span className="relative">{children}</span>
      <motion.span
        variants={wellMotion}
        transition={spring.ui}
        aria-hidden
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
          well,
          VARIANT[variant].well,
        )}
      >
        <motion.span variants={glyphOut} transition={spring.ui} className="col-start-1 row-start-1">
          <Glyph size={glyph} weight="light" />
        </motion.span>
        <motion.span variants={glyphIn} transition={spring.ui} className="col-start-1 row-start-1">
          <Glyph size={glyph} weight="light" />
        </motion.span>
      </motion.span>
    </>
  );
}

function shellClass({ variant, size, icon, className }: Required<Pick<OwnProps, "variant" | "size">> & Pick<OwnProps, "icon" | "className">) {
  return cn(
    "group relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-sans font-medium tracking-[0.01em]",
    "transition-[background-color,box-shadow,color] duration-500 ease-settle",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    SIZE[size].shell,
    icon && SIZE[size].withIcon,
    VARIANT[variant].shell,
    className,
  );
}

export type ButtonProps = OwnProps & Omit<HTMLMotionProps<"button">, keyof OwnProps>;

export function Button({
  variant = "primary",
  size = "md",
  icon,
  magnetic = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const magnet = useMagnet(magnetic);
  return (
    <motion.button
      type={type}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="press"
      variants={shellMotion}
      transition={spring.press}
      className={shellClass({ variant, size, icon, className })}
      {...magnet}
      {...rest}
    >
      <Inner icon={icon} size={size} variant={variant}>
        {children}
      </Inner>
    </motion.button>
  );
}

const MotionLink = motion.create(Link);

export type ButtonLinkProps = OwnProps & Omit<ComponentProps<typeof MotionLink>, keyof OwnProps>;

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon = "arrow-up-right",
  magnetic = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const magnet = useMagnet(magnetic);
  return (
    <MotionLink
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="press"
      variants={shellMotion}
      transition={spring.press}
      className={shellClass({ variant, size, icon, className })}
      {...magnet}
      {...rest}
    >
      <Inner icon={icon} size={size} variant={variant}>
        {children}
      </Inner>
    </MotionLink>
  );
}
