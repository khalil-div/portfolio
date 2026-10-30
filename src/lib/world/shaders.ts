/* The world's shaders. Nothing is an image: mountains, sea and clouds are all
   mathematics. Units are kilometres; x = east, y = up, z = north. The camera
   never moves, only turns, so the mountains are baked once into a panorama
   and each frame just lights them. Keep AZ/EL constants in step with engine.ts. */

const HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;

const SCENE = /* glsl */ `
#define SS smoothstep
const float PI = 3.14159265;
const float CAM_H = 0.016;      // the camera floats 16 m above the sea
const float AZ0 = 90., AZ1 = 335.;   // the panorama's sector, degrees from north
const float EL0 = -1.2, EL1 = 19.;   // and its elevation range
const float R0 = 0.4, R1 = 34.;      // nearest and farthest land
float rOfV(float v) { return R0 * pow(R1 / R0, v); }
float vOfR(float r) { return log(r / R0) / log(R1 / R0); }
`;

const NOISE = /* glsl */ `
float hash(ivec2 p) {
  uvec2 q = uvec2(p + ivec2(40000)) * uvec2(1597334673u, 3812015801u);
  uint n = (q.x ^ q.y) * 1597334673u;
  return float(n) * (1. / 4294967295.);
}
// Value noise with derivatives, x: -1…1, yz: gradient
vec3 noised(vec2 x) {
  vec2 i = floor(x), f = x - i;
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  vec2 du = 30. * f * f * (f * (f - 2.) + 1.);
  ivec2 c = ivec2(i);
  float a = hash(c), b = hash(c + ivec2(1, 0)), d = hash(c + ivec2(0, 1)), e = hash(c + ivec2(1, 1));
  float k1 = b - a, k2 = d - a, k4 = a - b - d + e;
  return vec3(-1. + 2. * (a + k1 * u.x + k2 * u.y + k4 * u.x * u.y), 2. * du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}
float vn(vec2 x) { return .5 + .5 * noised(x).x; }
const mat2 M2 = mat2(.8, -.6, .6, .8);
// fBm that damps detail on steep ground, which reads as erosion
float eroded(vec2 p, int oct) {
  float a = 0., b = 1.;
  vec2 d = vec2(0.);
  for (int i = 0; i < oct; i++) {
    vec3 n = noised(p);
    d += n.yz;
    a += b * n.x / (1. + dot(d, d));
    b *= .5;
    p = M2 * p * 2.;
  }
  return a;
}
float fbm(vec2 p, int oct) {
  float a = 0., b = .5;
  for (int i = 0; i < oct; i++) { a += b * vn(p); b *= .5; p = M2 * p * 2.03; }
  return a;
}
`;

const TERRAIN = /* glsl */ `
// The skyline is art-directed by bearing: a tall massif to the south, falling
// away to low, hazy ranges in the west where the sun sets, and open sea to the
// north and east where it rises (Muscat's real geography, roughly).
float elevDeg(float az) {
  return 1.9 * SS(92., 118., az) * (1. - SS(304., 332., az)) + 4.3 * SS(106., 146., az) * (1. - SS(204., 246., az));
}
float shoreR(float az) {
  return 2.2 + 6.5 * SS(204., 256., az) + 9. * SS(262., 318., az) + 5. * (1. - SS(100., 150., az));
}
float height(vec2 p, int oct) {
  float r = length(p) + 1e-4;
  float az = degrees(atan(p.x, p.y));
  if (az < 0.) az += 360.;
  float E = elevDeg(az);
  if (E <= .01) return -.03;
  float n0 = vn(p * .38 + 3.7), n1 = vn(p * 1.3 - 9.1);
  float c = r - (shoreR(az) + (n0 - .5) * 2.2 + (n1 - .5) * .7);
  if (c < 0.) return -.03 * min(1., -c);
  vec2 q = p * .36 + vec2(11.3, 4.7);
  q += .5 * vec2(vn(p * .21 + 1.7), vn(p * .19 - 4.4));
  float n = eroded(q, oct);
  float rid = 1. - abs(2. * vn(q * .55 + 19.) - 1.);
  float rid2 = 1. - abs(2. * vn(q * 1.9 + 31.) - 1.);
  float rid3 = 1. - abs(2. * vn(q * 5.3 + 47.) - 1.);
  float m = .3 + .72 * n + .55 * rid * rid * rid - .12 + .2 * rid2 * rid2 * rid + .07 * rid3 * rid3 * rid2;
  m = max(m, .03);
  m = m / (1. + .5 * max(m - .75, 0.));
  float env = r * tan(radians(E)) * 1.12;
  return env * (1. - exp(-c / .6)) * m * SS(0., .1, c);
}
vec3 normalAt(vec2 p, float h, float e, int oct) {
  return normalize(vec3(h - height(p + vec2(e, 0.), oct), e, h - height(p + vec2(0., e), oct)));
}
vec3 rock(vec2 p, float h, vec3 N) {
  float n1 = fbm(p * 1.6 + 5., 4), n2 = fbm(p * 8.3, 4);
  float strata = .5 + .5 * sin((h + .09 * n1) * 58. + n2 * 4.);
  // the Hajar is dark rock, the old floor of an ocean, with rust in its strata
  vec3 a = mix(vec3(.075, .052, .042), vec3(.2, .13, .085), clamp(n1 * 1.3 - .15 + .16 * strata, 0., 1.));
  a = mix(a, vec3(.04, .034, .034), SS(.42, .72, n2) * .8);
  a = mix(a, vec3(.17, .135, .1), SS(.86, .99, N.y) * .5);
  a = mix(a, vec3(.42, .35, .26) * (.72 + .56 * n2), SS(.014, .0, h) * .85);
  return a;
}
`;

export const VS_FULL = HEAD + /* glsl */ `
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`;

/** Heights around the camera in polar form: azimuth across, log-distance up. */
export const FS_POLAR = HEAD + SCENE + NOISE + TERRAIN + /* glsl */ `
in vec2 vUv; out vec4 o;
void main() {
  float az = radians(mix(AZ0, AZ1, vUv.x));
  float r = rOfV(vUv.y);
  float spacing = r * .0045;
  int oct = int(clamp(floor(log2(2.8 / (2. * spacing))), 4., 11.));
  o = vec4(height(r * vec2(sin(az), cos(az)), oct), 0., 0., 1.);
}`;

/** A plain map of the same land, for shadows and the shoreline. */
export const FS_MAP = HEAD + SCENE + NOISE + TERRAIN + /* glsl */ `
in vec2 vUv; out vec4 o;
void main() {
  vec2 p = (vUv - .5) * 68.;
  float h = height(p, 7);
  o = vec4(h, 0., 0., 1.);
}`;

/** Tiling noise. rg: wave slopes, b, a: cloud shapes. */
export const FS_TILE = HEAD + /* glsl */ `
in vec2 vUv; out vec4 o;
float hash(ivec2 p, int s) {
  uvec2 q = uvec2(p + ivec2(9000 + s * 131)) * uvec2(1597334673u, 3812015801u);
  uint n = (q.x ^ q.y) * 1597334673u;
  return float(n) * (1. / 4294967295.);
}
float tn(vec2 uv, int period, int s) {
  vec2 x = uv * float(period);
  ivec2 i = ivec2(floor(x));
  vec2 f = fract(x);
  vec2 u = f * f * (3. - 2. * f);
  ivec2 a = ivec2(i.x % period, i.y % period), b = ivec2((i.x + 1) % period, (i.y + 1) % period);
  return mix(mix(hash(a, s), hash(ivec2(b.x, a.y), s), u.x), mix(hash(ivec2(a.x, b.y), s), hash(b, s), u.x), u.y);
}
float waves(vec2 uv) {
  float a = 0., w = .5;
  int p = 7;
  for (int i = 0; i < 5; i++) {
    float n = tn(uv, p, i);
    a += w * (1. - abs(2. * n - 1.));
    w *= .52;
    p *= 2;
  }
  return a;
}
float fbmt(vec2 uv, int s) {
  float a = 0., w = .5;
  int p = 4;
  for (int i = 0; i < 6; i++) { a += w * tn(uv, p, s + i); w *= .5; p *= 2; }
  return a;
}
void main() {
  float e = 1. / 512.;
  float dx = waves(vUv + vec2(e, 0.)) - waves(vUv - vec2(e, 0.));
  float dy = waves(vUv + vec2(0., e)) - waves(vUv - vec2(0., e));
  float k = 9.;
  o = vec4(.5 + dx * k, .5 + dy * k, fbmt(vUv, 20), fbmt(vUv + .37, 40));
}`;

/** The panorama: where each ray first meets the land, once, at load. */
export const FS_GBUFFER = HEAD + SCENE + NOISE + TERRAIN + /* glsl */ `
in vec2 vUv;
layout(location = 0) out vec4 g0;  // normal x, normal z, distance, coverage
layout(location = 1) out vec4 g1;  // rock colour, ambient occlusion
uniform sampler2D uPolar;
void main() {
  float el = radians(mix(EL0, EL1, vUv.y));
  float te = tan(el);
  float hit = -1., pv = 0.;
  const int N = 210;
  for (int i = 0; i < N; i++) {
    float v = (float(i) + .5) / float(N);
    float r = rOfV(v);
    float ray = CAM_H + r * te;
    if (ray < 0. || ray > 8.) break;
    if (textureLod(uPolar, vec2(vUv.x, v), 0.).r >= ray) {
      float a = pv, b = v;
      for (int k = 0; k < 6; k++) {
        float m = .5 * (a + b);
        if (textureLod(uPolar, vec2(vUv.x, m), 0.).r >= CAM_H + rOfV(m) * te) b = m; else a = m;
      }
      hit = rOfV(b);
      break;
    }
    pv = v;
  }
  if (hit < 0.) { g0 = vec4(0.); g1 = vec4(0.); return; }
  float az = radians(mix(AZ0, AZ1, vUv.x));
  vec2 p = hit * vec2(sin(az), cos(az));
  int oct = int(clamp(floor(log2(2.8 / (hit * .0026))), 5., 11.));
  float h = height(p, oct);
  vec3 n = normalAt(p, h, max(.004, hit * .0012), oct);
  // Valleys see less sky
  float ao = 0.;
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.047;
    vec2 q = p + .16 * vec2(cos(a), sin(a));
    float qr = length(q), qa = degrees(atan(q.x, q.y));
    if (qa < 0.) qa += 360.;
    float nh = textureLod(uPolar, vec2((qa - AZ0) / (AZ1 - AZ0), vOfR(qr)), 0.).r;
    ao += clamp((nh - h) / .16, 0., 1.);
  }
  g0 = vec4(n.x, n.z, hit, 1.);
  g1 = vec4(rock(p, h, n), 1. - .85 * ao / 6.);
}`;

/** The sky itself: light scattering through the atmosphere (Rayleigh, Mie, ozone). */
export const FS_SKY = HEAD + /* glsl */ `
in vec2 vUv; out vec4 o;
uniform vec3 uSun;   // in this frame the sun sits at azimuth 0: (0, sin alt, cos alt)
const float PI = 3.14159265, RG = 6360., RT = 6460.;
const vec3 BR = vec3(5.802e-3, 13.558e-3, 33.1e-3);
const vec3 BO = vec3(.65e-3, 1.881e-3, .085e-3);
const float BMS = 5.2e-3, BMA = 1.2e-3, HR = 8., HM = 1.3;
float toSphere(vec3 p, vec3 d, float R) {
  float b = dot(p, d), c = dot(p, p) - R * R, q = b * b - c;
  return q < 0. ? -1. : -b + sqrt(q);
}
bool hitsGround(vec3 p, vec3 d) {
  float b = dot(p, d), c = dot(p, p) - RG * RG;
  return b < 0. && b * b - c > 0.;
}
vec3 dens(float h) {
  return vec3(exp(-h / HR), exp(-h / HM), max(0., 1. - abs(h - 25.) / 15.));
}
void main() {
  float phi = vUv.x * PI;
  float s = vUv.y * 2. - 1.;
  float lat = sign(s) * s * s * PI * .5;
  vec3 d = vec3(cos(lat) * sin(phi), sin(lat), cos(lat) * cos(phi));
  vec3 p0 = vec3(0., RG + .016, 0.);
  float tMax = toSphere(p0, d, RT);
  if (hitsGround(p0, d)) {
    float b = dot(p0, d), c = dot(p0, p0) - RG * RG;
    tMax = min(tMax, max(-b - sqrt(max(b * b - c, 0.)), 40.));
  }
  float mu = dot(d, uSun);
  float pr = 3. / (16. * PI) * (1. + mu * mu);
  float g = .78, gg = g * g;
  float pm = (1. - gg) / (4. * PI * pow(max(1. + gg - 2. * g * mu, 1e-4), 1.5));
  vec3 L = vec3(0.), tv = vec3(0.);
  const int N = 18;
  float prev = 0.;
  for (int i = 0; i < N; i++) {
    float f = (float(i) + .5) / float(N);
    float t = tMax * f * f;
    float dt = t - prev; prev = t;
    vec3 q = p0 + d * t;
    float h = length(q) - RG;
    vec3 de = dens(h) * dt;
    tv += de;
    if (hitsGround(q, uSun)) continue;
    float tl = toSphere(q, uSun, RT);
    vec3 tu = vec3(0.);
    const int M = 9;
    for (int j = 0; j < M; j++) {
      float u = (float(j) + .5) / float(M);
      float tt = tl * u * u;
      float next = tl * (u + 1. / float(M)) * (u + 1. / float(M));
      vec3 w = q + uSun * tt;
      tu += dens(length(w) - RG) * (next - tt);
    }
    vec3 T = exp(-(BR * (tv.x + tu.x) + (BMS + BMA) * (tv.y + tu.y) + BO * (tv.z + tu.z)));
    vec3 a = dens(h);
    L += T * (a.x * BR * pr + a.y * BMS * pm) * dt;
    // a little light that has bounced more than once
    L += T * (a.x * BR + a.y * BMS) * dt * .03 * vec3(.55, .78, 1.25);
  }
  o = vec4(L * 22., 1.);
}`;

/** One frame. */
export const VS_FRAME = HEAD + /* glsl */ `
out vec2 vUv;
flat out vec3 vAmb;
flat out float vSunVis, vMoonVis;
uniform sampler2D uSkyTex, uG0;
uniform vec3 uSunDraw, uMoonDraw;
const float AZ0 = 90., AZ1 = 335., EL0 = -1.2, EL1 = 19.;
float clear(vec3 d) {
  float az = degrees(atan(d.x, d.z));
  if (az < 0.) az += 360.;
  float el = degrees(asin(d.y));
  vec2 uv = vec2((az - AZ0) / (AZ1 - AZ0), (el - EL0) / (EL1 - EL0));
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return el < EL0 ? 0. : 1.;
  return 1. - textureLod(uG0, uv, 0.).a;
}
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
  vAmb = textureLod(uSkyTex, vec2(.5, .98), 0.).rgb * .55 + textureLod(uSkyTex, vec2(.25, .8), 0.).rgb * .45;
  vSunVis = uSunDraw.y < -.02 ? 0. : clear(uSunDraw);
  vMoonVis = uMoonDraw.y < -.01 ? 0. : clear(uMoonDraw);
}`;

export const FS_FRAME = HEAD + SCENE + /* glsl */ `
in vec2 vUv;
flat in vec3 vAmb;
flat in float vSunVis, vMoonVis;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uF, uHorizon, uYaw, uTime, uCloudT, uExposure, uFade, uStars, uLights, uIllum, uSunSize, uMoonSize, uTwilight, uBlue, uPolar, uCover, uScrim, uFrame, uDark;
uniform vec4 uStock;  // where the page's paper or ink takes over: starts, full, ends, gone (px from the top)
uniform vec3 uSun, uSunDraw, uMoon, uMoonDraw, uSunCol, uCloudSun, uMoonCol, uBoat;
uniform vec2 uSunH;
uniform mat3 uWorldToEq;
uniform sampler2D uSkyTex, uG0, uG1, uTile, uMap, uEmit;

vec3 sky(vec3 d) {
  float lat = asin(clamp(d.y, -1., 1.));
  float v = .5 + .5 * sign(lat) * sqrt(abs(lat) / 1.5708);
  float c = clamp(dot(normalize(d.xz + 1e-5), uSunH), -1., 1.);
  vec3 night = mix(vec3(.02, .034, .078), vec3(.0045, .0095, .036), SS(0., .5, d.y));
  // the blue hour: light that has bounced around the planet, single scattering misses it
  vec3 blue = mix(vec3(.105, .095, .165), vec3(.017, .037, .118), SS(0., .36, d.y));
  vec3 tint = mix(vec3(1.), vec3(.74, .84, 1.3), uTwilight * SS(.015, .34, d.y));
  // a polarising filter, as any photographer would use in full daylight
  tint *= mix(vec3(1.), vec3(.66, .86, 1.2), uPolar * SS(.01, .32, d.y)) * mix(vec3(1.), vec3(.86, .96, 1.12), uPolar);
  return textureLod(uSkyTex, vec2(acos(c) / PI, v), 0.).rgb * tint + (night * uStars + blue * uBlue) / uExposure;
}

vec4 clouds(vec3 d) {
  if (d.y < .012) return vec4(0.);
  vec2 p = d.xz / (d.y + .09);
  vec2 w = p * vec2(.036, .1) + uCloudT * vec2(.0036, .0009);
  float lod = clamp(2. - d.y * 26., 0., 3.);
  float a = textureLod(uTile, w, lod).b;
  vec2 warp = (textureLod(uTile, w * 1.7 + .3, lod).ba - .5) * .09;
  float b = textureLod(uTile, w * 3.1 + warp, lod).a;
  float e = textureLod(uTile, w * 8.3 + warp * 3., lod).b;
  float shape = a * .8 + b * .28 + e * .1 - .02;
  float den = SS(uCover, uCover + .27, shape) * SS(.012, .08, d.y) * (1. - SS(.18, .5, d.y) * mix(.9, 1., uPolar));
  if (den < .002) return vec4(0.);
  float toward = pow(max(dot(d, uSunDraw), 0.), 7.);
  vec3 c = uCloudSun * (.26 + 1.2 * toward) * (.66 + .5 * (1. - den)) + vAmb * .7;
  float nearMoon = pow(max(dot(d, uMoonDraw), 0.), 14.);
  c += vec3(.03, .045, .085) * uStars * (1. + .5 * nearMoon * uIllum) / uExposure;
  return vec4(c, den * mix(.72, .5, uStars));
}

// Shared terrain shading. withShadow is off for reflections.
vec3 shadeLand(vec3 rd, float el, vec2 uv, vec4 g, float cov, bool withShadow, float jitter) {
  vec3 alb = textureLod(uG1, uv, 0.).rgb / cov;
  float ao = textureLod(uG1, uv, 0.).a / cov;
  vec2 nxz = g.rg / cov;
  vec3 n = vec3(nxz.x, sqrt(max(0., 1. - dot(nxz, nxz))), nxz.y);
  float r = g.b / cov;
  vec2 h = normalize(rd.xz);
  vec3 P = vec3(h.x * r, CAM_H + r * tan(el), h.y * r);
  float ndl = max(dot(n, uSun), 0.);
  float sh = 1.;
  if (withShadow && ndl > .001 && uSun.y > -.02) {
    float t = .03 + .05 * jitter, res = 1.;
    vec3 o = P + n * .03;
    for (int i = 0; i < 13; i++) {
      vec3 q = o + uSun * t;
      float mh = textureLod(uMap, q.xz / 68. + .5, 0.).r;
      res = min(res, 9. * (q.y - mh) / t);
      if (res < .01) break;
      t *= 1.5;
    }
    sh = SS(0., 1., res);
  }
  vec3 col = alb * (uSunCol * ndl * sh / PI * mix(1., .55, uPolar) + vAmb * ao * (.55 + .45 * n.y) * 1.15 + uMoonCol * max(dot(n, uMoon), 0.) * .3);
  // the air between here and there
  vec3 far = sky(normalize(vec3(rd.x, max(rd.y, .012) + .035, rd.z)));
  float haze = 1. - exp(-r * mix(.088, .055, uPolar));
  return mix(col, far, haze);
}

vec2 panoUv(vec3 d, out float el) {
  float az = degrees(atan(d.x, d.z));
  if (az < 0.) az += 360.;
  el = asin(clamp(d.y, -1., 1.));
  return vec2((az - AZ0) / (AZ1 - AZ0), (degrees(el) - EL0) / (EL1 - EL0));
}
bool inPano(vec2 uv) { return uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.; }

// A dhow under its lateen sail. p: x from stern (-1) to bow (+1), y up, in half-lengths
// from the waterline. Returns coverage; sail says how much of it is canvas.
float dhow(vec2 p, out float sail) {
  float e = .05;
  float deck = .1 + .1 * p.x + .17 * p.x * p.x * p.x + .1 * p.x * p.x;
  float keel = -.03 + .09 * p.x * p.x;
  float hull = SS(-e, e, deck - p.y) * SS(-e, e, p.y - keel) * SS(1.04, .96, abs(p.x - .03));
  float mast = SS(.03 + e, .03, abs(p.x - .06 - p.y * .1)) * step(.05, p.y) * step(p.y, 1.1);
  // yard from low at the bow to high over the stern, canvas hanging beneath it
  vec2 a = vec2(.84, .3), b = vec2(-.44, 1.42), c = vec2(-.56, .27);
  float s1 = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
  float s2 = (p.x - b.x) * (c.y - b.y) - (p.y - b.y) * (c.x - b.x) - .07 * sin((p.y - c.y) * 2.8);
  float s3 = (p.x - c.x) * (a.y - c.y) - (p.y - c.y) * (a.x - c.x) + .05 * sin((p.x - c.x) * 2.2);
  sail = SS(-e, e, -s1) * SS(-e, e, -s2) * SS(-e, e, -s3);
  return max(max(hull, mast), sail);
}
vec3 dhowLight(float sail, vec2 p) {
  vec3 hull = vec3(.05, .032, .022) * (uSunCol * .2 + vAmb * .9);
  // canvas: lit from the front, glowing when the sun is behind it
  vec3 canvas = vec3(.82, .72, .58) * (uSunCol * (.07 + .1 * max(uSun.y, 0.)) + vAmb * mix(.32, .8, uPolar) + uMoonCol * .5);
  return mix(hull, canvas * (.82 + .18 * sin(p.x * 9. + p.y * 3.)), sail);
}

vec3 bodyGlow(vec3 rd, vec3 dir, vec3 col, float vis) {
  float c = max(dot(rd, dir), 0.);
  return col * vis * (pow(c, 9000.) * (.3 + .8 * uPolar) + pow(c, 1400.) * (.07 + .1 * uPolar) + pow(c, 180.) * .018);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float sy = uRes.y - px.y;
  // Where the rest of the page has taken over from the full-colour shot.
  float stock = SS(uStock.x, uStock.y, sy) * (1. - SS(uStock.z, uStock.w, sy));
  vec3 fwd = vec3(sin(uYaw), 0., cos(uYaw));
  vec3 right = vec3(cos(uYaw), 0., -sin(uYaw));
  vec3 rd = normalize(right * (px.x - uRes.x * .5) / uF + vec3(0., 1., 0.) * (px.y - uHorizon) / uF + fwd);
  float jitter = fract(52.9829189 * fract(dot(px, vec2(.06711056, .00583715))));

  // Footprint of the sea under this pixel, computed for every pixel so the
  // derivatives stay valid across the horizon.
  float dy = min(rd.y, -.0009);
  float tw = CAM_H / -dy;
  vec2 wp = rd.xz * tw;
  vec2 gx = dFdx(wp), gy = dFdy(wp);

  float el;
  vec2 uv = panoUv(rd, el);
  vec4 g = inPano(uv) ? textureLod(uG0, uv, 0.) : vec4(0.);
  float cov = g.a;

  vec3 col;
  if (rd.y >= 0. || cov > .995) {
    // ── sky ──
    vec3 s = sky(rd);
    if (uStars > .002 && rd.y > 0.) {
      vec3 q = uWorldToEq * rd;
      // faint stars: one per hashed cell on the celestial sphere
      vec3 cp = q * 240.;
      vec3 ci = floor(cp);
      uvec3 u = uvec3(ivec3(ci) + 4000) * uvec3(1597334673u, 3812015801u, 2798796415u);
      uint hv = (u.x ^ u.y ^ u.z) * 1597334673u;
      float h1 = float(hv) / 4294967295.;
      float st = 0.;
      if (h1 > .9935) {
        float h2 = fract(h1 * 913.7);
        vec3 c = ci + .5 + (vec3(h2, fract(h2 * 7.3), fract(h2 * 13.1)) - .5) * .6;
        float dd = length(cp - c);
        st = SS(.34, .05, dd) * (.14 + .9 * h2 * h2 * h2);
      }
      // the Milky Way, where it really is (galactic pole: RA 12h51m, Dec +27.1°)
      float gl = dot(q, vec3(-.8676, -.1980, .4560));
      float band = exp(-gl * gl / .034);
      vec2 mw = vec2(atan(q.y, q.x) * .32, q.z * .62);
      float tex = textureLod(uTile, mw, 1.).b;
      float mwL = band * SS(.22, .78, tex) * .9;
      float fade = SS(.02, .26, rd.y);
      s += (vec3(st) + vec3(.34, .36, .46) * mwL * .085) * uStars * fade / uExposure;
    }
    if (rd.y > 0.) {
      vec4 cl = clouds(rd);
      // the sun's disc sits behind the clouds
      float sc = dot(rd, uSunDraw);
      float sa = acos(clamp(sc, -1., 1.));
      // behind the page's text the sun is felt as coloured light, not seen as a disc
      float disc = SS(uSunSize * (1. + stock * 1.6), uSunSize * .8 * (1. - stock * .8), sa);
      s += uSunCol * disc * (2.6 + 3.4 * SS(uSunSize, 0., sa)) * (1. - cl.a * .9) * mix(1., .14, stock);
      // the moon: lit from where the sun really is, so its phase is the true one
      float mc = dot(rd, uMoonDraw);
      float ma = acos(clamp(mc, -1., 1.));
      if (ma < uMoonSize * 1.04 && uMoonDraw.y > -.01) {
        vec3 mr = normalize(cross(vec3(0., 1., 0.), uMoonDraw));
        vec3 mu = cross(uMoonDraw, mr);
        vec2 o = vec2(dot(rd - uMoonDraw, mr), dot(rd - uMoonDraw, mu)) / sin(uMoonSize);
        float rr = dot(o, o);
        if (rr < 1.) {
          // the disc may be drawn lower than it really is; its light is worked out where it really is
          vec3 tr = normalize(cross(vec3(0., 1., 0.), uMoon) + vec3(1e-4, 0., 0.));
          vec3 nrm = o.x * tr + o.y * cross(uMoon, tr) - sqrt(1. - rr) * uMoon;
          float lit = SS(-.02, .1, dot(nrm, uSun));
          float mar = SS(.36, .6, textureLod(uTile, o * .23 + .4, 0.).b);
          float tone = mix(.5, .98, mar) * (.85 + .15 * sqrt(1. - rr));
          float edge = SS(1., .92, rr);
          s = mix(s, vec3(1.0, .98, .93) * (lit * tone * 1.05 + .012) / uExposure, edge * (lit * .96 + .04) * mix(1., .4, stock));
        }
      }
      s = mix(s, cl.rgb, cl.a);
    } else {
      s = sky(vec3(rd.x, 0.002, rd.z));
    }
    // city glow low in the sky, over the land
    if (uLights > .01 && rd.y > 0.) {
      float az = degrees(atan(rd.x, rd.z));
      if (az < 0.) az += 360.;
      float land = SS(112., 150., az) * (1. - SS(262., 318., az));
      s += vec3(.62, .36, .18) * land * exp(-rd.y * 22.) * uLights * .024 / uExposure;
    }
    col = s;
  } else {
    // ── sea ──
    vec3 P = vec3(wp.x, 0., wp.y);
    float dist = tw;
    #define W(sc, off, amp) ((textureGrad(uTile, wp * sc + off, gx * sc, gy * sc).rg - .5) * amp)
    float t = uTime;
    vec2 s = W(1. / .042, t * vec2(.018, .008), .2) + W(1. / .0125, t * vec2(-.05, .031), .16) + W(1. / .23, t * vec2(.0026, .0044), .17) + W(1. / .0041, t * vec2(.09, -.07), .17);
    // far away the waves blur together: flatter on average, a calmer mirror
    vec2 sn = s * mix(1., .22, SS(.03, .55, tw));
    vec3 n = normalize(vec3(-sn.x, 1., -sn.y));
    vec3 v = -rd;
    float nv = max(dot(n, v), .02);
    vec3 R = reflect(rd, n);
    if (R.y < .002) R = normalize(vec3(R.x, .002 + abs(R.y), R.z));
    float F = .02 + .98 * pow(1. - nv, 5.);

    vec3 refl = sky(R);
    vec4 rc = clouds(R);
    refl = mix(refl, rc.rgb, rc.a * .9);
    float rel;
    vec2 ruv = panoUv(R, rel);
    if (inPano(ruv)) {
      vec4 rg = textureLod(uG0, ruv, 0.);
      if (rg.a > .02) refl = mix(refl, shadeLand(R, rel, ruv, rg, rg.a, false, 0.), rg.a);
      refl += textureLod(uEmit, ruv, 2.2).rgb * uLights * 2.2 / uExposure;
    }
    vec3 deep = (vec3(.004, .056, .084) * (uSunCol * max(uSun.y, 0.) * .32 + vAmb * .9)) * 1.1;
    // near the shore the seabed shows through: Muscat's turquoise
    float shallow = SS(-.027, -.003, textureLod(uMap, P.xz / 68. + .5, 0.).r);
    deep = mix(deep, deep * vec3(1.6, 3.3, 2.4), shallow);
    float scat = pow(1. - nv, 2.) * .4;
    deep += vec3(.0, .05, .055) * scat * (uSunCol * max(uSun.y, 0.) * .1 + vAmb * .3);
    vec3 c = mix(deep, refl, F);

    // the glitter: light from the disc that bounces off wave facets toward us
    float rough = mix(.00035, .0075, SS(.02, 1.8, dist));
    vec3 hv = normalize(v + uSunDraw);
    vec2 sl = hv.xz / hv.y + s * mix(1., .25, SS(.05, 1.6, dist));
    float lobe = exp(-dot(sl, sl) / (2. * rough)) / (2. * PI * rough);
    float fr = .02 + .98 * pow(1. - max(dot(v, hv), 0.), 5.);
    float gl = lobe * fr;
    gl = gl / (1. + gl * .14);  // a bright path, never a hard white block
    c += uSunCol * vSunVis * gl * .42 * SS(-.03, .05, uSunDraw.y) * mix(1., .42, SS(.05, .3, uSunDraw.y));
    if (vMoonVis > 0. && uMoon.y > 0.) {
      vec3 hm = normalize(v + uMoonDraw);
      vec2 ml = hm.xz / hm.y + s * mix(1., .25, SS(.05, 1.6, dist));
      float lm = exp(-dot(ml, ml) / (2. * rough)) / (2. * PI * rough);
      lm = lm / (1. + lm * .09);
      c += vec3(.8, .88, 1.) * vMoonVis * lm * .045 * uIllum / uExposure;
    }
    // the dhow's reflection, broken up by the same waves
    vec2 bp = (vec2(px.x + s.x * uBoat.z * 2.2, 2. * uBoat.y - px.y) - uBoat.xy) / uBoat.z;
    if (abs(bp.x) < 1.15 && bp.y > -.3 && bp.y < 1.6) {
      float bs, bm = dhow(bp, bs);
      c = mix(c, dhowLight(bs, bp) * .75, bm * .62 * SS(1.6, .1, bp.y));
    }
    col = c;
  }

  // ── land ──
  if (cov > .004) {
    vec3 land = shadeLand(rd, el, uv, g, cov, true, jitter);
    vec3 em = textureLod(uEmit, uv, 0.).rgb;
    // by day, the same points are houses: whitewashed, the way Muscat builds
    float house = SS(.22, .62, dot(em, vec3(.4))) * (1. - uLights) * exp(-g.b / cov * .088);
    land = mix(land, (uSunCol * .15 + vAmb * .5) * vec3(1., .97, .92), house);
    if (uLights > .01) land += em * uLights * (.75 + .25 * sin(uTime * 2.3 + px.x * .9)) * 2. / uExposure;
    col = mix(col, land, cov);
  }

  // ── the dhow ──
  vec2 bq = (px - uBoat.xy) / uBoat.z;
  if (abs(bq.x) < 1.15 && bq.y > -.2 && bq.y < 1.6) {
    float bs, bm = dhow(bq, bs);
    col = mix(col, dhowLight(bs, bq), bm);
    // her lantern, after dark
    col += vec3(1., .66, .34) * uLights * SS(.07, .0, length(bq - vec2(.07, .3))) * 1.6 / uExposure;
  }

  // glow from the sun and moon reaches over everything, like a real lens
  col += bodyGlow(rd, uSunDraw, uSunCol, vSunVis);
  float toSun = max(dot(rd, uSunDraw), 0.);
  col += uSunCol * vSunVis * pow(toSun, 42.) * .008;
  col += bodyGlow(rd, uMoonDraw, vec3(.9, .95, 1.) * .9 * uIllum / uExposure, vMoonVis);

  // film: exposure, tone curve, a touch of vignette, dither against banding
  col *= uExposure;
  vec2 c = (px / uRes - .5) * vec2(.9, 1.1);
  col *= 1. - dot(c, c) * .34;
  col = max(mix(vec3(dot(col, vec3(.2126, .7152, .0722))), col, 1.08), 0.);
  // Film keeps a colour's hue as it brightens: orange stays orange instead of
  // clipping to yellow. Only the very hottest light bleeds toward white.
  float peak = max(col.r, max(col.g, col.b));
  float mapped = (peak * (2.51 * peak + .03)) / (peak * (2.43 * peak + .59) + .14);
  vec3 kept = col / max(peak, 1e-4) * mapped;
  vec3 plain = clamp((col * (2.51 * col + .03)) / (col * (2.43 * col + .59) + .14), 0., 1.);
  col = mix(plain, kept, .8);
  col = mix(col, vec3(1.), SS(3., 16., peak) * .9);
  col = pow(clamp(col, 0., 1.), vec3(1. / 2.2));

  // keeps white text readable at every hour, unnoticed
  if (uScrim > .001) {
    float ys = sy / uFrame;
    float shade = .34 * SS(.42, 0., ys) + .42 * SS(.74, 1., ys);
    col = mix(col, vec3(.016, .031, .078), shade * uScrim);
  }
  // The rest of the page: the same scene, developed in the page's paper or ink.
  if (stock > .001) {
    float l = dot(col, vec3(.2126, .7152, .0722));
    vec3 ink = vec3(.043, .043, .047) + col * col * .3;
    vec3 hue = mix(vec3(1.), min(col / max(l, .05), vec3(1.6)), .5);
    vec3 paper = vec3(.961, .957, .941) * mix(vec3(1.), hue, .2) * mix(.925, 1.02, SS(.03, .6, l));
    float grain = fract(sin(dot(floor(px / 1.5), vec2(12.9898, 78.233))) * 43758.5453);
    col = mix(col, mix(paper, ink, uDark) + (grain - .5) * mix(.016, .011, uDark), stock);
  }
  col += (jitter - .5) / 255.;
  fragColor = vec4(col * uFade, 1.);
}`;

/** City lights on the shore and up the valleys, baked once with occlusion. */
export const VS_EMIT = HEAD + SCENE + NOISE + TERRAIN + /* glsl */ `
uniform sampler2D uPolar;
flat out vec3 vCol;
flat out float vR;
vec3 rnd(int i) {
  float a = hash(ivec2(i, 11)), b = hash(ivec2(i, 23)), c = hash(ivec2(i, 37));
  return vec3(a, b, c);
}
void main() {
  vec3 r = rnd(gl_VertexID);
  float az = mix(118., 322., r.x);
  float azr = radians(az);
  float rr = shoreR(az) - .5 + pow(r.y, 2.4) * 3.2;
  vec2 p = rr * vec2(sin(azr), cos(azr));
  float cluster = SS(.34, .66, vn(p * .85 + 3.)) * (1. - pow(r.y, 2.) * .6);
  float u = (az - AZ0) / (AZ1 - AZ0);
  float h = textureLod(uPolar, vec2(u, vOfR(rr)), 0.).r;
  if (h <= .002 || hash(ivec2(gl_VertexID, 51)) > cluster) { gl_Position = vec4(9.); gl_PointSize = 1.; vCol = vec3(0.); vR = 0.; return; }
  float el = degrees(atan((h + .008 - CAM_H) / rr));
  gl_Position = vec4(u * 2. - 1., (el - EL0) / (EL1 - EL0) * 2. - 1., 0., 1.);
  float k = hash(ivec2(gl_VertexID, 71));
  gl_PointSize = 1.1 + 1.2 * k * k;
  float w = hash(ivec2(gl_VertexID, 91));
  vCol = (w < .78 ? vec3(1., .72, .42) : w < .95 ? vec3(1., .9, .75) : vec3(.55, 1., .72)) * (.45 + .55 * k);
  vR = rr;
}`;

export const FS_EMIT = HEAD + /* glsl */ `
flat in vec3 vCol;
flat in float vR;
out vec4 o;
uniform sampler2D uG0;
void main() {
  vec4 g = texelFetch(uG0, ivec2(gl_FragCoord.xy), 0);
  if (g.a > .5 && g.b / g.a < vR - .06) discard;
  vec2 c = gl_PointCoord - .5;
  o = vec4(vCol * smoothstep(.25, .02, dot(c, c)), 1.);
}`;

/** The brightest stars, where they really are tonight. */
export const VS_STARS = HEAD + /* glsl */ `
layout(location = 0) in vec3 aStar;  // RA (rad), Dec (rad), magnitude
uniform mat3 uEqToWorld;
uniform vec2 uRes;
uniform float uF, uHorizon, uYaw, uStars, uTime, uDpr;
uniform sampler2D uG0;
flat out float vA;
const float AZ0 = 90., AZ1 = 335., EL0 = -1.2, EL1 = 19.;
void main() {
  vec3 q = vec3(cos(aStar.y) * cos(aStar.x), cos(aStar.y) * sin(aStar.x), sin(aStar.y));
  vec3 d = uEqToWorld * q;
  vec3 fwd = vec3(sin(uYaw), 0., cos(uYaw));
  vec3 right = vec3(cos(uYaw), 0., -sin(uYaw));
  float z = dot(d, fwd);
  float az = degrees(atan(d.x, d.z));
  if (az < 0.) az += 360.;
  float el = degrees(asin(d.y));
  vec2 uv = vec2((az - AZ0) / (AZ1 - AZ0), (el - EL0) / (EL1 - EL0));
  float open = (uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.) ? 1. - textureLod(uG0, uv, 0.).a : 1.;
  if (z < .05 || d.y < .015 || open < .5 || uStars < .01) { gl_Position = vec4(9.); gl_PointSize = 1.; vA = 0.; return; }
  vec2 s = vec2(dot(d, right) / z * uF + uRes.x * .5, d.y / z * uF + uHorizon);
  gl_Position = vec4(s / uRes * 2. - 1., 0., 1.);
  float b = pow(10., -.4 * aStar.z);
  float tw = .82 + .18 * sin(uTime * 3. + aStar.x * 91.);
  vA = min(1., .28 + .62 * b) * uStars * smoothstep(.015, .2, d.y) * tw;
  gl_PointSize = (1.5 + 2.1 * min(b, 1.6)) * uDpr * .62;
}`;

export const FS_STARS = HEAD + /* glsl */ `
flat in float vA;
out vec4 o;
uniform float uFade;
void main() {
  vec2 c = gl_PointCoord - .5;
  float d = smoothstep(.25, .0, dot(c, c));
  o = vec4(vec3(.92, .95, 1.) * d * d * vA * uFade, 1.);
}`;
