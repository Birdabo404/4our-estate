import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    template: "%s · 4OUR Estate",
    default: "4OUR Estate · Private residences in the Philippines",
  },
  description:
    "A private collection of residences across Makati, BGC, Alabang, Tagaytay, Cebu, and the islands. Represented with discretion by 4OUR Estate.",
  applicationName: "4OUR Estate",
  openGraph: {
    type: "website",
    siteName: "4OUR Estate",
    locale: "en_PH",
    title: "4OUR Estate",
    description: "Private residences in the Philippines, represented with discretion.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe7",
};

const MARK_JS = `document.documentElement.classList.add("js")`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PH" className={`${bodoni.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MARK_JS }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-(--z-toast) -translate-y-[200%] rounded-full bg-ink px-5 py-3 text-small text-paper transition-transform duration-500 ease-settle focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        <div aria-hidden className="grain" />
      </body>
    </html>
  );
}
