import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { PHOTOS, photosBy, type PhotoCategory } from "../../src/lib/photography/catalog";
import { WORK_DIR, readCandidates } from "./unsplash";

// Usage:
//   tsx sheet.ts candidates <category> [page]   numbered review sheet of scraped candidates
//   tsx sheet.ts zoom <category> <index...>     larger tiles of shortlisted candidates
//   tsx sheet.ts catalog <category...> <name>   sheet of curated photos, e.g. heroes and places

type Tile = { id: string; label: string; src: string };

const TILES_PER_SHEET = 30;
const PH = /philippines|pilipinas/i;

function candidateTiles(category: string): Tile[] {
  const pool = readCandidates().filter((c) => c.category === category);
  const filtered = category.startsWith("place-") ? pool.filter((c) => PH.test(`${c.location} ${c.alt}`)) : pool;
  return filtered
    .sort((a, b) => b.likes - a.likes)
    .map((c, i) => ({
      id: c.id,
      label: `${i} · ${c.width}×${c.height} · ${c.location ?? c.query}`,
      src: `https://images.unsplash.com/${c.id}?w=420&q=60`,
    }));
}

function catalogTiles(categories: string[]): Tile[] {
  const photos = categories.length ? categories.flatMap((c) => photosBy(c as PhotoCategory)) : PHOTOS;
  return photos.map((p) => ({
    id: p.id,
    label: `${p.category} · ${p.id.slice(6, 19)} · ${p.tone}`,
    src: `https://images.unsplash.com/${p.id}?w=420&q=60`,
  }));
}

async function render(tiles: Tile[], name: string, columns = 6, tileWidth = 280) {
  // Image viewers cache by path, so every render gets a fresh filename.
  const out = `${WORK_DIR}/sheets/${name}-${Date.now().toString(36)}.jpg`;
  const tileHeight = Math.round(tileWidth / 1.5);
  const html = `<!doctype html><html><body style="margin:0;background:#111;font:12px/1.3 system-ui;color:#ddd">
    <div style="display:grid;grid-template-columns:repeat(${columns},${tileWidth}px);gap:8px;padding:8px">
    ${tiles
      .map(
        (t) => `<figure style="margin:0"><div style="width:${tileWidth}px;height:${tileHeight}px;background:#000;display:flex">
          <img src="${t.src}" style="max-width:100%;max-height:100%;margin:auto"></div>
          <figcaption style="padding:3px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</figcaption></figure>`,
      )
      .join("")}
    </div></body></html>`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: columns * (tileWidth + 8) + 8, height: 800 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  for (let attempt = 0; attempt < 3; attempt++) {
    const broken = await page.evaluate(
      `Array.from(document.images).filter((i) => i.naturalWidth === 0).map((i) => (i.src = i.src + "&retry=${attempt}")).length`,
    );
    if (!broken) break;
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: out, fullPage: true, type: "jpeg", quality: 82 });
  await browser.close();
  console.log(`${out} (${tiles.length} tiles)`);
}

async function main() {
  const [mode, ...rest] = process.argv.slice(2);
  mkdirSync(`${WORK_DIR}/sheets`, { recursive: true });
  if (mode === "candidates") {
    const [category, page = "0"] = rest;
    const start = Number(page) * TILES_PER_SHEET;
    const tiles = candidateTiles(category);
    writeFileSync(`${WORK_DIR}/sheets/${category}.json`, JSON.stringify(tiles.map((t) => t.id)));
    console.log(`${category}: ${tiles.length} eligible candidates`);
    await render(tiles.slice(start, start + TILES_PER_SHEET), `${category}-${page}`);
  } else if (mode === "zoom") {
    const [category, ...indices] = rest;
    const tiles = candidateTiles(category).map((t) => ({ ...t, src: t.src.replace("w=420", "w=1200") }));
    const picked = indices.map((i) => tiles[Number(i)]);
    await render(picked, `${category}-zoom`, 3, 600);
  } else if (mode === "catalog") {
    const name = rest.pop()!;
    await render(catalogTiles(rest), name);
  } else {
    throw new Error("usage: sheet.ts candidates <category> [page] | zoom <category> <index...> | catalog <category...> <name>");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
