"use client";

/**
 * Runs a theme change inside a View Transition: the new theme grows in a
 * circle from the button (`vt-theme` is on <html> for the duration).
 * Falls back to an instant update without support or with reduced motion.
 */
export function withViewTransition(update: () => void) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduced) {
    update();
    return;
  }

  const transition = document.startViewTransition(() => {
    root.classList.add("vt-theme");
    update();
  });
  transition.finished.finally(() => root.classList.remove("vt-theme"));
}
