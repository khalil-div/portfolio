"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a media query. `false` on the server. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const media = matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Whether <html> has an attribute, kept in sync as it changes. */
export function useRootAttribute(name: string) {
  return useSyncExternalStore(
    (notify) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, { attributeFilter: [name] });
      return () => observer.disconnect();
    },
    () => document.documentElement.hasAttribute(name),
    () => false,
  );
}
