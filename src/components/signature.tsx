import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import { SIGNATURE } from "@/lib/signature";
import { SignaturePlayer } from "./signature-player";

/* First visit only: the name draws itself, letter by letter, turns into
   the other language and the screen lifts away. It ends in the visitor's
   language. The inline head script decides whether it plays (before first
   paint); the drawing is pure CSS so it starts the moment the page shows. */
export function Signature({ lang }: { lang: Locale }) {
  const order = lang === "ar" ? (["en", "ar"] as const) : (["ar", "en"] as const);
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-names">
        {order.map((name, step) => {
          const { viewBox, glyphs } = SIGNATURE[name];
          return (
            <svg key={name} className={`intro-name intro-${step === 0 ? "first" : "second"}`} viewBox={viewBox} data-lang={name}>
              {glyphs.map((d, i) => (
                <path key={i} d={d} pathLength={1} style={{ "--i": i / glyphs.length } as CSSProperties} />
              ))}
            </svg>
          );
        })}
        <span className="intro-line" />
      </div>
      <SignaturePlayer />
    </div>
  );
}
