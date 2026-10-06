import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionShell, Kicker, Counter } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { COPY, CHAPTERS, SPEC } from "../data/content";
import { prefersReduced } from "../utils/motion";

gsap.registerPlugin(ScrollTrigger);

export default function Performance() {
  const root = useRef<HTMLDivElement>(null);
  const curve = useRef<SVGPathElement>(null);
  useReveal(root);
  const c = COPY.performance;

  useEffect(() => {
    const path = curve.current;
    const sec = document.getElementById("performance");
    if (!path || !sec) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = prefersReduced() ? "0" : `${len}`;
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "center 30%",
      scrub: 1,
      onUpdate: (self) => (path.style.strokeDashoffset = `${len * (1 - self.progress)}`),
    });
    return () => st.kill();
  }, []);

  const R = c.readouts;

  return (
    <SectionShell id="performance" chapter="performance" height={CHAPTERS[2].height}>
      <div ref={root} className="relative h-full w-full px-5 sm:px-10">
        <div className="flex h-full flex-col justify-between pt-24 sm:pt-28">
          <div className="flex items-start justify-between gap-6">
            <Kicker index="03" label="Triax Vortech" data-rv="fade" />
            <p className="hidden max-w-[220px] text-right text-[13px] leading-relaxed opacity-70 md:block" data-rv="left">
              {c.body}
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-display font-extrabold leading-[0.92] tracking-[-0.02em]">
              <span className="block overflow-hidden">
                <span className="block text-[12vw] lg:text-[8.5vw]" data-rv="up">{c.title[0]}</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block text-[12vw] text-outline lg:text-[8.5vw]" data-rv="up">
                  {c.title[1]}
                  {c.title[2]}
                </span>
              </span>
            </h2>

            {/* power curve */}
            <div className="max-w-md" data-rv="up">
              <svg viewBox="0 0 400 90" className="w-full" aria-hidden="true">
                <line x1="0" y1="88" x2="400" y2="88" stroke="currentColor" strokeOpacity="0.15" />
                <line x1="0" y1="40" x2="400" y2="40" stroke="currentColor" strokeOpacity="0.08" />
                <path
                  ref={curve}
                  d="M0 88 C 60 84, 120 30, 200 14 C 280 2, 340 10, 400 22"
                  fill="none"
                  stroke="var(--color-ion)"
                  strokeWidth="1.6"
                />
                <circle cx="200" cy="14" r="2.5" fill="var(--color-ion)" />
              </svg>
              <div className="flex justify-between font-mono-tech text-[12px] tracking-[0.3em] opacity-45">
                <span>0 KM/H</span>
                <span>POWER CURVE — LAUNCH MODE</span>
                <span>{SPEC.topSpeed} KM/H</span>
              </div>
            </div>
          </div>

          {/* telemetry */}
          <div className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
            {R.map((r) => (
              <div key={r.k} className="border-b border-line py-5 pr-4 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0" data-rv="fade">
                <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">{r.k}</p>
                <p className="mt-2 font-display text-[6vw] font-extrabold leading-none tabular-nums lg:text-6xl">
                  <Counter to={r.v} dec={r.dec ?? 0} sectionId="performance" />
                  <span className="ml-2 align-top font-mono-tech text-[12px] font-normal tracking-[0.2em] opacity-60">
                    {r.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

