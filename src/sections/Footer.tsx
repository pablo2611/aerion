import { BRAND } from "../data/content";
import { AERION_MODEL, MODEL_CREDITS } from "../data/model";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#030408] px-5 py-14 sm:px-10">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-2xl font-extrabold tracking-[0.3em]">AERION</p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed opacity-60">
            {BRAND.tagline} A new generation of electric grand touring — announced in Genoa, 2027.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="font-mono-tech text-[12px] tracking-[0.35em] opacity-50">SYSTEMS</p>
          <ul className="mt-4 space-y-2 text-[13px] opacity-80">
            <li>Triax Vortech Drive</li>
            <li>IonVault 120 · CryoLoop</li>
            <li>AeroWeave Active Aero</li>
            <li>Halomind · Neural Path</li>
            <li>LumenSig Light System</li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="font-mono-tech text-[12px] tracking-[0.35em] opacity-50">MOTION</p>
          <ul className="mt-4 space-y-2 text-[13px] opacity-80">
            <li>React · Three.js</li>
            <li>GSAP ScrollTrigger</li>
            <li>GLSL Shaders</li>
            <li>WebAudio — SonicCore</li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="font-mono-tech text-[12px] tracking-[0.35em] opacity-50">COLORS</p>
          <div className="mt-4 flex gap-2">
            {["#5fe8ff", "#0c0e11", "#e6e8e3", "#ff5a2a", "#9aa1a8"].map((c) => (
              <span key={c} className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono-tech text-[12px] tracking-[0.22em] text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2027 AERION MOTORS — A FICTIONAL CONCEPT. ALL FIGURES SIMULATED.</p>
        <p>VIDEO — PEXELS / RENDER — IN-HOUSE STUDIO</p>
      </div>
      <div className="mt-5 max-w-5xl border-t border-white/10 pt-5 font-mono-tech text-[12px] leading-relaxed tracking-[0.16em] text-white/70">
        <p>{MODEL_CREDITS}</p>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          <a href={AERION_MODEL.source} target="_blank" rel="noreferrer" className="transition-colors hover:text-ion">MODEL SOURCE</a>
          <a href={AERION_MODEL.licenseUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-ion">CC BY 4.0 LICENSE</a>
          <span>{AERION_MODEL.optimization.toUpperCase()}</span>
        </p>
        <p className="mt-3">
          HUMAN INTERACTION RENDERS ARE ORIGINAL AERION CONCEPT IMAGES. VISUAL RESEARCH USED LICENSED PEXELS DRIVER / COCKPIT REFERENCES AND AUTOMOTIVE HMI GUIDANCE FOR LISTENING, PROCESSING AND CONFIRMATION STATES.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          <a href="https://www.pexels.com/photo/a-man-driving-a-car-at-night-with-purple-lights-17716276/" target="_blank" rel="noreferrer" className="transition-colors hover:text-ion">NIGHT COCKPIT REFERENCE</a>
          <a href="https://www.pexels.com/photo/a-man-in-a-jacket-driving-a-car-8631625/" target="_blank" rel="noreferrer" className="transition-colors hover:text-ion">OVER-SHOULDER REFERENCE</a>
          <a href="https://developer.android.com/design/ui/cars/guides/ux-requirements/communicate-app-by-voice" target="_blank" rel="noreferrer" className="transition-colors hover:text-ion">AUTOMOTIVE VOICE UX REFERENCE</a>
        </p>
      </div>
    </footer>
  );
}

