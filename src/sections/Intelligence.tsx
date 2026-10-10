import { CHAPTERS } from "../data/content";
import { INTELLIGENCE_DEMOS } from "../data/intelligence";
import { SectionShell } from "../components/ui";
import { useAIDemo } from "../hooks/useAIDemo";
import { useExperience } from "../store";

export default function Intelligence() {
  const runAI = useAIDemo();
  const action = useExperience((state) => state.aiAction);
  const stage = useExperience((state) => state.aiStage);
  const demo = INTELLIGENCE_DEMOS.find((item) => item.id === "autonomous")!;
  const active = action === "autonomous";
  const ready = active && stage === "responding";

  return (
    <SectionShell id="intelligence" chapter="intelligence" height={CHAPTERS[5].height} flow>
      <div className="ai-flow relative w-full bg-[#03070b] text-white">
        <div className="ai-sensor-image">
        <img
          src={`${import.meta.env.BASE_URL}images/aerion-road-ai-1280.webp`}
          srcSet={`${import.meta.env.BASE_URL}images/aerion-road-ai-640.webp 640w, ${import.meta.env.BASE_URL}images/aerion-road-ai-1280.webp 1280w`}
          sizes="100vw" width={1280} height={720} decoding="async"
          alt="Over the shoulder view of the AERION ONE driver and cockpit with autonomous assistance active"
          className={`ai-campaign-image object-[55%_center] ${ready ? "autonomous-drive-image" : ""}`}
          loading="lazy"
        />

        {/* Sensor fusion appears only after the user executes the AERION command. */}
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
          <span className="vision-lane absolute bottom-[18%] left-[41%] h-[47%] w-px origin-bottom -rotate-[14deg] bg-gradient-to-t from-ion to-transparent" />
          <span className="vision-lane absolute bottom-[18%] right-[33%] h-[47%] w-px origin-bottom rotate-[15deg] bg-gradient-to-t from-ion to-transparent" />
          {[
            ["58%", "38%", "VEHICLE · 42 M"], ["73%", "48%", "CYCLIST · 18 M"], ["48%", "34%", "VEHICLE · 67 M"],
          ].map(([left, top, label]) => <span key={label} className="vision-target absolute h-12 w-16 border border-ion/70" style={{ left, top }}><span className="absolute -top-4 left-0 font-mono-tech text-[12px] tracking-[0.14em] text-ion">{label}</span></span>)}
          <div className="radar-field absolute bottom-[17%] left-1/2 h-32 w-64 -translate-x-1/2 border-t border-ion/30" />
        </div>

        </div>
        <div className="ai-content relative flex flex-col">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-mono-tech text-[12px] tracking-[0.34em] text-ion">06 / NEURAL PATH</p>
              <h2 className="mt-3 font-display text-[clamp(2.4rem,6vw,7rem)] font-extrabold leading-[0.82] tracking-[-0.04em]">WHAT THE<br />CAR SEES.</h2>
            </div>
            <div className="hidden border-l border-white/20 pl-4 font-mono-tech text-[12px] leading-loose tracking-[0.22em] text-white/70 sm:block">
              <p>ASSISTANCE: L2+</p><p>DRIVER: ATTENTIVE</p><p>FUSION: 30 HZ</p>
            </div>
          </div>

          <div className="grid items-end gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="max-w-sm text-[13px] leading-relaxed text-white/65">The driver remains responsible. Halomind fuses cameras, radar and LiDAR, then AERION explains that model in direct language.</p>
              <button
                onClick={() => runAI("autonomous")}
                className={`mt-5 min-h-12 border px-5 font-mono-tech text-[12px] tracking-[0.22em] transition-all ${active ? "border-ion bg-ion/10 text-ion" : "border-white/30 hover:border-ion"}`}
                data-cursor
              >
                {stage === "listening" ? "LISTENING…" : stage === "processing" ? "FUSING SENSOR DATA…" : ready ? "✓ SENSOR VIEW ACTIVE" : "ASK AERION WHAT IT SEES"}
              </button>
            </div>

            <div className={`border border-white/20 bg-[#041019]/80 p-4 backdrop-blur-md transition-all duration-500 lg:col-span-5 lg:col-start-8 sm:p-6 ${active ? "opacity-100" : "opacity-55"}`}>
              <div className="flex items-center justify-between">
                <p className="font-mono-tech text-[12px] tracking-[0.24em] text-ion">AERION INTELLIGENCE / AERION</p>
                <p className="font-mono-tech text-[12px] tracking-[0.2em] text-white/70">{stage.toUpperCase()}</p>
              </div>
              <p className="mt-4 font-display text-base font-bold sm:text-xl">“{demo.prompt}”</p>
              <p className={`mt-3 border-l border-ion pl-3 text-[12px] leading-relaxed text-white/65 transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}>{demo.response}</p>
              <div className={`mt-4 grid grid-cols-2 gap-x-5 border-t border-white/15 transition-opacity ${ready ? "opacity-100" : "opacity-25"}`}>
                {demo.telemetry.map((item) => <div key={item.label} className="border-b border-white/10 py-2.5"><p className="font-mono-tech text-[12px] tracking-[0.2em] text-white/70">{item.label}</p><p className="mt-1 font-display text-xs font-bold">{ready ? item.value : "—"}</p></div>)}
              </div>
            </div>
          </div>

          <p className="font-mono-tech text-[12px] leading-relaxed tracking-[0.18em] text-white/70 sm:text-[12px]">CONCEPT DEMONSTRATION · DRIVER ATTENTION REQUIRED · CAPABILITY AND AVAILABILITY SUBJECT TO REGULATORY APPROVAL</p>
        </div>
      </div>
    </SectionShell>
  );
}
