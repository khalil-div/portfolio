"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Counters reach their final value at this point of a chapter's progress.
const COUNT_DONE_AT = 0.7;

/* Scrub one scene: --p drives continuous motion (scan, chart, progress),
   [data-at] thresholds flip discrete reveals that animate with CSS. */
function paint(scene: HTMLElement | null | undefined, p: number) {
  if (!scene) return;
  scene.style.setProperty("--p", p.toFixed(4));
  let changed = false;
  for (const el of scene.querySelectorAll<HTMLElement>("[data-at]")) {
    const on = p >= Number(el.dataset.at);
    if (on !== el.hasAttribute("data-in")) {
      el.toggleAttribute("data-in", on);
      changed = true;
    }
  }
  // Chat stacks slide up by the height of messages not yet sent, so new
  // ones push old ones out with a transform instead of a layout shift.
  const stack = scene.querySelector<HTMLElement>("[data-stack]");
  if (stack && changed) {
    let hidden = 0;
    for (const row of stack.querySelectorAll<HTMLElement>(":scope > [data-at]:not([data-in])")) hidden += row.offsetHeight;
    stack.style.setProperty("--unsent", `${hidden}px`);
  }
  for (const el of scene.querySelectorAll<HTMLElement>("[data-count]")) {
    const value = Math.round(Math.min(1, p / COUNT_DONE_AT) * Number(el.dataset.count));
    el.textContent = value.toLocaleString("en-US");
  }
}

export function ProcessStory({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const inline = steps.map((step) => step.querySelector<HTMLElement>("[data-scene]"));
    const staged = Array.from(root.querySelectorAll<HTMLElement>("[data-stage] [data-scene]"));
    const list = root.querySelector<HTMLElement>("[data-steps]");

    // Earlier chapters leave upward, later ones wait below.
    let current = -1;
    const setCurrent = (i: number) => {
      if (i === current) return;
      current = i;
      for (const group of [steps, staged]) {
        group.forEach((el, k) => {
          el.toggleAttribute("data-current", k === i);
          el.toggleAttribute("data-done", k < i);
        });
      }
    };

    // Hidden start states only apply once JS is ready to reveal them.
    root.setAttribute("data-armed", "");
    [...inline, ...staged].forEach((scene) => paint(scene, 0));

    const ctx = gsap.context(() => {
      // Wide: chapters scroll past a sticky stage and hand over at mid-screen.
      // Narrow: each chapter carries its own scene and plays as it enters.
      gsap.matchMedia().add({ wide: "(min-width: 1024px)", narrow: "(max-width: 1023.98px)" }, (media) => {
        const wide = Boolean(media.conditions?.wide);
        // Derived from position, not enter/leave events, so fast jumps
        // (anchor links, reloads mid-page) still land on the right chapter.
        const triggers: ScrollTrigger[] = [];
        const sync = () => {
          let i = 0;
          triggers.forEach((trigger, k) => {
            if (trigger.scroll() >= trigger.start) i = k;
          });
          setCurrent(i);
        };
        steps.forEach((step, i) => {
          const trigger = ScrollTrigger.create({
            ...(wide
              ? {
                  trigger: step,
                  // Chapter 0 waits until the stage has pinned under the nav;
                  // the last one finishes exactly as the stage starts to leave.
                  start: i === 0 ? "top 72px" : "top center",
                  end: i === steps.length - 1 ? "bottom bottom" : "bottom center",
                }
              : { trigger: inline[i] ?? step, start: "top 75%", end: "bottom 40%" }),
            onRefresh: sync,
            onUpdate: (self) => {
              paint(wide ? staged[i] : inline[i], self.progress);
              sync();
            },
          });
          triggers.push(trigger);
        });
        sync();
        if (wide && list) {
          ScrollTrigger.create({
            trigger: list,
            start: "top center",
            end: "bottom bottom",
            onUpdate: (self) => root.style.setProperty("--total", self.progress.toFixed(4)),
          });
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
