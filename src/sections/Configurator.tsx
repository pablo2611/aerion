import { useEffect, useRef, useState } from "react";
import { SectionShell, Kicker, Magnetic } from "../components/ui";
import {
  CALIPERS,
  CHAPTERS,
  COPY,
  FINISHES,
  INTERIORS,
  PAINTS,
  SIGNATURES,
  WHEELS,
  WHEEL_FINISHES,
  configPrice,
} from "../data/content";
import { INTELLIGENCE_DEMOS } from "../data/intelligence";
import { setVehicleHotspot, setVehicleView, useExperience, vehicleCamera } from "../store";
import { useAIDemo } from "../hooks/useAIDemo";
import { sonic } from "../audio";
import { prefersReduced } from "../utils/motion";

type ConfigTab = "paint" | "wheels" | "interior" | "lighting" | "ai";
const TABS: { id: ConfigTab; label: string }[] = [
  { id: "paint", label: "Paint" },
  { id: "wheels", label: "Wheels" },
  { id: "interior", label: "Interior" },
  { id: "lighting", label: "Lighting" },
  { id: "ai", label: "AI Experience" },
];
const fmt = (n: number) => "$" + n.toLocaleString("en-US");

export default function Configurator() {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, y: 0, at: 0 });
  const feedbackTimer = useRef<number | null>(null);
  const [tab, setTab] = useState<ConfigTab>("paint");
  const [feedback, setFeedback] = useState("AERION BLUE APPLIED");
  const config = useExperience((state) => state.config);
  const aiStage = useExperience((state) => state.aiStage);
  const setConfig = useExperience((state) => state.setConfig);
  const runAI = useAIDemo();
  const price = configPrice(config);
  const c = COPY.configurator;

  const paint = PAINTS.find((item) => item.id === config.paint)!;
  const wheel = WHEELS.find((item) => item.id === config.wheel)!;
  const wheelFinish = WHEEL_FINISHES.find((item) => item.id === config.wheelFinish)!;
  const interior = INTERIORS.find((item) => item.id === config.interior)!;

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    vehicleCamera.configActive = false;
  }, []);

  const announce = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback("CONFIGURATION SAVED"), 1900);
    sonic.blip();
  };
  const update = (patch: Parameters<typeof setConfig>[0], message: string, focus: "car" | "wheel" | "cabin" = "car") => {
    setConfig(patch);
    vehicleCamera.configActive = true;
    if (focus === "wheel") setVehicleHotspot("wheel");
    else if (focus === "cabin") setVehicleView("interior");
    else setVehicleView("front3q");
    announce(message);
  };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" });

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: event.clientX, y: event.clientY, at: performance.now() };
    if (!vehicleCamera.configActive) setVehicleView("front3q");
    vehicleCamera.configActive = true;
    vehicleCamera.lastInput = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    const elapsed = Math.max(0.016, (performance.now() - drag.current.at) / 1000);
    drag.current = { active: true, x: event.clientX, y: event.clientY, at: performance.now() };
    vehicleCamera.targetYaw -= dx * 0.006;
    vehicleCamera.targetPitch = Math.max(-0.08, Math.min(0.42, vehicleCamera.targetPitch - dy * 0.004));
    vehicleCamera.yawVelocity = (-dx * 0.006) / elapsed;
    vehicleCamera.pitchVelocity = (-dy * 0.004) / elapsed;
    vehicleCamera.lastInput = performance.now();
  };

  return (
    <SectionShell id="configurator" chapter="configurator" height={CHAPTERS[7].height}>
      <div ref={root} className="configurator-stage relative h-full w-full px-4 sm:px-8 lg:px-10">
        <div className="flex h-full flex-col pt-[max(5rem,env(safe-area-inset-top))] sm:pt-24">
          <div className="flex items-start justify-between">
            <Kicker index="08" label="Live configurator" />
            <div className="text-right">
              <p className="font-display text-xl font-extrabold tracking-wide sm:text-2xl">AERION ONE</p>
              <p className="font-mono-tech text-[12px] tracking-[0.25em] opacity-55">{fmt(price)} · {c.delivery}</p>
            </div>
          </div>

          {/* The free central studio keeps the product visible at every breakpoint. */}
          <div
            className="configurator-orbit pointer-events-auto absolute inset-x-0 top-[14%] h-[42%] cursor-grab active:cursor-grabbing sm:top-[15%] sm:h-[50%] lg:bottom-0 lg:left-0 lg:right-[430px] lg:top-[10%] lg:h-auto"
            style={{ touchAction: "none" }}
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => { drag.current.active = false; }}
            onPointerCancel={() => { drag.current.active = false; }}
            onWheel={(event) => {
              vehicleCamera.configActive = true;
              vehicleCamera.targetRadius = Math.max(2.6, Math.min(8.8, vehicleCamera.targetRadius + event.deltaY * 0.006));
            }}
            aria-label="Drag to rotate the configured AERION ONE"
            data-cursor
            data-cursor-label="DRAG"
          >
            <span className="absolute bottom-3 left-4 font-mono-tech text-[12px] tracking-[0.28em] opacity-50 sm:left-8 lg:left-10">
              DRAG 360° · SCROLL TO ZOOM
            </span>
          </div>

          <div className="configurator-summary pointer-events-none absolute bottom-[41%] left-4 hidden max-w-xs lg:bottom-9 lg:left-10 lg:block">
            <h2 className="font-display text-[clamp(3rem,6vw,7rem)] font-extrabold leading-[0.78] tracking-[-0.04em]">
              YOUR<br /><span className="text-outline">ONE.</span>
            </h2>
            <p className="mt-5 font-mono-tech text-[12px] leading-relaxed tracking-[0.22em] opacity-55">
              {paint.name.toUpperCase()} · {wheel.name.toUpperCase()}<br />{interior.name.toUpperCase()}
            </p>
          </div>

          {/* One category at a time: no dense technical wall. */}
          <div className="configurator-panel pointer-events-auto absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[43dvh] overflow-y-auto border border-ink/20 bg-paper/95 text-ink shadow-[0_-18px_60px_rgba(0,0,0,0.12)] backdrop-blur-md sm:inset-x-8 sm:max-h-[38dvh] lg:inset-y-24 lg:left-auto lg:right-10 lg:w-[390px] lg:max-h-none">
            <nav className="sticky top-0 z-10 flex overflow-x-auto border-b border-ink/15 bg-paper/95" aria-label="Configuration categories">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 px-3 py-3 font-mono-tech text-[12px] tracking-[0.2em] uppercase transition-colors sm:flex-1 ${tab === item.id ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"}`}
                  aria-current={tab === item.id ? "page" : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-ink/15 pb-3">
                <p className="font-mono-tech text-[12px] tracking-[0.28em] text-ink/55">LIVE CHANGE</p>
                <p className="config-feedback font-mono-tech text-[12px] tracking-[0.2em] text-[#08768a]" role="status">{feedback}</p>
              </div>

              {tab === "paint" && <div>
                <div className="flex items-end justify-between gap-4">
                  <div><p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">EXTERIOR PAINT</p><p className="mt-1 font-display text-xl font-extrabold">{paint.name}</p></div>
                  <span className="h-10 w-16 border border-ink/15" style={{ backgroundColor: paint.hex }} />
                </div>
                <div className="mt-5 grid grid-cols-4 gap-3" role="radiogroup" aria-label="Exterior paint">
                  {PAINTS.map((item) => <button
                    key={item.id}
                    role="radio"
                    aria-checked={config.paint === item.id}
                    aria-label={item.name}
                    onClick={() => update({ paint: item.id }, `${item.name.toUpperCase()} APPLIED`)}
                    className={`group flex aspect-square items-center justify-center border transition-all ${config.paint === item.id ? "border-ink bg-ink/[0.06]" : "border-ink/15 hover:border-ink/50"}`}
                  >
                    <span className={`h-8 w-8 rounded-full border border-black/15 transition-transform group-hover:scale-110 ${config.paint === item.id ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`} style={{ backgroundColor: item.hex }} />
                  </button>)}
                </div>
                <p className="mt-6 font-mono-tech text-[12px] tracking-[0.3em] opacity-55">SURFACE CHARACTER</p>
                <div className="mt-3 grid grid-cols-3 border border-ink/20" role="radiogroup" aria-label="Paint finish">
                  {FINISHES.map((item) => <button key={item.id} role="radio" aria-checked={config.finish === item.id} onClick={() => update({ finish: item.id }, `${item.name.toUpperCase()} APPLIED`)} className={`py-3 font-mono-tech text-[12px] tracking-[0.13em] uppercase ${config.finish === item.id ? "bg-ink text-paper" : "hover:bg-ink/[0.06]"}`}>{item.name.split(" ")[0]}</button>)}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono-tech text-[12px] tracking-[0.15em] text-ink/55"><span>METAL {Math.round(paint.metal * 100)}</span><span>ROUGH {Math.round(paint.rough * 100)}</span><span>CLEAR {Math.round(paint.clear * 100)}</span></div>
              </div>}

              {tab === "wheels" && <div>
                <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">WHEEL ARCHITECTURE</p>
                <p className="mt-1 font-display text-xl font-extrabold">{wheel.name}</p>
                <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Wheel design">
                  {WHEELS.map((item, index) => <button key={item.id} role="radio" aria-checked={config.wheel === item.id} onClick={() => update({ wheel: item.id }, `${item.name.toUpperCase()} FITTED`, "wheel")} className={`flex min-h-16 items-center gap-3 border px-3 text-left ${config.wheel === item.id ? "border-ink bg-ink/[0.06]" : "border-ink/15 hover:border-ink/50"}`}>
                    <span className="font-display text-2xl font-extrabold text-ink/25">0{index + 1}</span><span className="font-mono-tech text-[12px] tracking-[0.16em]">{item.name.toUpperCase()}</span>
                  </button>)}
                </div>
                <p className="mt-6 font-mono-tech text-[12px] tracking-[0.3em] opacity-55">FORGED FINISH</p>
                <div className="mt-3 grid grid-cols-4 gap-3" role="radiogroup" aria-label="Wheel finish">
                  {WHEEL_FINISHES.map((item) => <button key={item.id} role="radio" aria-checked={config.wheelFinish === item.id} title={item.name} onClick={() => update({ wheelFinish: item.id }, `${item.name.toUpperCase()} WHEELS`, "wheel")} className={`flex aspect-square items-center justify-center border ${config.wheelFinish === item.id ? "border-ink" : "border-ink/15"}`}><span className="h-7 w-7 rounded-full border border-black/20" style={{ backgroundColor: item.hex }} /></button>)}
                </div>
                <p className="mt-3 font-mono-tech text-[12px] tracking-[0.2em] text-ink/55">{wheelFinish.name.toUpperCase()} · AUTHORED RIM SURFACES</p>
                <p className="mt-6 font-mono-tech text-[12px] tracking-[0.3em] opacity-55">BRAKE CALIPERS</p>
                <div className="mt-3 flex gap-3">{CALIPERS.map((item) => <button key={item.id} aria-label={item.name} onClick={() => update({ caliper: item.id }, `${item.name.toUpperCase()} CALIPERS`, "wheel")} className={`h-9 w-9 rounded-full border ${config.caliper === item.id ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-ink/20"}`} style={{ backgroundColor: item.hex }} />)}</div>
              </div>}

              {tab === "interior" && <div>
                <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">CABIN MATERIAL</p>
                <p className="mt-1 font-display text-xl font-extrabold">{interior.name}</p>
                <div className="mt-4 space-y-2" role="radiogroup" aria-label="Interior finish">{INTERIORS.map((item) => <button key={item.id} role="radio" aria-checked={config.interior === item.id} onClick={() => update({ interior: item.id }, `${item.name.toUpperCase()} CABIN`, "cabin")} className={`flex w-full items-center gap-4 border p-3 text-left ${config.interior === item.id ? "border-ink bg-ink/[0.06]" : "border-ink/15"}`}><span className="h-8 w-14" style={{ backgroundColor: item.hex }} /><span className="font-mono-tech text-[12px] tracking-[0.2em]">{item.name.toUpperCase()}</span></button>)}</div>
                <button onClick={() => go("interior")} className="mt-6 w-full border border-ink py-3 font-mono-tech text-[12px] tracking-[0.22em] hover:bg-ink hover:text-paper">ENTER CABIN + AI</button>
              </div>}

              {tab === "lighting" && <div>
                <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-55">LUMENSIG</p>
                <div className="mt-4 space-y-2">{SIGNATURES.map((item) => <button key={item.id} onClick={() => update({ signature: item.id }, `${item.name.toUpperCase()} SIGNATURE`)} className={`flex w-full items-center justify-between border px-4 py-3 ${config.signature === item.id ? "border-ink bg-ink/[0.06]" : "border-ink/15"}`}><span className="font-mono-tech text-[12px] tracking-[0.2em]">{item.name.toUpperCase()}</span><span className="h-2 w-16" style={{ backgroundColor: item.hex, boxShadow: `0 0 14px ${item.hex}` }} /></button>)}</div>
              </div>}

              {tab === "ai" && <div>
                <p className="font-mono-tech text-[12px] tracking-[0.3em] text-[#08768a]">AERION INTELLIGENCE · POWERED BY CLAUDE</p>
                <p className="mt-3 text-[12px] leading-relaxed text-ink/65">Choose a guided command. Claude changes the cabin, route or vehicle display and confirms every action.</p>
                <div className="mt-4 space-y-2">{INTELLIGENCE_DEMOS.map((demo) => <button key={demo.id} onClick={() => { runAI(demo.id); announce(`${demo.effect}`); }} className="group flex w-full items-center justify-between border border-ink/15 px-4 py-3 text-left hover:border-ink"><span className="font-mono-tech text-[12px] tracking-[0.17em]">{demo.short.toUpperCase()}</span><span className="text-[#08768a] transition-transform group-hover:translate-x-1">→</span></button>)}</div>
                <div className="mt-5 flex items-center gap-3 border-t border-ink/15 pt-4"><span className={`h-2 w-2 rounded-full ${aiStage === "listening" ? "bg-red-500" : aiStage === "processing" ? "bg-amber-500" : "bg-[#08768a]"}`} /><span className="font-mono-tech text-[12px] tracking-[0.23em] uppercase">{aiStage}</span></div>
                <button onClick={() => go("interior")} className="mt-5 w-full bg-ink py-3 font-mono-tech text-[12px] tracking-[0.22em] text-paper">OPEN FULL AI EXPERIENCE</button>
              </div>}

              <div className="mt-6 border-t border-ink/15 pt-5">
                <Magnetic as="button" onClick={() => go("finale")} className="btn-solid w-full justify-center" data-cursor>{c.reserve}</Magnetic>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
