import { useEffect, useRef, useState } from "react";
import { PAINTS } from "../data/content";
import { driveCamera, runtime, useExperience } from "../store";
import { sonic } from "../audio";

export default function DriveControls() {
  const exploring = useExperience(s => s.exploreOpen);
  const driving = useExperience(s => s.driving);
  const ready = useExperience(s => s.modelReady);
  const paint = useExperience(s => s.config.paint);
  const audio = useExperience(s => s.audioOn);
  const error = useExperience(s => s.audioError);
  const phase = useExperience(s => s.phase);
  const [speed, setSpeed] = useState(80);
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [boostSeconds, setBoostSeconds] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [music, setMusic] = useState(Math.round(sonic.driveMusic * 100));
  const [engineMode, setEngineMode] = useState(sonic.engineMode);
  const [volume, setVolume] = useState(Math.round(sonic.volume * 100));
  const cooldownUntil = useRef(0);
  const drag = useRef({active:false,x:0,y:0});

  useEffect(() => {
    if (!driving) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sonic.setDrivingMix(true);
    driveCamera.targetYaw = 0.78;
    driveCamera.targetPitch = 0.22;
    driveCamera.targetRadius = 9.5;
    runtime.nitroUntil = 0;
    cooldownUntil.current = 0;
    setPaused(false); setBoostSeconds(0); setCooldown(0);
    const closeFromKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { runtime.driving = false; runtime.nitroUntil = 0; useExperience.setState({driving:false}); }
    };
    window.addEventListener("keydown",closeFromKey);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const boost = now < runtime.nitroUntil;
      setDisplaySpeed(Math.round(runtime.speed));
      setBoostSeconds(Math.max(0,Math.ceil((runtime.nitroUntil-now)/1000)));
      setCooldown(Math.max(0,Math.ceil((cooldownUntil.current-now)/1000)));
      sonic.hum(runtime.speed / 180, boost);
    },100);
    return () => {
      document.body.style.overflow = old;
      runtime.nitroUntil = 0;
      sonic.setDrivingMix(false); sonic.hum(0);
      window.removeEventListener("keydown",closeFromKey); window.clearInterval(timer);
    };
  },[driving]);

  useEffect(() => { runtime.targetSpeed = paused ? 0 : speed; },[speed,paused]);
  const close = () => { runtime.driving=false; runtime.nitroUntil=0; useExperience.setState({driving:false}); };
  const toggleMotor = async () => {
    setBusy(true);
    try { useExperience.setState({audioOn:await sonic.toggle()}); } finally {setBusy(false);}
  };
  const nitro = async () => {
    if (paused || performance.now() < cooldownUntil.current || busy) return;
    runtime.nitroUntil = performance.now()+4500;
    cooldownUntil.current = performance.now()+6500;
    setBoostSeconds(5); setCooldown(7);
    if (!audio) await toggleMotor();
    sonic.nitro();
  };
  const view = (yaw: number) => { driveCamera.targetYaw=yaw; driveCamera.targetPitch=0.2; driveCamera.targetRadius=9.5; };
  if (exploring || (!driving && phase === "configurator")) return null;
  if (!driving) return <button disabled={!ready} className="fixed bottom-5 right-5 z-30 btn-solid" onClick={() => {runtime.driving=true;useExperience.setState({driving:true,exploreOpen:false});}}>Ver en carretera</button>;

  return <div className="fixed inset-0 z-[60] pointer-events-none text-white" role="region" aria-label="Experiencia en carretera">
    <div className="drive-orbit absolute inset-0 pointer-events-auto touch-none"
      tabIndex={0} role="group" aria-label="Vista 360 grados: arrastra para girar, usa scroll para acercar o las flechas del teclado para cambiar la vista"
      onPointerDown={e=>{drag.current={active:true,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{
        if(!drag.current.active || performance.now()<runtime.nitroUntil)return;
        driveCamera.targetYaw -= (e.clientX-drag.current.x)*0.007;
        driveCamera.targetPitch = Math.max(0.04,Math.min(0.65,driveCamera.targetPitch+(e.clientY-drag.current.y)*0.004));
        drag.current.x=e.clientX;drag.current.y=e.clientY;
      }}
      onPointerUp={()=>{drag.current.active=false;}}
      onPointerCancel={()=>{drag.current.active=false;}}
      onWheel={e=>{driveCamera.targetRadius=Math.max(6,Math.min(14,driveCamera.targetRadius+e.deltaY*0.006));}}
      onKeyDown={e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();driveCamera.targetYaw+=e.key==='ArrowLeft'?0.25:-0.25;}
        if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();driveCamera.targetPitch=Math.max(0.04,Math.min(0.65,driveCamera.targetPitch+(e.key==='ArrowUp'?0.08:-0.08)));}
      }}
    />
    <div className="drive-heading absolute left-5 top-5 right-36">
      <h2 className="font-display text-xl sm:text-3xl font-bold">AERION · On the road</h2>
      <p className="mt-1 text-sm">Modo deportivo · simulación 3D</p>
      <p className="mt-2 text-xs text-white/85">Arrastra para girar 360° · scroll para acercar</p>
    </div>
    <button autoFocus className="absolute right-5 top-5 pointer-events-auto border border-white/50 bg-black/75 px-4 py-3" onClick={close}>Volver a la web</button>
    <div className="drive-panel drive-controls pointer-events-auto absolute bottom-5 left-5 right-5 sm:right-auto">
      <div className="flex items-baseline justify-between gap-5"><strong className="font-display text-3xl tabular-nums">{displaySpeed} <span className="text-base">km/h</span></strong><button aria-pressed={paused} onClick={()=>{runtime.nitroUntil=0;setPaused(!paused);}}>{paused?'Continuar':'Pausar'}</button></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="drive-nitro" disabled={paused||cooldown>0||busy} onClick={()=>void nitro()}>{boostSeconds>0?'NITRO · '+boostSeconds+'s':cooldown>0?'Recargando · '+cooldown+'s':'NITRO · escapes'}</button>
        <button disabled={busy} aria-pressed={audio} onClick={()=>void toggleMotor()}>{busy?'Iniciando…':audio?'Silenciar motor':'Activar motor'}</button>
      </div>
      <p role="status" className="mt-2 text-xs leading-relaxed text-white/85">{error || (boostSeconds>0?'Impulso activo · cámara de escapes':audio?'Motor activo · música de fondo al mínimo':'Activa el motor para escuchar la conducción.')}</p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Vistas del carro">
        <button onClick={()=>view(0.1)}>Frente</button><button onClick={()=>view(Math.PI/2)}>Lateral</button><button onClick={()=>view(Math.PI-0.4)}>Trasera</button>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer py-2 text-sm">Velocidad, sonido y color</summary>
        <div className="my-3 flex gap-2" role="group" aria-label="Tipo de motor">
          <button className={engineMode === "electric" ? "!border-ion !bg-ion/20" : ""} aria-pressed={engineMode === "electric"} onClick={()=>{setEngineMode("electric");sonic.setEngineMode("electric");}}>Eléctrico</button>
          <button className={engineMode === "race" ? "!border-ion !bg-ion/20" : ""} aria-pressed={engineMode === "race"} onClick={()=>{setEngineMode("race");sonic.setEngineMode("race");}}>Carrera</button>
        </div>
        <p className="mb-3 text-xs text-white/85">{engineMode === "race" ? "Motor grabado / respuesta a velocidad y nitro" : "Motor eléctrico / sonido digital"}</p>
        <label htmlFor="drive-speed">Velocidad · {speed} km/h</label><input id="drive-speed" type="range" min="20" max="180" step="10" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/>
        <label htmlFor="drive-volume">Volumen del motor · {volume}%</label><input id="drive-volume" type="range" min="0" max="100" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);sonic.setVolume(v/100);}}/>
        <label htmlFor="drive-music">Música de fondo · {music}%</label><input id="drive-music" type="range" min="0" max="30" value={music} onChange={e=>{const v=Number(e.target.value);setMusic(v);sonic.setDriveMusic(v/100);}}/>
        <div className="my-3 flex flex-wrap gap-2" role="group" aria-label="Color del carro">{PAINTS.map(p=><button key={p.id} aria-label={p.name} aria-pressed={paint===p.id} onClick={()=>useExperience.getState().setConfig({paint:p.id})} style={{background:p.hex,outline:paint===p.id?'2px solid #fff':undefined,minHeight:32,width:32,padding:0}}/>)}</div>
      </details>
      <p className="mt-2 text-[11px] leading-relaxed text-white/70">Nitro y escapes ficticios para esta experiencia.</p>
    </div>
  </div>;
}
