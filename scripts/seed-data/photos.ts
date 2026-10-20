import { access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

const photoSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  category: z.string().min(1),
  alt: z.string().min(1),
  photographer: z.string(),
  width: z.number(),
  height: z.number(),
  tone: z.string(),
});

export type CatalogPhoto = z.infer<typeof photoSchema>;

export async function loadCatalog(): Promise<CatalogPhoto[]> {
  const candidates = [
    process.env.PHOTO_CATALOG_PATH,
    path.join(process.cwd(), "src/lib/photography/catalog.ts"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  let catalogPath: string | null = null;
  for (const candidate of candidates) {
    try {
      await access(candidate);
      catalogPath = candidate;
      break;
    } catch {
      continue;
    }
  }
  if (!catalogPath) {
    throw new Error(
      "Photo catalog is missing. Merge ws/photos or set PHOTO_CATALOG_PATH to catalog.ts.",
    );
  }

  const imported = (await import(pathToFileURL(catalogPath).href)) as { PHOTOS?: unknown };
  const parsed = z.array(photoSchema).safeParse(imported.PHOTOS);
  if (!parsed.success) {
    throw new Error("Photo catalog does not match the expected PHOTOS shape.");
  }
  if (parsed.data.length < 24) {
    throw new Error(`Photo catalog has ${parsed.data.length} frames. Seed needs at least 24 unique covers.`);
  }
  return parsed.data;
}

export function sizedUrl(photo: CatalogPhoto): string {
  const base = photo.url.split("?")[0] ?? photo.url;
  return `${base}?auto=format&fit=crop&w=2000&q=80`;
}

export function assignPhotos<T extends { slug: string; photoCategories: string[]; imageCount: number }>(
  properties: T[],
  photos: CatalogPhoto[],
): Map<string, CatalogPhoto[]> {
  const covers = new Set<string>();
  const assigned = new Map<string, CatalogPhoto[]>();

  for (const property of properties) {
    const chosen: CatalogPhoto[] = [];
    const usedHere = new Set<string>();
    const taken = new Map<string, number>();

    const pickFrom = (category: string): CatalogPhoto | undefined =>
      photos.find(
        (photo) => photo.category === category && !covers.has(photo.id) && !usedHere.has(photo.id),
      );

    let cover: CatalogPhoto | undefined;
    for (const category of property.photoCategories) {
      cover = pickFrom(category);
      if (cover) break;
    }
    cover ??= photos.find((photo) => !covers.has(photo.id));
    if (!cover) {
      throw new Error(`No unique cover left for ${property.slug}.`);
    }
    chosen.push(cover);
    covers.add(cover.id);
    usedHere.add(cover.id);
    taken.set(cover.category, 1);

    while (chosen.length < property.imageCount) {
      const ranked = property.photoCategories
        .map((category, index) => ({ category, index, count: taken.get(category) ?? 0 }))
        .sort((left, right) => left.count - right.count || left.index - right.index);
      let next: CatalogPhoto | undefined;
      for (const item of ranked) {
        next = pickFrom(item.category);
        if (next) break;
      }
      next ??= photos.find((photo) => !covers.has(photo.id) && !usedHere.has(photo.id));
      if (!next) break;
      chosen.push(next);
      usedHere.add(next.id);
      taken.set(next.category, (taken.get(next.category) ?? 0) + 1);
    }

    if (chosen.length < 4) {
      throw new Error(
        `${property.slug} received ${chosen.length} photos. Each listing needs 4 to 6, and covers cannot be reused.`,
      );
    }
    assigned.set(property.slug, chosen.slice(0, 6));
  }

  if (covers.size !== properties.length) {
    throw new Error("Cover images are not unique.");
  }
  return assigned;
}
