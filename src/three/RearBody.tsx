import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useExperience } from "../store";
import { PAINTS } from "../data/content";

function rearGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.02, .20); shape.lineTo(1.02, .20);
  shape.quadraticCurveTo(1.08,.20,1.06,.28); shape.lineTo(.98,.52);
  shape.quadraticCurveTo(.95,.61,.85,.61); shape.lineTo(-.85,.61);
  shape.quadraticCurveTo(-.95,.61,-.98,.52); shape.lineTo(-1.06,.28);
  shape.quadraticCurveTo(-1.08,.20,-1.02,.20);
  for (const side of [-.70,.70]) {
    const hole = new THREE.Path(); hole.absellipse(side,.37,.16,.105,0,Math.PI*2,true,0); shape.holes.push(hole);
  }
  const g=new THREE.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.022,bevelThickness:.012,curveSegments:24});
  const p=g.getAttribute("position");for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-.18*(p.getX(i)/1.08)**2);g.computeVertexNormals();return g;
}

/** Continuous rear fascia with recessed outlets; nothing hangs below the undertray. */
export default function RearBody() {
  const geometry=useMemo(rearGeometry,[]);
  const paint=useExperience(s=>s.config.paint);
  const color=PAINTS.find(p=>p.id===paint)?.hex ?? "#101c24";
  const shoulder=useMemo(()=>{
    const shape=new THREE.Shape();shape.moveTo(-1.13,.53);shape.quadraticCurveTo(-1.20,.70,-1.03,.74);shape.quadraticCurveTo(0,.64,1.03,.74);shape.quadraticCurveTo(1.20,.70,1.13,.53);shape.quadraticCurveTo(0,.59,-1.13,.53);
    const g=new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:3,curveSegments:28});const p=g.getAttribute("position");for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-.20*(p.getX(i)/1.15)**2);g.computeVertexNormals();return g;
  },[]);
  const plate=useMemo(()=>{
    const canvas=document.createElement("canvas");canvas.width=512;canvas.height=112;
    const c=canvas.getContext("2d")!;
    c.fillStyle="#10191e";c.fillRect(0,0,512,112);
    c.fillStyle="#d8e3e8";c.font="500 48px sans-serif";c.textAlign="center";c.fillText("A E R I O N",256,73);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  },[]);
  useEffect(()=>()=>{geometry.dispose();shoulder.dispose();plate.dispose();},[geometry,shoulder,plate]);
  return <group name="AERIONIntegratedRear">
    <mesh geometry={geometry} position={[-2.57,0,0]} rotation={[0,-Math.PI/2,0]} castShadow>
      <meshStandardMaterial color="#10191d" roughness={.63} metalness={.22}/>
    </mesh>
    <mesh geometry={shoulder} position={[-2.60,0,0]} rotation={[0,-Math.PI/2,0]} castShadow><meshStandardMaterial color={color} roughness={.43} metalness={.6}/></mesh>
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
