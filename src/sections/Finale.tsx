import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell, Kicker, Magnetic, CineVideo } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { BRAND, COPY, CHAPTERS, MEDIA } from "../data/content";
import { sonic } from "../audio";
import { prefersReduced } from "../utils/motion";

gsap.registerPlugin(ScrollTrigger);

export default function Finale() {
  const root = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLDivElement>(null);
  useReveal(root);
  const [requested, setRequested] = useState(false);
  const c = COPY.finale;

  useEffect(() => {
    const sec = document.getElementById("finale");
    if (!sec || !speed.current || prefersReduced()) return;
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 80%",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => (speed.current!.style.opacity = String(self.progress * 0.9)),
    });
    return () => st.kill();
  }, []);

  return (
    <SectionShell id="finale" chapter="finale" height={CHAPTERS[8].height}>
      <div ref={root} className="relative h-full w-full">
        {/* speed-streak film, blended under the type */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-screen" aria-hidden="true">
          <CineVideo src={MEDIA.speedStreaks.src} poster={MEDIA.speedStreaks.poster} className="h-full w-full" />
        </div>
        {/* speed lines driven by scroll */}
        <div ref={speed} className="speedlines pointer-events-none absolute inset-0" style={{ opacity: 0 }} aria-hidden="true" />

        <div className="relative flex h-full flex-col items-center justify-center px-5 pt-16 text-center">
          <Kicker index="09" label="AERION ONE" className="justify-center" data-rv="fade" />
          <h2 aria-label={BRAND.model} className="mt-8 select-none">
            <span aria-hidden="true" className="block font-display text-[16vw] font-extrabold leading-[0.88] tracking-[-0.02em] sm:text-[11vw]" data-rv="up">
              AERION
            </span>
            <span aria-hidden="true" className="block font-display text-[16vw] font-extrabold leading-[0.88] tracking-[-0.02em] text-outline sm:text-[11vw]" data-rv="up">
              ONE
            </span>
          </h2>
          <p className="mt-6 font-mono-tech text-[12px] tracking-[0.5em] text-ion" data-rv="fade">
            {BRAND.tagline}
          </p>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed opacity-75" data-rv="up">
            {c.body}
          </p>

          <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4 sm:flex-row" data-rv="up">
            <Magnetic
              as="button"
              onClick={() => {
                if (!requested) {
                  setRequested(true);
                  sonic.hum(0.9);
                  setTimeout(() => sonic.hum(0), 2500);
                  sonic.blip();
                }
              }}
              className={requested ? "btn-ghost" : "btn-solid"}
              data-cursor
              data-cursor-expand
              data-cursor-label="GO"
              aria-live="polite"
            >
              {requested ? "✓ " : ""}
              {requested ? c.ctaDone : c.cta}
            </Magnetic>
            <Magnetic as="button" onClick={() => window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" })} className="btn-ghost" data-cursor>
              {c.back}
            </Magnetic>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

