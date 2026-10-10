import { useEffect, useRef, useState } from "react";
import { PAINTS } from "../data/content";
import { driveCamera, runtime, useExperience } from "../store";
import { sonic } from "../audio";
import { changeVehicleLane, startVehicleNitro } from '../vehicleActions';

export default function DriveControls() {
  const exploring = useExperience(s => s.exploreOpen);
  const driving = useExperience(s => s.driving);
  const paint = useExperience(s => s.config.paint);
  const audio = useExperience(s => s.audioOn);
  const error = useExperience(s => s.audioError);
  const cabin = useExperience(s => s.cabinView);
  const engineView=useExperience(s=>s.engineView);
  const environmentReady=useExperience(s=>s.environmentReady);
  const autonomous = useExperience(s => s.autonomous);
  const speed = useExperience(s=>s.cruiseSpeed);
  const setSpeed = (value:number) => useExperience.setState({cruiseSpeed:value});
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [gear,setGear]=useState(1);
  const [peak,setPeak]=useState(0);
  const paused = useExperience(s=>s.drivingPaused);
  const setPaused = (value:boolean) => useExperience.setState({drivingPaused:value,autonomous:!value,...(value?{}:{engineView:false})});
  const [boostSeconds, setBoostSeconds] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [maneuver,setManeuver]=useState('Tráfico simulado · detección vinculada a la carretera');
  const session=useRef(0);
  const engineMode = useExperience(s=>s.engineMode);
  const volume = useExperience(s=>s.audioVolume);
  const [expanded,setExpanded] = useState(false);

  const drag = useRef({active:false,x:0,y:0});
  useEffect(()=>setExpanded(false),[cabin,engineView]);

  useEffect(() => {
    if (!driving) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sonic.setDrivingMix(true);
    if(useExperience.getState().quality==='HIGH')useExperience.setState({quality:'MEDIUM'});
    driveCamera.targetYaw = 0.78;
    driveCamera.targetPitch = 0.22;
    driveCamera.targetRadius = 9.5;
    runtime.nitroUntil = 0;
    runtime.turn='off';runtime.lane=0;runtime.targetLane=0;
    session.current++;
    useExperience.setState({doorsOpen:false,cabinView:false,engineView:false});
    runtime.nitroCooldownUntil = 0;
    setPaused(false); setBoostSeconds(0); setCooldown(0);
    const closeFromKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { runtime.driving = false; runtime.nitroUntil = 0; useExperience.setState({driving:false,cabinView:false,engineView:false}); }
    };
    window.addEventListener("keydown",closeFromKey);
    const timer = window.setInterval(() => {
      const now = performance.now();
      const boost = now < runtime.nitroUntil;
      setDisplaySpeed(Math.round(runtime.speed));
      setGear(runtime.gear);
      setPeak(Math.round(runtime.peakSpeed));
      setBoostSeconds(Math.max(0,Math.ceil((runtime.nitroUntil-now)/1000)));
      setCooldown(Math.max(0,Math.ceil((runtime.nitroCooldownUntil-now)/1000)));
      sonic.hum(runtime.speed / 180, boost);
    },100);
    return () => {
      document.body.style.overflow = old;
      runtime.nitroUntil = 0;
      runtime.turn='off';session.current++;
      sonic.setDrivingMix(false); sonic.hum(0);
      window.removeEventListener("keydown",closeFromKey); window.clearInterval(timer);
    };
  },[driving]);

  useEffect(() => { runtime.targetSpeed = paused ? 0 : speed; },[speed,paused]);
  const close = () => { runtime.driving=false; runtime.nitroUntil=0; useExperience.setState({driving:false,cabinView:false,engineView:false}); };
  const toggleMotor = async () => {
    setBusy(true);
    try { useExperience.setState({audioOn:await sonic.toggle()}); } finally {setBusy(false);}
  };
  const nitro = async () => {
    if(busy)return;
    const message=startVehicleNitro();setManeuver(message);
    if(performance.now()<runtime.nitroUntil)useExperience.setState({cabinView:false,engineView:false});
  };
  const changeLane=(direction:'left'|'right')=>setManeuver(changeVehicleLane(direction));
  const view = (yaw: number) => { runtime.nitroUntil=0;useExperience.setState({cabinView:false,engineView:false}); driveCamera.targetYaw=yaw; driveCamera.targetPitch=0.2; driveCamera.targetRadius=9.5; };
  const inspectEngine=()=>{runtime.speed=0;runtime.nitroUntil=0;useExperience.setState({engineView:!engineView,cabinView:false,drivingPaused:true,autonomous:false});if(!audio)void toggleMotor();};
  if (exploring || !driving) return null;

  return <div className="fixed inset-0 z-[60] pointer-events-none text-white" role="region" aria-label="Experiencia en carretera">
    <div className="drive-orbit absolute inset-0 pointer-events-auto touch-none"
      tabIndex={0} role="group" aria-label="Vista 360 grados: arrastra para girar, usa scroll para acercar o las flechas del teclado para cambiar la vista"
      onPointerDown={e=>{drag.current={active:true,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{
        if(!drag.current.active || cabin || performance.now()<runtime.nitroUntil)return;
        driveCamera.targetYaw -= (e.clientX-drag.current.x)*0.007;
        driveCamera.targetPitch = Math.max(0.04,Math.min(0.65,driveCamera.targetPitch+(e.clientY-drag.current.y)*0.004));
        drag.current.x=e.clientX;drag.current.y=e.clientY;
      }}
      onPointerUp={()=>{drag.current.active=false;}}
      onPointerCancel={()=>{drag.current.active=false;}}
      onWheel={e=>{if(!cabin)driveCamera.targetRadius=Math.max(6,Math.min(14,driveCamera.targetRadius+e.deltaY*0.006));}}
      onKeyDown={e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();driveCamera.targetYaw+=e.key==='ArrowLeft'?0.25:-0.25;}
        if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();driveCamera.targetPitch=Math.max(0.04,Math.min(0.65,driveCamera.targetPitch+(e.key==='ArrowUp'?0.08:-0.08)));}
      }}
    />
    <div className="drive-heading absolute left-5 top-5 right-36">
      <h2 className="font-display text-xl sm:text-3xl font-bold">AERION · On the road</h2>
      <p className="mt-1 text-sm">{cabin ? "Cabina sin volante" : "Gran turismo"} · {autonomous ? "Piloto IA" : "En espera"} · simulación 3D</p>
      <p className="mt-2 text-xs text-white/85">Arrastra para girar 360° · scroll para acercar</p>
      {!environmentReady&&<p role="status" className="mt-2 text-xs">Cargando entorno 3D…</p>}
    </div>
    <button autoFocus className="absolute right-5 top-5 pointer-events-auto border border-white/50 bg-black/75 px-4 py-3" onClick={close}>Volver a la web</button>
    <div className={`drive-panel drive-controls pointer-events-auto absolute bottom-5 left-5 right-5 sm:right-auto ${cabin?"is-cabin":""} ${engineView?"is-engine":""}`}>
      <div className="flex items-baseline justify-between gap-5"><strong className="font-display text-3xl tabular-nums">{displaySpeed} <span className="text-base">km/h</span></strong><button aria-pressed={paused} onClick={()=>{runtime.nitroUntil=0;useExperience.setState({engineView:false});setPaused(!paused);}}>{paused?'Continuar':'Pausar'}</button></div>
      {!cabin && <p className="mt-1 text-xs text-white/85">{engineView?"Motor eléctrico · inspección detenida":`Marcha ${gear} / 7 · Máx. ${peak} km/h`}</p>}
      {engineView && <div className="mt-3 text-sm leading-relaxed"><strong>AERION · Triax Vortech</strong><p>3 motores eléctricos de flujo axial · tracción integral con vectorización PulseVector.</p><dl className="engine-specs"><dt>Potencia / par</dt><dd>1.340 hp / 1.200 Nm</dd><dt>Arquitectura</dt><dd>800 V · inversor y cableado HV</dd><dt>Batería / refrigeración</dt><dd>IonVault 120 kWh · CryoLoop</dd><dt>0–100 / velocidad</dt><dd>2,1 s · 350 km/h de concepto</dd></dl><p className="text-xs text-white/70">Vista: dos motores traseros e inversor. Datos de diseño ficticios; 460 km/h y marchas corresponden al modo deportivo de simulación.</p></div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="drive-nitro" disabled={paused||engineView||cooldown>0||busy} onClick={()=>void nitro()}>{boostSeconds>0?'NITRO · '+boostSeconds+'s':cooldown>0?'Recarga · '+cooldown+'s':'Nitro'}</button>
        <button onClick={()=>{if(engineView)inspectEngine();else useExperience.setState({cabinView:!cabin,engineView:false});}}>{engineView?'Cerrar motor':cabin?'Exterior':'Cabina IA'}</button>
        <button aria-expanded={expanded} aria-controls="drive-settings" onClick={()=>setExpanded(!expanded)}>{expanded?'Cerrar ajustes':'Ajustes'}</button>
      </div>
      {expanded && <div id="drive-settings">
      <button className="mt-3 w-full" disabled={busy} aria-pressed={audio} onClick={()=>void toggleMotor()}>{busy?'Iniciando…':audio?'Silenciar motor':'Activar motor'}</button>
      <p role="status" className="mt-2 text-xs leading-relaxed text-white/85">{error || (boostSeconds>0?(cabin?'Impulso activo · vista de cabina':'Impulso activo · cámara de escapes'):audio?paused?'Motor en ralentí · música solo en la web':'Motor y ambiente de conducción · sin música':'Activa el motor para escuchar la conducción.')}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Vistas del carro">
        <label>Vista <select aria-label="Vista exterior" defaultValue="" onChange={e=>{view(Number(e.target.value));}}><option value="" disabled>Elegir ángulo</option><option value="0.1">Frente</option><option value="1.570796">Lateral</option><option value="2.741593">Trasera</option></select></label>
        <button aria-pressed={engineView} onClick={inspectEngine}>{engineView?'Cerrar motor':'Ver motor'}</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Direccionales y cambio de carril"><button disabled={paused||boostSeconds>0} onClick={()=>changeLane('left')}>← Izquierda</button><button disabled={paused||boostSeconds>0} onClick={()=>changeLane('right')}>Derecha →</button></div>
      <p role="status" className="mt-2 text-xs text-white/85">{maneuver}</p>
      <details className="mt-3">
        <summary className="cursor-pointer py-2 text-sm">Velocidad, sonido y color</summary>
        <div className="my-3 flex gap-2" role="group" aria-label="Tipo de motor">
          <button className={engineMode === "electric" ? "!border-ion !bg-ion/20" : ""} aria-pressed={engineMode === "electric"} onClick={()=>sonic.setEngineMode("electric")}>Eléctrico</button>
          <button className={engineMode === "race" ? "!border-ion !bg-ion/20" : ""} aria-pressed={engineMode === "race"} onClick={()=>sonic.setEngineMode("race")}>Carrera</button>
        </div>
        <p className="mb-3 text-xs text-white/85">{engineMode === "race" ? "Motor grabado / respuesta a velocidad y nitro" : "Motor eléctrico / sonido digital"}</p>
        <label htmlFor="drive-speed">Velocidad · {speed} km/h</label><input id="drive-speed" type="range" min="20" max="420" step="10" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/>
        <label htmlFor="drive-volume">Volumen del motor · {volume}%</label><input id="drive-volume" type="range" min="0" max="100" value={volume} onChange={e=>sonic.setVolume(Number(e.target.value)/100)}/>
        <div className="my-3 flex flex-wrap gap-2" role="group" aria-label="Color del carro">{PAINTS.map(p=><button key={p.id} aria-label={p.name} aria-pressed={paint===p.id} onClick={()=>useExperience.getState().setConfig({paint:p.id})} style={{background:p.hex,outline:paint===p.id?'2px solid #fff':undefined,minHeight:32,width:32,padding:0}}/>)}</div>
      </details>
      <p className="mt-2 text-[11px] leading-relaxed text-white/70">Nitro y escapes ficticios para esta experiencia.</p>
      </div>}
    </div>
  </div>;
}
