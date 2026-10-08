import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";
import { SIGNATURES } from "../data/content";

export default function VehicleLights() {
  const beams = useRef<THREE.Group>(null);
  const lights = useRef<THREE.Group>(null);
  const signature = useExperience(s => s.config.signature);
  const color = SIGNATURES.find(s => s.id === signature)?.hex ?? "#5fe8ff";
  const targets = useMemo(() => [-0.68, 0.68].map(z => {
    const target = new THREE.Object3D(); target.position.set(11,0,z*2); return target;
  }), []);
  useFrame(() => {
    const on = useExperience.getState().headlightsOn;
    if (beams.current) beams.current.visible = on && (runtime.driving || runtime.chapter === 6) && !runtime.cabin;
    if (lights.current) lights.current.visible = on;
  });
  return <>
    <group ref={lights}>
      {targets.map((target,i) => <group key={i}>
        <primitive object={target}/>
        <spotLight position={[2.28,0.67,i?0.68:-0.68]} target={target} color={color} intensity={6} distance={15} angle={0.23} penumbra={0.7} decay={2}/>
      </group>)}
    </group>
    <group ref={beams} visible={false}>
      {[-0.68,0.68].map(z => <mesh key={z} position={[5.2,0.025,z*1.5]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[5.8,1.7]}/>
        <shaderMaterial transparent depthWrite={false} uniforms={{color:{value:new THREE.Color(color)}}}
          vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
          fragmentShader="varying vec2 vUv; uniform vec3 color; void main(){float a=pow(1.-vUv.x,1.5)*(1.-smoothstep(0.,.5,abs(vUv.y-.5)))*smoothstep(0.,.1,vUv.x);gl_FragColor=vec4(color,a*.12);}"/>
      </mesh>)}
    </group>
    {/* Recessed perception sensors and rear diffuser fins add readable exterior detail. */}
    {[-0.79,0.79].map(z => <mesh key={z} position={[2.37,0.47,z]} rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[0.035,0.035,0.018,12]}/><meshStandardMaterial color="#071419" metalness={0.5} roughness={0.24}/>
    </mesh>)}
    {[-0.72,-0.36,0,0.36,0.72].map(z => <mesh key={z} position={[-2.39,0.22,z]} rotation={[0,0,-0.08]}>
      <boxGeometry args={[0.37,0.16,0.02]}/><meshStandardMaterial color="#172126" roughness={0.62} metalness={0.3}/>
    </mesh>)}
  </>;
}
