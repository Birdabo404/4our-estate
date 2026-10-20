/**
 * End-to-end pass over the public screens against a running dev server.
 *
 *   npx next dev -p 3201
 *   node --env-file=.env.local --import tsx scripts/e2e/public.ts
 *
 * Writes screenshots to /tmp/shots/fe-public/. Shares the seeded database with
 * other work, so it only adds uniquely addressed inquiries and restores any
 * favorite it toggles.
 */
import { mkdirSync } from "node:fs";
import { type Browser, type BrowserContext, chromium, expect, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

const BASE = process.env.E2E_BASE ?? "http://localhost:3201";
const OUT = "/tmp/shots/fe-public";
const BUYER = { email: "camille.uy@4our.estate", password: "Estate!2026" };
const SLUGS = { sale: "forbes-park-acacia-house", rent: "bgc-high-street-lease", sold: "mactan-newtown-beachfront" } as const;

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
} as const;
type ViewportName = keyof typeof VIEWPORTS;

const SCREENS = [
  { name: "home", path: "/" },
  { name: "listings", path: "/properties" },
  { name: "listings-rent", path: "/properties?listingType=rent" },
  { name: "listings-empty", path: "/properties?q=observatory&propertyType=lot&listingType=rent" },
  { name: "detail-sale", path: `/properties/${SLUGS.sale}` },
  { name: "detail-rent", path: `/properties/${SLUGS.rent}` },
  { name: "detail-sold", path: `/properties/${SLUGS.sold}` },
] as const;

const HIDE_DEV_OVERLAY = "nextjs-portal { display: none !important; }";

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];
const consoleErrors: string[] = [];

async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`  pass  ${name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
    results.push({ name, ok: false, detail });
    console.log(`  FAIL  ${name}\n        ${detail}`);
  }
}

async function newContext(browser: Browser, name: ViewportName): Promise<BrowserContext> {
  const context = await browser.newContext({ ...VIEWPORTS[name], baseURL: BASE });
  await context.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.append(style);
    });
  }, HIDE_DEV_OVERLAY);
  context.on("page", (page) => watchConsole(page, name));
  return context;
}

function watchConsole(page: Page, label: string) {
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`[${label}] ${page.url()} ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`[${label}] ${page.url()} ${error.message}`));
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(2200);
}

async function shoot(page: Page, name: string, viewport: ViewportName) {
  await page.screenshot({ path: `${OUT}/${name}-${viewport}.png` });
  await page.screenshot({ path: `${OUT}/${name}-${viewport}-full.png`, fullPage: true });
}

async function captureScreens(context: BrowserContext, viewport: ViewportName) {
  const page = await context.newPage();
  for (const screen of SCREENS) {
    await check(`${viewport}: ${screen.name} renders`, async () => {
      const response = await page.goto(screen.path, { waitUntil: "networkidle" });
      expect(response?.status(), `status for ${screen.path}`).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await settle(page);
      await shoot(page, screen.name, viewport);
    });
  }

  await check(`${viewport}: lightbox opens from the hero and closes with Escape`, async () => {
    await page.goto(`/properties/${SLUGS.sale}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const opener = page.getByRole("button", { name: /^View \d+ photographs$/ });
    await opener.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/lightbox-${viewport}.png` });
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("02 /");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
  await page.close();
}

async function checkMissingResidence(browser: Browser) {
  await check("detail: a missing residence answers 404 with the editorial not-found", async () => {
    const response = await fetch(`${BASE}/properties/not-a-real-house`);
    expect(response.status).toBe(404);
    // Chromium logs a failed-resource error for any 404 document, so this page stays outside the console watch.
    const page = await browser.newPage({ ...VIEWPORTS.desktop, baseURL: BASE });
    await page.goto("/properties/not-a-real-house", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: HIDE_DEV_OVERLAY });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("no longer");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/not-found-desktop.png` });
    await page.close();
  });
}

function resultCount(page: Page) {
  return page.locator('p[aria-live="polite"] .tabular').first();
}

async function checkFilters(context: BrowserContext) {
  const page = await context.newPage();
  await check("filters: listing type updates the URL and the results", async () => {
    await page.goto("/properties", { waitUntil: "networkidle" });
    const before = Number(await resultCount(page).innerText());
    await page.getByRole("radio", { name: "Lease" }).first().check({ force: true });
    await expect(page).toHaveURL(/listingType=rent/);
    await expect(resultCount(page)).not.toHaveText(String(before));
    const after = Number(await resultCount(page).innerText());
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
    await expect(page.getByRole("button", { name: "Remove filter: For lease" })).toBeVisible();
  });

  await check("filters: keyword search is debounced into the URL", async () => {
    await page.getByRole("searchbox").first().fill("Makati");
    await expect(page).toHaveURL(/q=Makati/);
    await expect(page.getByRole("button", { name: "Remove filter: “Makati”" })).toBeVisible();
  });

  await check("filters: clear all returns the full collection", async () => {
    await page.getByRole("button", { name: "Clear all" }).first().click();
    await expect(page).toHaveURL(/\/properties$/);
  });

  await check("filters: an impossible search shows the editorial empty state", async () => {
    await page.goto("/properties?q=observatory&propertyType=lot&listingType=rent", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Nothing in the collection matches, yet" })).toBeVisible();
  });
  await page.close();
}

async function checkInquiry(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(`/properties/${SLUGS.sale}`, { waitUntil: "networkidle" });
  const form = page.locator("aside").getByRole("form", { name: /Inquire about/ });

  await check("inquiry: an empty submit shows inline errors and focuses the first", async () => {
    await form.getByRole("button", { name: "Send inquiry" }).click();
    await expect(form.getByText("Enter your name.")).toBeVisible();
    await expect(form.getByText("Enter a valid email.")).toBeVisible();
    await expect(form.getByText("Write at least 20 characters.")).toBeVisible();
    await expect(form.locator('[name="name"]')).toBeFocused();
    await page.screenshot({ path: `${OUT}/inquiry-errors-desktop.png` });
  });

  await check("inquiry: a past viewing date is refused", async () => {
    await form.locator('[name="preferredViewingDate"]').fill("2020-01-01");
    await form.getByRole("button", { name: "Send inquiry" }).click();
    await expect(form.getByText("Choose today or a later date.")).toBeVisible();
    await form.locator('[name="preferredViewingDate"]').fill("");
  });

  await check("inquiry: a valid note is sent and confirmed", async () => {
    await form.locator('[name="name"]').fill("Marisol Ocampo");
    await form.locator('[name="email"]').fill(`e2e+${Date.now()}@example.com`);
    await form.locator('[name="phone"]').fill("0917 555 0199");
    await form.locator('[name="message"]').fill("We would like to see the house on a weekday morning, ideally before the rains.");
    await form.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.locator("aside").getByText(/Your note is with/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Inquiry sent")).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/inquiry-sent-desktop.png` });
  });
  await page.close();
}

async function checkGuestFavorite(context: BrowserContext) {
  const page = await context.newPage();
  await check("favorites: a guest is invited to sign in and come back", async () => {
    await page.goto("/properties", { waitUntil: "networkidle" });
    await page.locator("main button[aria-pressed]").first().click();
    const prompt = page.getByRole("status").filter({ hasText: "Sign in to save residences" });
    await expect(prompt).toBeVisible();
    await expect(prompt.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login?next=%2Fproperties");
  });
  await page.close();
}

/** Signs in through the same cookie format the app's server client reads. */
async function buyerCookies() {
  const jar = new Map<string, string>();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await supabase.auth.signInWithPassword(BUYER);
  if (error) throw new Error(`Buyer sign-in failed: ${error.message}`);
  await new Promise((resolve) => setTimeout(resolve, 50));
  const host = new URL(BASE).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", sameSite: "Lax" as const }));
}

async function checkMemberFavorite(browser: Browser) {
  const context = await newContext(browser, "desktop");
  await context.addCookies(await buyerCookies());
  const page = await context.newPage();
  const button = () => page.locator("main button[aria-pressed]").first();

  await check("favorites: a buyer's toggle persists across a reload", async () => {
    await page.goto("/properties", { waitUntil: "networkidle" });
    const initial = await button().getAttribute("aria-pressed");
    const flipped = initial === "true" ? "false" : "true";
    await button().click();
    await expect(button()).toHaveAttribute("aria-pressed", flipped);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: "networkidle" });
    await expect(button()).toHaveAttribute("aria-pressed", flipped);

    await button().click();
    await expect(button()).toHaveAttribute("aria-pressed", initial ?? "false");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: "networkidle" });
    await expect(button()).toHaveAttribute("aria-pressed", initial ?? "false");
  });

  await check("inquiry: a signed-in buyer sees their name and email prefilled", async () => {
    await page.goto(`/properties/${SLUGS.rent}`, { waitUntil: "networkidle" });
    const form = page.locator("aside").getByRole("form", { name: /Inquire about/ });
    await expect(form.locator('[name="email"]')).toHaveValue(BUYER.email);
    await expect(form.locator('[name="name"]')).not.toHaveValue("");
  });
  await context.close();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  console.log(`Public screens against ${BASE}`);

  for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
    const context = await newContext(browser, viewport);
    await captureScreens(context, viewport);
    await context.close();
  }

  await checkMissingResidence(browser);

  const desktop = await newContext(browser, "desktop");
  await checkFilters(desktop);
  await checkInquiry(desktop);
  await checkGuestFavorite(desktop);
  await desktop.close();
  await checkMemberFavorite(browser);

  await check("no console errors on any page", async () => {
    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots in ${OUT}.`);
  if (consoleErrors.length > 0) console.log(consoleErrors.join("\n"));
  process.exitCode = failed.length > 0 ? 1 : 0;
}

void main();
