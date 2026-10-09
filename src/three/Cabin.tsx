import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";
import { SIGNATURES } from "../data/content";
import { readTelemetry } from "../telemetry";
import { Html } from "@react-three/drei";
import CabinAssistant from "../sections/CabinAssistant";
import { detectedActors } from '../traffic';

function screenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 384;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { canvas, texture, ctx: canvas.getContext("2d")! };
}

/** Physical displays live inside the model; the cabin has no steering hardware. */
export default function Cabin() {
  const display = useMemo(screenTexture, []);
  const ambient = useRef<THREE.MeshBasicMaterial>(null);
  const clock = useRef(-1);
  const signature = useExperience(s => s.config.signature);
  const cabin=useExperience(s=>s.cabinView && (s.driving||s.exploreOpen));
  const narrow=useThree(s=>s.size.width<768);
  const htmlPortal=useMemo(()=>{
    const layer=document.createElement('div');
    layer.id='aerion-cabin-screen-layer';
    Object.assign(layer.style,{position:'fixed',inset:'0',pointerEvents:'none',zIndex:'66'});
    return {current:layer};
  },[]);
  useEffect(()=>{
    document.body.appendChild(htmlPortal.current);
    return()=>htmlPortal.current.remove();
  },[htmlPortal]);
  const color = SIGNATURES.find(s => s.id === signature)?.hex ?? "#5fe8ff";
  useEffect(() => () => display.texture.dispose(), [display]);

  useFrame(({ clock: sceneClock }) => {
    const state = useExperience.getState();
    const telemetry = readTelemetry();
    const time = sceneClock.elapsedTime;
    const rate = runtime.cabin ? 0.12 : 0.6;
    if (time - clock.current < rate) return;
    clock.current = time;
    const c = display.ctx;
    c.fillStyle = "#07131c"; c.fillRect(0, 0, 1024, 384);
    c.fillStyle = color; c.font = "600 22px sans-serif"; c.fillText("AERION", 34, 44);
    c.fillStyle = "#edf7fa"; c.font = "500 98px sans-serif";
    c.fillText(String(telemetry.speed).padStart(2, "0"), 32, 158);
    c.font = "20px sans-serif"; c.fillStyle = "#a9c4cf"; c.fillText("km/h", 40, 192);
    c.fillStyle = telemetry.autonomous ? color : "#e7bb86";
    c.font = "600 21px sans-serif"; c.fillText(telemetry.autonomous ? "PILOTO IA" : "EN ESPERA", 34, 261);
    c.fillStyle = "#b4cbd4"; c.font = "18px sans-serif";
    c.fillText(`${telemetry.gear} / ${telemetry.rpm} RPM`, 34, 299);
    c.fillText(`BATERIA ${telemetry.battery}%`, 34, 347);
    // Perspective lane geometry, moving relative to the vehicle's simulated speed.
    c.save(); c.beginPath(); c.rect(320, 55, 255, 285); c.clip();
    c.fillStyle = "#102a36"; c.beginPath(); c.moveTo(468, 60); c.lineTo(508, 60); c.lineTo(625, 345); c.lineTo(350, 345); c.fill();
    c.strokeStyle = state.autonomous ? color : "#617d89"; c.lineWidth = 3;
    [0, 1].forEach(side => { c.beginPath(); c.moveTo(470 + side * 36, 60); c.lineTo(355 + side * 260, 345); c.stroke(); });
    const shift = runtime.reduced ? 0 : runtime.telemetry.distanceKm * 9;
    c.strokeStyle = "#b9d2da"; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const d = ((i / 7 + shift) % 1) ** 2;
      const y = 60 + d * 280;
      c.beginPath(); c.moveTo(488, y); c.lineTo(488, y + 5 + d * 24); c.stroke();
    }
    c.fillStyle = color; c.fillRect(464, 238, 48, 74);
    c.fillStyle = "#16313b"; c.fillRect(470, 249, 36, 25);
    const detected=detectedActors(runtime.lane);
    for(const actor of detected){
      const depth=1-actor.x/100;
      const y=70+depth*155;
      const x=488-actor.relativeLane*(9+depth*10);
      const w=actor.kind==='car'?16+depth*14:9+depth*7;
      c.fillStyle=actor.kind==='car'?'#a9c8da':'#ffb265';c.fillRect(x-w/2,y,w,w*1.6);
      c.strokeStyle='#5fe8ff';c.lineWidth=1;c.strokeRect(x-w/2-4,y-4,w+8,w*1.6+8);
      c.font='12px sans-serif';c.fillText(`${actor.id} ${Math.round(actor.x)}m`,x-w/2-4,y-9);
    }
    if(runtime.turn!=='off'&&Math.floor(time*2)%2===0){c.fillStyle='#ffb347';c.font='bold 30px sans-serif';c.fillText(runtime.turn==='left'?'←':'→',runtime.turn==='left'?365:548,290);}
    c.restore();
    c.font='14px sans-serif';c.fillStyle='#9dbcc8';c.fillText(`${detected.length} OBJETOS · SIMULACIÓN`,325,375);
    c.fillStyle = "#abc7d2"; c.font = "17px sans-serif"; c.fillText(`MOTOR ${telemetry.motorTemp} °C`, 325, 348);
    // The assistant remains visible on the physical screen from outside too.
    if(!runtime.cabin){
      c.fillStyle='#102731';c.fillRect(600,20,400,340);
      c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(795,125,46,0,Math.PI*2);c.stroke();
      c.fillStyle=color;
      for(let i=0;i<9;i++){const h=12+Math.sin(time*2+i*.8)*9;c.fillRect(762+i*8,125-h/2,3,h);}
      c.fillStyle='#edf7fa';c.font='600 25px sans-serif';c.fillText('AERION IA',726,210);
      c.font='18px sans-serif';c.fillStyle='#b4cbd4';c.fillText('Tu asistente de conducción',676,247);
      c.font='16px sans-serif';c.fillText('Entra a Cabina IA para hablar',680,298);
    }
    display.texture.needsUpdate = true;
    if (ambient.current) ambient.current.opacity = 0.2 + runtime.lightState.ambient * 0.65;
  });

  return <group name="AERIONAutonomousCabin">
    {/* Panoramic instrument screen, facing the passengers (-X). */}
    <mesh position={[1.42,0.79,0]}><boxGeometry args={[0.4,0.48,1.79]}/><meshStandardMaterial color="#19282e" roughness={0.84} metalness={0.08}/></mesh>
    <group position={[1.12, 0.93, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.032]}><boxGeometry args={[1.60, 0.65, 0.048]}/><meshStandardMaterial color="#0c151c" metalness={0.35} roughness={0.48}/></mesh>
      <mesh><planeGeometry args={[1.52, 0.57]}/><meshBasicMaterial map={display.texture} toneMapped={false}/></mesh>
      {cabin && <Html transform portal={htmlPortal} position={[narrow?0:.43,0,.008]} distanceFactor={narrow?1.8:.8} zIndexRange={[66,65]} style={{width:320}}><CabinAssistant/></Html>}
    </group>
    {/* Low floating console leaves a clear lounge-like space in front of the seats. */}
    <group position={[0.69, 0.60, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      <mesh position={[0,0,-0.026]}><boxGeometry args={[0.48,0.62,0.055]}/><meshStandardMaterial color="#17232b" metalness={0.35} roughness={0.5}/></mesh>
      <mesh><planeGeometry args={[0.44,0.55]}/><meshStandardMaterial color="#071d28" emissive={color} emissiveIntensity={0.12} roughness={0.42}/></mesh>
    </group>
    {[-0.79, 0.79].map(z => <group key={z}>
      <mesh position={[0.15,0.63,z]}><boxGeometry args={[1.72,0.009,0.014]}/><meshBasicMaterial ref={z<0?ambient:undefined} color={color} transparent opacity={0.7} toneMapped={false}/></mesh>
      <mesh position={[0.16,0.32,z*0.75]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.2,0.19]}/><meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false}/></mesh>
    </group>)}
    <mesh position={[1.20,0.585,0]}><boxGeometry args={[0.018,0.007,1.56]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
  </group>;
}
