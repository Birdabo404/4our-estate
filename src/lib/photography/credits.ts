import { PHOTO_CATEGORIES, PHOTOS, type Photo, type PhotoCategory } from "./catalog";

export const UNSPLASH_HREF = "https://unsplash.com/?utm_source=4our_estate&utm_medium=referral";
export const UNSPLASH_LICENSE_HREF = "https://unsplash.com/license?utm_source=4our_estate&utm_medium=referral";

export function categoryLabel(category: PhotoCategory): string {
  switch (category) {
    case "hero":
      return "Hero";
    case "exterior-tropical-modern":
      return "Tropical modern";
    case "exterior-contemporary":
      return "Contemporary";
    case "exterior-classic":
      return "Classic";
    case "condo-tower":
      return "Towers";
    case "interior-living":
      return "Living";
    case "interior-kitchen":
      return "Kitchen";
    case "interior-dining":
      return "Dining";
    case "interior-bedroom":
      return "Bedroom";
    case "interior-bath":
      return "Bath";
    case "pool":
      return "Pool";
    case "view-sea":
      return "Sea";
    case "view-city":
      return "City";
    case "view-highland":
      return "Highlands";
    case "land-lot":
      return "Land";
    case "detail":
      return "Detail";
    case "place-makati":
      return "Makati";
    case "place-bgc":
      return "BGC";
    case "place-cebu":
      return "Cebu";
    case "place-siargao":
      return "Siargao";
    case "place-boracay":
      return "Boracay";
    case "place-palawan":
      return "Palawan";
    case "place-tagaytay":
      return "Tagaytay";
    case "place-baguio":
      return "Baguio";
    case "place-la-union":
      return "La Union";
    default: {
      const unhandled: never = category;
      return unhandled;
    }
  }
}

export type CreditGroup = {
  category: PhotoCategory;
  label: string;
  photos: Photo[];
};

export type PhotographerCredit = {
  name: string;
  count: number;
  categories: CreditGroup[];
};

export const PHOTOGRAPHER_COUNT = new Set(PHOTOS.map((photo) => photo.photographer)).size;

export function photographerCredits(): PhotographerCredit[] {
  const byName = new Map<string, Photo[]>();
  for (const photo of PHOTOS) {
    const list = byName.get(photo.photographer);
    if (list) list.push(photo);
    else byName.set(photo.photographer, [photo]);
  }

  return [...byName.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .map(([name, photos]) => {
      const byCategory = new Map<PhotoCategory, Photo[]>();
      for (const photo of photos) {
        const list = byCategory.get(photo.category);
        if (list) list.push(photo);
        else byCategory.set(photo.category, [photo]);
      }
      const categories = PHOTO_CATEGORIES.flatMap((category) => {
        const photosInCategory = byCategory.get(category);
        if (!photosInCategory) return [];
        return [{ category, label: categoryLabel(category), photos: photosInCategory }];
      });
      return { name, count: photos.length, categories };
    });
}
