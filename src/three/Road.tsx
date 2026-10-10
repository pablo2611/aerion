import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";
import { advanceTelemetry } from "../telemetry";
import { drivetrainAt, nextRoadSpeed } from "../drivetrain";
import RoadLandscape from "./RoadLandscape";
import RoadTraffic from "./RoadTraffic";

/** One instanced draw call for moving roadside reflectors. */
export default function Road() {
  const group = useRef<THREE.Group>(null);
  const posts = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(),[]);
  const distance = useRef(0);
  useFrame((_,delta) => {
    if (!group.current) return;
    group.current.visible = runtime.driving;
    if (!runtime.driving) return;
    const dt = Math.min(delta,0.05);
    const boosting = performance.now() < runtime.nitroUntil;
    const state = useExperience.getState();
    if(!state.drivingPaused)runtime.lane=THREE.MathUtils.damp(runtime.lane,runtime.targetLane,1.1,dt);
    if(Math.abs(runtime.lane-runtime.targetLane)<.03)runtime.turn='off';
    group.current.position.z=-runtime.lane;
    const target = state.drivingPaused || state.engineView || runtime.telemetry.battery <= 0 ? 0 : boosting ? 460 : state.cruiseSpeed;
    runtime.speed = nextRoadSpeed(runtime.speed,target,dt,boosting);
    runtime.peakSpeed=Math.max(runtime.peakSpeed,runtime.speed);
    const drive=drivetrainAt(runtime.speed);
    if(drive.gear!==runtime.gear)runtime.shiftUntil=performance.now()+220;
    runtime.gear=drive.gear;runtime.rpm=drive.rpm;
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
  return <group ref={group} name="AERIONRoad" visible={false}>
    <instancedMesh ref={posts} args={[undefined,undefined,32]} frustumCulled={false}>
      <boxGeometry/><meshStandardMaterial color="#d4d9d3" roughness={0.6} emissive="#5fe8ff" emissiveIntensity={0.15}/>
    </instancedMesh>
    {[-5.3,5.3].map(z => <mesh key={z} position={[0,0.62,z]}><boxGeometry args={[140,0.14,0.1]}/><meshStandardMaterial color="#8599a1" metalness={0.75} roughness={0.35}/></mesh>)}
    <Suspense fallback={null}><RoadLandscape/></Suspense>
    <RoadTraffic/>
  </group>;
}
