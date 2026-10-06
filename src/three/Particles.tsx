import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { runtime, PARTICLE_COUNT, useExperience } from "../store";
import { AERO, ENERGY, HOLO, RADAR, GLOW } from "./shaders";

const { damp } = THREE.MathUtils;
const win = (t: number) => Math.min(1, Math.max(0, THREE.MathUtils.smoothstep(t, 0.06, 0.28) * (1 - THREE.MathUtils.smoothstep(t, 0.8, 0.98))));

/* --------------------------- airflow -------------------------------- */

export function AirFlow() {
  const quality = runtime.quality;
  const count = PARTICLE_COUNT[quality];
  const mat = useRef<THREE.ShaderMaterial>(null);
  const active = useRef(0);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3); // unused placeholder, positions computed in shader
    const seed = new Float32Array(count);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random();
      rand[i * 4] = Math.random();
      rand[i * 4 + 1] = Math.random();
      rand[i * 4 + 2] = Math.random();
      rand[i * 4 + 3] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 12);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActive: { value: 0 },
      uDrive: { value: 0 },
      uColor: { value: new THREE.Color("#5fe8ff") },
    }),
    []
  );

  useFrame((_, dt) => {
    const target = runtime.driving ? 0.24 * Math.min(runtime.speed/80,1) : runtime.chapter === 1 ? win(runtime.local) : 0;
    active.current = damp(active.current, target, 3, Math.min(dt, 0.05));
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt * (runtime.reduced ? 0.15 : 1);
      mat.current.uniforms.uActive.value = active.current;
      mat.current.uniforms.uDrive.value = runtime.driving ? 1 : 0;
    }
  });

  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={mat}
        vertexShader={AERO.vertex}
        fragmentShader={AERO.fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------- energy flow ----------------------------- */

export function EnergyFlow() {
  const count = runtime.quality === "LOW" ? 160 : 320;
  const mat = useRef<THREE.ShaderMaterial>(null);
  const pylonMat = useRef<THREE.ShaderMaterial>(null);
  const beamMat = useRef<THREE.ShaderMaterial>(null);
  const pylon = useRef<THREE.Group>(null);
  const active = useRef(0);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const rand = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random();
      rand[i * 3] = Math.random();
      rand[i * 3 + 1] = Math.random();
      rand[i * 3 + 2] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.2, 0), 4);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uActive: { value: 0 }, uColor: { value: new THREE.Color("#5fe8ff") } }),
    []
  );

  useFrame((_, dt) => {
    const target = runtime.chapter === 3 ? win(runtime.local) : 0;
    active.current = damp(active.current, target, 3, Math.min(dt, 0.05));
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt * (runtime.reduced ? 0.2 : 1);
      mat.current.uniforms.uActive.value = active.current;
    }
    if (pylonMat.current) pylonMat.current.uniforms.uOpacity.value = active.current * 0.9;
    if (beamMat.current) beamMat.current.uniforms.uOpacity.value = active.current * 0.5;
    if (pylon.current) pylon.current.visible = active.current > 0.02;
  });

  return (
    <group>
      <points geometry={geo}>
        <shaderMaterial
          ref={mat}
          vertexShader={ENERGY.vertex}
          fragmentShader={ENERGY.fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* charge pylon */}
      <group ref={pylon} position={[4.6, 0, -1.4]} visible={false}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.09, 1.7, 0.09]} />
          <meshStandardMaterial color="#10141a" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.14]} />
          <meshStandardMaterial color="#05070a" emissive="#5fe8ff" emissiveIntensity={2.2} />
        </mesh>
      </group>
      {/* energy line: pylon → pack */}
      <mesh position={[3.35, 0.2, -0.72]} rotation={[0, Math.atan2(0.72, 3.3), -Math.PI / 2]} visible={true}>
        <planeGeometry args={[3.3, 0.1]} />
        <shaderMaterial
          ref={beamMat}
          vertexShader={GLOW.vertex}
          fragmentShader={GLOW.fragment}
          uniforms={{ uColor: { value: new THREE.Color("#5fe8ff") }, uOpacity: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ----------------------- holo intelligence -------------------------- */

export function HoloField() {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const active = useRef(0);

  const holoMats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.ShaderMaterial({
            uniforms: { uColor: { value: new THREE.Color("#5fe8ff") }, uTime: { value: Math.random() * 10 }, uOpacity: { value: 0 } },
            vertexShader: HOLO.vertex,
            fragmentShader: HOLO.fragment,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          })
      ),
    []
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: "#5fe8ff", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    []
  );
  const radarMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color("#5fe8ff") }, uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: RADAR.vertex,
        fragmentShader: RADAR.fragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((_, dt) => {
    const target = runtime.chapter === 5 && useExperience.getState().aiAction === "autonomous" ? win(runtime.local) : 0;
    active.current = damp(active.current, target, 3, Math.min(dt, 0.05));
    const g = group.current;
    if (!g) return;
    g.visible = active.current > 0.01;
    if (!g.visible) return;
    const time = performance.now() / 1000;
    if (ringA.current) ringA.current.rotation.z = time * 0.25;
    if (ringB.current) ringB.current.rotation.z = -time * 0.18;
    ringMat.opacity = active.current * 0.4;
    holoMats.forEach((m, i) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uOpacity.value = active.current * 0.85;
      const mesh = g.children[i + 2] as THREE.Mesh;
      if (mesh) mesh.lookAt(0, mesh.position.y * 0.4, 0);
    });
    radarMat.uniforms.uTime.value = time;
    radarMat.uniforms.uOpacity.value = active.current;
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={ringA} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.3, 0.008, 8, 128]} />
        <primitive object={ringMat} attach="material" />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2.6, 0.2, 0]}>
        <torusGeometry args={[3.9, 0.005, 8, 128]} />
        <primitive object={ringMat} attach="material" />
      </mesh>
      <mesh position={[2.7, 2.1, -1.9]}>
        <planeGeometry args={[2.3, 1.35]} />
        <primitive object={holoMats[0]} attach="material" />
      </mesh>
      <mesh position={[-3, 1.6, 1.5]}>
        <planeGeometry args={[2.0, 1.2]} />
        <primitive object={holoMats[1]} attach="material" />
      </mesh>
      <mesh position={[0.5, 2.9, 2.3]}>
        <planeGeometry args={[1.7, 1.0]} />
        <primitive object={holoMats[2]} attach="material" />
      </mesh>
      <mesh position={[0, 3.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 48]} />
        <primitive object={radarMat} attach="material" />
      </mesh>
    </group>
  );
}
