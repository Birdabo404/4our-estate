import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { StoreProvider } from "@/lib/store/provider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-hanken",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    template: "%s · 4OUR Estate",
    default: "4OUR Estate · Homes for sale and lease in the Philippines",
  },
  description:
    "Houses, condos, and villas across Makati, BGC, Alabang, Tagaytay, Cebu, and the islands. Real photos, prices in pesos, and an agent who replies.",
  applicationName: "4OUR Estate",
  openGraph: {
    type: "website",
    siteName: "4OUR Estate",
    locale: "en_PH",
    title: "4OUR Estate",
    description: "Homes for sale and lease in the Philippines, with real photos and prices in pesos.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f2ec",
};

const MARK_JS = `document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-PH"
      className={`${bricolage.variable} ${hanken.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MARK_JS }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-(--z-toast) -translate-y-[200%] rounded-md bg-ink px-5 py-3 text-small text-paper transition-transform duration-500 ease-settle focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <StoreProvider>
          <MotionProvider>{children}</MotionProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
