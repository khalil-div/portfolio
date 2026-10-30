"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMediaQuery } from "@/lib/use-dom-state";

gsap.registerPlugin(ScrollTrigger);

/* Eased wheel scrolling, driven by GSAP's ticker so scroll-linked scenes
   update in the same frame. Touch screens never load it: their native scrolling
   is better than anything we could do. Reduced motion turns it off entirely.
   Anchor links honor scroll-padding-top. */
export function SmoothScroll() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (reduced || matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    const lenis = new Lenis({ anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (seconds: number) => lenis.raf(seconds * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return null;
}
