import { ExplorePlaces } from "@/components/home/explore-places";
import { HomeHero } from "@/components/home/hero";
import {
  AgentInvitation,
  FeaturedCollection,
  MarketFigures,
  Philosophy,
  RecentLedger,
  Statement,
} from "@/components/home/sections";
import { getFeaturedProperties, getMarketStats, listCities, listProperties } from "@/lib/data/properties";
import { PHOTOS, type Photo } from "@/lib/photography/catalog";

function photo(id: string): Photo {
  const found = PHOTOS.find((p) => p.id === id);
  if (!found) throw new Error(`Photo ${id} is missing from the catalog.`);
  return found;
}

const HERO = photo("photo-1694859035074-cb7166b5e7ce");
const PHILOSOPHY = photo("photo-1571327352610-1c5484ccc840");
const INVITATION = photo("photo-1623298317883-6b70254edf31");

export default async function HomePage() {
  const [featured, cities, stats, recent] = await Promise.all([
    getFeaturedProperties(4),
    listCities(),
    getMarketStats(),
    listProperties({ sort: "newest", page: 1 }),
  ]);
  const featuredIds = new Set(featured.map((p) => p.id));
  const ledger = recent.items.filter((p) => !featuredIds.has(p.id)).slice(0, 5);

  return (
    <>
      <HomeHero photo={HERO} listingCount={stats.listingCount} cityCount={stats.cityCount} />
      <Statement />
      <FeaturedCollection properties={featured} />
      <ExplorePlaces cities={cities} />
      <MarketFigures stats={stats} />
      <RecentLedger properties={ledger} />
      <Philosophy photo={PHILOSOPHY} />
      <AgentInvitation photo={INVITATION} />
    </>
  );
}
