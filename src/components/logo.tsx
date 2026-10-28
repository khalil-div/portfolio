import { LOGO } from "@/lib/logo";

/* The mark: خ, the first letter of Khalil (the same sound as K), with its
   dot as the orange sun. Readex Pro outlines from scripts/logo/khah.py.
   Colours come from CSS (.logo-*), so it follows the theme: an ink tile
   with a paper letter, and the sun always orange. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={`logo ${className ?? ""}`} viewBox="0 0 100 100" aria-hidden="true">
      <rect className="logo-tile" width="100" height="100" rx="28" />
      <path className="logo-letter" d={LOGO.letter} pathLength={1} />
      <path className="logo-sun" d={LOGO.sun} />
    </svg>
  );
}
