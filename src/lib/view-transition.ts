"use client";

/**
 * Runs a DOM update inside a View Transition. `kind` becomes a class on <html>
 * for the duration, so CSS can pick the right animation (vt-theme, vt-xray).
 * Falls back to an instant update without support or with reduced motion.
 */
export function withViewTransition(kind: "theme" | "xray", update: () => void) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduced) {
    update();
    return;
  }

  const className = `vt-${kind}`;
  const transition = document.startViewTransition(() => {
    // Added inside the update so only the new snapshot carries the scanline.
    root.classList.add(className);
    update();
  });
  transition.finished.finally(() => root.classList.remove(className));
}
