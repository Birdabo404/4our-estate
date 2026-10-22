import { ExplorePlaces } from "@/components/home/explore-places";
import { HomeHero } from "@/components/home/hero";
import {
  AgentInvitation,
  FeaturedCollection,
  HowItWorks,
  MarketFigures,
  RecentLedger,
  Ticker,
} from "@/components/home/sections";
import { getFeaturedProperties, getMarketStats, listCities, listProperties } from "@/lib/data/properties";
import { PHOTOS, type Photo } from "@/lib/photography/catalog";

function photo(id: string): Photo {
  const found = PHOTOS.find((p) => p.id === id);
  if (!found) throw new Error(`Photo ${id} is missing from the catalog.`);
  return found;
}

const HERO = photo("photo-1768200498972-fd56353d73fc");
const INVITATION = photo("photo-1623298317883-6b70254edf31");

export default async function HomePage() {
  const [featured, cities, stats, recent] = await Promise.all([
    getFeaturedProperties(4),
    listCities(),
    getMarketStats(),
    listProperties({ sort: "newest", page: 1 }),
  ]);
  const featuredIds = new Set(featured.map((p) => p.id));
  const ledger = recent.items.filter((p) => !featuredIds.has(p.id)).slice(0, 6);

  return (
    <>
      <HomeHero
        photo={HERO}
        listingCount={stats.listingCount}
        cityCount={stats.cityCount}
        cities={cities}
        spotlight={featured[0]}
      />
      <Ticker properties={recent.items.slice(0, 8)} />
      <FeaturedCollection properties={featured} total={stats.listingCount} />
      <ExplorePlaces cities={cities} />
      <RecentLedger properties={ledger} />
      <MarketFigures stats={stats} />
      <HowItWorks />
      <AgentInvitation photo={INVITATION} />
    </>
  );
}
