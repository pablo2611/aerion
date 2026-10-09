import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime, useExperience } from '../store';
import { roadActors, advanceActor } from '../traffic';

/** Lightweight traffic and radar share the same positions and IDs. */
export default function RoadTraffic() {
  const groups=useRef<(THREE.Group|null)[]>([]);
  useFrame((_,delta)=>{
    if(!runtime.driving)return;
    roadActors.forEach((actor,i)=>{
      if(!useExperience.getState().drivingPaused)advanceActor(actor,runtime.speed,delta);
      if(actor.x<14&&actor.x>-10&&Math.abs(actor.lane-runtime.lane)<2.2)actor.lane=runtime.lane<=0?3.2:-3.2;
      groups.current[i]?.position.set(actor.x,0,actor.lane);
    });
  });
  return <group>{roadActors.map((actor,i)=><group key={actor.id} ref={node=>{groups.current[i]=node;}} position={[actor.x,0,actor.lane]}>
    <mesh position={[0,.55,0]}><boxGeometry args={actor.kind==='car'?[4,.65,1.75]:[1.65,.35,.45]}/><meshStandardMaterial color={actor.color} roughness={.4} metalness={.45}/></mesh>
    {actor.kind==='car'?<mesh position={[-.2,1.04,0]}><boxGeometry args={[2.1,.6,1.48]}/><meshStandardMaterial color="#20343f" roughness={.2} metalness={.3}/></mesh>:<group>
      <mesh position={[-.12,1.04,0]} rotation={[0,0,-.28]}><capsuleGeometry args={[.17,.32,4,8]}/><meshStandardMaterial color="#1a2735"/></mesh>
      <mesh position={[.02,1.48,0]}><sphereGeometry args={[.19,12,8]}/><meshStandardMaterial color="#c6d3db" metalness={.5} roughness={.35}/></mesh>
      <mesh position={[.1,1.48,.10]}><boxGeometry args={[.24,.08,.2]}/><meshStandardMaterial color="#14212b" roughness={.2}/></mesh>
      <mesh position={[.50,.94,0]} rotation={[0,0,.2]}><boxGeometry args={[.1,.08,.62]}/><meshStandardMaterial color="#829098" metalness={.7}/></mesh>
    </group>}
    {(actor.kind==='car'?[-1.3,1.3]:[-.68,.68]).flatMap(x=>(actor.kind==='car'?[-.82,.82]:[0]).map(z=><mesh key={`${x}:${z}`} position={[x,.34,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.34,.34,.16,12]}/><meshStandardMaterial color="#101418" roughness={.9}/></mesh>))}
    {(actor.kind==='car'?[-.64,.64]:[0]).map(z=><mesh key={z} position={[actor.kind==='car'?-2.01:-.84,.65,z]}><boxGeometry args={[.03,.13,actor.kind==='car'?.32:.16]}/><meshBasicMaterial color="#ff423e" toneMapped={false}/></mesh>)}
  </group>)}</group>;
}
