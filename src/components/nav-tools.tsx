"use client";

import { useEffect, type MouseEvent } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { withViewTransition } from "@/lib/view-transition";

type Labels = {
  toLight: string;
  toDark: string;
  language: string;
  languageLabel: string;
};

export function NavTools({ lang, labels }: { lang: Locale; labels: Labels }) {
  const other: Locale = lang === "en" ? "ar" : "en";

  // Follow system theme changes until the visitor picks one.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (localStorage.getItem("theme")) return;
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();
    root.style.setProperty("--vt-x", `${rect.left + rect.width / 2}px`);
    root.style.setProperty("--vt-y", `${rect.top + rect.height / 2}px`);

    const next = root.dataset.theme === "dark" ? "light" : "dark";
    withViewTransition(() => {
      root.dataset.theme = next;
    });
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  const rememberLocale = () => {
    document.cookie = `${LOCALE_COOKIE}=${other};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <div className="nav-tools">
      {/* A full navigation on purpose: <html lang dir> changes, and the
          browser's cross-document view transition fades between languages. */}
      <a
        href={`/${other}`}
        hrefLang={other}
        lang={other}
        className="tool tool-lang"
        aria-label={labels.languageLabel}
        onClick={rememberLocale}
      >
        {labels.language}
      </a>

      <button type="button" className="tool tool-icon" onClick={toggleTheme}>
        <span className="sr-only only-light">{labels.toDark}</span>
        <span className="sr-only only-dark">{labels.toLight}</span>
        <svg className="only-light" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <svg className="only-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
