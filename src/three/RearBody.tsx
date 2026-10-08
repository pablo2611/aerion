import { useEffect, useMemo } from "react";
import * as THREE from "three";

function rearGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.02, .20); shape.lineTo(1.02, .20);
  shape.quadraticCurveTo(1.08,.20,1.06,.28); shape.lineTo(.98,.52);
  shape.quadraticCurveTo(.95,.67,.85,.67); shape.lineTo(-.85,.67);
  shape.quadraticCurveTo(-.95,.67,-.98,.52); shape.lineTo(-1.06,.28);
  shape.quadraticCurveTo(-1.08,.20,-1.02,.20);
  for (const side of [-.70,.70]) {
    const hole = new THREE.Path(); hole.absellipse(side,.37,.16,.105,0,Math.PI*2,true,0); shape.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:16});
}

/** Continuous rear fascia with recessed outlets; nothing hangs below the undertray. */
export default function RearBody() {
  const geometry=useMemo(rearGeometry,[]);
  const plate=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=112;
    const c=canvas.getContext("2d")!;
    c.fillStyle="#10191e";c.fillRect(0,0,512,112);
    c.strokeStyle="#64767e";c.lineWidth=3;c.strokeRect(5,5,502,102);
    c.fillStyle="#d8e3e8";c.font="500 48px sans-serif";c.textAlign="center";c.fillText("A E R I O N",256,73);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  },[]);
  useEffect(()=>()=>{geometry.dispose();plate.dispose();},[geometry,plate]);
  return <group name="AERIONIntegratedRear">
    <mesh geometry={geometry} position={[-2.52,0,0]} rotation={[0,-Math.PI/2,0]} castShadow>
      <meshStandardMaterial color="#162126" roughness={.58} metalness={.28}/>
    </mesh>
    {/* Three shallow strakes join the undertray instead of protruding below it. */}
    {[-.38,0,.38].map(z=><mesh key={z} position={[-2.43,.245,z]} rotation={[0,0,-.12]}>
      <boxGeometry args={[.31,.065,.024]}/><meshStandardMaterial color="#0b1217" roughness={.65}/>
    </mesh>)}
    <mesh position={[-2.637,.49,0]} rotation={[0,-Math.PI/2,0]}>
      <planeGeometry args={[.55,.12]}/><meshBasicMaterial map={plate} toneMapped={false}/>
    </mesh>
    {[-.40,.40].map(z=><mesh key={z} position={[-2.64,.36,z]}>
      <boxGeometry args={[.012,.018,.11]}/><meshStandardMaterial color="#6b0b13" emissive="#d4172a" emissiveIntensity={.5} roughness={.4}/>
    </mesh>)}
  </group>;
}
