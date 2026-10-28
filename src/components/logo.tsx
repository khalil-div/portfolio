/* The mark: code brackets with the sun rising between them on a horizon.
   "I build", in Muscat. Colours come from CSS (.logo-*), so it follows the
   theme: an ink tile with paper strokes, and the sun always orange. */
export function Logo({ className, rising }: { className?: string; rising?: boolean }) {
  return (
    <svg className={`logo ${className ?? ""}`} viewBox="0 0 100 100" aria-hidden="true">
      <rect className="logo-tile" width="100" height="100" rx="28" />
      <path className="logo-bracket logo-bracket-start" d="M31 31 15.5 50 31 69" />
      <path className="logo-bracket logo-bracket-end" d="m69 31 15.5 19L69 69" />
      {/* The loading screen raises the sun from behind the horizon. */}
      {rising && (
        <clipPath id="logo-above-horizon">
          <rect width="100" height="59" />
        </clipPath>
      )}
      <g clipPath={rising ? "url(#logo-above-horizon)" : undefined}>
        <path className="logo-sun" d="M36 59a14 14 0 0 1 28 0Z" />
      </g>
      <path className="logo-horizon" d="M33 59h34" />
    </svg>
  );
}
