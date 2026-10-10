import { sonic } from "../audio";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { runtime, useExperience } from "../store";
import { BRAND } from "../data/content";
import { Magnetic } from "../components/ui";
import { prefersReduced } from "../utils/motion";

export default function Hero() {
  const ready = useExperience(s => s.modelReady);
  const enterRoad = () => { runtime.driving = true; runtime.peakSpeed = 0; sonic.setDrivingMix(true); useExperience.setState({driving:true,exploreOpen:false}); if (!useExperience.getState().audioOn) void sonic.toggle().then(audioOn => useExperience.setState({audioOn})); };
  const booted = useExperience((s) => s.booted);
  const setExplore = useExperience((s) => s.setExplore);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!booted || !root.current) return;
    if (prefersReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-letter",
        { yPercent: 118 },
        { yPercent: 0, duration: 1.5, ease: "power4.out", stagger: 0.055, delay: 0.2 }
      );
      gsap.fromTo(
        ".hero-meta",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.12, delay: 1 }
      );
      gsap.fromTo(".hero-hint", { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 1.8 });
    }, root);
    return () => ctx.revert();
  }, [booted]);

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" });

  return (
    <section id="top" className="relative h-[100dvh] min-h-[620px]" aria-label="AERION ONE — reveal">
      <div ref={root} className="pointer-events-none relative h-full px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(6rem,calc(env(safe-area-inset-top)+4.8rem))] sm:px-10 sm:pt-28">
        {/* meta lines */}
        <div className="flex items-start justify-between font-mono-tech text-[12px] tracking-[0.3em] opacity-70">
          <p className="hero-meta">{BRAND.premiere}</p>
          <p className="hero-meta hidden sm:block">REVEAL — 00 / 09</p>
        </div>

        {/* The title is held in its own upper plane, preserving a wide central stage for the car. */}
        <div className="hero-title absolute left-5 top-[20%] sm:left-10 sm:top-[18%] lg:top-[17%]">
          <h1 className="sr-only">AERION ONE — {BRAND.tagline}</h1>
          <div aria-hidden="true" className="select-none">
            <div className="overflow-hidden">
              <div className="flex">
                {"AERION".split("").map((c, i) => (
                  <span key={i} className="hero-letter inline-block font-display text-[clamp(3.8rem,12.2vw,13.5rem)] font-extrabold leading-[0.78] tracking-[-0.035em]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero-meta mt-2 flex items-center gap-3 font-mono-tech text-[12px] tracking-[0.38em] text-ion sm:mt-4 sm:text-[12px]">
              <span>ONE</span>
              <span className="h-px w-8 bg-ion/60 sm:w-14" />
              <span>THE AIR, ENGINEERED</span>
            </div>
          </div>
        </div>

        {/* intro + CTA */}
        <div className="absolute inset-x-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-wrap items-end justify-between gap-4 sm:inset-x-10 sm:bottom-10">
          <div className="hidden max-w-xs md:block">
            <p className="hero-meta text-[13px] font-normal leading-relaxed opacity-75">
              {BRAND.intro}
            </p>
            <div className="hero-meta pointer-events-auto mt-6 flex flex-wrap items-center gap-4">
              <Magnetic as="button" onClick={() => setExplore(true)} className="btn-solid" data-cursor data-cursor-expand data-cursor-label="EXPLORE">
                Explore vehicle
              </Magnetic>
              <Magnetic as="button" onClick={() => go("configurator")} className="btn-ghost" data-cursor>
                Configure yours
              </Magnetic>
            </div>
          </div>
          <div className="hero-meta pointer-events-auto flex max-w-[240px] flex-col items-start gap-3 md:hidden">
            <p className="text-[12px] leading-relaxed opacity-75">A zero-emission grand tourer, engineered from air and light.</p>
            <Magnetic as="button" onClick={() => setExplore(true)} className="btn-solid" data-cursor data-cursor-label="EXPLORE">
              Explore vehicle
            </Magnetic>
            <Magnetic as="button" onClick={() => go("configurator")} className="btn-ghost" data-cursor>
              Configure yours
            </Magnetic>
          </div>
          <button disabled={!ready} onClick={enterRoad} className="hero-meta pointer-events-auto btn-ghost shrink-0">Ver en carretera</button>
          <div className="hero-meta hidden flex-col items-end gap-1.5 font-mono-tech text-[12px] tracking-[0.3em] opacity-60 xl:flex" aria-hidden="true">
            <span>1,340 HP — TRIAX VORTECH</span>
            <span>705 KM — IONVAULT 120</span>
            <span>0.197 Cd — AEROWEAVE</span>
          </div>
          <div className="hero-hint pointer-events-none absolute bottom-0 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 opacity-0 sm:flex">
            <span className="font-mono-tech text-[12px] tracking-[0.4em] opacity-60">SCROLL</span>
            <span className="hero-line block h-10 w-px bg-current" />
          </div>
          <div className="hero-hint pointer-events-none flex flex-col items-center gap-1.5 opacity-0 sm:hidden" aria-hidden="true">
            <span className="font-mono-tech text-[12px] tracking-[0.35em] opacity-55">SCROLL</span>
            <span className="hero-line block h-5 w-px bg-current" />
          </div>
        </div>
      </div>
    </section>
  );
}

