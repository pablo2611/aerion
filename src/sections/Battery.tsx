import { useRef } from "react";
import { SectionShell, Kicker, Counter } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { COPY, CHAPTERS } from "../data/content";
import { prefersReduced } from "../utils/motion";

export default function Battery() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const c = COPY.battery;

  return (
    <SectionShell id="battery" chapter="battery" height={CHAPTERS[3].height}>
      <div ref={root} className="relative h-full w-full px-5 sm:px-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-[2%] top-[10%] select-none font-display text-[30vw] font-extrabold leading-none text-outline opacity-15"
        >
          120
        </span>

        <div className="flex h-full flex-col justify-between pt-24 sm:pt-28">
          <div className="flex items-start justify-between">
            <Kicker index="04" label="IonVault 120" data-rv="fade" />
            <p className="hidden max-w-[210px] text-right font-mono-tech text-[12px] leading-relaxed tracking-[0.2em] opacity-60 md:block" data-rv="left">
              STRUCTURAL PACK — CRYOLOOP THERMAL
            </p>
          </div>

          <div className="grid grid-cols-12 items-end gap-x-6 gap-y-8">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="font-display font-extrabold leading-[0.92] tracking-[-0.02em]">
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] lg:text-[9vw]" data-rv="up">{c.title[0]}</span>
                </span>
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] text-outline lg:text-[9vw]" data-rv="up">{c.title[1]}</span>
                </span>
              </h2>
              <p className="mt-6 max-w-md text-[14px] leading-relaxed opacity-75" data-rv="up">
                {c.body}
              </p>
            </div>

            <div className="col-span-12 lg:col-span-4 lg:col-start-8">
              <div className="border-t border-line pt-2">
                {c.rows.map((r) => (
                  <div key={r.k} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5" data-rv="right">
                    <span className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">{r.k}</span>
                    <span className="font-display text-lg font-bold tracking-wide">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2">
            <p className="flex items-center gap-2.5 font-mono-tech text-[12px] tracking-[0.3em] text-ion" data-rv="fade">
              <span className="aero-dot inline-block h-1.5 w-1.5 rounded-full bg-ion" />
              ENERGY FLOW — ACTIVE · {""}
              <span className="text-white">
                <Counter to={705} sectionId="battery" /> KM ESTIMATED RANGE
              </span>
            </p>
            <button
              onClick={() => document.getElementById("interior")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" })}
              className="group flex items-center gap-3 font-mono-tech text-[12px] tracking-[0.3em] uppercase opacity-60 transition-opacity hover:opacity-100"
              data-cursor
              data-cursor-label="NEXT"
              data-rv="fade"
            >
              Next — The quiet room
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

