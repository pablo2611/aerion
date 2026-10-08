import { useMemo } from "react";
import * as THREE from "three";
import { useExperience } from "../store";

function Cable({points}:{points:[number,number,number][]}){
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
  return <mesh><tubeGeometry args={[curve,16,.018,6,false]}/><meshStandardMaterial color="#dd6528" roughness={.55}/></mesh>;
}
export default function EngineBay(){
  const visible=useExperience(s=>s.engineView && s.driving);
  return <group visible={visible} position={[-1.62,.81,0]} name="ElectricPowertrain">
    <mesh position={[0,-.10,0]}><boxGeometry args={[1.32,.07,1.58]}/><meshStandardMaterial color="#17232a" metalness={.5} roughness={.5}/></mesh>
    {[-.43,.43].map(z=><group key={z} position={[0,.16,z]}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.23,.23,.56,32]}/><meshStandardMaterial color="#77868e" metalness={.85} roughness={.32}/></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[0,0,(i-4)*.06]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.23,.013,5,24]}/><meshStandardMaterial color="#3f535c" metalness={.8} roughness={.38}/></mesh>)}
      <mesh position={[0,0,z>0?.30:-.30]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,.035,24]}/><meshStandardMaterial color="#a47042" metalness={.75} roughness={.35}/></mesh>
    </group>)}
    <mesh position={[.40,.18,0]}><boxGeometry args={[.32,.36,1.12]}/><meshStandardMaterial color="#394b54" metalness={.6} roughness={.42}/></mesh>
    {Array.from({length:12},(_,i)=><mesh key={i} position={[.4,.37,(i-5.5)*.075]}><boxGeometry args={[.30,.035,.022]}/><meshStandardMaterial color="#9da8ac" metalness={.8} roughness={.4}/></mesh>)}
    <Cable points={[[.48,.24,-.5],[.2,.42,-.65],[-.34,.38,-.43]]}/>
    <Cable points={[[.48,.24,.5],[.2,.42,.65],[-.34,.38,.43]]}/>
    {[-.63,.63].map(z=><mesh key={z} position={[0,-.04,z]}><boxGeometry args={[1.27,.12,.07]}/><meshStandardMaterial color="#819095" metalness={.8} roughness={.35}/></mesh>)}
  </group>;
}
