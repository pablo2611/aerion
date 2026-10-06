import { useEffect, useRef, useState } from "react";
import { runtime, useExperience } from "../store";

const STAGES = ["CALIBRATING OPTICS", "CHARGING IONVAULT 120", "WAKING HALOMIND", "AEROWEAVE STANDBY"];

export default function Loader() {
  const setBooted = useExperience((s) => s.setBooted);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState(0);
  const [exit, setExit] = useState(false);
  const [done, setDone] = useState(false);
  const reduced = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    let p = 0;
    const t0 = performance.now();
    const dur = reduced.current ? 500 : 1900;
    const iv = setInterval(() => {
      p = Math.min(100, p + Math.random() * 7 + 3.5);
      setPct(Math.floor(p));
      setStage(Math.min(3, Math.floor((p / 100) * 3.99)));
      if (p >= 100) {
        clearInterval(iv);
        const wait = Math.max(0, dur - (performance.now() - t0));
        setTimeout(() => {
          runtime.bootAt = performance.now();
          setBooted(true);
          setExit(true);
          setTimeout(() => setDone(true), reduced.current ? 300 : 1000);
        }, wait);
      }
    }, 80);
    return () => clearInterval(iv);
  }, [setBooted]);

  if (done) return null;
  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col justify-between bg-[#04060a] px-6 py-8 sm:px-12 sm:py-10 ${
        exit ? "loader-exit" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between font-mono-tech text-[12px] tracking-[0.3em] text-white/70">
        <span>AERION // BOOT SEQUENCE</span>
        <span>ONE-001</span>
      </div>

      <div className="w-full">
        <div className="flex items-end justify-between gap-4">
          <div className="flex overflow-hidden">
            {"AERION".split("").map((c, i) => (
              <span
                key={i}
                className="loader-letter font-display text-[16vw] font-extrabold leading-[0.85] text-white sm:text-[9vw]"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {c}
              </span>
            ))}
          </div>
          <span className="mb-2 font-mono-tech text-[12px] tracking-[0.3em] text-ion">ONE</span>
        </div>

        <div className="relative mt-8 h-px w-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-ion transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%`, boxShadow: "0 0 18px rgba(95,232,255,0.9)" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono-tech text-[12px] tracking-[0.3em] text-white/60">
          <span className="loader-blink">{STAGES[stage]}</span>
          <span>
            <span className="text-white">{String(pct).padStart(3, "0")}</span> / 100
          </span>
        </div>
      </div>

      <div className="font-mono-tech text-[12px] tracking-[0.3em] text-white/30">
        THE AIR, ENGINEERED — GENOA 2027
      </div>
    </div>
  );
}

