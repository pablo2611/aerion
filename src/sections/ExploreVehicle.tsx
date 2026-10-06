import { useEffect, useRef, useState } from "react";
import { VEHICLE_HOTSPOTS } from "../data/content";
import { setVehicleHotspot, setVehicleView, type VehicleView, vehicleCamera, useExperience } from "../store";

const VIEWS: { id: VehicleView; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "front3q", label: "Front 3/4" },
  { id: "side", label: "Side" },
  { id: "rear3q", label: "Rear 3/4" },
  { id: "rear", label: "Rear" },
  { id: "detail", label: "Detail" },
  { id: "interior", label: "Interior" },
];

const PIN_POSITIONS = [
  "left-[68%] top-[49%]",
  "left-[62%] top-[66%]",
  "left-[29%] top-[56%]",
  "left-[47%] top-[70%]",
  "left-[70%] top-[43%]",
  "left-[47%] top-[40%]",
];

export default function ExploreVehicle() {
  const open = useExperience((s) => s.exploreOpen);
  const rolling = useExperience(s => s.showroomWheels);
  const setRolling = useExperience(s => s.setShowroomWheels);
  const reduced = useExperience(s => s.reducedMotion);
  const active = useExperience((s) => s.activeHotspot);
  const setExplore = useExperience((s) => s.setExplore);
  const setHotspot = useExperience((s) => s.setHotspot);
  const drag = useRef({ active: false, x: 0, y: 0, at: 0 });
  const [pinsVisible, setPinsVisible] = useState(true);

  useEffect(() => {
    if (!open) return;
    setPinsVisible(window.innerWidth >= 768);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExplore(false);
        setHotspot(null);
      }
    };
    const pinsTimer = window.setInterval(() => {
      if (performance.now() - vehicleCamera.lastInput > 3100) setPinsVisible(false);
    }, 500);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearInterval(pinsTimer);
    };
  }, [open, setExplore, setHotspot]);

  if (!open) return null;
  const selected = VEHICLE_HOTSPOTS.find((h) => h.id === active);
  const pickHotspot = (id: string) => {
    setPinsVisible(false);
    setHotspot(id);
    setVehicleHotspot(id);
  };
  const reset = () => {
    setPinsVisible(true);
    setHotspot(null);
    setVehicleView("front3q");
  };
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { active: true, x: e.clientX, y: e.clientY, at: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    vehicleCamera.lastInput = performance.now();
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    const elapsed = Math.max(0.016, (performance.now() - drag.current.at) / 1000);
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.at = performance.now();
    vehicleCamera.targetYaw -= dx * 0.006;
    vehicleCamera.targetPitch = Math.max(-0.1, Math.min(0.48, vehicleCamera.targetPitch - dy * 0.0045));
    vehicleCamera.yawVelocity = (-dx * 0.006) / elapsed;
    vehicleCamera.pitchVelocity = (-dy * 0.0045) / elapsed;
    vehicleCamera.lastInput = performance.now();
    if (Math.abs(dx) + Math.abs(dy) > 2) setPinsVisible(false);
  };
  const onUp = () => {
    drag.current.active = false;
    vehicleCamera.lastInput = performance.now();
  };

  return (
    <section className="fixed inset-0 z-[21] text-white" role="dialog" aria-modal="true" aria-label="Explore AERION ONE in 360 degrees">
      {/* This transparent surface drives the camera; controls live above it. */}
      <div
        className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => {
          e.preventDefault();
          vehicleCamera.targetRadius = Math.max(2.45, Math.min(9.5, vehicleCamera.targetRadius + e.deltaY * 0.006));
          vehicleCamera.lastInput = performance.now();
        }}
        aria-label="Drag to rotate the AERION ONE. Use mouse wheel to zoom."
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[22] flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10 sm:pt-7">
        <div className="explore-chrome pointer-events-auto max-w-[230px] border border-white/20 bg-black/30 px-4 py-3 backdrop-blur-sm sm:max-w-none">
          <p className="font-mono-tech text-[12px] tracking-[0.35em] text-ion">AERION ONE / SHOWROOM</p>
          <p className="mt-1.5 font-display text-sm font-bold tracking-wide">CONCESIONARIO — 360°</p>
        </div>
        <button
          onClick={() => { setExplore(false); setHotspot(null); }}
          className="pointer-events-auto explore-close flex h-11 items-center gap-3 border border-white/25 bg-black/30 px-4 font-mono-tech text-[12px] tracking-[0.28em] uppercase backdrop-blur-sm transition-colors hover:border-ion hover:text-ion"
          data-cursor
        >
          <span className="text-lg leading-none">×</span> Close
        </button>
      </div>

      {/* Discreet pins align to the default front 3/4 composition. The list below is the accessible counterpart. */}
      <div className={`absolute inset-0 z-[23] transition-opacity duration-400 ${active || !pinsVisible ? "pointer-events-none opacity-0" : ""}`} aria-hidden={Boolean(active) || !pinsVisible}>
        {VEHICLE_HOTSPOTS.map((hotspot, i) => (
          <button
            key={hotspot.id}
            onClick={() => pickHotspot(hotspot.id)}
            className={`explore-pin absolute ${PIN_POSITIONS[i]} h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ion/75 bg-[#071016]/70 text-[12px] text-ion backdrop-blur-sm`}
            aria-label={`Inspect ${hotspot.title}`}
          >
            <span className="absolute inset-[8px] rounded-full bg-ion" />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[24] px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] sm:px-10 sm:pb-7">
        <div className="pointer-events-auto mx-auto flex max-w-max flex-wrap justify-center gap-1 border border-white/20 bg-[#06090e]/80 p-1.5 backdrop-blur-md">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => { setHotspot(null); setPinsVisible(view.id === "front3q"); setVehicleView(view.id); }}
              className="px-2.5 py-2 font-mono-tech text-[12px] tracking-[0.19em] uppercase text-white/65 transition-colors hover:bg-white/10 hover:text-ion sm:px-3 sm:text-[12px]"
              data-cursor
            >
              {view.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto mt-2 flex justify-center">
          <button onClick={() => setRolling(!rolling)} disabled={reduced} aria-pressed={rolling && !reduced} className="bg-[#081018]/95 px-4 py-2 text-sm text-white transition-colors hover:bg-[#18313b] disabled:opacity-60" data-cursor>
            {reduced ? "Llantas detenidas · movimiento reducido" : rolling ? "Pausar llantas" : "Activar llantas"}
          </button>
        </div>
        <p className="pointer-events-none mt-3 text-center font-mono-tech text-[12px] tracking-[0.28em] text-white/70 sm:text-[12px]">
          ARRASTRA PARA GIRAR · SCROLL PARA ACERCAR
        </p>
      </div>

      <aside className={`pointer-events-auto absolute bottom-[6.5rem] right-5 z-[25] w-[min(20rem,calc(100vw-2.5rem))] border border-ion/35 bg-[#081018]/95 p-5 backdrop-blur-md transition-all duration-500 sm:right-10 sm:bottom-28 ${selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} aria-live="polite">
        {selected && <>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="font-mono-tech text-[12px] tracking-[0.3em] text-ion">{selected.label} / COMPONENT</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold">{selected.title}</h2>
            </div>
            <button onClick={reset} className="font-mono-tech text-[12px] tracking-[0.22em] text-white/65 hover:text-ion">RESET</button>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-white/75">{selected.body}</p>
        </>}
      </aside>

      <div className="sr-only">
        <p>Explore AERION ONE components.</p>
        {VEHICLE_HOTSPOTS.map((hotspot) => <button key={hotspot.id} onClick={() => pickHotspot(hotspot.id)}>{hotspot.title}</button>)}
      </div>
    </section>
  );
}
