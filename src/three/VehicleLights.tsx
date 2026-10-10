import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";
import { SIGNATURES } from "../data/content";

export default function VehicleLights() {
  const beams = useRef<THREE.Group>(null);
  const signature = useExperience(s => s.config.signature);
  const color = SIGNATURES.find(s => s.id === signature)?.hex ?? "#5fe8ff";
  useFrame(() => {
    const on = useExperience.getState().headlightsOn;
    if (beams.current) beams.current.visible = on && (runtime.driving || runtime.chapter === 6) && !runtime.cabin;
  });
  return <>
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
  </>;
}
