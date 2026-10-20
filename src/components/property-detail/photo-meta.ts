import type { PropertyImage } from "@/lib/domain/types";
import { PHOTOS } from "@/lib/photography/catalog";

export type GalleryImage = PropertyImage & { ratio: number };

const FALLBACK_RATIO = 3 / 2;

const RATIO_BY_ID = new Map(PHOTOS.map((photo) => [photo.id, photo.width / photo.height]));

function catalogRatio(url: string): number {
  const id = url.match(/photo-[0-9a-f]+-[0-9a-f]+/)?.[0];
  return (id && RATIO_BY_ID.get(id)) || FALLBACK_RATIO;
}

/** Agent uploads have no catalog entry, so they fall back to 3:2 until the schema stores dimensions. */
export function withRatios(images: readonly PropertyImage[]): GalleryImage[] {
  return images.map((image) => ({ ...image, ratio: catalogRatio(image.url) }));
}

export type GalleryRow =
  | { kind: "wide"; image: GalleryImage; index: number }
  | { kind: "pair"; images: [GalleryImage, GalleryImage]; indexes: [number, number] }
  | { kind: "single"; image: GalleryImage; index: number; align: "start" | "end" };

const isLandscape = (image: GalleryImage) => image.ratio >= 1.15;

/** Landscapes run the full column, portraits pair up at equal height, a lone portrait sits off-centre. */
export function galleryRows(images: readonly GalleryImage[], offset: number): GalleryRow[] {
  const rows: GalleryRow[] = [];
  let singles = 0;
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const next = images[i + 1];
    if (isLandscape(image)) {
      rows.push({ kind: "wide", image, index: i + offset });
    } else if (next && !isLandscape(next)) {
      rows.push({ kind: "pair", images: [image, next], indexes: [i + offset, i + 1 + offset] });
      i++;
    } else {
      rows.push({ kind: "single", image, index: i + offset, align: singles++ % 2 === 0 ? "end" : "start" });
    }
  }
  return rows;
}

const SENTENCE = /(?<=[.!?])\s+(?=[A-Z])/;

export function splitDescription(description: string): { lead: string; body: string[] } {
  const paragraphs = description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const [first = "", ...rest] = paragraphs;
  const sentences = first.split(SENTENCE);
  if (rest.length === 0 && sentences.length > 4) {
    return { lead: sentences.slice(0, 2).join(" "), body: [sentences.slice(2).join(" ")] };
  }
  return { lead: first, body: rest };
}
