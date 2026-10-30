/* The world's engine: WebGL2, no libraries. It bakes the mountains once (a few
   frames at load), then each frame only has to light them and move the sea.
   Sizes scale with `quality`; every texture here is generated, none downloaded. */

import { skyAt, type Sky, type Vec3 } from "./astronomy";
import { FS_EMIT, FS_FRAME, FS_GBUFFER, FS_MAP, FS_POLAR, FS_SKY, FS_STARS, FS_TILE, VS_EMIT, VS_FRAME, VS_FULL, VS_STARS } from "./shaders";
import { STARS } from "./stars";

const D = Math.PI / 180;
const CAM_DROP = 16; // metres from the camera down to the water
const AZ0 = 90;
const AZ1 = 335;
const LAND = [Math.sin(215 * D), Math.cos(215 * D)];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Sunlight left after crossing the atmosphere, at a given altitude and height. */
function transmit(alt: number, heightKm: number): Vec3 {
  const RG = 6360;
  const RT = 6460;
  const ox = 0;
  const oy = RG + heightKm;
  const dx = Math.cos(alt);
  const dy = Math.sin(alt);
  const b = oy * dy;
  const ground = b * b - (oy * oy - RG * RG);
  if (b < 0 && ground > 0) return [0, 0, 0];
  const tl = -b + Math.sqrt(b * b - (oy * oy - RT * RT));
  let r = 0;
  let m = 0;
  let o = 0;
  const N = 24;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const t = tl * u * u;
    const dt = tl * ((u + 1 / N) * (u + 1 / N) - u * u);
    const h = Math.hypot(ox + dx * t, oy + dy * t) - RG;
    r += Math.exp(-h / 8) * dt;
    m += Math.exp(-h / 1.5) * dt;
    o += Math.max(0, 1 - Math.abs(h - 25) / 15) * dt;
  }
  const mie = 10.6e-3 * m;
  return [
    Math.exp(-(5.802e-3 * r + mie + 0.65e-3 * o)),
    Math.exp(-(13.558e-3 * r + mie + 1.881e-3 * o)),
    Math.exp(-(33.1e-3 * r + mie + 0.085e-3 * o)),
  ];
}

const EXPOSURE: [number, number][] = [
  [-90, 16],
  [-18, 16],
  [-12, 14],
  [-8, 9],
  [-5, 4.6],
  [-2, 1.5],
  [0, 0.72],
  [4, 0.42],
  [12, 0.3],
  [30, 0.23],
  [90, 0.2],
];
function exposureAt(altDeg: number) {
  for (let i = 1; i < EXPOSURE.length; i++) {
    if (altDeg <= EXPOSURE[i][0]) {
      const [a0, e0] = EXPOSURE[i - 1];
      const [a1, e1] = EXPOSURE[i];
      return Math.exp(Math.log(e0) + ((altDeg - a0) / (a1 - a0)) * (Math.log(e1) - Math.log(e0)));
    }
  }
  return 0.2;
}

/* Sun and moon as seen on screen. The light on the land uses their true
   direction. The discs stay low enough to stay in frame and under the
   headline: true near the horizon, compressed above it, so that straight up
   would land exactly on `ceiling` (at noon in June the sun is overhead, and a
   phone can't look straight up and keep the mountains in view). */
const DEFAULT_CEILING = 19.5 * D;
const drawnAlt = (alt: number, ceiling: number) => {
  if (alt <= 0) return alt;
  const m = (Math.PI / 2 * ceiling) / (Math.PI / 2 - ceiling);
  return (m * alt) / (alt + m);
};

export type Stage = {
  sky: Sky;
  yaw: number;
  sunDraw: Vec3;
  moonDraw: Vec3;
  moonInFrame: boolean;
};

export function stageAt(ms: number, ceiling = DEFAULT_CEILING): Stage {
  const sky = skyAt(ms);
  const { sun, moon } = sky;
  const dayW = ss(-9 * D, -2 * D, sun.alt);
  // By day, look toward the sun, passing through south when it's high.
  let dx = sun.dir[0];
  let dz = sun.dir[2] - 0.22;
  let l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  // By night, look at the moon if it's up, leaning toward the city's lights.
  // The camera turns just before it rises, so a moonrise is there to be seen.
  const moonUp = ss(-1.5 * D, 1.5 * D, moon.alt);
  const mh = Math.hypot(moon.dir[0], moon.dir[2]) || 1;
  let nx = (moon.dir[0] / mh) * moonUp + LAND[0] * 0.6;
  let nz = (moon.dir[2] / mh) * moonUp + LAND[1] * 0.6;
  l = Math.hypot(nx, nz) || 1;
  nx /= l;
  nz /= l;
  const vx = dx * dayW + nx * (1 - dayW) + LAND[0] * 0.02;
  const vz = dz * dayW + nz * (1 - dayW) + LAND[1] * 0.02;
  const yaw = Math.atan2(vx, vz);

  const place = (az: number, alt: number, spread: number): Vec3 => {
    const rel = wrapPi(az - yaw);
    const a = yaw + spread * Math.tanh(rel / spread);
    const e = drawnAlt(alt, ceiling);
    return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  };
  const rel = wrapPi(moon.az - yaw);
  return {
    sky,
    yaw,
    sunDraw: place(sun.az, sun.alt, 12 * D),
    moonDraw: place(moon.az, moon.alt, 11 * D),
    moonInFrame: moon.alt > 0 && Math.abs(rel) < 70 * D && sun.alt < -2 * D,
  };
}

type Tex = WebGLTexture;
type Uniforms = Record<string, WebGLUniformLocation | null>;

export type World = {
  /** Draw one frame. Returns false until the first view has been baked. */
  draw(frame: {
    ms: number;
    time: number;
    cloudT: number;
    fade: number;
    /** How far the horizon sits below its composed place, in CSS px: the camera tilting up. */
    horizonShift: number;
    /** The highest the sun may be drawn, in radians, if not where compose() put it. */
    ceiling?: number;
    /** How much the frame darkens behind white text, 0 … 1. */
    scrim?: number;
    /** Where the page's paper or ink takes over, in CSS px from the top: starts, full, ends, gone. */
    stock?: [number, number, number, number];
    /** 0: the page is paper. 1: the page is ink. */
    dark?: number;
  }): boolean;
  resize(cssW: number, cssH: number, dpr: number): void;
  /** Frames the shot on a screen of a given height: where the horizon sits, and the highest the sun may go, in CSS px from the top. */
  compose(frameHeight: number, horizonFromTop: number, ceilingFromTop: number): void;
  /** The highest the sun may be drawn in the composed shot, in radians. */
  ceiling(): number;
  /** The scene at a moment, with the sun and moon placed for this frame. */
  stage(ms: number): Stage;
  /** Where a world direction lands on screen, in CSS px. */
  project(stage: Stage, dir: Vec3): { x: number; y: number; ok: boolean };
  /** Asks for the colour at the very top of the frame just drawn, without making the GPU wait. */
  sampleTop(): void;
  /** The most recent colour sampleTop() has brought back, for the browser's toolbar and the header. */
  topColor(): string | null;
  isDone(): boolean;
  destroy(): void;
};

export function createWorld(canvas: HTMLCanvasElement, quality = 1): World | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return null;
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const programs: { p: WebGLProgram; u: Uniforms }[] = [];
  const program = (vs: string, fs: string) => {
    const p = gl.createProgram()!;
    const a = compile(gl.VERTEX_SHADER, vs);
    const b = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, a);
    gl.attachShader(p, b);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error("[world]", gl.getProgramInfoLog(p), gl.getShaderInfoLog(a), gl.getShaderInfoLog(b));
      throw new Error("shader");
    }
    const entry = { p, u: {} as Uniforms };
    programs.push(entry);
    return entry;
  };
  const loc = (e: { p: WebGLProgram; u: Uniforms }, name: string) => {
    if (!(name in e.u)) e.u[name] = gl.getUniformLocation(e.p, name);
    return e.u[name];
  };

  const texture = (w: number, h: number, internal: number, format: number, type: number, filter: number = gl.LINEAR, wrap: number = gl.CLAMP_TO_EDGE) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  };
  const target = (...t: Tex[]) => {
    const f = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    t.forEach((x, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, x, 0));
    gl.drawBuffers(t.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    return f;
  };
  const bind = (unit: number, t: Tex, uniform: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.uniform1i(uniform, unit);
  };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  let pPolar, pMap, pTile, pG, pSky, pFrame, pEmit, pStars;
  try {
    pPolar = program(VS_FULL, FS_POLAR);
    pMap = program(VS_FULL, FS_MAP);
    pTile = program(VS_FULL, FS_TILE);
    pG = program(VS_FULL, FS_GBUFFER);
    pSky = program(VS_FULL, FS_SKY);
    pFrame = program(VS_FRAME, FS_FRAME);
    pEmit = program(VS_EMIT, FS_EMIT);
    pStars = program(VS_STARS, FS_STARS);
  } catch {
    return null;
  }

  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const q = Math.min(quality, maxTex / 4608);
  const polarW = Math.round(2048 * q);
  const polarH = Math.round(1024 * q);
  const panoW = Math.round(4608 * q);
  const panoH = Math.round(432 * q);
  const F16 = gl.RGBA16F;
  const HF = gl.HALF_FLOAT;

  let polar: Tex | null = texture(polarW, polarH, F16, gl.RGBA, HF);
  const map = texture(1024, 1024, F16, gl.RGBA, HF);
  const tile = texture(512, 512, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR_MIPMAP_LINEAR, gl.REPEAT);
  const g0 = texture(panoW, panoH, F16, gl.RGBA, HF);
  const g1 = texture(panoW, panoH, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
  const emit = texture(panoW, panoH, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR_MIPMAP_LINEAR);
  const skyLut = texture(128, 96, F16, gl.RGBA, HF);
  const fGbuf = target(g0, g1);
  gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
  gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
  const fSky = target(skyLut);
  const fEmit = target(emit);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const starBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(STARS.flatMap(([h, d, m]) => [h * 15 * D, d * D, m])), gl.STATIC_DRAW);

  const fullscreen = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

  // One pixel read back through a buffer, so nothing ever waits for the GPU.
  const topBuf = gl.createBuffer();
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, topBuf);
  gl.bufferData(gl.PIXEL_PACK_BUFFER, 4, gl.STREAM_READ);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  let topFence: WebGLSync | null = null;
  let top: string | null = null;

  // ── The bake: a queue that runs a little each frame ──
  let lo = -1;
  let hi = -1;
  let budget = Math.max(48, Math.round(300 * q));
  let lightsDone = false;
  let polarDone = false;

  const bakeBasics = () => {
    let f = target(polar!);
    gl.viewport(0, 0, polarW, polarH);
    gl.useProgram(pPolar.p);
    fullscreen();
    gl.deleteFramebuffer(f);
    f = target(map);
    gl.viewport(0, 0, 1024, 1024);
    gl.useProgram(pMap.p);
    fullscreen();
    gl.deleteFramebuffer(f);
    f = target(tile);
    gl.viewport(0, 0, 512, 512);
    gl.useProgram(pTile.p);
    fullscreen();
    gl.deleteFramebuffer(f);
    gl.bindTexture(gl.TEXTURE_2D, tile);
    gl.generateMipmap(gl.TEXTURE_2D);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    polarDone = true;
  };

  const bakeColumns = (x0: number, w: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fGbuf);
    gl.viewport(0, 0, panoW, panoH);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, 0, w, panoH);
    gl.useProgram(pG.p);
    bind(0, polar!, loc(pG, "uPolar"));
    fullscreen();
    gl.disable(gl.SCISSOR_TEST);
  };

  const uOfYaw = (yaw: number) => {
    let az = yaw / D;
    if (az < 0) az += 360;
    return clamp01((az - AZ0) / (AZ1 - AZ0));
  };

  const bakeStep = (yaw: number) => {
    if (!polarDone) {
      bakeBasics();
      return;
    }
    if (lo < 0) {
      const c = Math.round(uOfYaw(yaw) * panoW);
      lo = Math.max(0, c - budget);
      hi = Math.min(panoW, c + budget);
      bakeColumns(lo, hi - lo);
      return;
    }
    if (lo > 0 || hi < panoW) {
      const started = performance.now();
      if (hi < panoW) {
        const w = Math.min(budget, panoW - hi);
        bakeColumns(hi, w);
        hi += w;
      }
      if (lo > 0) {
        const w = Math.min(budget, lo);
        lo -= w;
        bakeColumns(lo, w);
      }
      if (performance.now() - started < 6) budget = Math.min(Math.round(budget * 1.3), 1600);
      return;
    }
    if (!lightsDone) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fEmit);
      gl.viewport(0, 0, panoW, panoH);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pEmit.p);
      bind(0, polar!, loc(pEmit, "uPolar"));
      bind(1, g0, loc(pEmit, "uG0"));
      gl.drawArrays(gl.POINTS, 0, 2600);
      gl.disable(gl.BLEND);
      gl.bindTexture(gl.TEXTURE_2D, emit);
      gl.generateMipmap(gl.TEXTURE_2D);
      lightsDone = true;
      gl.deleteTexture(polar!);
      polar = null;
    }
  };

  // ── Each frame ──
  let lastAlt = 99;
  let W = 1;
  let H = 1;
  let DPR = 1;
  let cssW = 1;
  let cssH = 1;

  let horizonAt = 0;
  let tilt = 0;
  let frameH = 0;
  let ceiling = DEFAULT_CEILING;

  const camera = () => ({
    F: (cssW > cssH ? 1.05 : 1.8) * cssW,
    horizonFromTop: horizonAt || cssH * (cssW > cssH ? 0.62 : 0.64),
  });

  const draw: World["draw"] = ({ ms, time, cloudT, fade, horizonShift, ceiling: top = ceiling, scrim = 0, stock: page, dark = 1 }) => {
    const st = stageAt(ms, top);
    const { sky } = st;
    if (!lightsDone) bakeStep(st.yaw);
    if (lo < 0) return false;

    const sunAlt = sky.sun.alt;
    // The sky is scattered around the sun where it's drawn, so its halo sits on the disc.
    const lutAlt = drawnAlt(sunAlt, top);
    if (Math.abs(lutAlt - lastAlt) > 0.015 * D) {
      lastAlt = lutAlt;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fSky);
      gl.viewport(0, 0, 128, 96);
      gl.useProgram(pSky.p);
      gl.uniform3f(loc(pSky, "uSun"), 0, Math.sin(lutAlt), Math.cos(lutAlt));
      fullscreen();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(pFrame.p);
    const u = (n: string) => loc(pFrame, n);
    const cam = camera();
    tilt = horizonShift;
    const horizon = (cssH - cam.horizonFromTop - horizonShift) * DPR;
    gl.uniform2f(u("uRes"), W, H);
    gl.uniform1f(u("uF"), cam.F * DPR);
    gl.uniform1f(u("uHorizon"), horizon);
    gl.uniform1f(u("uYaw"), st.yaw);
    gl.uniform1f(u("uScrim"), scrim);
    gl.uniform1f(u("uFrame"), (frameH || cssH) * DPR);
    gl.uniform1f(u("uDark"), dark);
    if (page) gl.uniform4f(u("uStock"), page[0] * DPR, Math.max(page[1], page[0] + 1) * DPR, page[2] * DPR, Math.max(page[3], page[2] + 1) * DPR);
    else gl.uniform4f(u("uStock"), 1e6, 1e6 + 1, 1e6, 1e6 + 1);
    // A dhow on her way somewhere, 400 m out, always in the shot. Two minutes to cross the screen.
    const boatSpan = cssW + 120;
    const boatX = ((((time * 3.4 + cssW * 0.12 + 60) % boatSpan) + boatSpan) % boatSpan) - 60;
    const boatY = horizon - (CAM_DROP * cam.F * DPR) / 400;
    gl.uniform3f(u("uBoat"), boatX * DPR, boatY, 0.0225 * cam.F * DPR);
    gl.uniform1f(u("uTime"), time);
    gl.uniform1f(u("uCloudT"), cloudT);
    const altDeg = sunAlt / D;
    const exposure = exposureAt(altDeg);
    gl.uniform1f(u("uExposure"), exposure);
    gl.uniform1f(u("uFade"), fade);
    const stars = ss(-5, -13, altDeg);
    const lights = ss(2.5, -5, altDeg);
    gl.uniform1f(u("uStars"), stars);
    gl.uniform1f(u("uLights"), lights);
    gl.uniform1f(u("uTwilight"), ss(9, -1, altDeg) * ss(-15, -6, altDeg));
    gl.uniform1f(u("uBlue"), ss(-1.5, -6.5, altDeg) * ss(-18, -10, altDeg));
    gl.uniform1f(u("uPolar"), ss(5, 20, altDeg));
    gl.uniform1f(u("uCover"), 0.56 + 0.13 * ss(8, 40, altDeg));
    gl.uniform1f(u("uIllum"), sky.illumination);
    gl.uniform1f(u("uSunSize"), 1.05 * D);
    gl.uniform1f(u("uMoonSize"), 1.15 * D);
    gl.uniform3fv(u("uSun"), sky.sun.dir);
    gl.uniform3fv(u("uSunDraw"), st.sunDraw);
    gl.uniform3fv(u("uMoon"), sky.moon.dir);
    gl.uniform3fv(u("uMoonDraw"), st.moonInFrame ? st.moonDraw : [0, -1, 0]);
    const h = Math.hypot(st.sunDraw[0], st.sunDraw[2]) || 1;
    gl.uniform2f(u("uSunH"), st.sunDraw[0] / h, st.sunDraw[2] / h);
    const tSun = transmit(Math.max(sunAlt, -0.2 * D), 0);
    const sunFade = ss(-1.2 * D, 0.2 * D, sunAlt);
    gl.uniform3f(u("uSunCol"), tSun[0] * 22 * sunFade, tSun[1] * 22 * sunFade, tSun[2] * 22 * sunFade);
    const tCloud = transmit(sunAlt, 7);
    const cloudGain = 7 + 16 * ss(6, 40, altDeg);
    gl.uniform3f(u("uCloudSun"), tCloud[0] * cloudGain, tCloud[1] * cloudGain, tCloud[2] * cloudGain);
    const moonLight = 0.05 * sky.illumination * ss(-1 * D, 8 * D, sky.moon.alt) * ss(-1, -7, altDeg);
    gl.uniform3f(u("uMoonCol"), 0.62 * moonLight, 0.72 * moonLight, moonLight);
    // equatorial ← world is the transpose of world ← equatorial
    const m = sky.eqToWorld;
    gl.uniformMatrix3fv(u("uWorldToEq"), false, [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
    bind(0, skyLut, u("uSkyTex"));
    bind(1, g0, u("uG0"));
    bind(2, g1, u("uG1"));
    bind(3, tile, u("uTile"));
    bind(4, map, u("uMap"));
    bind(5, emit, u("uEmit"));
    fullscreen();

    if (stars > 0.01) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pStars.p);
      const v = (n: string) => loc(pStars, n);
      gl.uniformMatrix3fv(v("uEqToWorld"), false, m);
      gl.uniform2f(v("uRes"), W, H);
      gl.uniform1f(v("uF"), cam.F * DPR);
      gl.uniform1f(v("uHorizon"), horizon);
      gl.uniform1f(v("uYaw"), st.yaw);
      gl.uniform1f(v("uStars"), stars);
      gl.uniform1f(v("uTime"), time);
      gl.uniform1f(v("uDpr"), DPR);
      gl.uniform1f(v("uFade"), fade);
      bind(1, g0, v("uG0"));
      gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, STARS.length);
      gl.disableVertexAttribArray(0);
      gl.disable(gl.BLEND);
    }
    return true;
  };

  return {
    draw,
    resize(w, h, dpr) {
      cssW = w;
      cssH = h;
      DPR = dpr;
      W = Math.round(w * dpr);
      H = Math.round(h * dpr);
      canvas.width = W;
      canvas.height = H;
    },
    compose(frameHeight, horizonFromTop, ceilingFromTop) {
      frameH = frameHeight;
      horizonAt = horizonFromTop;
      ceiling = Math.max(5 * D, Math.atan((horizonFromTop - ceilingFromTop) / camera().F));
    },
    ceiling: () => ceiling,
    stage: (ms) => stageAt(ms, ceiling),
    project(st, dir) {
      const cam = camera();
      const fx = Math.sin(st.yaw);
      const fz = Math.cos(st.yaw);
      const z = dir[0] * fx + dir[2] * fz;
      if (z < 0.05) return { x: 0, y: 0, ok: false };
      const rx = dir[0] * fz - dir[2] * fx;
      return { x: (rx / z) * cam.F + cssW / 2, y: cam.horizonFromTop + tilt - (dir[1] / z) * cam.F, ok: true };
    },
    sampleTop() {
      if (topFence) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, topBuf);
      gl.readPixels(Math.round(W / 2), H - 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      topFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    },
    topColor() {
      if (topFence) {
        const state = gl.clientWaitSync(topFence, 0, 0);
        if (state === gl.ALREADY_SIGNALED || state === gl.CONDITION_SATISFIED) {
          gl.deleteSync(topFence);
          topFence = null;
          const px = new Uint8Array(4);
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, topBuf);
          gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px);
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
          top = `rgb(${px[0]} ${px[1]} ${px[2]})`;
        }
      }
      return top;
    },
    isDone: () => lightsDone,
    destroy() {
      programs.forEach((e) => gl.deleteProgram(e.p));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
