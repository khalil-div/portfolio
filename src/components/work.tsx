import type { ReactNode } from "react";
import Image from "next/image";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import desktopAr from "@/assets/work/matcha-muse/desktop-ar.jpg";
import desktopEn from "@/assets/work/matcha-muse/desktop-en.jpg";
import mobileAr from "@/assets/work/matcha-muse/mobile-ar.jpg";
import mobileEn from "@/assets/work/matcha-muse/mobile-en.jpg";
import { Check } from "./icons";

type T = Dictionary["work"];

const MATCHA_URL = "https://matcha-muse.vercel.app";

/* ── 01 · Matcha Muse ───────────────────────────────────────
   The laptop shows the page's language, the phone the other one:
   both languages, in one glance. */
export function MatchaCase({ lang, t }: { lang: Locale; t: T }) {
  const m = t.matcha;
  const other = lang === "ar" ? "en" : "ar";
  return (
    <article className="case" data-reveal>
      <a
        className="case-visual shots"
        href={`${MATCHA_URL}/${lang}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t.visit}: ${m.name}`}
       
      >
        <span className="browser">
          <span className="browser-bar" aria-hidden="true">
            <span className="browser-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="browser-url mono" dir="ltr">
              matcha-muse.vercel.app/{lang}
            </span>
          </span>
          <Image
            className="shot-img"
            src={lang === "ar" ? desktopAr : desktopEn}
            alt={m.shotLabel}
            sizes="(min-width: 1320px) 700px, (min-width: 1024px) 55vw, 100vw"
            placeholder="blur"
          />
        </span>
        <span className="phone-shot">
          <Image src={other === "ar" ? mobileAr : mobileEn} alt="" sizes="190px" placeholder="blur" />
        </span>
      </a>

      <CaseInfo
        index={1}
        kind={m.kind}
        name={m.name}
        summary={m.summary}
        points={m.points}
        facts={[
          [t.role, m.role],
          [t.stack, "Next.js · PostgreSQL · Vercel"],
        ]}
      >
        <a className="btn-text case-cta" href={`${MATCHA_URL}/${lang}`} target="_blank" rel="noopener noreferrer">
          {t.visit}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </CaseInfo>
    </article>
  );
}

/* ── 02 · Government platform ───────────────────────────────
   Private work: a live diagram instead of screenshots. Requests from
   each department pass sign-in, the shared platform, then land in that
   department's own data store. */
const TENANT_X = [80, 220, 360];
const STORE_X = [140, 220, 300];
const flow = (i: number) =>
  `M${TENANT_X[i]} 96 V152 C${TENANT_X[i]} 168 220 164 220 180 V234 C220 254 ${STORE_X[i]} 250 ${STORE_X[i]} 272`;


export function GovCase({ lang, t }: { lang: Locale; t: T }) {
  const g = t.gov;
  const d = g.diagram;
  // Arabic reads right to left, so department "أ" sits on the right.
  const at = (i: number) => (lang === "ar" ? TENANT_X.length - 1 - i : i);
  return (
    <article className="case" data-reveal>
      <figure className="case-visual diagram-card">
        <svg className="diagram" viewBox="0 0 440 400" role="img" aria-label={g.name}>
          <rect className="dg-zone" x="8" y="8" width="424" height="384" rx="20" />
          <text className="dg-small" x="220" y="38">
            {d.network}
          </text>

          {TENANT_X.map((x, i) => (
            <g key={x}>
              <path className="dg-wire" d={`M${x} 96 V124 M${x} 152 C${x} 168 220 164 220 180`} />
              <path className="dg-wire" d={`M220 234 C220 254 ${STORE_X[i]} 250 ${STORE_X[i]} 272`} />
            </g>
          ))}

          {TENANT_X.map((_, i) => (
            <circle key={i} className="dg-packet" r="4">
              <animateMotion dur="3.6s" begin={`-${i * 1.2}s`} repeatCount="indefinite" path={flow(i)} />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.08;0.9;1"
                dur="3.6s"
                begin={`-${i * 1.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {TENANT_X.map((x, i) => (
            <g key={x}>
              <rect className="dg-node" x={x - 60} y="56" width="120" height="40" rx="12" />
              <text className="dg-label" x={x} y="81">
                {d.tenants[at(i)]}
              </text>
            </g>
          ))}

          <rect className="dg-gate" x="40" y="124" width="360" height="28" rx="14" />
          <text className="dg-small dg-on-gate" x="220" y="143">
            {d.signIn}
          </text>

          <rect className="dg-core" x="135" y="180" width="170" height="54" rx="14" />
          <text className="dg-label dg-on-core" x="220" y="212">
            {d.platform}
          </text>

          {STORE_X.map((x, i) => (
            <g key={x}>
              <path className="dg-db" d={`M${x - 28} 272 v34 a28 8 0 0 0 56 0 v-34`} />
              <ellipse className="dg-db" cx={x} cy="272" rx="28" ry="8" />
              <text className="dg-small" x={x} y="300">
                {d.tenantShort[at(i)]}
              </text>
            </g>
          ))}
          <text className="dg-small" x="220" y="352">
            {d.data}
          </text>
        </svg>
        <figcaption className="case-note">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
            <rect x="1" y="6" width="10" height="7" rx="2" fill="currentColor" />
            <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {g.note}
        </figcaption>
      </figure>

      <CaseInfo
        index={2}
        kind={g.kind}
        name={g.name}
        summary={g.summary}
        points={g.points}
        facts={[
          [t.role, g.role],
          [t.stack, "ASP.NET · SQL Server · Docker"],
        ]}
      />
    </article>
  );
}

function CaseInfo({
  index,
  kind,
  name,
  summary,
  points,
  facts,
  children,
}: {
  index: number;
  kind: string;
  name: string;
  summary: string;
  points: string[];
  facts: [string, string][];
  children?: ReactNode;
}) {
  return (
    <div className="case-info">
      <p className="case-kind">
        <span className="case-num mono">0{index}</span>
        {kind}
      </p>
      <h3 className="case-name">{name}</h3>
      <p className="case-summary">{summary}</p>
      <ul className="case-points">
        {points.map((point) => (
          <li key={point}>
            <span className="tick">
              <Check />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <dl className="case-facts">
        {facts.map(([label, value], i) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={i === 1 ? "mono" : undefined} dir={i === 1 ? "ltr" : undefined}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}

/* ── Next ─────────────────────────────────────────────────── */
export function NextCase({ t, whatsapp }: { t: T; whatsapp: string }) {
  return (
    <aside className="case-next" data-reveal>
      <p className="case-num mono">03</p>
      <h3 className="case-next-title">{t.next.title}</h3>
      <p className="case-next-body">{t.next.body}</p>
      <a className="btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
        {t.next.cta}
        <span className="btn-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </aside>
  );
}
