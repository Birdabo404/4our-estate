import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ease, type EaseName } from "../../src/lib/motion";

type Use = "text" | "large" | "ui";

const MIN_RATIO: Record<Use, number> = { text: 4.5, large: 3, ui: 3 };

const PAIRS: ReadonlyArray<{ fg: string; bg: string; use: Use; role: string }> = [
  { fg: "ink", bg: "paper", use: "text", role: "Body and headings" },
  { fg: "ink-soft", bg: "paper", use: "text", role: "Secondary copy" },
  { fg: "ink-muted", bg: "paper", use: "text", role: "Meta, captions, eyebrows" },
  { fg: "ink-muted", bg: "paper-raised", use: "text", role: "Meta inside panels" },
  { fg: "ink-muted", bg: "paper-sunken", use: "text", role: "Meta on sunken wells" },
  { fg: "accent", bg: "paper", use: "text", role: "Accent text, links" },
  { fg: "accent", bg: "paper-raised", use: "text", role: "Accent text in panels" },
  { fg: "accent", bg: "paper", use: "ui", role: "Focus ring on paper" },
  { fg: "paper", bg: "ink", use: "text", role: "Primary button label" },
  { fg: "on-night", bg: "night", use: "text", role: "Footer and overlays" },
  { fg: "on-night-muted", bg: "night", use: "text", role: "Footer meta" },
  { fg: "accent-soft", bg: "night", use: "text", role: "Accent on night" },
  { fg: "accent", bg: "night", use: "ui", role: "Focus ring on night" },
  { fg: "positive", bg: "paper", use: "text", role: "Positive status" },
  { fg: "danger", bg: "paper", use: "text", role: "Field errors" },
  { fg: "danger", bg: "paper-raised", use: "text", role: "Field errors in panels" },
];

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing token --${name} in globals.css`);
  return match[1].trim();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const failures: string[] = [];

console.log("| Foreground | Background | Ratio | Needs | Role |");
console.log("| --- | --- | --- | --- | --- |");
for (const { fg, bg, use, role } of PAIRS) {
  const fgHex = token(`color-${fg}`);
  const bgHex = token(`color-${bg}`);
  const ratio = contrast(fgHex, bgHex);
  const needed = MIN_RATIO[use];
  const pass = ratio >= needed;
  if (!pass) failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)} < ${needed}`);
  console.log(
    `| \`${fg}\` ${fgHex} | \`${bg}\` ${bgHex} | ${ratio.toFixed(2)}:1 | ${needed}:1 ${pass ? "pass" : "FAIL"} | ${role} |`,
  );
}

for (const name of Object.keys(ease) as EaseName[]) {
  const fromCss = token(`ease-${name}`).replace(/\s+/g, "");
  const fromTs = `cubic-bezier(${ease[name].join(",")})`;
  if (fromCss !== fromTs) failures.push(`--ease-${name} is ${fromCss}, motion.ts says ${fromTs}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} token check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`\nAll ${PAIRS.length} contrast pairs pass and ${Object.keys(ease).length} eases match motion.ts.`);
