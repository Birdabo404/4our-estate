import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge<"bg-pattern">({
  extend: {
    theme: {
      text: ["display-1", "display-2", "display-3", "heading", "title", "lead", "body", "small", "micro"],
      ease: ["settle", "reveal", "exit"],
      shadow: ["float", "lift", "hairline", "block"],
      radius: ["photo", "field", "panel"],
    },
    classGroups: {
      "bg-pattern": ["bg-grid", "bg-grid-night", "bg-dots", "bg-hatch"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
