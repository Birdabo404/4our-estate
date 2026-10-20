import { PHOTOS } from "./photos";

export { PHOTOS };

export const PHOTO_CATEGORIES = [
  "hero",
  "exterior-tropical-modern",
  "exterior-contemporary",
  "exterior-classic",
  "condo-tower",
  "interior-living",
  "interior-kitchen",
  "interior-dining",
  "interior-bedroom",
  "interior-bath",
  "pool",
  "view-sea",
  "view-city",
  "view-highland",
  "land-lot",
  "detail",
  "place-makati",
  "place-bgc",
  "place-cebu",
  "place-siargao",
  "place-boracay",
  "place-palawan",
  "place-tagaytay",
  "place-baguio",
  "place-la-union",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export type PhotoTone = "warm" | "neutral" | "cool";

export type Photo = {
  /** Unsplash CDN id, e.g. "photo-1600596542815-ffad4c1539a9". */
  id: string;
  /** Bare CDN URL with no query string. Use `photoUrl` to size it. */
  url: string;
  category: PhotoCategory;
  alt: string;
  photographer: string;
  width: number;
  height: number;
  tone: PhotoTone;
};

const byCategory = new Map<PhotoCategory, Photo[]>(
  PHOTO_CATEGORIES.map((category) => [category, []]),
);
for (const photo of PHOTOS) byCategory.get(photo.category)!.push(photo);

export function photosBy(category: PhotoCategory): readonly Photo[] {
  return byCategory.get(category)!;
}

export function photoUrl(photo: Photo, width: number, quality = 75): string {
  return `${photo.url}?w=${Math.round(width)}&q=${quality}&auto=format&fit=crop`;
}
