import VoiceControls from "./VoiceControls";
import AIEcosystem from '../components/AIEcosystem';
import { useMemo } from "react";
import { CHAPTERS } from "../data/content";
import { INTELLIGENCE_DEMOS } from "../data/intelligence";
import { SectionShell } from "../components/ui";
import { useAIDemo } from "../hooks/useAIDemo";
import { setVehicleView, useExperience } from "../store";

const STAGE_LABELS = {
  ready: "Ready",
  listening: "Listening",
  processing: "Processing",
  responding: "Responding",
};

export default function Interior() {
  const aiAction = useExperience((state) => state.aiAction);
  const aiStage = useExperience((state) => state.aiStage);
  const config = useExperience((state) => state.config);
  const runAI = useAIDemo();
  const active = useMemo(
    () => INTELLIGENCE_DEMOS.find((demo) => demo.id === aiAction) ?? INTELLIGENCE_DEMOS[0],
    [aiAction]
  );
  const responded = aiStage === "responding";

  return (
    <SectionShell id="interior" chapter="interior" height={CHAPTERS[4].height} flow>
      <div className={`ai-experience ai-flow relative w-full ai-theme-${config.uiTheme}`}>
        <img
          src={`${import.meta.env.BASE_URL}images/aerion-cabin-1280.webp`}
          srcSet={`${import.meta.env.BASE_URL}images/aerion-cabin-640.webp 640w, ${import.meta.env.BASE_URL}images/aerion-cabin-1280.webp 1280w`}
          sizes="100vw" width={1280} height={720} loading="lazy" decoding="async"
          alt="A driver inside AERION ONE speaking with the integrated AERION intelligence"
          className="ai-campaign-image object-[40%_center] sm:object-center"
        />

        <div className="ai-content relative flex flex-col text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono-tech text-[12px] tracking-[0.34em] text-ion">05 / AERION INTELLIGENCE</p>
              <h2 className="mt-2 font-display text-[clamp(2.2rem,5.2vw,6.4rem)] font-extrabold leading-[0.84] tracking-[-0.035em]">
                TALK TO<br />THE DRIVE.
              </h2>
              <p className="mt-3 font-mono-tech text-[12px] tracking-[0.25em] text-white/70">LOCAL VOICE ASSISTANT · CONCEPT DEMO</p>
            </div>
            <div className="hidden max-w-[420px] md:block">
              <AIEcosystem />
            </div>
          </div>

          <VoiceControls />
          <div className="md:hidden"><AIEcosystem /></div>
          <button className="mt-4 w-fit border border-ion bg-[#06131c] px-5 py-3 text-sm text-ion" onClick={() => { useExperience.getState().setExplore(true); setVehicleView("interior"); }}>
            Entrar a la cabina 3D · sin volante
          </button>
          {/* The HMI is a functional interaction surface, not a detached marketing card. */}
          <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-8">
            <div className="hidden lg:col-span-4 lg:block">
              <p className="max-w-xs text-[13px] leading-relaxed text-white/65">
                Try a guided command. This local concept changes the visual cabin settings and speaks a response; route and sensor values are simulated.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {INTELLIGENCE_DEMOS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => runAI(demo.id)}
                    className={`border px-3 py-3 text-left font-mono-tech text-[12px] tracking-[0.18em] uppercase transition-all ${aiAction === demo.id ? "border-ion bg-ion/10 text-ion" : "border-white/20 text-white/65 hover:border-white/50"}`}
                    data-cursor
                  >
                    {demo.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-hmi lg:col-span-6 lg:col-start-7">
              <div className="border border-white/20 bg-[#051019]/80 p-4 backdrop-blur-md sm:p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`ai-status-dot h-2.5 w-2.5 rounded-full ai-status-${aiStage}`} />
                    <p className="font-mono-tech text-[12px] tracking-[0.28em] uppercase text-ion">{STAGE_LABELS[aiStage]}</p>
                  </div>
                  <p className="font-mono-tech text-[12px] tracking-[0.22em] text-white/70">AERION / CABIN CONTEXT 04</p>
                </div>

                <div className="py-4 sm:py-5">
                  <div className={`ai-waveform flex h-8 items-center gap-[3px] ${aiStage === "listening" ? "is-listening" : ""}`} aria-hidden="true">
                    {Array.from({ length: 28 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 42}ms`, height: `${18 + ((i * 13) % 70)}%` }} />)}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold leading-snug sm:text-2xl">“{active.prompt}”</p>
                  <div className={`grid transition-all duration-700 ${responded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="border-l border-ion pl-3 text-[12px] leading-relaxed text-white/70 sm:text-[13px]">{active.response}</p>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-x-5 border-t border-white/15 transition-opacity duration-500 ${responded ? "opacity-100" : "opacity-30"}`}>
                  {active.telemetry.map((item) => <div key={item.label} className="border-b border-white/10 py-2.5">
                    <p className="font-mono-tech text-[12px] tracking-[0.22em] text-white/70">{item.label}</p>
                    <p className="mt-1 font-display text-[12px] font-bold tracking-wide text-white sm:text-[13px]">{responded ? item.value : "—"}</p>
                  </div>)}
                </div>
                <p className={`mt-3 font-mono-tech text-[12px] tracking-[0.24em] text-ion transition-opacity ${responded ? "opacity-100" : "opacity-0"}`}>✓ {active.effect}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {INTELLIGENCE_DEMOS.map((demo) => <button key={demo.id} onClick={() => runAI(demo.id)} className={`min-h-10 border px-2 font-mono-tech text-[12px] tracking-[0.15em] uppercase ${aiAction === demo.id ? "border-ion bg-ion/10 text-ion" : "border-white/20 text-white/65"}`}>{demo.short}</button>)}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
