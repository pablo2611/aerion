import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  data-rv="up" | "left" | "right" | "line" | "fade"                  */
/*  Elements fade/slide in once when they enter the viewport.          */
/*  Honors prefers-reduced-motion (opacity only, no transforms).       */
/* ------------------------------------------------------------------ */

export function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-rv]"));
    if (!els.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      els.forEach((el) => {
        if (reduced) {
          gsap.set(el, { opacity: 1, x: 0, y: 0, scaleX: 1 });
          return;
        }
        const dir = el.dataset.rv || "up";
        const from: gsap.TweenVars = { opacity: 0 };
        if (dir === "up") {
          from.y = 30;
        } else if (dir === "left") {
          from.x = -36;
        } else if (dir === "right") {
          from.x = 36;
        } else if (dir === "line") {
          from.scaleX = 0;
          from.opacity = 1;
        }
        gsap.fromTo(
          el,
          from,
          {
            opacity: 1,
            x: 0,
            y: 0,
            scaleX: 1,
            duration: 1.15,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);
}
