import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium, type ConsoleMessage, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp/shots/fe-app";
const PHOTO = "/tmp/fe-app-photo.jpg";
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const stamp = Date.now().toString(36);
const buyerEmail = `e2e.buyer.${stamp}@4our.test`;
const agentSignupEmail = `e2e.agent.${stamp}@4our.test`;
const buyerPassword = "Harbor!2026";
const listingTitle = `E2E Casa ${stamp}`;
const agentEmail = "isabel.santos@4our.estate";
const adminEmail = "admin@4our.estate";
const demoPassword = "Estate!2026";

const created = { propertyId: "" };

const errors: string[] = [];

function watch(page: Page) {
  const ignore = (text: string) =>
    text.includes("favicon") ||
    text.includes("Download the React DevTools") ||
    text.includes("React DevTools");

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignore(text)) return;
    errors.push(`console: ${text}`);
  });
  page.on("pageerror", (err) => {
    if (ignore(err.message)) return;
    errors.push(`pageerror: ${err.message}`);
  });
}

async function shot(page: Page, name: string, prepare?: () => Promise<void>) {
  for (const [label, viewport] of [
    ["1440", DESKTOP],
    ["390", MOBILE],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready);
    if (prepare) await prepare();
    await page.waitForTimeout(250);
    const path = join(OUT, `${name}-${label}.png`);
    await page.screenshot({ path, fullPage: false });
    console.log(`saved ${path}`);
  }
  await page.setViewportSize(DESKTOP);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard\/(buyer|agent|admin)/, { timeout: 30000 });
}

async function signOut(page: Page) {
  await page.setViewportSize(DESKTOP);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 20000 });
}

async function savePhoto() {
  const response = await fetch(
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=70&auto=format&fit=crop",
  );
  if (!response.ok) throw new Error(`Could not download a photograph (${response.status}).`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000) throw new Error("The downloaded photograph is too small.");
  writeFileSync(PHOTO, bytes);
}

function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function psql(statement: string) {
  execFileSync(
    "docker",
    ["exec", "estate-postgres", "psql", "-U", "estate", "-d", "estate", "-v", "ON_ERROR_STOP=1", "-c", statement],
    { stdio: "inherit" },
  );
}

async function cleanup() {
  const emails = [buyerEmail, agentSignupEmail].map(sqlText).join(", ");
  if (created.propertyId) {
    const id = sqlText(created.propertyId);
    psql(`DELETE FROM inquiries WHERE "propertyId" = ${id};`);
    psql(`DELETE FROM properties WHERE id = ${id};`);
    console.log(`cleanup removed property ${created.propertyId}`);
  }
  psql(`DELETE FROM users WHERE email IN (${emails});`);
  console.log(`cleanup removed ${buyerEmail} and ${agentSignupEmail}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await savePhoto();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  watch(page);

  try {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /welcome/i }).waitFor();
    await shot(page, "login");

    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /account/i }).waitFor();
    await shot(page, "signup-buyer");

    await page.goto(`${BASE}/signup?role=agent`, { waitUntil: "networkidle" });
    await page.getByLabel("Agency").waitFor();
    await shot(page, "signup-agent", async () => {
      await page.getByLabel("PRC license").scrollIntoViewIfNeeded();
    });

    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create account" }).click();
    await page.getByText("Enter your full name.").waitFor();
    await page.getByText("Enter a valid email.").waitFor();
    await page.locator("[id$='-error']").filter({ hasText: "Use 8 to 72 characters, including a letter and a number." }).waitFor();
    const described = await page.locator("[aria-invalid='true']").count();
    if (described < 1) throw new Error("Signup validation did not mark a field invalid.");

    await page.getByLabel(/full name/i).fill("Lila Mariposa");
    await page.getByLabel(/email/i).fill(buyerEmail);
    await page.getByLabel(/^password/i).fill(buyerPassword);
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard\/buyer/, { timeout: 30000 });
    await page.getByRole("heading", { level: 1 }).waitFor();
    await shot(page, "buyer-saved");

    await page.goto(`${BASE}/dashboard/admin`, { waitUntil: "networkidle" });
    await page.waitForURL(/\/dashboard\/buyer/, { timeout: 15000 });
    if (new URL(page.url()).pathname.startsWith("/dashboard/admin")) {
      throw new Error("A buyer was able to open the admin desk.");
    }

    await page.goto(`${BASE}/dashboard/buyer/inquiries`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Inquiries", exact: true }).waitFor();
    await shot(page, "buyer-inquiries");
    await page.goto(`${BASE}/dashboard/buyer/profile`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
    await shot(page, "buyer-profile");
    await signOut(page);

    await page.goto(`${BASE}/signup?role=agent`, { waitUntil: "networkidle" });
    await page.getByLabel(/full name/i).fill("Andres Bautista");
    await page.getByLabel(/email/i).fill(agentSignupEmail);
    await page.getByLabel(/^password/i).fill(buyerPassword);
    await page.getByLabel("Agency").fill("Harbor Desk");
    await page.getByLabel("PRC license").fill("PRC REB No. 0099111");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/dashboard\/agent/, { timeout: 30000 });
    await signOut(page);

    await signIn(page, agentEmail, demoPassword);
    await page.waitForURL(/\/dashboard\/agent$/);
    await shot(page, "agent-overview");
    await page.goto(`${BASE}/dashboard/agent/listings`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Listings", exact: true }).waitFor();
    await shot(page, "agent-listings");
    await page.goto(`${BASE}/dashboard/agent/inquiries`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Inquiries", exact: true }).waitFor();
    await shot(page, "agent-inquiries");

    await page.goto(`${BASE}/dashboard/agent/listings/new`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByText("Enter a title.").waitFor();
    await shot(page, "editor-errors");

    await page.locator('input[name="title"]').fill(listingTitle);
    await page.locator('input[name="pricePhp"]').fill("12500000");
    await page.locator('input[name="bedrooms"]').fill("3");
    await page.locator('input[name="bathrooms"]').fill("2");
    await page.locator('input[name="floorAreaSqm"]').fill("180");
    await page.locator('input[name="parkingSlots"]').fill("1");
    await page.locator('input[name="neighborhood"]').fill("Poblacion");
    await page.locator('input[name="city"]').fill("Makati");
    await page.locator('input[name="province"]').fill("Metro Manila");
    await page.locator('input[name="address"]').fill("1 Test Street");
    await page.locator('textarea[name="description"]').fill("A quiet test residence written for the end to end check.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.waitForURL(/\/dashboard\/agent\/listings\/[0-9a-f-]{36}/, { timeout: 30000 });
    created.propertyId = page.url().split("/").pop() ?? "";
    const slug = await page.locator("[data-listing-slug]").getAttribute("data-listing-slug");
    if (!slug) throw new Error("The editor did not expose a slug.");

    await page.locator("input[type=file]").setInputFiles(PHOTO);
    await page.getByText("Added", { exact: true }).waitFor({ timeout: 30000 });
    await page.locator('img[src*="localhost:4000/uploads"]').first().waitFor({ timeout: 30000 });

    await page.getByRole("button", { name: "Submit for review" }).click();
    await page.getByText("In review").waitFor({ timeout: 20000 });

    await page.goto(`${BASE}/dashboard/agent/listings`, { waitUntil: "networkidle" });
    const archive = page.getByRole("listitem").filter({ hasText: "Published" }).first().getByRole("button", { name: "Archive" });
    await archive.click();
    await page.getByRole("heading", { name: "Archive this residence?" }).waitFor();
    await shot(page, "confirm-archive");
    await page.getByRole("button", { name: "Keep it" }).click();
    await page.getByRole("heading", { name: "Archive this residence?" }).waitFor({ state: "hidden" });

    await signOut(page);
    await signIn(page, adminEmail, demoPassword);
    await page.waitForURL(/\/dashboard\/admin$/);
    await shot(page, "admin-overview");
    await page.goto(`${BASE}/dashboard/admin/users`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "People" }).waitFor();
    await shot(page, "admin-users");
    await page.goto(`${BASE}/dashboard/admin/moderation`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Moderation" }).waitFor();
    const pending = page.getByRole("listitem").filter({ hasText: listingTitle });
    await pending.waitFor({ timeout: 20000 });
    await shot(page, "admin-moderation");
    await pending.getByRole("button", { name: "Publish" }).click();
    await pending.waitFor({ state: "detached", timeout: 20000 });

    await signOut(page);
    await page.goto(`${BASE}/properties/${slug}`, { waitUntil: "networkidle" });
    await page.getByText(listingTitle).first().waitFor({ timeout: 20000 });
    console.log(`published ${slug}`);
  } finally {
    await browser.close();
    await cleanup();
  }

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    throw new Error(`${errors.length} console errors`);
  }
  console.log("e2e passed");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
