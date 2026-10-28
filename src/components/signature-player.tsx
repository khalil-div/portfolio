"use client";

import { useEffect } from "react";

// Matches the CSS timeline in globals.css (Signature).
const SETTLE_MS = 1150; // the page starts its entrance under the lifting screen
const DONE_MS = 1450;

/* Runs the end of the intro: releases the hero's entrance, then removes
   the overlay. Any click, tap or key skips straight to the end. */
export function SignaturePlayer() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "on") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const settle = () => {
      if (root.dataset.intro === "on") root.dataset.intro = "out";
    };
    const done = () => {
      root.removeAttribute("data-intro");
      root.removeAttribute("data-intro-at");
    };
    const skip = () => {
      settle();
      timers.push(setTimeout(done, 300));
      stopListening();
    };
    const events = ["pointerdown", "keydown", "wheel"] as const;
    const stopListening = () => events.forEach((type) => window.removeEventListener(type, skip));
    events.forEach((type) => window.addEventListener(type, skip, { once: true, passive: true }));

    // The drawing started at first paint, before this script loaded: count
    // from then, so slow connections don't leave the finished name waiting.
    const elapsed = performance.now() - Number(root.dataset.introAt ?? performance.now());
    timers.push(setTimeout(settle, SETTLE_MS - elapsed), setTimeout(done, DONE_MS - elapsed));
    return () => {
      timers.forEach(clearTimeout);
      stopListening();
    };
  }, []);

  return null;
}
