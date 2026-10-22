import { chromium, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:3301";
const PASSWORD = "Estate!2026";
const SLUG = "mock-lane-house-9473";
const TITLE = "Mock Lane House 9473";

async function signIn(page: Page, email: string) {
  await page.goto("/login", { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard\/(buyer|agent|admin)/, { timeout: 60_000 });
}

async function main() {
  const browser = await chromium.launch();
  const agent = await browser.newContext({ baseURL: BASE });
  const agentPage = await agent.newPage();
  await signIn(agentPage, "isabel.santos@4our.estate");
  await agentPage.goto("/dashboard/agent/listings/new", { waitUntil: "networkidle", timeout: 60_000 });
  await agentPage.getByLabel("Title").fill(TITLE);
  await agentPage.getByLabel("Slug").fill(SLUG);
  await agentPage.getByLabel("Price in pesos").fill("2500000");
  await agentPage.getByLabel("Bedrooms").fill("2");
  await agentPage.getByLabel("Bathrooms").fill("1");
  await agentPage.getByLabel("Floor area").fill("80");
  await agentPage.getByLabel("Parking").fill("1");
  await agentPage.getByLabel("Neighborhood").fill("Probe");
  await agentPage.getByRole("textbox", { name: /^City\b/ }).fill("Makati");
  await agentPage.getByLabel("Province").fill("Metro Manila");
  await agentPage.getByLabel("Street address").fill("2 Probe Street");
  await agentPage.getByLabel("Description").fill("A lane house kept so mock mode can publish a draft.");
  await agentPage.getByRole("button", { name: "Save draft" }).click();
  await agentPage.waitForURL(/\/dashboard\/agent\/listings\/[0-9a-f-]{36}$/, { timeout: 60_000 });
  await expect(agentPage.locator("[data-listing-slug]")).toHaveAttribute("data-listing-slug", SLUG);
  await agentPage.getByRole("button", { name: "Submit for review" }).click();
  await expect(agentPage.getByText("In review").first()).toBeVisible({ timeout: 30_000 });
  console.log("agent submitted the draft for review");
  await agent.close();

  const admin = await browser.newContext({ baseURL: BASE });
  const adminPage = await admin.newPage();
  await signIn(adminPage, "admin@4our.estate");
  await adminPage.goto("/dashboard/admin/moderation", { waitUntil: "networkidle", timeout: 60_000 });
  const row = adminPage.locator("li").filter({ hasText: TITLE });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(row).toHaveCount(0, { timeout: 30_000 });
  console.log("admin published the listing");
  await admin.close();

  const guest = await browser.newContext({ baseURL: BASE });
  const guestPage = await guest.newPage();
  const response = await guestPage.goto(`/properties/${SLUG}`, { waitUntil: "networkidle", timeout: 60_000 });
  expect(response?.status()).toBe(200);
  await expect(guestPage.getByRole("heading", { level: 1 })).toContainText(TITLE);
  console.log(`visitor sees ${SLUG}`);
  await guest.close();
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
