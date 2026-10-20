import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { getFavoriteIds } from "@/lib/data/buyer";
import { getViewer } from "@/lib/data/viewer";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  const favoriteIds = viewer.kind === "member" ? await getFavoriteIds() : [];
  return (
    <FavoritesProvider initialIds={favoriteIds} signedIn={viewer.kind === "member"}>
      <SiteNav viewer={viewer} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </FavoritesProvider>
  );
}
