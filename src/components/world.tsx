"use client";

import { useEffect, useRef, useState } from "react";
import { atMuscatHour, muscatClock, skyAt } from "@/lib/world/astronomy";
import type { Stage, World as Engine } from "@/lib/world/engine";

type Labels = {
  dragSun: string;
  dragMoon: string;
  swipe: string;
  now: string;
  place: string;
  hourLabel: string;
};

const HOUR = 3600000;
const D = Math.PI / 180;
const OPENING_MS = 4400; // the time-lapse that lands on the present
const OPENING_FROM = -1.3 * HOUR;
const SPARK_MS = 340; // on a first visit, the logo's full stop gets there just before the world does
const SWIPE_HOURS = 6; // one screen-width of swipe
const MAX_OFFSET = 36 * HOUR;
const BODY_CEILING = 24 * D; // once the camera has tilted up, the sun has room to climb

const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const ss = (a: number, b: number, x: number) => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

/** Sunrise and sunset, in ms, on the Muscat day that contains a moment. */
function sunTimes(ms: number) {
  const cross = (from: number, to: number) => {
    let a = atMuscatHour(from, ms);
    let b = atMuscatHour(to, ms);
    const below = skyAt(a).sun.alt < 0;
    for (let i = 0; i < 12; i++) {
      const m = (a + b) / 2;
      if (skyAt(m).sun.alt < 0 === below) a = m;
      else b = m;
    }
    return a;
  };
  return { rise: cross(3, 9), set: cross(15, 21) };
}

type Hint = "sun" | "moon" | "swipe" | null;

/* On phones the whole page is one continuous shot of Muscat, drawn live. It
   opens in full colour; as the page scrolls the camera tilts up, the scene
   develops into the page's paper or ink, the day passes through the story, and
   it ends in full colour again, at night. The canvas stays fixed and never
   moves with the page, so scrolling only slides text over a still picture.
   The engine only loads on phones. The time of day is the one piece of state
   everything hangs from: now + offset (the visitor) + the page's story. */
export function World({ t }: { t: Labels }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [away, setAway] = useState(false); // the visitor has moved the hour
  const goHome = useRef<() => void>(() => {});

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const grab = handle.current;
    if (!el || !cv || !grab) return;
    const docRoot = document.documentElement;
    const phones = matchMedia("(max-width: 767px)");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const params = new URLSearchParams(location.search);
    const previewHour = Number(params.get("hour"));
    const preview = params.has("hour") && Number.isFinite(previewHour) ? atMuscatHour(previewHour) : null;
    const now = () => preview ?? Date.now();

    // The header stands in the first screen and leaves with it, then comes back as
    // a bar once the scene has developed all the way to the top of the screen.
    const past = new IntersectionObserver(([entry]) => docRoot.toggleAttribute("data-past-world", !entry.isIntersecting), {
      rootMargin: `${Math.max(0, Math.round(el.clientHeight * 0.34) - 72)}px 0px 0px 0px`,
    });
    past.observe(el);

    let world: Engine | null = null;
    let quality = 1;
    let stop = () => {};
    let cancelled = false;
    let started = false;

    const start = async () => {
      started = true;
      const { createWorld } = await import("@/lib/world/engine");
      if (cancelled) return;

      let raf = 0;
      let visible = true;
      let dpr = Math.min(devicePixelRatio || 1, 2);
      const lowEnd = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
      quality = lowEnd <= 4 ? 0.75 : 1;

      const make = () => {
        world = createWorld(cv, quality);
        if (!world) {
          docRoot.dataset.world = "off";
          return false;
        }
        size();
        return true;
      };

      // ── Framing ──
      let cssW = 0;
      let cssH = 0;
      let frameH = 0; // the first screen, with the browser's bars showing; the canvas is taller
      let sized = "";
      const size = () => {
        cssW = cv.clientWidth;
        cssH = cv.clientHeight;
        frameH = el.clientHeight;
        if (!cssW || !cssH || !frameH || !world) return; // hidden: a phone turned on its side
        const key = `${cssW}|${cssH}|${dpr}`;
        if (key !== sized) {
          sized = key;
          world.resize(cssW, cssH, dpr);
        }
        // The sun never climbs behind the headline.
        const title = document.querySelector(".hero-title");
        const below = title ? title.getBoundingClientRect().bottom + scrollY : frameH * 0.4;
        world.compose(frameH, frameH * 0.655, below + 40);
        measure();
        dirty = true;
      };

      // ── The page's story: scroll position → the hour, the camera, the paper or ink ──
      let knots: [y: number, ms: number][] = [[0, 0]];
      let bodyTop = 0; // the scene has fully developed here…
      let endTop = Infinity; // …and starts coming back here, below the last text
      let endGone = Infinity;
      let maxY = 0;
      const measure = () => {
        const top = (q: Element) => q.getBoundingClientRect().top + scrollY;
        const caption = document.querySelector(".hero-caption");
        const foot = document.querySelector(".footer-inner");
        bodyTop = caption ? top(caption) - 16 : frameH * 1.34;
        endTop = foot ? foot.getBoundingClientRect().bottom + scrollY + 20 : Infinity;
        endGone = endTop + frameH * 0.14;
        maxY = docRoot.scrollHeight - innerHeight;
        if (still.matches) return;

        // The day the page tells: the morning nearest to the hero's hour
        // (evening visitors go on through the night and see a sunrise).
        const base = now() + target;
        const day = sunTimes(base);
        let move = 0;
        if (day.rise + HOUR - base > 12 * HOUR) move = -24 * HOUR;
        else if (base - day.rise - HOUR > 12 * HOUR) move = 24 * HOUR;
        const rise = day.rise + move;
        const set = day.set + move;
        const marks = [rise + HOUR, rise + 3 * HOUR, (rise + set) / 2 + 0.6 * HOUR, set - 1.5 * HOUR, set + 0.12 * HOUR].map((m) => m - base);
        const night = set + 3 * HOUR - base;

        const work = document.getElementById("work");
        const process = document.getElementById("process");
        const contact = document.getElementById("contact");
        const next: [number, number][] = [[0, 0]];
        if (work) next.push([top(work) - frameH * 0.5, 0]);
        if (process) next.push([top(process), marks[0]]);
        document.querySelectorAll<HTMLElement>("[data-step]").forEach((step, i) => {
          const from = top(step) - frameH * 0.5;
          next.push([from, marks[Math.min(i, 3)]], [from + step.offsetHeight, marks[Math.min(i + 1, 4)]]);
        });
        if (contact) next.push([top(contact) - frameH * 1.4, marks[4]], [top(contact) + frameH * 0.3, night]);
        knots = next.sort((a, b) => a[0] - b[0]);
      };
      const storyAt = (y: number) => {
        if (y <= knots[0][0]) return knots[0][1];
        for (let i = 1; i < knots.length; i++) {
          const [y1, m1] = knots[i];
          if (y <= y1) {
            const [y0, m0] = knots[i - 1];
            return y1 === y0 ? m1 : m0 + ((y - y0) / (y1 - y0)) * (m1 - m0);
          }
        }
        return knots[knots.length - 1][1];
      };

      // ── Time ──
      let offset = still.matches ? 0 : OPENING_FROM; // ms away from the present
      let target = offset;
      let velocity = 0; // hours per second, after a swipe
      let tween: { from: number; at: number; ms: number } | null = null;
      let opening = !still.matches;
      let openedAt = 0;
      let dragging: "sun" | "moon" | "swipe" | null = null;
      let everUsed = false;
      try {
        everUsed = !!localStorage.getItem("world-used");
      } catch {}

      let seaTime = 0;
      let cloudT = 90;
      let fade = 0;
      let sparked = false;
      let ready = false;
      let last = 0;
      let dirty = true;
      let slowFrom = 0;
      let lastTop = 0;
      let lastToolbar = 0;
      let lastColour = "";
      let toolbarColour = "";
      let lastDraw = false;
      let lastClock = "";
      let lastHandle = "";
      let lastInk = -1;
      let stage: Stage | null = null;
      let shownHint: Hint = null;
      let settled = true; // the story is measured from the hour we've come to rest on
      let story = 0; // ms the page's story has moved the clock, eased
      let lastY = -1;
      let dark = docRoot.dataset.theme === "dark" ? 1 : 0;

      const moved = () => {
        if (!everUsed) {
          everUsed = true;
          try {
            localStorage.setItem("world-used", "1");
          } catch {}
        }
        setHint(null);
        shownHint = null;
        el.classList.add("world-touched");
        setAway(true);
        dirty = true;
      };
      const setTarget = (ms: number) => {
        target = clamp(ms, -MAX_OFFSET, MAX_OFFSET);
        tween = null;
        opening = false;
        dirty = true;
        schedule();
      };
      goHome.current = () => {
        if (!target && !offset) return;
        velocity = 0;
        settled = false;
        tween = { from: offset, at: performance.now(), ms: clamp((Math.abs(offset) / HOUR) * 420, 900, 2600) };
        setAway(false);
        el.classList.remove("world-touched");
        dirty = true;
        schedule();
      };

      // Which body the visitor can grab at this moment.
      const bodyOf = (s: Stage) => (s.sky.sun.alt > 0.012 ? "sun" : s.moonInFrame ? "moon" : null);
      const dirOf = (s: Stage, b: "sun" | "moon") => (b === "sun" ? s.sunDraw : s.moonDraw);

      // ── The sun on a string: it slides along its path toward the finger ──
      const pull = (b: "sun" | "moon", x: number, y: number) => {
        if (!world) return;
        let ms = now() + target;
        for (let i = 0; i < 4; i++) {
          const a = world.stage(ms - 300000);
          const c = world.stage(ms + 300000);
          const here = world.project(world.stage(ms), dirOf(world.stage(ms), b));
          const pa = world.project(a, dirOf(a, b));
          const pc = world.project(c, dirOf(c, b));
          if (!here.ok || !pa.ok || !pc.ok) break;
          const tx = (pc.x - pa.x) / (10 / 60);
          const ty = (pc.y - pa.y) / (10 / 60);
          const len = tx * tx + ty * ty;
          if (len < 1) break;
          const step = clamp(((x - here.x) * tx + (y - here.y) * ty) / len, -0.4, 0.4);
          ms += step * HOUR;
          if (Math.abs(step) < 0.002) break;
        }
        setTarget(ms - now());
      };

      let grabDX = 0;
      let grabDY = 0;
      let pulled = false;
      let lastAt = { x: 0, y: 0 };
      const toFrame = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY }); // the canvas starts at the screen's corner
      const onGrabDown = (e: PointerEvent) => {
        if (!world || !stage) return;
        const b = bodyOf(stage);
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        grab.setPointerCapture(e.pointerId);
        const at = world.project(stage, dirOf(stage, b));
        const p = toFrame(e);
        grabDX = at.x - p.x;
        grabDY = at.y - p.y;
        lastAt = at;
        dragging = b;
        pulled = false;
        velocity = 0;
        target = offset;
        grab.dataset.held = "";
        schedule();
      };
      const onGrabMove = (e: PointerEvent) => {
        if (dragging !== "sun" && dragging !== "moon") return;
        const p = toFrame(e);
        if (!pulled) {
          // A tap isn't a pull: nothing changes until the finger really moves.
          if (Math.hypot(p.x + grabDX - lastAt.x, p.y + grabDY - lastAt.y) < 3) return;
          pulled = true;
          moved();
        }
        pull(dragging, p.x + grabDX, p.y + grabDY);
      };
      const onGrabUp = () => {
        dragging = null;
        settled = false;
        delete grab.dataset.held;
        schedule();
      };

      // ── A swipe anywhere: one screen-width is six hours ──
      let swipeId = -1;
      let swipeX = 0;
      let swipeY = 0;
      let swipeLive = false;
      let swipeAt = 0;
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        swipeId = e.pointerId;
        swipeX = e.clientX;
        swipeY = e.clientY;
        swipeLive = false;
        swipeAt = performance.now();
        velocity = 0;
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== swipeId) return;
        const dx = e.clientX - swipeX;
        const dy = e.clientY - swipeY;
        if (!swipeLive) {
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
          swipeLive = true;
          dragging = "swipe";
          el.setPointerCapture(e.pointerId);
          target = offset;
          moved();
          swipeX = e.clientX;
          swipeAt = performance.now();
          return;
        }
        const t0 = performance.now();
        const hours = (dx / cssW) * SWIPE_HOURS;
        const dt = Math.max(8, t0 - swipeAt) / 1000;
        velocity = velocity * 0.6 + (hours / dt) * 0.4;
        swipeX = e.clientX;
        swipeAt = t0;
        setTarget(target + hours * HOUR);
      };
      const onUp = (e: PointerEvent) => {
        if (e.pointerId !== swipeId) return;
        swipeId = -1;
        if (swipeLive) {
          dragging = null;
          settled = false;
          if (performance.now() - swipeAt > 90) velocity = 0;
          schedule();
        }
        swipeLive = false;
      };

      // ── Keyboard and screen readers ──
      const slider = range.current;
      const onRange = () => {
        if (!slider) return;
        const value = Number(slider.value);
        const today = atMuscatHour(value / 60, now());
        setTarget(today - now());
        moved();
      };
      slider?.addEventListener("input", onRange);

      // ── Each frame ──
      const paintHandle = (s: Stage, y: number) => {
        if (!world) return;
        const b = dragging === "sun" || dragging === "moon" ? dragging : y < 24 ? bodyOf(s) : null;
        const at = b ? world.project(s, dirOf(s, b)) : null;
        const key = at && at.ok ? `${Math.round(at.x * 2)}|${Math.round((at.y + y) * 2)}` : "off";
        if (key === lastHandle) return;
        lastHandle = key;
        if (at && at.ok && at.y < frameH + 40) {
          grab.style.display = "";
          grab.style.transform = `translate3d(${at.x.toFixed(1)}px, ${(at.y + y).toFixed(1)}px, 0)`;
          grab.style.setProperty("--edge", String(clamp((at.x - cssW / 2) / (cssW / 2), -1, 1)));
        } else grab.style.display = "none";
      };

      const paintHint = (s: Stage) => {
        if (everUsed || dragging) return;
        // It appears as the opening slows down, while the eye is free again.
        if (opening && (!openedAt || last - openedAt < OPENING_MS * 0.72)) return;
        const b = bodyOf(s);
        const next: Hint = b ?? "swipe";
        if (next !== shownHint) {
          shownHint = next;
          setHint(next);
        }
      };

      // The headline stands in this light: warm near the horizon, cool at night.
      const paintInk = (s: Stage) => {
        const alt = s.sky.sun.alt / D;
        const warm = Math.max(0, 1 - Math.abs(alt - 3) / 10);
        const cool = clamp((-alt - 3) / 8, 0, 1);
        const key = Math.round(warm * 12) * 20 + Math.round(cool * 12);
        if (key === lastInk) return;
        lastInk = key;
        const r = Math.round(255 - cool * 14);
        const g = Math.round(255 - warm * 19 - cool * 8);
        const b = Math.round(255 - warm * 45);
        el.parentElement?.style.setProperty("--world-ink", `rgb(${r} ${g} ${b})`);
      };

      const paintClock = (ms: number) => {
        const text = muscatClock(ms);
        if (text !== lastClock) {
          lastClock = text;
          if (clock.current) clock.current.textContent = text;
          if (slider) {
            const [hh, mm] = text.split(":").map(Number);
            slider.value = String(hh * 60 + mm);
            slider.setAttribute("aria-valuetext", text);
          }
        }
      };

      // The header's bar and the browser's own bars take the colour of the top of the sky,
      // so nothing edges the picture. Sampled now and then, never waited for.
      const navBar = document.querySelector<HTMLElement>(".nav");
      const paintToolbar = (t0: number, resting = false) => {
        if (!world) return;
        const colour = world.topColor();
        if (colour && colour !== lastColour) {
          lastColour = colour;
          navBar?.style.setProperty("--bar", colour);
        }
        if (lastColour && lastColour !== toolbarColour && (resting || t0 - lastToolbar > 1200)) {
          toolbarColour = lastColour;
          lastToolbar = t0;
          setToolbar(lastColour);
        }
      };
      const sampleToolbar = (t0: number) => {
        if (lastDraw || t0 - lastTop > 500) {
          lastTop = t0;
          world?.sampleTop();
        }
      };

      const frame = (t0: number) => {
        raf = 0;
        if (!visible || !world || !cssW) return;
        const dt = last ? Math.min(0.1, (t0 - last) / 1000) : 0;
        const y = Math.max(0, scrollY);

        // Only the opening and the visitor's own hand get 60 fps. A scrolling page gets 30,
        // the sea at rest gets 30, and while someone's reading nothing is drawn at all:
        // it's the phone's work that makes scrolling stutter and batteries run down.
        const busy = opening || dragging || tween || Math.abs(velocity) > 0.01 || Math.abs(target - offset) > 2000 || fade < 1;
        const scrolled = y !== lastY;
        const darkTo = docRoot.dataset.theme === "dark" ? 1 : 0;
        const easing = Math.abs(storyAt(y) - story) > 20000 || dark !== darkTo;
        const inColour = bodyTop - y > 0 || endTop - y < cssH;
        const wanted = dirty || scrolled || easing || (inColour && !still.matches);
        if (!busy && !wanted) {
          // Nothing to draw: the engine sleeps until a scroll or a touch wakes it.
          setTimeout(() => paintToolbar(performance.now(), true), 150);
          return;
        }
        schedule();
        if (!busy && t0 - last < 28) return;
        const speed = dt > 0 && lastY >= 0 ? (y - lastY) / dt : 0;
        lastY = y;
        last = t0;

        // Time moves
        const before = offset;
        if (opening && openedAt) {
          const k = clamp((t0 - openedAt) / OPENING_MS, 0, 1);
          offset = OPENING_FROM * (1 - easeOut(k));
          target = offset;
          if (k >= 1) {
            opening = false;
            offset = target = 0;
          }
        } else if (tween) {
          const k = clamp((t0 - tween.at) / tween.ms, 0, 1);
          offset = tween.from * (1 - easeInOut(k));
          target = offset;
          if (k >= 1) {
            tween = null;
            offset = target = 0;
          }
        } else {
          if (!dragging && Math.abs(velocity) > 0.01) {
            target = clamp(target + velocity * dt * HOUR, -MAX_OFFSET, MAX_OFFSET);
            velocity *= Math.exp(-dt / 0.45);
          }
          offset += (target - offset) * (1 - Math.exp(-dt / (dragging ? 0.06 : 0.14)));
        }

        const storyBefore = story;
        story += (storyAt(y) - story) * (1 - Math.exp(-dt / 0.16));
        dark += (darkTo - dark) * (1 - Math.exp(-dt / 0.12));
        if (Math.abs(darkTo - dark) < 0.004) dark = darkTo;

        const hero = now() + offset; // the hour in the first screen
        const ms = hero + story;
        if (!still.matches && inColour) {
          seaTime += dt;
          cloudT += dt;
        }
        // Clouds race along when time does.
        cloudT += ((offset - before + story - storyBefore) / HOUR) * 110;

        // The camera tilts up until the mountains stand along the bottom of the screen,
        // and comes back down for the last shot. The paper or ink keeps just ahead of the text.
        const up = ss(0, frameH * 1.05, y);
        const down = Number.isFinite(endTop) ? ss(endTop - frameH * 1.1, Math.max(maxY, endTop - frameH), y) : 0;
        const shift = still.matches ? 0 : (frameH * 0.345 + 10) * up * (1 - down) + frameH * 0.065 * down;
        const lead = clamp(speed * 0.035, -70, 70);
        const ok = world.draw({
          ms,
          time: seaTime,
          cloudT,
          fade,
          horizonShift: shift,
          ceiling: world.ceiling() + (BODY_CEILING - world.ceiling()) * up * (1 - down),
          scrim: 1 - ss(0, frameH * 0.5, y),
          stock: [frameH - y - lead, bodyTop - y - lead, endTop - y - lead, endGone - y - lead],
          dark,
        });
        if (!ok) {
          dirty = true;
          return;
        }
        // One more after a scroll stops, to catch the colour of where it came to rest.
        dirty = scrolled;
        lastDraw = !scrolled && !busy && !easing;

        if (!ready) {
          ready = true;
          el.dataset.ready = "";
          docRoot.setAttribute("data-world-live", "");
        }
        // The curtain: fades from black, after the logo (if it's playing) has gone.
        const intro = docRoot.dataset.intro === "on";
        if (!intro && !openedAt) {
          openedAt = t0 + (sparked ? SPARK_MS : 0);
        }
        if (intro) sparked = true;
        if (openedAt) fade = clamp((t0 - openedAt) / 900, 0, 1);

        // Come to rest: the rest of the page's day is told from this hour.
        if (!settled && !busy) {
          settled = true;
          measure();
          story = storyAt(y);
        }

        if (y < frameH) {
          stage = world.stage(hero);
          paintHandle(stage, y);
          paintHint(stage);
          paintInk(stage);
          paintClock(hero);
          publishSun(stage);
        }
        paintToolbar(t0);
        sampleToolbar(t0);

        // Too slow for this phone? Fewer pixels, not fewer frames.
        if ((busy || scrolled) && dt > 0) {
          if (dt > 0.042) {
            slowFrom += 1;
            if (slowFrom > 24 && dpr > 1) {
              dpr = Math.max(1, dpr - 0.35);
              slowFrom = 0;
              size();
            }
          } else slowFrom = Math.max(0, slowFrom - 1);
        }
      };

      const schedule = () => {
        if (!raf && visible) raf = requestAnimationFrame(frame);
      };

      // Tell the logo where the sun is, so its full stop can fly there.
      const publishSun = (s: Stage) => {
        if (!world || docRoot.dataset.intro !== "on") return;
        const b = bodyOf(s);
        const at = b ? world.project(s, dirOf(s, b)) : null;
        if (at?.ok) {
          docRoot.style.setProperty("--world-sun-x", `${at.x.toFixed(1)}px`);
          docRoot.style.setProperty("--world-sun-y", `${at.y.toFixed(1)}px`);
        }
      };

      if (!make()) return;

      const resized = () => {
        size();
        schedule();
      };
      const observer = new ResizeObserver(resized);
      observer.observe(cv);
      observer.observe(el);
      // The page's own height moving only changes where the story's marks are.
      const page = new ResizeObserver(() => {
        measure();
        dirty = true;
        schedule();
      });
      page.observe(document.body);
      const themes = new MutationObserver(schedule);
      themes.observe(docRoot, { attributeFilter: ["data-theme"] });
      window.addEventListener("scroll", schedule, { passive: true });

      const sync = () => {
        const on = phones.matches && document.visibilityState === "visible";
        if (on === visible) return;
        visible = on;
        last = 0;
        if (on) {
          size();
          schedule();
        }
      };
      phones.addEventListener("change", sync);
      document.addEventListener("visibilitychange", sync);

      const onLost = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(raf);
        raf = 0;
        visible = false;
        world = null;
        ready = false;
        sized = "";
        docRoot.removeAttribute("data-world-live");
      };
      const onRestored = () => {
        if (!make()) return;
        visible = true;
        dirty = true;
        schedule();
      };
      cv.addEventListener("webglcontextlost", onLost);
      cv.addEventListener("webglcontextrestored", onRestored);

      grab.addEventListener("pointerdown", onGrabDown);
      grab.addEventListener("pointermove", onGrabMove);
      grab.addEventListener("pointerup", onGrabUp);
      grab.addEventListener("pointercancel", onGrabUp);
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);

      el.dataset.live = "";
      schedule();

      stop = () => {
        cancelAnimationFrame(raf);
        visible = false;
        observer.disconnect();
        page.disconnect();
        themes.disconnect();
        window.removeEventListener("scroll", schedule);
        phones.removeEventListener("change", sync);
        document.removeEventListener("visibilitychange", sync);
        cv.removeEventListener("webglcontextlost", onLost);
        cv.removeEventListener("webglcontextrestored", onRestored);
        grab.removeEventListener("pointerdown", onGrabDown);
        grab.removeEventListener("pointermove", onGrabMove);
        grab.removeEventListener("pointerup", onGrabUp);
        grab.removeEventListener("pointercancel", onGrabUp);
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        slider?.removeEventListener("input", onRange);
        setToolbar(null);
        docRoot.removeAttribute("data-world-live");
        world?.destroy();
      };
    };

    // Only phones load it. A window narrowed later loads it then.
    const gate = () => {
      if (phones.matches && !started) void start();
    };
    gate();
    phones.addEventListener("change", gate);
    return () => {
      cancelled = true;
      phones.removeEventListener("change", gate);
      past.disconnect();
      stop();
    };
  }, []);

  const hintText = hint === "sun" ? t.dragSun : hint === "moon" ? t.dragMoon : t.swipe;

  return (
    <>
      <canvas ref={canvas} className="world-canvas" aria-hidden="true" />
      <div ref={root} className="world" data-hint={hint ?? undefined}>
        {/* The sun itself is the control. Invisible until it's needed; keyboards use the slider below. */}
        <button ref={handle} type="button" className="world-handle" tabIndex={-1} aria-hidden="true">
          <span className="world-ring" />
          {hint && hint !== "swipe" ? <span className="world-hint">{hintText}</span> : null}
        </button>
        {hint === "swipe" ? <span className="world-hint world-hint-free">{hintText}</span> : null}

        <div className="world-bar">
          <span className="world-time">
            <span>{t.place}</span>
            <span ref={clock} className="mono" dir="ltr" />
          </span>
          <button type="button" className="world-now" data-show={away || undefined} onClick={() => goHome.current()}>
            {t.now}
          </button>
        </div>

        <input ref={range} className="sr-only world-range" type="range" min="0" max="1439" step="15" aria-label={t.hourLabel} defaultValue="720" />
      </div>
    </>
  );
}

/* The browser's bars are part of the picture. */
function setToolbar(colour: string | null) {
  const root = document.documentElement;
  root.style.backgroundColor = colour ?? "";
  const shade = colour ?? getComputedStyle(root).getPropertyValue("--bg");
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((el) => (el.content = shade));
}
