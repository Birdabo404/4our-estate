import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-1", "display-2", "display-3", "heading", "title", "lead", "body", "small", "micro"],
      ease: ["settle", "reveal", "exit"],
      shadow: ["float", "lift", "hairline"],
      radius: ["photo", "field", "panel"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
