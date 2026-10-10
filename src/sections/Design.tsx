import { useRef } from "react";
import { SectionShell, Kicker, Hotspot } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { COPY, CHAPTERS } from "../data/content";
import { prefersReduced } from "../utils/motion";

export default function Design() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const c = COPY.design;

  return (
    <SectionShell id="design" chapter="design" height={CHAPTERS[0].height}>
      <div ref={root} className="relative h-full w-full px-5 sm:px-10">
        <div className="flex h-full flex-col justify-between pt-24 sm:pt-28">
          <div className="flex items-start justify-between">
            <Kicker index="01" label="Design" data-rv="fade" />
            <p className="hidden max-w-[190px] text-right font-mono-tech text-[12px] leading-relaxed tracking-[0.2em] opacity-60 md:block" data-rv="left">
              {c.kicker}
            </p>
          </div>

          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-10">
            <h2 className="col-span-12 font-display font-extrabold leading-[0.9] tracking-[-0.02em] lg:col-span-7">
              <span className="block overflow-hidden">
                <span className="block text-[15vw] lg:text-[10.5vw]" data-rv="up">{c.title[0]}</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block text-[15vw] text-outline lg:text-[10.5vw]" data-rv="up">{c.title[1]}</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block text-[15vw] lg:text-[10.5vw]" data-rv="up">{c.title[2]}</span>
              </span>
            </h2>

            <div className="col-span-12 space-y-6 lg:col-span-4 lg:col-start-9">
              <p className="max-w-sm text-[14px] leading-relaxed opacity-80" data-rv="up">
                {c.body}
              </p>
              <div className="grid grid-cols-2 gap-x-6">
                {c.facts.map((f) => (
                  <div key={f.k} className="border-t border-line py-2.5" data-rv="fade">
                    <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">{f.k}</p>
                    <p className="mt-1 font-display text-sm font-bold tracking-wide">{f.v}</p>
                  </div>
                ))}
              </div>
              <figure className="hidden md:block" data-rv="up">
                <div className="w-64 overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}images/aerion-showroom-640.webp`}
                    width={640} height={360} decoding="async"
                    alt="AERION ONE viewed from outside with its driver visible inside the illuminated cabin"
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 font-mono-tech text-[12px] tracking-[0.25em] opacity-55">
                  HUMAN PRESENCE — CABIN PROFILE / NIGHT
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2">
            {/* mobile hotspot accordion */}
            <div className="flex flex-col gap-1 md:hidden">
              {c.hotspots.map((h) => (
                <details key={h.title} className="group border-t border-line py-2">
                  <summary className="flex cursor-pointer list-none items-center gap-2 font-mono-tech text-[12px] tracking-[0.25em] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-ion" />
                    {h.title}
                  </summary>
                  <p className="mt-2 max-w-xs pr-8 text-[12px] leading-relaxed opacity-70">{h.body}</p>
                </details>
              ))}
            </div>
            <button
              onClick={() => document.getElementById("aero")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" })}
              className="group flex items-center gap-3 font-mono-tech text-[12px] tracking-[0.3em] uppercase opacity-60 transition-opacity hover:opacity-100"
              data-cursor
              data-cursor-label="NEXT"
              data-rv="fade"
            >
              Next — Aerodynamics
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
            </button>
          </div>
        </div>

        {/* desktop hotspots over the car (front of the car faces screen-right) */}
        <div className="hidden md:block">
          <Hotspot x="60%" y="55%" {...c.hotspots[0]} />
          <Hotspot x="45%" y="42%" {...c.hotspots[1]} />
          <Hotspot x="31%" y="57%" {...c.hotspots[2]} />
        </div>
      </div>
    </SectionShell>
  );
}

