import { cn } from "@/lib/cn";

/**
 * A round rubber stamp: a ring of mono text around the 4OUR asterisk. It
 * turns slowly, the one ambient motion on the page, and stops under reduced
 * motion with every other animation.
 */
export function Stamp({ text, className }: { text: string; className?: string }) {
  return (
    <span aria-hidden className={cn("relative grid size-32 place-items-center", className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full animate-[spin_28s_linear_infinite]">
        <defs>
          <path id="stamp-ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1 -92 0" />
        </defs>
        <text className="fill-current font-mono text-[9.4px] uppercase tracking-[0.18em]">
          <textPath href="#stamp-ring" textLength="285">
            {text}
          </textPath>
        </text>
      </svg>
      <Asterisk className="size-10 text-accent" />
    </span>
  );
}

export function Asterisk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="square">
        <path d="M20 3v34" />
        <path d="M5.3 11.5l29.4 17" />
        <path d="M5.3 28.5l29.4-17" />
      </g>
    </svg>
  );
}
