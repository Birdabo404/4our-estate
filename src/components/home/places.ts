import type { CityCount } from "@/lib/data/types";
import { type PhotoCategory, photosBy, type Photo } from "@/lib/photography/catalog";

/** How a city is known to buyers, which can differ from its municipality. */
type PlaceSpec = { name: string; note: string; category: PhotoCategory; pick?: number; lat: number; lng: number };

const PLACE_BY_CITY: Partial<Record<string, PlaceSpec>> = {
  Makati: { name: "Makati", note: "Forbes Park, Dasmariñas, Rockwell", category: "place-makati", pick: 2, lat: 14.5547, lng: 121.0244 },
  Taguig: { name: "Bonifacio Global City", note: "Towers along the High Street grid", category: "place-bgc", pick: 1, lat: 14.5509, lng: 121.0503 },
  "General Luna": { name: "Siargao", note: "Cloud 9 and the coconut coast", category: "place-siargao", lat: 9.7861, lng: 126.1556 },
  Malay: { name: "Boracay", note: "Hillside villas above the coves", category: "place-boracay", pick: 2, lat: 11.9674, lng: 121.9248 },
  "El Nido": { name: "El Nido", note: "Karst bays of northern Palawan", category: "place-palawan", lat: 11.1956, lng: 119.4075 },
  Tagaytay: { name: "Tagaytay", note: "The ridge above Taal Lake", category: "place-tagaytay", lat: 14.1153, lng: 120.9621 },
  "Cebu City": { name: "Cebu", note: "The city and the Visayan islands", category: "place-cebu", pick: 2, lat: 10.3157, lng: 123.8854 },
  Baguio: { name: "Baguio", note: "Pine country in the Cordillera", category: "place-baguio", lat: 16.4023, lng: 120.596 },
};

export type Place = {
  city: string;
  province: string;
  count: number;
  name: string;
  note: string;
  photo: Photo;
  lat: number;
  lng: number;
};

/** Cities with photography become places; the rest are named in a closing line. */
export function toPlaces(cities: readonly CityCount[]): { places: Place[]; others: CityCount[] } {
  const places: Place[] = [];
  const others: CityCount[] = [];
  for (const city of cities) {
    const spec = PLACE_BY_CITY[city.name];
    const photo = spec ? photosBy(spec.category)[spec.pick ?? 0] : undefined;
    if (spec && photo) places.push({ city: city.name, province: city.province, count: city.count, name: spec.name, note: spec.note, photo, lat: spec.lat, lng: spec.lng });
    else others.push(city);
  }
  return { places, others };
}
