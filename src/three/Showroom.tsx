import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useExperience } from "../store";

/** A lightweight architectural set, shared by the explorer and configurator. */
export default function Showroom() {
  const room = useRef<THREE.Group>(null);
  useFrame(() => {
    if (room.current) room.current.visible = !runtime.driving && (useExperience.getState().exploreOpen || runtime.chapter === 0 || runtime.chapter === 7);
  });
  return <group ref={room} visible={false}>
    <mesh position={[0, -0.045, 0]} receiveShadow>
      <boxGeometry args={[32, 0.12, 32]} />
      <meshStandardMaterial color="#aaa99f" roughness={0.94} metalness={0} />
    </mesh>
    <mesh position={[0, 3.3, -15]} receiveShadow>
      <boxGeometry args={[32, 6.6, 0.3]} /><meshStandardMaterial color="#c4c3b8" roughness={1} />
    </mesh>
    <mesh position={[0, 6.55, 0]}>
      <boxGeometry args={[32, 0.18, 32]} /><meshStandardMaterial color="#b4b4aa" roughness={1} />
    </mesh>
    {[-15, 15].map(x => <group key={x}>
      <mesh position={[x, 2.8, 0]}>
        <boxGeometry args={[0.16, 5.6, 30]} /><meshStandardMaterial color="#a8bdc1" roughness={0.8} metalness={0.05} />
      </mesh>
      {[-12, -6, 0, 6, 12].map(z => <mesh key={z} position={[x * 0.99, 3.2, z]}>
        <boxGeometry args={[0.24, 6.4, 0.15]} /><meshStandardMaterial color="#454d4c" roughness={0.85} />
      </mesh>)}
      <mesh position={[x * 0.985, 2.6, 0]}>
        <boxGeometry args={[0.12, 0.1, 30]} /><meshStandardMaterial color="#454d4c" roughness={0.85} />
      </mesh>
    </group>)}
    {[-7, 7].map(x => <mesh key={x} position={[x, 3.3, -8]} castShadow receiveShadow>
      <boxGeometry args={[0.45, 6.6, 0.45]} /><meshStandardMaterial color="#858b85" roughness={0.9} />
    </mesh>)}
    {[-5.5, 5.5].map(x => <mesh key={x} position={[x, 6.42, 0]}>
      <boxGeometry args={[0.7, 0.035, 15]} /><meshStandardMaterial color="#d4d6ce" roughness={1} />
    </mesh>)}
    <mesh position={[-5.7, 0.42, -6.8]}>
      <boxGeometry args={[4.6, 0.84, 1]} /><meshStandardMaterial color="#565e59" roughness={0.88} />
    </mesh>
    <mesh position={[-5.7, 0.87, -6.8]}>
      <boxGeometry args={[4.8, 0.08, 1.1]} /><meshStandardMaterial color="#bfb6a3" roughness={0.9} />
    </mesh>
    {[-4, 4].map(z => <mesh key={z} position={[0, 0.019, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[22, 0.012]} /><meshBasicMaterial color="#83867e" />
    </mesh>)}
  </group>;
}
