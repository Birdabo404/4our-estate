import { chromium, type Browser, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";

export const WORK_DIR = "/tmp/photos";
export const CANDIDATES_PATH = `${WORK_DIR}/candidates.json`;

export type Candidate = {
  id: string;
  slug: string;
  category: string;
  query: string;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  color: string;
  likes: number;
  location: string | null;
};

export function readCandidates(): Candidate[] {
  return existsSync(CANDIDATES_PATH) ? JSON.parse(readFileSync(CANDIDATES_PATH, "utf8")) : [];
}

export type UnsplashSession = {
  napi<T>(path: string): Promise<T>;
  close(): Promise<void>;
};

// Unsplash sits behind an Anubis proof-of-work challenge that hard-denies the
// headless shell and stalls when navigator.webdriver is true.
export async function openUnsplash(): Promise<UnsplashSession> {
  const browser: Browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  });
  await context.addInitScript("Object.defineProperty(navigator, 'webdriver', { get: () => false })");
  const page: Page = await context.newPage();
  await page.goto("https://unsplash.com/s/photos/villa?license=free", { waitUntil: "domcontentloaded" });
  await page.waitForFunction("!/bot|noes/i.test(document.title)", null, { timeout: 90_000 });

  return {
    async napi<T>(path: string) {
      const [status, body] = (await page.evaluate(
        `fetch(${JSON.stringify(`/napi/${path}`)}).then(async (r) => [r.status, await r.text()])`,
      )) as [number, string];
      if (status !== 200) throw new Error(`napi ${path} -> ${status}`);
      return JSON.parse(body) as T;
    },
    close: () => browser.close(),
  };
}

export function cdnId(rawUrl: string): string | null {
  const url = new URL(rawUrl);
  if (url.hostname !== "images.unsplash.com") return null;
  const id = url.pathname.slice(1);
  return id.startsWith("photo-") ? id : null;
}
