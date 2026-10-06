import { useEffect, useState } from "react";
import { PAINTS } from "../data/content";
import { runtime, useExperience } from "../store";
import { sonic } from "../audio";

export default function DriveControls() {
  const driving = useExperience(s => s.driving);
  const ready = useExperience(s => s.modelReady);
  const paint = useExperience(s => s.config.paint);
  const [speed, setSpeed] = useState(80);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [paused, setPaused] = useState(false);
  const audio = useExperience(s => s.audioOn);
  const phase = useExperience(s => s.phase);
  const close = () => { runtime.driving = false; useExperience.setState({ driving:false }); sonic.hum(0); };
  useEffect(() => {
    if (!driving) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if(e.key === "Escape") close(); };
    window.addEventListener("keydown",key);
    const timer = window.setInterval(() => { setDisplaySpeed(Math.round(runtime.speed)); sonic.hum(runtime.speed / 180); },200);
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown",key); clearInterval(timer); };
  },[driving]);
  useEffect(() => { runtime.targetSpeed = paused ? 0 : speed; },[speed,paused]);
  if (!driving && phase === "configurator") return null;
  if (!driving) return <button disabled={!ready} className="fixed bottom-5 right-5 z-30 btn-solid" onClick={() => { runtime.driving = true; useExperience.setState({driving:true,exploreOpen:false}); }}>Ver en carretera</button>;
  return <div className="fixed inset-0 z-[60] pointer-events-none text-white" role="region" aria-label="Experiencia en carretera">
    <div className="absolute left-5 top-20 sm:top-5"><h2 className="font-display text-xl sm:text-3xl font-bold">AERION · On the road</h2><p className="mt-1 text-sm">Gran turismo eléctrico · simulación 3D</p></div>
    <button autoFocus className="absolute right-5 top-5 pointer-events-auto border border-white/50 bg-black/60 px-4 py-3" onClick={close}>Volver a la web</button>
    <div className="drive-panel pointer-events-auto absolute bottom-5 left-5 right-5 sm:right-auto">
      <div className="flex items-baseline justify-between gap-5"><strong className="font-display text-4xl tabular-nums">{displaySpeed} <span className="text-base">km/h</span></strong><button aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Continuar" : "Pausar"}</button></div>
      <label htmlFor="drive-speed">Velocidad simulada · {speed} km/h</label><input id="drive-speed" type="range" min="20" max="180" step="10" value={speed} onChange={e => setSpeed(Number(e.target.value))}/>
      <div className="my-3 flex flex-wrap gap-2" role="group" aria-label="Color del carro">{PAINTS.map(p => <button key={p.id} aria-label={p.name} aria-pressed={paint === p.id} onClick={() => useExperience.getState().setConfig({paint:p.id})} style={{background:p.hex,outline:paint===p.id ? '2px solid #fff' : undefined,minHeight:32,width:32,padding:0}} />)}</div>
      <button aria-pressed={audio} onClick={async () => useExperience.setState({audioOn:await sonic.toggle()})}>{audio ? "Silenciar música y motor" : "Activar música y motor"}</button>
    </div>
  </div>;
}

