"use client";

import { useEffect, useRef } from "react";
import { CITY, HAJAR, HAJAR_VIEWBOX } from "@/lib/hajar";
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
      // Night falls slowly, over almost two screens of scrolling.
      if (contact) {
        next.push([top(contact) - vh * 1.4, STORY.chapters[3][1] + offset], [top(contact) + vh * 0.3, STORY.night + offset]);
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

    // Colours drift slowly, so they go through CSS variables in ~250 steps
    // per day. Positions and opacities change every frame, so they are
    // written straight onto the few elements that move: inherited variables
    // would make the browser restyle every element in the sky, every frame.
    const part = (name: string) => sky.querySelector<HTMLElement | SVGElement>(`.${name}`)!;
    const sun = part("sky-sun");
    const moon = part("sky-moon");
    const sunGlow = part("sky-glow-sun");
    const moonGlow = part("sky-glow-moon");
    const stars = part("sky-stars");
    const meteor = part("sky-meteor");
    const cityGlow = part("sky-city-glow");
    const layers: [HTMLElement | SVGElement, number][] = [
      [part("ridges-back"), 7],
      [part("city"), 10],
      [part("ridges-front"), 18],
    ];
    let lastShade = -1;
    let lastTheme = "";

    const paint = () => {
      raf = 0;
      const t = timeAt(scrollY);
      const theme = root.dataset.theme === "dark" ? "dark" : "light";
      const b = bodiesAt(t);
      const shade = Math.round(t * 250);
      if (shade !== lastShade || theme !== lastTheme) {
        lastShade = shade;
        lastTheme = theme;
        const c = skyAt(shade / 250, theme);
        const s = sky.style;
        s.setProperty("--sky-top", c.top);
        s.setProperty("--sky-mid", c.mid);
        s.setProperty("--sky-horizon", c.horizon);
        s.setProperty("--sky-glow", c.glow);
        s.setProperty("--sun-core", sunCore(b.warmth));
        s.setProperty("--warmth", Math.min(1, b.warmth).toFixed(2));
      }

      // Heights are measured from the mountains' horizon (see .sky in CSS).
      const vw = innerWidth;
      const vh = innerHeight;
      const ridges = Math.min(300, Math.max(96, Math.min(vh * 0.24, vw * 0.125)));
      const horizon = vh - ridges * 0.62;
      const zenith = vh * 0.13;
      const place = (x: number, up: number) =>
        `translate(${(x * vw).toFixed(1)}px, ${(horizon - up * (horizon - zenith)).toFixed(1)}px)`;

      sun.style.transform = place(b.sun.x, b.sun.up);
      sun.style.opacity = b.sun.disc.toFixed(3);
      moon.style.transform = `${place(b.moon.x, b.moon.up)} rotate(-18deg)`;
      moon.style.opacity = b.moon.disc.toFixed(3);
      // Once it has climbed, the moon goes soft-focus as well as faint.
      moon.style.filter = `blur(${((1 - b.moon.disc) * 2.2).toFixed(2)}px)`;
      sunGlow.style.transform = place(b.sun.x, b.sun.up);
      sunGlow.style.opacity = b.sun.seen.toFixed(3);
      moonGlow.style.transform = place(b.moon.x, b.moon.up);
      moonGlow.style.opacity = b.moon.seen.toFixed(3);
      stars.style.opacity = b.stars.toFixed(3);

      const max = root.scrollHeight - vh;
      const depth = max > 0 ? scrollY / max : 0;
      for (const [layer, rise] of layers) layer.style.transform = `translateY(${(depth * rise).toFixed(2)}px)`;
      layers[1][0].style.opacity = b.lights.toFixed(3);
      cityGlow.style.opacity = b.lights.toFixed(3);
      // Shooting stars only once the night is fully dark.
      meteor.style.opacity = Math.min(1, Math.max(0, (b.stars - 0.9) * 10)).toFixed(2);

      // Cards cast shadows away from the sun. Stepped, so the whole page
      // restyles only a few dozen times per scroll instead of every frame.
      // Fine steps (about 1px of shadow each) so the change reads as a glide.
      const lit = b.sun.seen;
      const lx = Math.round((b.sun.x - 0.5) * 2 * lit * 20) / 20;
      const warm = Math.round(Math.min(1, b.warmth) * 10) / 10;
      const on = Math.round(lit * 10) / 10;
      const light = `${lx}|${warm}|${on}`;
      if (light !== lastLight) {
        lastLight = light;
        root.style.setProperty("--light-x", String(lx));
        root.style.setProperty("--light-warm", String(warm));
        root.style.setProperty("--light-on", String(on));
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
      <div className="sky-glow sky-glow-moon" />
      <div className="sky-glow sky-glow-sun" />
      <div className="sky-moon" />
      <div className="sky-sun" />
      <div className="sky-meteor" />
      <div className="sky-city-glow" />
      {/* Separate layers, so the twinkling city never repaints the mountains:
          far + middle ridges, the city in the valley, then the foothills. */}
      <svg className="sky-ridges ridges-back" viewBox={HAJAR_VIEWBOX} preserveAspectRatio="xMidYMax slice">
        {RIDGES.slice(0, 2).map((name) => (
          <g key={name} className={`ridge ridge-${name}`}>
            <path className="ridge-fill" d={HAJAR[name].fill} />
            <path className="ridge-line" d={HAJAR[name].crest} />
          </g>
        ))}
      </svg>
      <div className="city">
        {[0, 1, 2].map((group) => (
          <svg
            key={group}
            className={`sky-ridges city-${group}`}
            viewBox={HAJAR_VIEWBOX}
            preserveAspectRatio="xMidYMax slice"
          >
            {CITY.filter((light) => light[3] === group).map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} />
            ))}
          </svg>
        ))}
      </div>
      <svg className="sky-ridges ridges-front" viewBox={HAJAR_VIEWBOX} preserveAspectRatio="xMidYMax slice">
        <g className="ridge ridge-near">
          <path className="ridge-fill" d={HAJAR.near.fill} />
          <path className="ridge-line" d={HAJAR.near.crest} />
        </g>
      </svg>
    </div>
  );
}
