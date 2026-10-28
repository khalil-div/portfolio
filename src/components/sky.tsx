"use client";

import { useEffect, useRef } from "react";
import { HAJAR, HAJAR_VIEWBOX } from "@/lib/hajar";
import { bodiesAt, clockT, muscatT, nearest, skyAt, STORY } from "@/lib/sky";

const RIDGES = ["far", "mid", "near"] as const;

// Sun colour from white-gold at noon to deep orange at sunset.
const sunCore = (warmth: number) => {
  const w = Math.min(1, warmth);
  const r = 255;
  const g = Math.round(244 - w * 154);
  const b = Math.round(214 - w * 178);
  return `rgb(${r} ${g} ${b})`;
};

/* The fixed sky behind the page. Scroll position becomes a time of day:
   the hero opens at the real time in Muscat, Work carries it to morning,
   the four chapters run morning → sunset, and Contact falls into night. */
export function Sky() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sky = ref.current;
    if (!sky) return;
    const root = document.documentElement;
    // `?hour=21` previews the page at another time of day.
    const preview = new URLSearchParams(location.search).get("hour");
    const opening = preview && Number.isFinite(Number(preview)) ? clockT(Number(preview)) : muscatT();
    let knots: [y: number, t: number][] = [[0, opening]];
    let raf = 0;
    let lastLight = "";

    // Scroll positions where the clock reaches each part of the story.
    const measure = () => {
      const vh = innerHeight;
      const top = (el: Element) => el.getBoundingClientRect().top + scrollY;
      const work = document.getElementById("work");
      const process = document.getElementById("process");
      const contact = document.getElementById("contact");
      const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
      const morning = nearest(opening, STORY.morning);
      const offset = morning - STORY.morning; // keeps the clock moving one way

      const next: [number, number][] = [[0, opening]];
      if (work) next.push([top(work) - vh * 0.5, opening]);
      if (process) next.push([top(process), morning]);
      steps.forEach((step, i) => {
        const [from, to] = STORY.chapters[i] ?? STORY.chapters[3];
        const start = top(step) - vh * 0.5;
        next.push([start, from + offset], [start + step.offsetHeight, to + offset]);
      });
      if (contact) {
        next.push([top(contact) - vh * 0.9, STORY.chapters[3][1] + offset], [top(contact) - vh * 0.1, STORY.night + offset]);
      }
      knots = next.sort((a, b) => a[0] - b[0]);
    };

    const timeAt = (y: number) => {
      if (y <= knots[0][0]) return knots[0][1];
      for (let i = 1; i < knots.length; i++) {
        const [y1, t1] = knots[i];
        if (y <= y1) {
          const [y0, t0] = knots[i - 1];
          return y1 === y0 ? t1 : t0 + ((y - y0) / (y1 - y0)) * (t1 - t0);
        }
      }
      return knots[knots.length - 1][1];
    };

    const paint = () => {
      raf = 0;
      const t = timeAt(scrollY);
      const dark = root.dataset.theme === "dark";
      const c = skyAt(t, dark ? "dark" : "light");
      const b = bodiesAt(t);
      const s = sky.style;
      s.setProperty("--sky-top", c.top);
      s.setProperty("--sky-mid", c.mid);
      s.setProperty("--sky-horizon", c.horizon);
      s.setProperty("--sky-glow", c.glow);
      s.setProperty("--sun-x", b.sunX.toFixed(4));
      s.setProperty("--sun-up", b.sunUp.toFixed(4));
      s.setProperty("--sun-o", b.sun.toFixed(3));
      s.setProperty("--sun-core", sunCore(b.warmth));
      s.setProperty("--moon-o", b.moon.toFixed(3));
      s.setProperty("--stars-o", b.stars.toFixed(3));
      s.setProperty("--warmth", Math.min(1, b.warmth).toFixed(3));
      // At night the halo belongs to the moon, high on the right.
      s.setProperty("--glow-x", (b.sun > 0 ? b.sunX : 0.78).toFixed(4));
      s.setProperty("--glow-up", (b.sun > 0 ? b.sunUp : 0.92).toFixed(4));
      const max = root.scrollHeight - innerHeight;
      s.setProperty("--depth", (max > 0 ? scrollY / max : 0).toFixed(4));

      // Cards cast shadows away from the sun. Stepped, so the whole page
      // restyles only a few dozen times per scroll instead of every frame.
      const lx = b.sun > 0 ? Math.round((b.sunX - 0.5) * 2 * 10) / 10 : 0;
      const warm = Math.round(Math.min(1, b.warmth) * 5) / 5;
      const light = `${lx}|${warm}|${b.sun > 0 ? 1 : 0}`;
      if (light !== lastLight) {
        lastLight = light;
        root.style.setProperty("--light-x", String(lx));
        root.style.setProperty("--light-warm", String(warm));
        root.style.setProperty("--light-on", b.sun > 0 ? "1" : "0");
      }
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    measure();
    paint();
    sky.setAttribute("data-ready", "");

    const resize = new ResizeObserver(remeasure);
    resize.observe(document.body);
    const themes = new MutationObserver(schedule);
    themes.observe(root, { attributeFilter: ["data-theme"] });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      themes.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <div ref={ref} className="sky" aria-hidden="true">
      <div className="sky-stars" />
      <div className="sky-glow" />
      <div className="sky-moon" />
      <div className="sky-sun" />
      <svg className="sky-ridges" viewBox={HAJAR_VIEWBOX} preserveAspectRatio="xMidYMax slice">
        {RIDGES.map((name) => (
          <g key={name} className={`ridge ridge-${name}`}>
            <path className="ridge-fill" d={HAJAR[name].fill} />
            <path className="ridge-line" d={HAJAR[name].crest} />
          </g>
        ))}
      </svg>
    </div>
  );
}
