import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";
import { advanceTelemetry } from "../telemetry";

/** One instanced draw call for moving roadside reflectors. */
export default function Road() {
  const group = useRef<THREE.Group>(null);
  const posts = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(),[]);
  const distance = useRef(0);
  const hills = useMemo(() => Array.from({length:18},(_,i) => ({x:(i%9)*12-48,z:i<9?-18:18,y:3+(i*7%5),scale:6+(i*3%7)})),[]);
  useFrame((_,delta) => {
    if (!group.current) return;
    group.current.visible = runtime.driving;
    if (!runtime.driving) return;
    const dt = Math.min(delta,0.05);
    const boosting = performance.now() < runtime.nitroUntil;
    const state = useExperience.getState();
    const target = state.drivingPaused || runtime.telemetry.battery <= 0 ? 0 : boosting ? Math.min(state.cruiseSpeed + 85, 260) : state.cruiseSpeed;
    runtime.speed = THREE.MathUtils.damp(runtime.speed,target,boosting ? 2.2 : 1.5,dt);
    if (target === 0 && runtime.speed < 0.3) runtime.speed = 0;
    advanceTelemetry(dt, runtime.speed, boosting);
    if (!runtime.reduced) distance.current += runtime.speed / 3.6 * dt;
    if(posts.current) {
      for(let i=0;i<32;i++) {
        object.position.set(((i%16)*8 - distance.current%8)-56,0.6,i<16?-5.1:5.1);
        object.scale.set(0.12,1.2,0.12);
        object.updateMatrix(); posts.current.setMatrixAt(i,object.matrix);
      }
      posts.current.instanceMatrix.needsUpdate=true;
    }
  });
  return <group ref={group} visible={false}>
    <instancedMesh ref={posts} args={[undefined,undefined,32]} frustumCulled={false}>
      <boxGeometry/><meshStandardMaterial color="#d4d9d3" roughness={0.6} emissive="#5fe8ff" emissiveIntensity={0.15}/>
    </instancedMesh>
    {[-5.3,5.3].map(z => <mesh key={z} position={[0,0.62,z]}><boxGeometry args={[140,0.14,0.1]}/><meshStandardMaterial color="#8599a1" metalness={0.75} roughness={0.35}/></mesh>)}
    {hills.map((h,i) => <mesh key={i} position={[h.x,h.y*0.25,h.z]} scale={[h.scale,h.y,h.scale]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={i%2?'#31474b':'#25383d'} roughness={1}/></mesh>)}
    <mesh position={[36,15,-32]}><sphereGeometry args={[2.8,24,16]}/><meshBasicMaterial color="#ffd4a3"/></mesh>
  </group>;
}
