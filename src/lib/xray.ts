"use client";

import { withViewTransition } from "./view-transition";

export const XRAY_SEEN_KEY = "xray-seen";

/** Turns X-Ray on or off with the scanner transition, for this session. */
export function setXray(on: boolean) {
  withViewTransition("xray", () => {
    document.documentElement.toggleAttribute("data-xray", on);
  });
  try {
    sessionStorage.setItem("xray", on ? "1" : "0");
    localStorage.setItem(XRAY_SEEN_KEY, "1");
  } catch {}
}
