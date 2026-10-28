"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { useRootAttribute } from "@/lib/use-dom-state";
import { withViewTransition } from "@/lib/view-transition";
import { setXray, XRAY_SEEN_KEY } from "@/lib/xray";

// First-time visitors get one hint, after the hero demo has played once.
const NUDGE_AFTER_MS = 9000;
const NUDGE_FOR_MS = 7000;

type Labels = {
  xray: string;
  xrayShort: string;
  toLight: string;
  toDark: string;
  language: string;
  languageLabel: string;
  xrayNudge: string;
  xrayKeyHint: string;
};

export function NavTools({ lang, labels }: { lang: Locale; labels: Labels }) {
  const other: Locale = lang === "en" ? "ar" : "en";
  // X-Ray lives on <html>, which outlives this component across navigations.
  const xray = useRootAttribute("data-xray");
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(XRAY_SEEN_KEY) === "1";
    } catch {}
    if (seen) return;
    let hide: ReturnType<typeof setTimeout>;
    const show = setTimeout(() => {
      if (document.documentElement.hasAttribute("data-xray")) return;
      setNudge(true);
      try {
        localStorage.setItem(XRAY_SEEN_KEY, "1");
      } catch {}
      hide = setTimeout(() => setNudge(false), NUDGE_FOR_MS);
    }, NUDGE_AFTER_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

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
    withViewTransition("theme", () => {
      root.dataset.theme = next;
    });
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  const toggleXray = () => {
    setNudge(false);
    setXray(!xray);
  };

  const rememberLocale = () => {
    document.cookie = `${LOCALE_COOKIE}=${other};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <div className="nav-tools">
      <span className="xray-anchor">
        <button
          type="button"
          className="tool xray-switch"
          aria-pressed={xray}
          aria-keyshortcuts="X"
          onClick={toggleXray}
          title={labels.xray}
          data-nudge={nudge ? "" : undefined}
        >
          <span className="xray-track" aria-hidden="true">
            <span className="xray-thumb" />
          </span>
          <span className="xray-label-long">{labels.xray}</span>
          <span className="xray-label-short">{labels.xrayShort}</span>
        </button>
        <span className="xray-nudge" role="status" data-show={nudge ? "" : undefined}>
          {nudge && (
            <>
              {labels.xrayNudge}
              <span className="xray-nudge-key">
                {labels.xrayKeyHint} <kbd>X</kbd>
              </span>
            </>
          )}
        </span>
      </span>

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
