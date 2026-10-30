"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { useMediaQuery } from "@/lib/use-dom-state";

/* ── Timeline ──────────────────────────────────────────────
   One loop tells the whole story: a sketch (idea) becomes an interface
   (design), someone orders (build), the shop gets notified (launch). */

const PHASES = [
  { id: "idea", ms: 1600 },
  { id: "design", ms: 1400 },
  { id: "build", ms: 2900 },
  { id: "launch", ms: 3100 },
] as const;

const LOOP_MS = PHASES.reduce((sum, p) => sum + p.ms, 0);
const PRICES = [0.3, 0.4, 0.5];

type Target = "size" | "plus" | "add";

type Frame = {
  phase: number;
  size: number;
  qty: number;
  cursor: Target | null;
  press: boolean;
  sent: boolean;
  toast: boolean;
  layer: number;
};

const START: Frame = {
  phase: 0,
  size: 1,
  qty: 1,
  cursor: null,
  press: false,
  sent: false,
  toast: false,
  layer: -1,
};

const FINAL: Frame = { ...START, phase: 3, size: 2, qty: 2, sent: true, toast: true, layer: 3 };

// [time in ms from loop start, change]
const SCRIPT: [number, Partial<Frame>][] = [
  [0, START],
  [1600, { phase: 1 }],
  [3000, { phase: 2, cursor: "size", layer: 0 }],
  [3750, { press: true, size: 2 }],
  [3950, { press: false }],
  [4300, { cursor: "plus" }],
  [5000, { press: true, qty: 2 }],
  [5200, { press: false }],
  [5450, { cursor: "add" }],
  [5900, { phase: 3, press: true, sent: true, layer: 1 }],
  [6100, { press: false }],
  [6350, { layer: 2 }],
  [6800, { layer: 3, toast: true, cursor: null }],
];

type Showcase = { frame: Frame; cycle: number; reduced: boolean };

const ShowcaseContext = createContext<Showcase>({ frame: START, cycle: 0, reduced: false });

export function ShowcaseProvider({ className, children }: { className?: string; children: ReactNode }) {
  const [playing, setPlaying] = useState<Frame>(START);
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const anchor = useRef<HTMLElement>(null);

  // Only animate while it's on screen and the tab is visible. On phones the
  // hero's first screen is the world, and the card waits below it.
  useEffect(() => {
    const seen = new Set<Element>();
    const update = () => setRunning(seen.size > 0 && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) seen.add(entry.target);
        else seen.delete(entry.target);
      }
      update();
    });
    const hero = anchor.current;
    if (hero) {
      const narrow = matchMedia("(max-width: 767px)").matches;
      for (const el of narrow ? hero.querySelectorAll(".hero-demo, .rail") : [hero]) observer.observe(el);
    }
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (!running || reduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      setCycle((c) => c + 1);
      for (const [at, change] of SCRIPT) {
        timers.push(setTimeout(() => setPlaying((f) => ({ ...f, ...change })), at));
      }
      timers.push(setTimeout(play, LOOP_MS));
    };
    play();
    return () => timers.forEach(clearTimeout);
  }, [running, reduced]);

  const frame = reduced ? FINAL : playing;

  return (
    <ShowcaseContext.Provider value={{ frame, cycle, reduced }}>
      <section ref={anchor} className={className}>
        {children}
      </section>
    </ShowcaseContext.Provider>
  );
}

/* ── Demo card ──────────────────────────────────────────── */

export function OrderDemo({ lang, t }: { lang: Locale; t: Dictionary["demo"] }) {
  const { frame } = useContext(ShowcaseContext);
  const stage = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const targets = useRef<Partial<Record<Target, HTMLElement | null>>>({});

  // Glide the cursor to whatever it is about to press; between loops,
  // park it below the card so it always glides in.
  useLayoutEffect(() => {
    if (!stage.current || !cursor.current) return;
    const s = stage.current.getBoundingClientRect();
    const el = frame.cursor && targets.current[frame.cursor];
    let x = s.width * 0.62;
    let y = s.height + 12;
    if (el) {
      const r = el.getBoundingClientRect();
      x = r.left - s.left + r.width / 2 - 4;
      y = r.top - s.top + r.height / 2 - 2;
    } else if (frame.phase !== 0) {
      return;
    }
    cursor.current.style.setProperty("--x", `${x}px`);
    cursor.current.style.setProperty("--y", `${y}px`);
  }, [frame.cursor, frame.phase]);

  const total = formatPrice(PRICES[frame.size] * frame.qty, lang, t.currency);
  const register = useCallback((target: Target, el: HTMLElement | null) => {
    targets.current[target] = el;
  }, []);

  return (
    <div className="demo">
      <p className="sr-only">{t.label}</p>

      <div className="stage" ref={stage} data-phase={PHASES[frame.phase].id} aria-hidden="true">
        <div className="toast" data-show={frame.toast ? "" : undefined}>
          <span className="toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 17.5 3.5 21l4-1.3A9 9 0 1 0 5 17.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="m8.5 12 2.3 2.3L15.5 9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="toast-text">
            <span className="toast-title block">{t.toastTitle}</span>
            <span className="toast-body block">
              {t.toastBody} · {total}
            </span>
          </span>
          <span className="toast-time">{t.now}</span>
        </div>

        <div className="order-card">
          <div className="sketch">
            <div className="sk-row">
              <span className="sk sk-circle" />
              <span className="grid flex-1 gap-1.5">
                <span className="sk sk-line w-1/2" />
                <span className="sk sk-line w-1/3" />
              </span>
            </div>
            <span className="sk sk-img mono">idea.sketch</span>
            <span className="sk sk-line w-2/5" />
            <span className="sk sk-line w-3/5" />
            <div className="sk-row">
              <span className="sk sk-pill" />
              <span className="sk sk-pill" style={{ flex: "0 0 96px" }} />
            </div>
            <span className="sk sk-btn" />
          </div>

          <CardContent lang={lang} t={t} frame={frame} register={register} />
          <Lens lang={lang} t={t} frame={frame} />
        </div>

        <span
          className="cursor"
          ref={cursor}
          data-show={frame.cursor ? "" : undefined}
          data-press={frame.press ? "" : undefined}
        >
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path
              d="M3 2.5v15.2l4.1-3.9 2.7 6.2 2.9-1.3-2.7-6.1 5.7-.3L3 2.5Z"
              fill="#0f0f10"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────
   Rendered twice: the real card, and its wireframe twin inside the lens.
   Same markup and state, so every outline sits exactly on its part. */

const CODE_SIZES = ["S", "M", "L"];

function CardContent({
  lang,
  t,
  frame,
  register,
  wire = false,
}: {
  lang: Locale;
  t: Dictionary["demo"];
  frame: Frame;
  register?: (target: Target, el: HTMLElement | null) => void;
  wire?: boolean;
}) {
  const total = formatPrice(PRICES[frame.size] * frame.qty, lang, t.currency);
  const press = (target: Target) => (frame.press && frame.cursor === target ? "" : undefined);

  return (
    <div className={wire ? "lens-content" : "card-content"}>
      <div className="shop" data-part="shop" data-tag={wire ? `<Shop name="${t.shop}" />` : undefined}>
        <span className="shop-logo">{lang === "ar" ? "ك" : "K"}</span>
        <span className="grid">
          <span className="shop-name">{t.shop}</span>
          <span className="shop-meta">{t.shopMeta}</span>
        </span>
      </div>

      <div className="product-visual" data-part="photo" data-tag={wire ? "<Image src=\"karak.webp\" />" : undefined}>
        <KarakGlass />
      </div>

      <div data-part="product" data-tag={wire ? `<Product price={${PRICES[frame.size].toFixed(3)}} />` : undefined}>
        <div className="product-row">
          <span className="product-name">{t.product}</span>
          <span className="shop-meta mono">{formatPrice(PRICES[frame.size], lang, t.currency)}</span>
        </div>
        <p className="product-notes">{t.notes}</p>
      </div>

      <div className="controls-row">
        <div
          className="segmented"
          style={{ "--i": frame.size } as CSSProperties}
          data-part="size"
          data-tag={wire ? `<SizePicker value="${CODE_SIZES[frame.size]}" />` : undefined}
        >
          <span className="seg-thumb" />
          {t.sizes.map((label, i) => (
            <span
              key={label}
              className="seg-option grid place-items-center"
              aria-checked={frame.size === i}
              ref={i === 2 && register ? (el) => register("size", el) : undefined}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="stepper" data-part="qty" data-tag={wire ? `<Quantity value={${frame.qty}} />` : undefined}>
          <span className="step-btn">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span className="qty">{frame.qty}</span>
          <span className="step-btn" data-pressed={press("plus")} ref={register ? (el) => register("plus", el) : undefined}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>

      <div
        className="order-btn"
        data-part="order"
        data-tag={wire ? (frame.sent ? "POST /api/orders → 201" : "<OrderButton onClick={send} />") : undefined}
        data-pressed={press("add")}
        data-sent={frame.sent ? "" : undefined}
        ref={register ? (el) => register("add", el) : undefined}
      >
        <span className="swap">
          <span data-hidden={frame.sent ? "" : undefined}>{t.add}</span>
          <span data-hidden={frame.sent ? undefined : ""} className="inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="m2.5 7.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.added}
          </span>
        </span>
        <span className="price mono">{total}</span>
      </div>
    </div>
  );
}

/* ── Lens ───────────────────────────────────────────────────
   A hidden magnifier. Over the card (or after press-and-hold on touch)
   a lens follows the pointer and shows the card's wiring underneath. */

const HOLD_MS = 320;

function Lens({ lang, t, frame }: { lang: Locale; t: Dictionary["demo"]; frame: Frame }) {
  const ref = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const part = useRef("");

  const setPart = useCallback((name: string) => {
    part.current = name;
    const lens = ref.current;
    if (!lens || !label.current) return;
    let tag = "";
    for (const el of lens.querySelectorAll<HTMLElement>("[data-part]")) {
      const on = el.dataset.part === name;
      el.toggleAttribute("data-active", on);
      if (on) tag = el.dataset.tag ?? "";
    }
    label.current.textContent = tag;
    label.current.toggleAttribute("data-show", Boolean(tag));
  }, []);

  // The demo keeps playing under the lens; keep the label's values live.
  useEffect(() => {
    if (part.current) setPart(part.current);
  }, [frame, setPart]);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;
    let active = false;
    let hold: ReturnType<typeof setTimeout> | undefined;
    let start = { x: 0, y: 0 };

    // Highlight the part under the pointer and name it in the lens label.
    const place = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--lx", `${e.clientX - r.left}px`);
      card.style.setProperty("--ly", `${e.clientY - r.top}px`);
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>(".card-content [data-part]");
      setPart(hit?.dataset.part ?? "");
    };
    // On touch the lens floats above the fingertip, like a text loupe,
    // so the finger never covers what it is magnifying.
    const show = (on: boolean, touch = false) => {
      active = on;
      card.toggleAttribute("data-lens", on);
      card.toggleAttribute("data-touch", on && touch);
    };
    const cancelHold = () => {
      clearTimeout(hold);
      hold = undefined;
    };

    // Park the closed lens in the middle of the card: at its corner, the
    // invisible rim would hang off the edge and widen the page.
    card.style.setProperty("--lx", `${card.offsetWidth / 2}px`);
    card.style.setProperty("--ly", `${card.offsetHeight / 2}px`);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      place(e);
      show(true);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") show(false);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      start = { x: e.clientX, y: e.clientY };
      place(e);
      hold = setTimeout(() => show(true, true), HOLD_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || active) place(e);
      // Moving before the hold completes means the visitor is scrolling.
      else if (hold && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) cancelHold();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      cancelHold();
      show(false);
    };
    // While the lens is held, the finger moves the lens, not the page.
    const onTouchMove = (e: TouchEvent) => {
      if (active) e.preventDefault();
    };
    const onContextMenu = (e: Event) => {
      if (active || hold) e.preventDefault();
    };

    const pointer: [string, (e: PointerEvent) => void][] = [
      ["pointerenter", onEnter],
      ["pointerleave", onLeave],
      ["pointerdown", onDown],
      ["pointermove", onMove],
      ["pointerup", onUp],
      ["pointercancel", onUp],
    ];
    for (const [type, fn] of pointer) card.addEventListener(type, fn as EventListener);
    card.addEventListener("touchmove", onTouchMove, { passive: false });
    card.addEventListener("contextmenu", onContextMenu);
    return () => {
      cancelHold();
      for (const [type, fn] of pointer) card.removeEventListener(type, fn as EventListener);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("contextmenu", onContextMenu);
    };
  }, [setPart]);

  return (
    <div ref={ref} className="lens" aria-hidden="true">
      {/* Clipped to the card: the magnified twin must not widen the page. */}
      <div className="lens-clip">
        <div className="lens-view">
          <CardContent lang={lang} t={t} frame={frame} wire />
        </div>
      </div>
      <span className="lens-ring" />
      <span ref={label} className="lens-label mono" />
    </div>
  );
}

function KarakGlass() {
  // Drawn twice (the card and its twin in the lens), so the gradient id is unique.
  const tea = useId();
  return (
    <svg width="132" height="132" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={tea} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d08a48" />
          <stop offset="1" stopColor="#8d4c1f" />
        </linearGradient>
      </defs>
      <g className="steam" stroke="#fff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round">
        <path d="M50 36c-3-4 3-7 0-11s3-7 0-10" />
        <path d="M60 34c-3-4 3-7 0-11s3-7 0-10" />
        <path d="M70 36c-3-4 3-7 0-11s3-7 0-10" />
      </g>
      <ellipse cx="60" cy="113" rx="34" ry="4.5" fill="#000" fillOpacity=".12" />
      <path d="M37 44h46l-6.5 64.5c-.3 2.4-8 3.5-16.5 3.5s-16.2-1.1-16.5-3.5L37 44Z" fill="#fff" fillOpacity=".22" />
      <path d="M39.6 56h40.8l-5.1 51.6c-.3 1.9-7 2.9-15.3 2.9s-15-1-15.3-2.9L39.6 56Z" fill={`url(#${tea})`} />
      <ellipse cx="60" cy="56" rx="20.4" ry="3.2" fill="#ecc89a" />
      <path d="M37 44h46l-6.5 64.5c-.3 2.4-8 3.5-16.5 3.5s-16.2-1.1-16.5-3.5L37 44Z" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" />
      <ellipse cx="60" cy="44" rx="23" ry="3.4" stroke="#fff" strokeOpacity=".9" strokeWidth="1.5" />
      <path d="M43.5 51 47 104" stroke="#fff" strokeOpacity=".45" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Story rail ─────────────────────────────────────────── */

export function StoryRail({ chapters }: { chapters: Dictionary["chapters"] }) {
  const { frame, cycle, reduced } = useContext(ShowcaseContext);

  return (
    <ol className="rail" aria-hidden="true">
      {chapters.map((chapter, i) => {
        const state = reduced || i < frame.phase ? "done" : i === frame.phase ? "active" : "idle";
        return (
          <li
            key={chapter.label}
            className="rail-step"
            data-state={state}
            style={{ "--phase-ms": `${PHASES[i].ms}ms` } as CSSProperties}
          >
            <span className="rail-bar">
              <span className="rail-fill" key={state === "active" ? cycle : undefined} />
            </span>
            <span className="rail-label">
              <span className="rail-num mono">0{i}</span>
              <span className="rail-text">{chapter.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
