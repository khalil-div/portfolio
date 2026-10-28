import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { Check } from "./icons";

/* Four small "screens", one per chapter of the same Dar Karak project.
   They are static markup: ProcessStory scrubs them with scroll by writing
   --p (0 → 1) on each scene and flagging [data-at] elements as [data-in]. */

type Props = { lang: Locale; t: Dictionary["process"]; demo: Dictionary["demo"] };

const ANNOTATIONS = [
  "<Chat /> → requirements.md",
  "<Prototype /> → design tokens",
  "POST /api/orders · PostgreSQL",
  "Vercel · CDN · SSL",
];

export function Scene({ index, current, ...props }: Props & { index: number; current?: boolean }) {
  const Body = [ChatScene, DesignScene, BuildScene, LaunchScene][index];
  return (
    <div
      className="scene"
      data-scene={index}
      data-current={current ? "" : undefined}
      data-x={ANNOTATIONS[index]}
    >
      <Body {...props} />
      <span className="scene-progress" aria-hidden="true" />
    </div>
  );
}

/* 00 · Idea: a chat that turns into a plan. Older messages scroll away. */
function ChatScene({ t, demo }: Props) {
  const c = t.chat;
  return (
    <>
      <header className="scene-bar">
        <span className="avatar">{c.initials}</span>
        <span className="scene-bar-text">
          <span className="scene-bar-title">{demo.shop}</span>
          <span className="scene-bar-sub">
            <span className="online-dot" />
            {c.status}
          </span>
        </span>
      </header>
      <div className="scene-body chat">
        <div className="chat-stack" data-stack>
          {c.messages.map((m, i) => (
            <div key={i} className="reveal-row" data-at={i * 0.11}>
              <div>
                <p className="bubble" data-from={m.from}>
                  {m.text}
                </p>
              </div>
            </div>
          ))}
          <div className="reveal-row" data-at={0.46}>
            <div>
              <div className="plan">
                <p className="plan-title mono">{c.plan}</p>
                <ul className="plan-list">
                  {c.planItems.map((item, i) => (
                    <li key={item} className="plan-item" data-at={0.54 + i * 0.06}>
                      <span className="tick">
                        <Check />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="plan-foot" data-at={0.8}>
                  {c.planFoot}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* 01 · Design: the wireframe is scanned into the finished screen. */
function DesignScene({ lang, t, demo }: Props) {
  const d = t.design;
  return (
    <>
      <header className="scene-bar">
        <span className="file-icon" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="scene-bar-text">
          <span className="scene-bar-title">{d.file}</span>
        </span>
        <span className="scene-bar-tag mono">{d.version}</span>
      </header>
      <div className="scene-body design">
        <div className="phone">
          <div className="screen wire" aria-hidden="true">
            <div className="sk-row">
              <span className="sk sk-circle" />
              <span className="sk sk-line" style={{ width: "40%" }} />
            </div>
            <span className="sk screen-hero" />
            <span className="sk sk-line" style={{ width: "30%" }} />
            {d.items.map((item) => (
              <div key={item.name} className="sk-row">
                <span className="sk sk-thumb" />
                <span className="sk sk-line" style={{ flex: 1 }} />
              </div>
            ))}
            <span className="sk sk-btn" />
          </div>

          <div className="screen ui">
            <div className="shop">
              <span className="shop-logo">{t.chat.initials.slice(0, 1)}</span>
              <span className="shop-name">{demo.shop}</span>
            </div>
            <span className="screen-hero" />
            <p className="menu-title">{d.menu}</p>
            {d.items.map((item, i) => (
              <div key={item.name} className="menu-row">
                <span className="thumb" data-variant={i} />
                <span className="menu-name">{item.name}</span>
                <span className="menu-price mono">{formatPrice(item.price, lang, demo.currency)}</span>
              </div>
            ))}
            <span className="screen-btn">{d.order}</span>
          </div>

          <span className="scan-edge" aria-hidden="true" />
        </div>

        <div className="comment" data-at={0.7}>
          <span className="avatar avatar-sm">{t.chat.initials}</span>
          <p>{d.comment}</p>
        </div>

        <div className="stamp" data-at={0.84}>
          <Check />
          {d.approved}
        </div>
      </div>
    </>
  );
}

/* 02 · Build: real code types itself in, then the checklist ticks over. */
const CODE: [string, string][][] = [
  [["kw", "export async function "], ["fn", "POST"], ["", "(req) {"]],
  [["kw", "  const "], ["", "order = "], ["kw", "await "], ["", "req."], ["fn", "json"], ["", "();"]],
  [["kw", "  await "], ["", "db."], ["fn", "insert"], ["", "(orders)."], ["fn", "values"], ["", "(order);"]],
  [["kw", "  await "], ["fn", "notify"], ["", "(shop, order);"]],
  [["kw", "  return "], ["", "Response."], ["fn", "json"], ["", "(order, { status: "], ["num", "201"], ["", " });"]],
  [["", "}"]],
];

function BuildScene({ t }: Props) {
  const b = t.build;
  return (
    <>
      <header className="scene-bar">
        <span className="scene-bar-text">
          <span className="scene-bar-title mono" dir="ltr">
            api/orders/route.ts
          </span>
        </span>
        <span className="scene-bar-tag mono">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
            <circle cx="3" cy="2.5" r="1.5" stroke="currentColor" />
            <circle cx="3" cy="9.5" r="1.5" stroke="currentColor" />
            <circle cx="7.5" cy="4.5" r="1.5" stroke="currentColor" />
            <path d="M3 4v4M7.5 6c0 1.5-1.5 2-4.5 2" stroke="currentColor" />
          </svg>
          {b.branch}
        </span>
      </header>
      <div className="scene-body build">
        <pre className="code mono" dir="ltr">
          {CODE.map((tokens, i) => (
            <span key={i} className="code-line" data-at={i * 0.06}>
              <span className="ln">{i + 1}</span>
              {tokens.map(([kind, text], k) => (
                <span key={k} className={kind ? `tok-${kind}` : undefined}>
                  {text}
                </span>
              ))}
            </span>
          ))}
        </pre>

        <ul className="checks">
          {b.checks.map((check, i) => (
            <li key={check} className="check" data-at={0.4 + i * 0.09}>
              <span className="tick">
                <Check />
              </span>
              {check}
            </li>
          ))}
        </ul>

        <p className="preview-pill" data-at={0.82}>
          <span className="online-dot" />
          {b.preview}
          <span className="mono">· {b.when}</span>
        </p>
      </div>
    </>
  );
}

/* 03 · Launch: the site is live and the numbers start to move. */
function LaunchScene({ t }: Props) {
  const l = t.launch;
  return (
    <>
      <header className="scene-bar">
        <span className="url-bar mono" dir="ltr">
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
            <rect x="1" y="5" width="8" height="6" rx="1.5" fill="currentColor" />
            <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          {l.url}
        </span>
        <span className="live-badge">
          <span className="status-dot" />
          {l.live}
        </span>
      </header>
      <div className="scene-body launch">
        <div className="stats">
          <div className="stat">
            <p className="stat-label">{l.orders}</p>
            <p className="stat-value mono" data-count="38">
              38
            </p>
          </div>
          <div className="stat">
            <p className="stat-label">{l.visitors}</p>
            <p className="stat-value mono" data-count="1240">
              1,240
            </p>
          </div>
        </div>

        <svg className="spark" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="spark-area"
            d="M0 92 C30 90 45 84 70 80 S110 70 135 66 S170 46 195 48 S240 30 260 22 S290 10 300 8 V100 H0 Z"
          />
          <path
            className="spark-line"
            pathLength={1}
            d="M0 92 C30 90 45 84 70 80 S110 70 135 66 S170 46 195 48 S240 30 260 22 S290 10 300 8"
          />
        </svg>

        <div className="mini-toast" data-at={0.62}>
          <span className="toast-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 5.5h10l-1 7.5H4L3 5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M5.5 5.5V4.5a2.5 2.5 0 0 1 5 0v1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="toast-text">
            <span className="toast-title block">{l.toastTitle}</span>
            <span className="toast-body block">{l.toastBody}</span>
          </span>
        </div>
      </div>
    </>
  );
}
