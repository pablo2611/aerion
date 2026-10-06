import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell, Kicker, Counter } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { COPY, CHAPTERS } from "../data/content";

gsap.registerPlugin(ScrollTrigger);

export default function Aero() {
  const root = useRef<HTMLDivElement>(null);
  const wingVal = useRef<HTMLSpanElement>(null);
  const wingBar = useRef<HTMLDivElement>(null);
  useReveal(root);
  const c = COPY.aero;

  useEffect(() => {
    const sec = document.getElementById("aero");
    const val = wingVal.current;
    const bar = wingBar.current;
    if (!sec || !val || !bar) return;
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 60%",
      end: "center 30%",
      scrub: 0.8,
      onUpdate: (self) => {
        val.textContent = `${Math.round(self.progress * 27)}°`;
        bar.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <SectionShell id="aero" chapter="aero" height={CHAPTERS[1].height}>
      <div ref={root} className="relative h-full w-full px-5 sm:px-10">
        {/* ghost number */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-[4%] top-[12%] select-none font-display text-[26vw] font-extrabold leading-none text-outline opacity-25"
        >
          0.197
        </span>

        <div className="flex h-full flex-col justify-between pt-24 sm:pt-28">
          <Kicker index="02" label="Aerodynamics" data-rv="fade" />

          <div className="grid grid-cols-12 items-center gap-x-6 gap-y-10">
            <div className="col-span-12 lg:col-span-7">
              <h2 className="font-display font-extrabold leading-[0.92] tracking-[-0.02em]">
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] lg:text-[9.5vw]" data-rv="up">{c.title[0]}</span>
                </span>
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] text-outline lg:text-[9.5vw]" data-rv="up">{c.title[1]}</span>
                </span>
              </h2>
              <p className="mt-6 max-w-sm text-[14px] leading-relaxed opacity-75" data-rv="up">
                {c.body}
              </p>
            </div>

            {/* live aero telemetry */}
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <div className="border-t border-line pt-3 font-mono-tech" data-rv="right">
                <p className="flex items-center gap-2 text-[12px] tracking-[0.3em] text-ion">
                  <span className="aero-dot inline-block h-1.5 w-1.5 rounded-full bg-ion" />
                  AIRFLOW — LIVE SIMULATION
                </p>
              </div>
              <div className="mt-6 space-y-0">
                {c.live.map((l) => (
                  <div key={l.k} className="border-b border-line py-4" data-rv="right">
                    <p className="text-[12px] tracking-[0.3em] opacity-55">{l.k}</p>
                    <div className="mt-1.5 flex items-baseline justify-between gap-4">
                      {l.k === "REAR WING" ? (
                        <>
                          <span ref={wingVal} className="font-display text-3xl font-extrabold tabular-nums">
                            0°
                          </span>
                          <div className="h-px w-24 bg-line">
                            <div ref={wingBar} className="h-px w-full origin-left bg-ion" style={{ transform: "scaleX(0)" }} />
                          </div>
                        </>
                      ) : (
                        <span className="font-display text-3xl font-extrabold">
                          {l.k === "DRAG COEFFICIENT" ? (
                            <Counter to={0.197} dec={3} sectionId="aero" />
                          ) : (
                            <Counter to={Number(l.v.replace(/[^0-9]/g, ""))} sectionId="aero" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2">
            <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-40" data-rv="fade">
              64 PRESSURE POINTS — 200 READS / SEC
            </p>
            <button
              onClick={() => document.getElementById("performance")?.scrollIntoView({ behavior: "smooth" })}
              className="group flex items-center gap-3 font-mono-tech text-[12px] tracking-[0.3em] uppercase opacity-60 transition-opacity hover:opacity-100"
              data-cursor
              data-cursor-label="NEXT"
              data-rv="fade"
            >
              Next — Performance
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

