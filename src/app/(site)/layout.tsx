import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { getViewer } from "@/lib/data/viewer";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  return (
    <>
      <SiteNav viewer={viewer} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
