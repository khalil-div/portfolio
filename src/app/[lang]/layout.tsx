import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono, Readex_Pro } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { ScrollReveals } from "@/components/scroll-reveals";
import { SmoothScroll } from "@/components/smooth-scroll";
import { dirOf, isLocale, locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import { getDictionary } from "./dictionaries";
import "../globals.css";

const readex = Readex_Pro({
  subsets: ["latin", "arabic"],
  variable: "--font-readex",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-plex-ar",
  display: "swap",
});

// Runs before first paint so the stored theme (or the system's) never flashes,
// picks the logo candidate being previewed (?logo=e1 … e4, kept for the session),
// and decides whether the logo intro plays: first visit only (or
// ?intro to replay), never with reduced motion. If anything fails, the
// intro removes itself after 3 seconds.
const rootStateScript = `(function(){var r=document.documentElement;try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}r.dataset.theme=t;var l=new URLSearchParams(location.search).get("logo")||sessionStorage.getItem("logo");if(/^e[1-4]$/.test(l||"")){r.dataset.logo=l;sessionStorage.setItem("logo",l)}var q=location.search.indexOf("intro")>-1;if((q||!localStorage.getItem("intro"))&&!matchMedia("(prefers-reduced-motion: reduce)").matches){r.dataset.intro="on";r.dataset.introAt=String(Math.round(performance.now()));localStorage.setItem("intro","1");setTimeout(function(){r.removeAttribute("data-intro")},3000)}}catch(e){}})()`;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = await getDictionary(lang);
  // Shared on WhatsApp/LinkedIn, the preview comes in the page's language.
  const image = { url: `/og/${lang}.png`, width: 1200, height: 630, alt: meta.title };
  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    authors: [{ name: "Khalil Alblushi" }],
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", ar: "/ar", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      url: `/${lang}`,
      siteName: lang === "ar" ? "خليل البلوشي" : "Khalil Alblushi",
      title: meta.title,
      description: meta.description,
      locale: lang === "ar" ? "ar_OM" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_OM",
      images: [image],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [image] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      className={`${readex.variable} ${jetbrains.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={rootStateScript} />
      </head>
      <body>
        {children}
        <SmoothScroll />
        <ScrollReveals />
      </body>
    </html>
  );
}
