"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Flags every [data-reveal] element with [data-in] the first time it
   scrolls into view; CSS does the animating. Hidden start states only
   apply once :root has [data-reveals], so the page works without JS. */
export function ScrollReveals() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reveals", "");
    const ctx = gsap.context(() => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => el.setAttribute("data-in", ""),
        });
      }
    });
    return () => {
      ctx.revert();
      root.removeAttribute("data-reveals");
    };
  }, []);

  return null;
}
