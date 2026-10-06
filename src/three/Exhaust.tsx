import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "../store";

/** Volumetric, animated sport flames; this package is fictional. */
export default function Exhaust() {
  const pipes = useRef<THREE.Group>(null);
  const flames = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
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
  useFrame((state) => {
    if(pipes.current)pipes.current.visible=runtime.driving;
    const remaining=runtime.nitroUntil-performance.now();
    const active=runtime.driving&&remaining>0;
    if(flames.current)flames.current.visible=active;
    if(!active)return;
    if(material.current)material.current.opacity=0.8*Math.min(1,remaining/450);
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
    <group ref={pipes} visible={false}>
      {[-0.62,0.62].map(z=><group key={z} position={[-2.58,0.3,z]}>
        <mesh rotation={[0,0,Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.13,0.13,0.38,20,1,true]}/>
          <meshStandardMaterial color="#657681" metalness={0.8} roughness={0.4} side={THREE.DoubleSide}/>
        </mesh>
        <mesh position={[-0.14,0,0]} rotation={[0,Math.PI/2,0]}>
          <circleGeometry args={[0.105,20]}/><meshStandardMaterial color="#090b10" side={THREE.DoubleSide}/>
        </mesh>
      </group>)}
    </group>
    <group ref={flames} visible={false}>
      {[-0.62,0.62].map(z=><group key={z} position={[-3.4,0.3,z]}>
        <mesh geometry={heat.geometry} rotation={[0,0,Math.PI/2]} renderOrder={5}>
          <meshBasicMaterial ref={z<0?material:undefined} vertexColors transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/>
        </mesh>
        <mesh geometry={heat.geometry} rotation={[0,0,Math.PI/2]} scale={[0.45,0.95,0.45]} renderOrder={6}>
          <meshBasicMaterial vertexColors transparent opacity={0.95} depthWrite={false} side={THREE.DoubleSide} toneMapped={false}/>
        </mesh>
      </group>)}
      <pointLight position={[-3,0.45,0]} color="#ff7d29" intensity={0.65} distance={3}/>
    </group>
  </>;
}
