/* Golden hour: the page is lit like a day in Muscat.
   `t` runs around the clock from 0 (deep night) through dawn, midday and
   sunset back to 1 (night again). Everything visual is derived from it. */

type RGBA = [number, number, number, number];

type Keyframe = {
  t: number;
  top: string; // sky at the top of the screen
  mid: string;
  horizon: string; // just above the mountains
  glow: string; // the sun's (or moon's) halo, with alpha
};

/* Light theme keeps the sky pale enough for dark text at every hour:
   its "night" is a lavender blue hour, not black. */
const LIGHT: Keyframe[] = [
  { t: 0.0, top: "#d8dbe8", mid: "#e3e3ec", horizon: "#ebe4e6", glow: "#a8b4e099" },
  { t: 0.13, top: "#e6e3ec", mid: "#f0e9e8", horizon: "#f8dccb", glow: "#ffbf9a99" },
  { t: 0.3, top: "#eceff1", mid: "#f4f2ed", horizon: "#f8ecdc", glow: "#ffdcae88" },
  { t: 0.48, top: "#e9eff4", mid: "#f4f4f0", horizon: "#f6f3ec", glow: "#fff2cf88" },
  { t: 0.66, top: "#f0ece5", mid: "#f6eee1", horizon: "#f8dfbf", glow: "#ffc98a99" },
  { t: 0.82, top: "#eee2dc", mid: "#f5dccd", horizon: "#f7c6a6", glow: "#ff8a5088" },
  { t: 0.92, top: "#dfdbe6", mid: "#eadcdf", horizon: "#f0cdc2", glow: "#e0857a77" },
];

/* Dark theme: an ink sky where the sun is mostly felt as coloured light. */
const DARK: Keyframe[] = [
  { t: 0.0, top: "#04060c", mid: "#070a13", horizon: "#0d1322", glow: "#7f95e033" },
  { t: 0.13, top: "#07070c", mid: "#110e13", horizon: "#2b1813", glow: "#ff8a4c55" },
  { t: 0.3, top: "#0a0a0d", mid: "#100f10", horizon: "#1f1a13", glow: "#ffcf8a33" },
  { t: 0.48, top: "#0b0c0f", mid: "#0f1013", horizon: "#17181b", glow: "#fff1c222" },
  { t: 0.66, top: "#0b0a0a", mid: "#130f0e", horizon: "#2b1a0e", glow: "#ffb35a44" },
  { t: 0.82, top: "#0a090a", mid: "#1b0e0a", horizon: "#401708", glow: "#ff5a2466" },
  { t: 0.92, top: "#06060b", mid: "#0e0b13", horizon: "#1d1220", glow: "#a04a5a44" },
];

const hex = (h: string): RGBA => {
  const n = h.slice(1);
  const v = (i: number) => parseInt(n.slice(i, i + 2), 16);
  return [v(0), v(2), v(4), n.length > 6 ? v(6) / 255 : 1];
};

const PALETTES = {
  light: LIGHT.map((k) => ({ ...k, rgba: [k.top, k.mid, k.horizon, k.glow].map(hex) })),
  dark: DARK.map((k) => ({ ...k, rgba: [k.top, k.mid, k.horizon, k.glow].map(hex) })),
};

const smooth = (x: number) => x * x * (3 - 2 * x);
const mix = (a: RGBA, b: RGBA, x: number): RGBA => a.map((v, i) => v + (b[i] - v) * x) as RGBA;
const css = ([r, g, b, a]: RGBA) => `rgb(${r | 0} ${g | 0} ${b | 0} / ${a.toFixed(3)})`;

export const wrap = (t: number) => ((t % 1) + 1) % 1;

export type SkyColors = { top: string; mid: string; horizon: string; glow: string };

/** The sky's colours at time `t`, eased between neighbouring keyframes. */
export function skyAt(t: number, theme: "light" | "dark"): SkyColors {
  const frames = PALETTES[theme];
  const x = wrap(t);
  let i = frames.length - 1;
  while (i > 0 && frames[i].t > x) i--;
  const a = frames[i];
  const b = frames[(i + 1) % frames.length];
  const span = (b.t > a.t ? b.t : b.t + 1) - a.t;
  const k = smooth(((x - a.t + 1) % 1) / span);
  const [top, mid, horizon, glow] = a.rgba.map((c, j) => css(mix(c, b.rgba[j], k)));
  return { top, mid, horizon, glow };
}

// Sun is up from dawn to dusk; the moon owns the rest.
const SUNRISE = 0.12;
const SUNSET = 0.86;

export type Bodies = {
  sunX: number; // 0 (left) … 1 (right), fraction of the screen
  sunUp: number; // 0 on the horizon … 1 at its highest
  sun: number; // visibility 0 … 1
  moon: number;
  stars: number;
  warmth: number; // 0 neutral … 1 deep sunset orange
};

/* From Muscat the sea is to the north, so the sun rises on the right
   (east) and sets on the left (west), arcing high over the city at noon. */
export function bodiesAt(t: number): Bodies {
  const x = wrap(t);
  const day = Math.min(1, Math.max(0, (x - SUNRISE) / (SUNSET - SUNRISE)));
  const up = x > SUNRISE - 0.03 && x < SUNSET + 0.03;
  const height = Math.sin(Math.PI * day);
  const nightness = up ? 0 : 1;
  const edge = (from: number, to: number) => Math.min(1, Math.max(0, (x - from) / (to - from)));
  const twilight = x < 0.5 ? 1 - edge(0.04, 0.12) : edge(0.88, 0.97);
  return {
    sunX: 0.88 - day * 0.76,
    sunUp: height,
    sun: up ? Math.min(1, height * 4) : 0,
    moon: Math.max(nightness, twilight),
    stars: twilight,
    warmth: Math.max(0, 1 - Math.abs(x - 0.82) / 0.12) + Math.max(0, 1 - Math.abs(x - 0.13) / 0.08) * 0.6,
  };
}

/* Muscat clock → t. Anchors line up with the palette keyframes. */
const CLOCK: [hours: number, t: number][] = [
  [0, 0],
  [5.5, 0.13],
  [8, 0.3],
  [12.5, 0.48],
  [15.5, 0.66],
  [18, 0.82],
  [19, 0.92],
  [24, 1],
];

export function muscatT(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Muscat",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return clockT(get("hour") + get("minute") / 60);
}

/** Hours on a 24-hour clock (e.g. 18.5) → t. */
export function clockT(hours: number): number {
  const h = Math.min(24, Math.max(0, hours));
  let i = 0;
  while (i < CLOCK.length - 2 && CLOCK[i + 1][0] <= h) i++;
  const [h0, t0] = CLOCK[i];
  const [h1, t1] = CLOCK[i + 1];
  return t0 + ((h - h0) / (h1 - h0)) * (t1 - t0);
}

/** The shortest way round the clock from `from` to `to` (may go backwards). */
export function nearest(from: number, to: number): number {
  let d = wrap(to) - wrap(from);
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return from + d;
}

/* The story's day: where each part of the page sits on the clock. */
export const STORY = {
  morning: 0.26,
  chapters: [
    [0.26, 0.38],
    [0.38, 0.54],
    [0.54, 0.7],
    [0.7, 0.84],
  ] as [number, number][],
  night: 1,
};
