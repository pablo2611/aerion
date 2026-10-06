import { useRef, useState } from "react";
import { SectionShell, Kicker, CineVideo } from "../components/ui";
import { useReveal } from "../hooks/useReveal";
import { COPY, CHAPTERS, MEDIA, SIGNATURES } from "../data/content";
import { runtime, useExperience } from "../store";
import { sonic } from "../audio";
import { prefersReduced } from "../utils/motion";

export default function Night() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const c = COPY.night;
  const config = useExperience((s) => s.config);
  const setConfig = useExperience((s) => s.setConfig);
  const [ambient, setAmbient] = useState(55);

  const pick = (id: string) => {
    const sig = SIGNATURES.find((s) => s.id === id);
    if (!sig) return;
    setConfig({ signature: id });
    runtime.lightState.sig = sig.hex;
    sonic.blip();
  };
  const setAmb = (v: number) => {
    setAmbient(v);
    runtime.lightState.ambient = v / 100;
  };

  return (
    <SectionShell id="night" chapter="night" height={CHAPTERS[6].height}>
      <div ref={root} className="relative h-full w-full px-5 sm:px-10">
        {/* masked night-drive film */}
        <div className="pointer-events-none absolute left-8 top-1/2 hidden h-[64vh] w-[21vw] -translate-y-1/2 lg:block" data-rv="left">
          <CineVideo
            src={MEDIA.nightDrive.src}
            poster={MEDIA.nightDrive.poster}
            className="h-full w-full"
            alt="Night drive, highway light trails"
          />
          <div className="absolute inset-0 border border-white/15" />
          <p className="absolute -bottom-6 left-0 font-mono-tech text-[12px] tracking-[0.3em] opacity-40">
            07 // NIGHT DRIVE — {MEDIA.nightDrive.credit.toUpperCase()}
          </p>
        </div>

        <div className="flex h-full flex-col justify-between pt-24 sm:pt-28">
          <div className="flex items-start justify-between">
            <Kicker index="07" label="LumenSig" data-rv="fade" />
            <p className="hidden max-w-[200px] text-right font-mono-tech text-[12px] leading-relaxed tracking-[0.2em] opacity-60 md:block" data-rv="left">
              320 M ADAPTIVE BEAM · PHOTON TAIL 1.9 M
            </p>
          </div>

          <div className="grid grid-cols-12 items-center gap-x-6 gap-y-8">
            <div className="col-span-12 lg:col-span-5">
              <h2 className="font-display font-extrabold leading-[0.92] tracking-[-0.02em]">
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] lg:text-[9vw]" data-rv="up">{c.title[0]}</span>
                </span>
                <span className="block overflow-hidden">
                  <span className="block text-[13vw] text-outline lg:text-[9vw]" data-rv="up">{c.title[1]}</span>
                </span>
              </h2>
              <p className="mt-6 max-w-sm text-[14px] leading-relaxed opacity-75" data-rv="up">
                {c.body}
              </p>
            </div>

            {/* live light controls — written straight into the render state */}
            <div className="col-span-12 lg:col-span-4 lg:col-start-8" data-rv="right">
              <div className="border border-line bg-black/25 p-6 sm:p-8">
                <p className="font-mono-tech text-[12px] tracking-[0.35em] text-ion">LIGHT SYSTEM — LIVE</p>

                <div className="mt-6">
                  <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-60">SIGNATURE</p>
                  <div className="mt-3 flex gap-4" role="radiogroup" aria-label="Light signature color">
                    {SIGNATURES.map((s) => (
                      <button
                        key={s.id}
                        role="radio"
                        aria-checked={config.signature === s.id}
                        onClick={() => pick(s.id)}
                        title={s.name}
                        data-cursor
                        data-cursor-label="CONFIGURE"
                        className={`h-9 w-9 rounded-full border transition-transform duration-300 hover:scale-110 ${
                          config.signature === s.id ? "scale-110 border-white" : "border-white/25"
                        }`}
                        style={{ backgroundColor: s.hex, boxShadow: config.signature === s.id ? `0 0 22px ${s.hex}aa` : "none" }}
                      />
                    ))}
                  </div>
                  <p className="mt-2.5 font-mono-tech text-[12px] tracking-[0.25em] opacity-50">
                    {SIGNATURES.find((s) => s.id === config.signature)?.name.toUpperCase()}
                  </p>
                </div>

                <div className="mt-7">
                  <div className="flex items-center justify-between">
                    <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-60">CABIN AMBIENT</p>
                    <p className="font-mono-tech text-[12px] tabular-nums text-ion">{ambient}%</p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ambient}
                    onChange={(e) => setAmb(Number(e.target.value))}
                    className="aerion-range mt-3 w-full"
                    aria-label="Cabin ambient light intensity"
                  />
                </div>

                <p className="mt-7 border-t border-line pt-4 font-mono-tech text-[12px] leading-relaxed tracking-[0.22em] opacity-45">
                  {c.note}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2">
            <p className="font-mono-tech text-[12px] tracking-[0.3em] opacity-40" data-rv="fade">
              LUMENSIG — VISIBLE FROM 2 KM
            </p>
            <button
              onClick={() => document.getElementById("configurator")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" })}
              className="group flex items-center gap-3 font-mono-tech text-[12px] tracking-[0.3em] uppercase opacity-60 transition-opacity hover:opacity-100"
              data-cursor
              data-cursor-label="NEXT"
              data-rv="fade"
            >
              Next — Configure
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

