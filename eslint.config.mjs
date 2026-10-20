import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/*
 * Motion ownership (DESIGN.md, "Motion"). GSAP is registered once in
 * src/lib/gsap.ts and imported from there; Anime.js lives only in the
 * src/components/motion primitives. ESLint replaces rule options per
 * matching config rather than merging them, so each file set below lists
 * its complete ban.
 */
const GSAP_BAN = [
  { name: "gsap", message: "Import { gsap, ScrollTrigger, useGSAP } from \"@/lib/gsap\" so plugins and eases are registered once." },
  { name: "@gsap/react", message: "Import { useGSAP } from \"@/lib/gsap\"." },
];
const GSAP_PATTERN = { group: ["gsap/*"], message: "Import GSAP plugins via \"@/lib/gsap\"." };
const ANIME_BAN = {
  name: "animejs",
  message: "Anime.js owns SVG and type sequencing only. Use SplitHeading, CountUp, or Wordmark from @/components/motion.",
};

const EASE_LITERAL = String.raw`/cubic-bezier\(|\bease-(in|out|in-out|linear)\b|\beaseInOut\b/`;
const EASE_MESSAGE = "Use the shared eases: `ease`/`tween`/`spring` from @/lib/motion or the ease-settle/ease-reveal/ease-exit classes.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/gsap.ts", "src/components/motion/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: [...GSAP_BAN, ANIME_BAN], patterns: [GSAP_PATTERN] }],
    },
  },
  {
    files: ["src/components/motion/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: GSAP_BAN, patterns: [GSAP_PATTERN] }],
    },
  },
  {
    files: ["src/lib/gsap.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [ANIME_BAN] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/motion.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${EASE_LITERAL}]`, message: EASE_MESSAGE },
        { selector: `TemplateElement[value.raw=${EASE_LITERAL}]`, message: EASE_MESSAGE },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
