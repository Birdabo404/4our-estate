import { mkdirSync, writeFileSync } from "node:fs";
import { PHOTO_CATEGORIES, type PhotoCategory } from "../../src/lib/photography/catalog";
import { CANDIDATES_PATH, WORK_DIR, cdnId, openUnsplash, readCandidates, type Candidate } from "./unsplash";

const QUERIES: Record<PhotoCategory, readonly string[]> = {
  hero: [
    "modern house dusk",
    "tropical villa ocean",
    "luxury villa night",
    "villa infinity pool sunset",
    "minimalist architecture dusk",
    "house over water",
    "modern villa twilight",
  ],
  "exterior-tropical-modern": [
    "tropical modern house",
    "bali villa architecture",
    "tropical villa exterior",
    "modern house palm trees",
    "resort villa",
  ],
  "exterior-contemporary": [
    "contemporary house exterior",
    "modern minimalist house",
    "modern concrete house",
    "modern house glass facade",
  ],
  "exterior-classic": [
    "vigan",
    "bahay na bato",
    "hacienda house",
    "spanish villa",
    "spanish colonial house",
    "mediterranean villa",
    "classic mansion exterior",
    "heritage house",
    "colonial architecture house",
  ],
  "condo-tower": [
    "residential tower",
    "luxury condominium building",
    "high rise apartment facade",
    "residential skyscraper",
  ],
  "interior-living": [
    "minimal living room natural light",
    "luxury living room",
    "modern living room interior",
    "living room wood interior",
    "japandi living room",
    "wabi sabi interior",
    "tropical living room",
    "living room ocean view",
  ],
  "interior-kitchen": [
    "modern kitchen interior",
    "luxury kitchen marble",
    "minimalist kitchen wood",
    "japandi kitchen",
    "kitchen island natural light",
  ],
  "interior-dining": [
    "dining room interior",
    "modern dining table interior",
    "luxury dining room",
    "japandi dining",
    "dining table natural light",
  ],
  "interior-bedroom": [
    "minimal bedroom interior",
    "luxury bedroom",
    "hotel bedroom natural light",
    "japandi bedroom",
    "tropical villa bedroom",
    "linen bed natural light",
  ],
  "interior-bath": [
    "luxury bathroom",
    "modern bathroom interior",
    "stone bathtub",
    "minimal bathroom",
    "travertine bathroom",
    "tropical outdoor bathroom",
  ],
  pool: ["infinity pool", "villa pool", "swimming pool modern house", "tropical pool"],
  "view-sea": ["ocean view from villa", "sea view terrace", "calm sea horizon", "tropical sea aerial"],
  "view-city": ["city view apartment window", "city skyline night window", "manila skyline", "penthouse view"],
  "view-highland": ["taal volcano", "misty mountains pine forest", "highland mist morning", "cordillera mountains"],
  "land-lot": ["open land aerial", "rice field aerial", "coconut plantation", "empty field green", "hillside lot"],
  detail: [
    "wood texture interior",
    "travertine texture",
    "architectural shadow",
    "linen texture light",
    "concrete texture shadow",
    "rattan texture",
  ],
  "place-makati": ["makati", "makati skyline", "makati city"],
  "place-bgc": ["bonifacio global city", "bgc taguig", "taguig"],
  "place-cebu": ["cebu", "cebu city", "moalboal", "oslob cebu"],
  "place-siargao": ["siargao", "siargao island", "general luna siargao"],
  "place-boracay": ["boracay", "white beach boracay"],
  "place-palawan": ["el nido", "palawan", "coron"],
  "place-tagaytay": ["tagaytay", "taal lake"],
  "place-baguio": ["baguio", "baguio city"],
  "place-la-union": ["la union", "san juan la union", "elyu"],
};

const PAGES_PER_QUERY = 2;

type SearchResult = {
  results: Array<{
    slug: string;
    width: number;
    height: number;
    color: string;
    likes: number;
    premium: boolean;
    alt_description: string | null;
    description: string | null;
    urls: { raw: string };
    user: { name: string };
  }>;
};

type PhotoDetail = { location?: { title?: string | null; country?: string | null } };

function admits(category: PhotoCategory, width: number, height: number): boolean {
  if (category === "hero") return width >= 2400 && width / height >= 1.4;
  return true;
}

async function main() {
  const requested = process.argv.slice(2) as PhotoCategory[];
  const unknown = requested.filter((c) => !PHOTO_CATEGORIES.includes(c));
  if (unknown.length) throw new Error(`unknown categories: ${unknown.join(", ")}`);
  const categories = requested.length ? requested : [...PHOTO_CATEGORIES];

  mkdirSync(WORK_DIR, { recursive: true });
  const session = await openUnsplash();
  const kept = readCandidates().filter((c) => !categories.includes(c.category as PhotoCategory));
  const fresh: Candidate[] = [];

  for (const category of categories) {
    const seen = new Set<string>();
    for (const query of QUERIES[category]) {
      for (let page = 1; page <= PAGES_PER_QUERY; page++) {
        const q = encodeURIComponent(query);
        const { results } = await session.napi<SearchResult>(
          `search/photos?query=${q}&per_page=30&page=${page}&license=free`,
        );
        for (const r of results) {
          const id = cdnId(r.urls.raw);
          if (r.premium || !id || seen.has(id) || !admits(category, r.width, r.height)) continue;
          seen.add(id);
          fresh.push({
            id,
            slug: r.slug,
            category,
            query,
            width: r.width,
            height: r.height,
            alt: r.alt_description ?? r.description ?? "",
            photographer: r.user.name,
            color: r.color,
            likes: r.likes,
            location: null,
          });
        }
      }
    }
    if (category.startsWith("place-") || category === "view-highland") {
      for (const c of fresh.filter((f) => f.category === category)) {
        const detail = await session.napi<PhotoDetail>(`photos/${c.slug}`);
        const loc = detail.location;
        c.location = [loc?.title, loc?.country].filter(Boolean).join(" | ") || null;
      }
    }
    console.log(`${category}: ${seen.size} candidates`);
  }

  await session.close();
  writeFileSync(CANDIDATES_PATH, JSON.stringify([...kept, ...fresh], null, 1));
  console.log(`wrote ${kept.length + fresh.length} candidates to ${CANDIDATES_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
