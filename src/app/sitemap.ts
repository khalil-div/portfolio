import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((lang) => [lang, `${SITE_URL}/${lang}`]));
  return locales.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    alternates: { languages },
  }));
}
