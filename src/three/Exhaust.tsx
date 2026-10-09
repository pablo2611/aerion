import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "../store";

/** Volumetric, animated sport flames; this package is fictional. */
export default function Exhaust() {
  const flames = useRef<THREE.Group>(null);
  const outer = useMemo(()=>new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),[]);
  const inner = useMemo(()=>outer.clone(),[outer]);
  const heat = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.16,1.3,24,12,true);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
    const colors = new Float32Array(position.count * 3);
    const blue = new THREE.Color("#2aafff"), orange = new THREE.Color("#ff5b0a"), yellow = new THREE.Color("#ffd64b");
    const color = new THREE.Color();
    for(let i=0;i<position.count;i++){
      const tail=uv.getY(i);
      color.copy(blue).lerp(orange,Math.min(1,tail*4)).lerp(yellow,Math.max(0,(tail-0.35)*0.7));
      color.toArray(colors,i*3);
    }
    geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
    return {geometry,original:new Float32Array(position.array)};
  },[]);
  useEffect(()=>()=>{heat.geometry.dispose();outer.dispose();inner.dispose();},[heat,outer,inner]);
  useFrame((state) => {
    const remaining=runtime.nitroUntil-performance.now();
    const active=runtime.driving&&remaining>0;
    if(flames.current)flames.current.visible=active;
    if(!active)return;
    const fade=Math.min(1,remaining/450);
    outer.opacity=.72*fade; inner.opacity=.9*fade;
    const position=heat.geometry.getAttribute("position") as THREE.BufferAttribute;
    const time=runtime.reduced?0:state.clock.elapsedTime;
    for(let i=0;i<position.count;i++){
      const x=heat.original[i*3], y=heat.original[i*3+1], z=heat.original[i*3+2];
      const tail=(y+0.65)/1.3;
      const ripple=1+Math.sin(tail*21-time*24+i*0.11)*0.17*tail;
      position.setXYZ(i,x*ripple+Math.sin(time*18+tail*20)*0.025*tail,y,z*ripple);
    }
    position.needsUpdate=true;
  });
  return <>
    <group>
      {[-0.70,0.70].map(z=><group key={z} position={[-2.615,0.37,z]}>
        <mesh rotation={[0,0,Math.PI/2]} scale={[1,1,1.5]} castShadow>
          <cylinderGeometry args={[0.09,0.085,0.12,32,1,true]}/>
          <meshStandardMaterial color="#72828b" metalness={0.88} roughness={0.32} side={THREE.DoubleSide}/>
        </mesh>
        <mesh position={[0.035,0,0]} rotation={[0,Math.PI/2,0]} scale={[1.5,1,1]}>
          <circleGeometry args={[0.087,32]}/><meshStandardMaterial color="#040709" side={THREE.DoubleSide}/>
        </mesh>
        <mesh position={[-0.061,0,0]} rotation={[0,Math.PI/2,0]} scale={[1.5,1,1]}>
          <torusGeometry args={[0.091,0.006,8,32]}/><meshStandardMaterial color="#a4b0b4" metalness={.9} roughness={.25}/>
        </mesh>
      </group>)}
    </group>
    <group ref={flames} visible={false}>
      {[-0.70,0.70].map(z=><group key={z} position={[-3.30,0.37,z]}>
        <mesh geometry={heat.geometry} material={outer} rotation={[0,0,Math.PI/2]} scale={[.58,1,.88]} renderOrder={5}/>
        <mesh geometry={heat.geometry} material={inner} rotation={[0,0,Math.PI/2]} scale={[0.29,0.97,0.44]} renderOrder={6}/>
      </group>)}
      {/* Unlit flames keep the scene's light count stable: toggling a light
          here recompiles every lit car material on boost start and finish. */}
    </group>
  </>;
}
