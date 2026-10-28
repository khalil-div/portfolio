import { LOGOS, type LogoId } from "@/lib/logos";

/* The logo, in each candidate form (?logo=e1 … e4 picks one; see the head
   script and globals.css). Colours come from CSS (.logo-*): an ink tile
   with paper letters, and the sun always orange. */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      {(Object.keys(LOGOS) as LogoId[]).map((id) => (
        <svg key={id} className={`logo ${className ?? ""}`} data-mark={id} viewBox="0 0 100 100" aria-hidden="true">
          <rect className="logo-tile" width="100" height="100" rx="28" />
          {LOGOS[id].letters.map((d, i) => (
            <path key={i} className="logo-letter" d={d} pathLength={1} />
          ))}
          {LOGOS[id].strokes.map((d, i) => (
            <path key={i} className="logo-stroke" d={d} pathLength={1} />
          ))}
          <path className="logo-sun" d={LOGOS[id].sun} />
        </svg>
      ))}
    </>
  );
}

/* e4 only: the name itself is the logo, ending in the orange sun. */
export function Wordmark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={`wordmark ${className ?? ""}`} aria-hidden="true">
      {name}
      <span className="wordmark-sun" />
    </span>
  );
}
