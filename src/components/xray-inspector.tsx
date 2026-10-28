"use client";

import { useEffect, useRef } from "react";
import { useRootAttribute } from "@/lib/use-dom-state";
import { setXray } from "@/lib/xray";

const BREAKPOINTS: [number, string][] = [
  [1280, "xl"],
  [1024, "lg"],
  [768, "md"],
  [640, "sm"],
  [0, "xs"],
];

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/* X-Ray's live layer: a HUD with page vitals, a measuring box that
   follows the pointer over annotated parts, and the X / Esc shortcuts.
   Everything writes straight to the DOM; nothing re-renders per frame. */
export function XrayInspector() {
  const xray = useRootAttribute("data-xray");
  const hud = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // Shortcuts work in any keyboard layout (KeyX is the physical key).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const on = document.documentElement.hasAttribute("data-xray");
      if (event.code === "KeyX") setXray(!on);
      else if (event.code === "Escape" && on) setXray(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // HUD: section, viewport, scroll, fps, theme · language.
  useEffect(() => {
    if (!xray || !hud.current) return;
    const field = (name: string) => hud.current!.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
    const out = {
      section: field("section"),
      viewport: field("viewport"),
      scroll: field("scroll"),
      fps: field("fps"),
      theme: field("theme"),
    };
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    const root = document.documentElement;
    let frames = 0;
    let since = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      frames++;
      if (now - since >= 500) {
        out.fps.textContent = String(Math.round((frames * 1000) / (now - since)));
        frames = 0;
        since = now;

        const middle = innerHeight / 2;
        const current = sections.find((s) => {
          const r = s.getBoundingClientRect();
          return r.top <= middle && r.bottom > middle;
        });
        out.section.textContent = current ? `#${current.id || "hero"}` : "—";
        const bp = BREAKPOINTS.find(([min]) => innerWidth >= min)![1];
        out.viewport.textContent = `${innerWidth} × ${innerHeight} · ${bp}`;
        const max = root.scrollHeight - innerHeight;
        out.scroll.textContent = `${max > 0 ? Math.round((scrollY / max) * 100) : 0}%`;
        out.theme.textContent = `${root.dataset.theme} · ${root.lang}/${root.dir}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xray]);

  // Measuring box for the annotated part under the pointer.
  useEffect(() => {
    const el = box.current;
    if (!xray || !el || !matchMedia("(pointer: fine)").matches) return;
    const label = el.firstElementChild as HTMLElement;
    let target: HTMLElement | null = null;
    let x = -1;
    let y = -1;
    let raf = 0;

    const place = () => {
      raf = 0;
      const hit = document.elementFromPoint(x, y);
      target = hit instanceof HTMLElement || hit instanceof SVGElement ? hit.closest<HTMLElement>("[data-x]") : null;
      if (!target) {
        el.removeAttribute("data-show");
        return;
      }
      const r = target.getBoundingClientRect();
      el.style.transform = `translate(${r.left}px, ${r.top}px)`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
      label.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      el.setAttribute("data-show", "");
    };
    // Scrolling re-measures, but only once the pointer has a position.
    const schedule = () => {
      if (!raf && x >= 0) raf = requestAnimationFrame(place);
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      schedule();
    };
    const onLeave = () => el.removeAttribute("data-show");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      el.removeAttribute("data-show");
    };
  }, [xray]);

  return (
    <>
      <div ref={box} className="measure" aria-hidden="true">
        <span className="measure-label mono" />
      </div>
      <div ref={hud} className="hud only-xray mono" dir="ltr" aria-hidden="true">
        <p className="hud-title">
          <span className="hud-dot" />
          X-Ray inspector
          <span className="hud-keys">
            <kbd>X</kbd> / <kbd>Esc</kbd>
          </span>
        </p>
        <dl>
          <dt>section</dt>
          <dd data-field="section">—</dd>
          <dt>viewport</dt>
          <dd data-field="viewport">—</dd>
          <dt>scroll</dt>
          <dd data-field="scroll">—</dd>
          <dt className="hud-extra">fps</dt>
          <dd className="hud-extra" data-field="fps">—</dd>
          <dt className="hud-extra">theme</dt>
          <dd className="hud-extra" data-field="theme">—</dd>
        </dl>
      </div>
    </>
  );
}
