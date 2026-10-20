import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3101";
const OUT = process.env.SHOTS_DIR ?? "/tmp/shots/design";
const ROUTES = ["/styleguide", "/"] as const;
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

mkdirSync(OUT, { recursive: true });

const errors: string[] = [];

function slug(route: string): string {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
}

function watch(page: Page, label: string) {
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${label}] console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[${label}] pageerror: ${err.message}`));
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => Math.floor(window.innerHeight * 0.6));
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(2400);
}

async function shot(page: Page, name: string, fullPage = false) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage });
  console.log(`saved ${path}`);
}

async function main() {
  const browser = await chromium.launch();

  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const route of ROUTES) {
      const label = `${slug(route)}-${vpName}`;
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
      const page = await context.newPage();
      watch(page, label);
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await settle(page);
      await shot(page, `${label}-top`);
      await shot(page, `${label}-full`, true);

      if (route === "/") {
        await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: "instant" }));
        await page.waitForTimeout(1200);
        await shot(page, `${label}-nav-scrolled`);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(800);

        if (vpName === "mobile") {
          await page.getByRole("button", { name: "Open menu" }).click();
          await page.waitForTimeout(1600);
          await shot(page, `${label}-menu-open`);
          await page.keyboard.press("Escape");
          await page.waitForTimeout(900);
        } else {
          for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
          await page.waitForTimeout(500);
          await shot(page, `${label}-focus`);
        }
      }

      if (route === "/styleguide") {
        for (const id of await page.locator("main section[id]").evaluateAll((els) => els.map((el) => el.id))) {
          const path = join(OUT, `${label}-section-${id}.png`);
          await page.locator(`section#${id}`).screenshot({ path });
          console.log(`saved ${path}`);
        }
      }

      if (route === "/styleguide" && vpName === "desktop") {
        await page.locator("#fields").scrollIntoViewIfNeeded();
        await page.locator("#fields input[name=email]").focus();
        await page.waitForTimeout(600);
        await shot(page, `${label}-field-focus`);
        await page.getByRole("button", { name: "Open dialog" }).click();
        await page.waitForTimeout(1200);
        await shot(page, `${label}-dialog`);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(900);
      }

      await context.close();
    }
  }

  await browser.close();

  if (errors.length > 0) {
    console.error(`\n${errors.length} console error(s):\n${errors.join("\n")}`);
    process.exit(1);
  }
  console.log("\nNo console errors.");
}

void main();
