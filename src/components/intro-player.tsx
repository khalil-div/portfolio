"use client";

import { useEffect } from "react";

// Matches the CSS timeline in globals.css (Intro).
const FLY_MS = 1000; // the logo leaves for the header
const DONE_MS = 1500;

/* Ends the intro: flies the logo into the header's logo (wherever it sits
   on this screen and in this language), clears the screen, then removes
   the overlay. Any click, key or scroll skips straight to the flight. */
export function IntroPlayer() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== "on") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const fly = () => {
      if (root.dataset.intro !== "on") return;
      const logo = document.querySelector<SVGElement>(".intro-logo");
      const target = document.querySelector<SVGElement>(".nav .brand-mark");
      if (logo && target) {
        const from = logo.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        logo.style.setProperty("--fly-x", `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
        logo.style.setProperty("--fly-y", `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
        logo.style.setProperty("--fly-s", String(to.width / from.width));
      }
      root.dataset.intro = "out";
    };
    const done = () => {
      root.removeAttribute("data-intro");
      root.removeAttribute("data-intro-at");
    };
    const skip = () => {
      fly();
      timers.push(setTimeout(done, DONE_MS - FLY_MS));
      stopListening();
    };
    const events = ["pointerdown", "keydown", "wheel"] as const;
    const stopListening = () => events.forEach((type) => window.removeEventListener(type, skip));
    events.forEach((type) => window.addEventListener(type, skip, { once: true, passive: true }));

    // The build started at first paint, before this script loaded: count
    // from then, so slow connections don't leave the finished logo waiting.
    const elapsed = performance.now() - Number(root.dataset.introAt ?? performance.now());
    timers.push(setTimeout(fly, FLY_MS - elapsed), setTimeout(done, DONE_MS - elapsed));
    return () => {
      timers.forEach(clearTimeout);
      stopListening();
    };
  }, []);

  return null;
}
