/* Where the sun, moon and stars really are over Muscat at a given moment.
   Low-precision formulas from the Astronomical Almanac (good to about 0.01°
   for the sun and 0.3° for the moon), plain math with no dependencies.
   Directions are [east, up, north]; angles are radians. */

const D = Math.PI / 180;

export const MUSCAT = { lat: 23.5859 * D, lon: 58.4059 * D };

export type Vec3 = [number, number, number];
export type Body = { dir: Vec3; alt: number; az: number };

export type Sky = {
  sun: Body;
  moon: Body;
  /** Lit fraction of the moon, 0 (new) … 1 (full). */
  illumination: number;
  /** Rotates equatorial star directions into [east, up, north], column-major. */
  eqToWorld: number[];
};

const sinLat = Math.sin(MUSCAT.lat);
const cosLat = Math.cos(MUSCAT.lat);

/** Days since J2000.0 (2000-01-01 12:00 UTC). */
const days = (ms: number) => ms / 86400000 - 10957.5;

function sunRaDec(n: number) {
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * D;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D;
  const eps = (23.439 - 4e-7 * n) * D;
  return {
    ra: Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)),
    dec: Math.asin(Math.sin(eps) * Math.sin(lambda)),
  };
}

function moonRaDec(n: number) {
  const T = n / 36525;
  const s = (a: number, b: number) => Math.sin((a + b * T) * D);
  const lambda =
    (218.32 +
      481267.881 * T +
      6.29 * s(135, 477198.87) -
      1.27 * s(259.3, -413335.36) +
      0.66 * s(235.7, 890534.22) +
      0.21 * s(269.9, 954397.74) -
      0.19 * s(357.5, 35999.05) -
      0.11 * s(186.5, 966404.03)) *
    D;
  const beta =
    (5.13 * s(93.3, 483202.02) + 0.28 * s(228.2, 960400.89) - 0.28 * s(318.3, 6003.15) - 0.17 * s(217.6, -407332.21)) * D;
  const eps = (23.439 - 4e-7 * n) * D;
  const l = Math.cos(beta) * Math.cos(lambda);
  const m = Math.cos(eps) * Math.cos(beta) * Math.sin(lambda) - Math.sin(eps) * Math.sin(beta);
  const k = Math.sin(eps) * Math.cos(beta) * Math.sin(lambda) + Math.cos(eps) * Math.sin(beta);
  return { ra: Math.atan2(m, l), dec: Math.asin(k) };
}

function toBody(ra: number, dec: number, lst: number): Body {
  const h = lst - ra;
  const east = -Math.cos(dec) * Math.sin(h);
  const north = cosLat * Math.sin(dec) - sinLat * Math.cos(dec) * Math.cos(h);
  const up = sinLat * Math.sin(dec) + cosLat * Math.cos(dec) * Math.cos(h);
  return { dir: [east, up, north], alt: Math.asin(up), az: Math.atan2(east, north) };
}

export function skyAt(ms: number): Sky {
  const n = days(ms);
  const lst = (280.46061837 + 360.98564736629 * n) * D + MUSCAT.lon;
  const s = sunRaDec(n);
  const m = moonRaDec(n);
  const sun = toBody(s.ra, s.dec, lst);
  const moon = toBody(m.ra, m.dec, lst);
  const cosElong = sun.dir[0] * moon.dir[0] + sun.dir[1] * moon.dir[1] + sun.dir[2] * moon.dir[2];
  const sl = Math.sin(lst);
  const cl = Math.cos(lst);
  return {
    sun,
    moon,
    illumination: (1 - cosElong) / 2,
    // Columns of: x = -sl·qx + cl·qy, y = cφ·cl·qx + cφ·sl·qy + sφ·qz, z = -sφ·cl·qx - sφ·sl·qy + cφ·qz
    eqToWorld: [-sl, cosLat * cl, -sinLat * cl, cl, cosLat * sl, -sinLat * sl, 0, sinLat, cosLat],
  };
}

/** The clock in Muscat (UTC+4 all year) as "HH:MM". */
export function muscatClock(ms: number) {
  const m = Math.floor(ms / 60000 + 240);
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Today's moment (ms) at a given Muscat clock hour, e.g. 17.5. */
export function atMuscatHour(hour: number, now = Date.now()) {
  const dayStart = Math.floor((now + 4 * 3600000) / 86400000) * 86400000 - 4 * 3600000;
  return dayStart + hour * 3600000;
}
