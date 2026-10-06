import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, SMAA } from "@react-three/postprocessing";
import { runtime, useExperience, DPR, vehicleCamera } from "../store";
import Car from "./Car";
import Road from "./Road";
import { SIGNATURES } from "../data/content";
import { AirFlow, EnergyFlow, HoloField } from "./Particles";
import { FLOOR } from "./shaders";

const { damp, clamp, lerp, smoothstep } = THREE.MathUtils;

/* ---------------------- per-chapter themes ------------------------- */

const THEME = {
  hero: { bg: "#080e18", floor: "#080b10", near: 8, far: 25, pool: 0.55, grid: 0.5, contact: 0.9, env: 1.0, exp: 1.08 },
  light: { bg: "#ebebe7", floor: "#d8d8d2", near: 19, far: 70, pool: 0.14, grid: 0.55, contact: 0.45, env: 1.7, exp: 1.12 },
  dark: { bg: "#05070b", floor: "#0a0d12", near: 11, far: 42, pool: 0.5, grid: 0.6, contact: 0.85, env: 0.95, exp: 1.0 },
  night: { bg: "#03040a", floor: "#05060d", near: 6.5, far: 24, pool: 0.8, grid: 0.28, contact: 1.0, env: 0.45, exp: 0.95 },
};
const CH_THEME = ["light", "dark", "dark", "dark", "dark", "dark", "night", "light", "dark"] as const;
type ThemeKey = keyof typeof THEME;

function themeBlend(ch: number, t: number) {
  const cur: ThemeKey = ch === -1 ? "hero" : CH_THEME[ch];
  let next: ThemeKey = cur;
  let w = 0;
  if (t > 0.8 && ch !== -1 && ch < CH_THEME.length - 1) {
    next = CH_THEME[ch + 1];
    w = smoothstep(t, 0.8, 1);
  }
  if (t > 0.9 && ch === -1) {
    next = "light";
    w = 0; // hero handoff handled by damped camera
  }
  const a = THEME[cur];
  const b = THEME[next];
  return {
    bg: [a.bg, b.bg, w] as const,
    floor: [a.floor, b.floor, w] as const,
    near: lerp(a.near, b.near, w),
    far: lerp(a.far, b.far, w),
    pool: lerp(a.pool, b.pool, w),
    grid: lerp(a.grid, b.grid, w),
    contact: lerp(a.contact, b.contact, w),
    env: lerp(a.env, b.env, w),
    exp: lerp(a.exp, b.exp, w),
  };
}

/* --------------------------- camera -------------------------------- */

function camAt(ch: number, t: number, now: number, width: number, height: number) {
  const s = t * t * (3 - 2 * t);
  const out = { x: 0, y: 1, z: 5, tx: 0, ty: 0.55, tz: 0, fov: 40 };
  const L = (a: number[], b: number[]) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)];
  switch (ch) {
    case -1: {
      const heroT = runtime.bootAt ? clamp((now - runtime.bootAt / 1000) / 4.5, 0, 1) : 0;
      const e = 1 - Math.pow(1 - heroT, 3);
      out.x = lerp(0, 1.5, e);
      out.y = lerp(1.55, 1.0, e);
      out.z = lerp(11.5, 5.2, e);
      out.fov = lerp(46, 39, e);
      out.ty = 0.6;
      break;
    }
    case 0: { const p = L([1.7, 1.05, 5.0], [4.3, 1.15, 3.3]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.fov = 38; break; }
    case 1: { const p = L([4.3, 0.95, 3.1], [2.4, 0.6, 4.7]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.fov = 40; break; }
    case 2: { const p = L([1.4, 1.0, 5.7], [0, 1.05, 6.0]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.fov = 43; break; }
    case 3: { const p = L([0.3, 2.2, 5.4], [0, 3.5, 3.4]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.ty = 0.1; out.fov = lerp(45, 40, s); break; }
    case 4: { const p = L([-0.5, 1.5, 3.1], [0.55, 0.88, 1.42]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.tx = 0.15; out.ty = 0.8; out.tz = 0.4; out.fov = lerp(40, 66, s); break; }
    case 5: { const p = L([-1.7, 1.3, 3.7], [-3.5, 2.0, -3.1]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.ty = 0.7; out.fov = 42; break; }
    case 6: { const p = L([-4.7, 0.72, 2.3], [-3.2, 0.62, 3.4]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.tx = 0.8; out.fov = 39; break; }
    case 7: { const p = L([-2.4, 1.5, 4.5], [0.2, 1.35, 5.3]); out.x = p[0]; out.y = p[1]; out.z = p[2]; out.fov = 38; break; }
    case 8: {
      const carX = s * s * s * 17;
      const p = L([2.6, 0.95, 5.4], [7.8, 0.85, 3.4]);
      out.x = p[0]; out.y = p[1]; out.z = p[2];
      out.tx = carX - 1.5; out.ty = 0.5;
      out.fov = 38 + s * 14;
      break;
    }
  }
  /* Portrait has an intentionally different framing rather than a scaled desktop camera. */
  const portrait = width / height < 0.78;
  if (portrait) {
    out.x *= 0.7;
    out.z *= 1.45;
    out.y = out.y * 0.84 + 0.08;
    out.fov = Math.max(out.fov + 11, 54);
    if (ch === -1) {
      out.x = 0.95;
      out.y = 0.9;
      out.z = 9.2;
      out.ty = 0.56;
      out.fov = 58;
    }
    if (ch === 4) {
      out.x = 0.35;
      out.y = 1.0;
      out.z = 3.1;
      out.fov = 61;
    }
  } else if (width < 1100) {
    out.z *= 1.13;
    out.fov += 3;
  }
  /* pointer parallax */
  if (!runtime.reduced) {
    const k = ch === 7 ? 0.55 : 0.35;
    out.x += runtime.pointer.x * k;
    out.y += runtime.pointer.y * 0.22 * k;
  }
  return out;
}

function Rig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3(0, 0.55, 0));
  const caRef = useRef<any>(null);
  const quality = runtime.quality;
  const exploreOpen = useExperience((s) => s.exploreOpen);

  useFrame((_, dt) => {
    const dtc = Math.min(dt, 0.05);
    const now = performance.now() / 1000;
    const reduced = runtime.reduced;
    const configOrbit = runtime.chapter === 7 && vehicleCamera.configActive;
    const freeView = exploreOpen || configOrbit;
    const c = camera;
    let targetPos: THREE.Vector3;
    let targetFov: number;
    if (freeView) {
      const v = vehicleCamera;
      const idleMs = performance.now() - v.lastInput;
      if (!reduced && idleMs < 1200) {
        v.targetYaw += v.yawVelocity * dtc;
        v.targetPitch = clamp(v.targetPitch + v.pitchVelocity * dtc, -0.1, 0.48);
        v.yawVelocity *= Math.exp(-3.8 * dtc);
        v.pitchVelocity *= Math.exp(-4.2 * dtc);
      }
      if (exploreOpen && !reduced && idleMs > 3100) v.targetYaw += dtc * 0.045;
      v.yaw = damp(v.yaw, v.targetYaw, 4.2, dtc);
      v.pitch = damp(v.pitch, v.targetPitch, 4.2, dtc);
      v.radius = damp(v.radius, v.targetRadius, 4.2, dtc);
      v.focus.x = damp(v.focus.x, v.targetFocus.x, 4.2, dtc);
      v.focus.y = damp(v.focus.y, v.targetFocus.y, 4.2, dtc);
      v.focus.z = damp(v.focus.z, v.targetFocus.z, 4.2, dtc);
      const cp = Math.cos(v.pitch);
      const radius = v.radius * (configOrbit ? 1.28 : 1);
      targetPos = new THREE.Vector3(
        v.focus.x + Math.cos(v.yaw) * cp * radius,
        v.focus.y + Math.sin(v.pitch) * radius,
        v.focus.z + Math.sin(v.yaw) * cp * radius
      );
      targetFov = size.width / size.height < 0.78 ? 54 : 40;
      look.current.x = damp(look.current.x, v.focus.x, 4.5, dtc);
      look.current.y = damp(look.current.y, v.focus.y, 4.5, dtc);
      look.current.z = damp(look.current.z, v.focus.z, 4.5, dtc);
    } else if (runtime.driving) {
      targetPos = new THREE.Vector3(size.width < 768 ? 7.8 : 6.8, 2.4, size.width < 768 ? 8.8 : 6.6);
      targetFov = size.width < 768 ? 54 : 43;
      look.current.lerp(new THREE.Vector3(0,0.65,0),1-Math.exp(-3*dtc));
    } else {
      const cam = camAt(runtime.chapter, runtime.local, now, size.width, size.height);
      targetPos = new THREE.Vector3(cam.x, cam.y, cam.z);
      targetFov = cam.fov;
      look.current.x = damp(look.current.x, cam.tx, 3.2, dtc);
      look.current.y = damp(look.current.y, cam.ty, 3.2, dtc);
      look.current.z = damp(look.current.z, cam.tz, 3.2, dtc);
    }
    const k = freeView ? 4.2 : 2.6;
    c.position.x = damp(c.position.x, targetPos.x, k, dtc);
    c.position.y = damp(c.position.y, targetPos.y, k, dtc);
    c.position.z = damp(c.position.z, targetPos.z, k, dtc);
    c.lookAt(look.current);
    const velKick = !freeView && !reduced && quality === "HIGH" ? Math.min(Math.abs(runtime.velocity) * 0.045, 5) : 0;
    c.fov = damp(c.fov, targetFov + velKick, 3.5, dtc);
    if (runtime.chapter === 7 && !exploreOpen && !runtime.driving) {
      c.setViewOffset(size.width,size.height,size.width >= 1024 ? 215 : 0,size.width < 1024 ? size.height*0.12 : 0,size.width,size.height);
    } else if (c.view?.enabled) c.clearViewOffset();
    c.updateProjectionMatrix();
    if (caRef.current?.offset) {
      const o = 0.00035 + (velKick / 7) * 0.004;
      caRef.current.offset.set(o, o * 0.6);
    }
  });

  return quality === "LOW" ? null : (
    <EffectComposer multisampling={0}>
      {quality === "HIGH" && <SMAA />}
      <Bloom mipmapBlur intensity={quality === "HIGH" ? 0.72 : 0.48} luminanceThreshold={0.78} luminanceSmoothing={0.28} />
      {quality === "HIGH" && <ChromaticAberration ref={caRef} />}
      <Vignette eskil={false} offset={0.26} darkness={0.62} />
    </EffectComposer>
  );
}

/* ------------------------ stage / atmosphere ----------------------- */

function Stage() {
  const isConfig = useExperience(s => s.phase === "configurator");
  const signature = useExperience(s => s.config.signature);
  const signatureColor = SIGNATURES.find(s => s.id === signature)?.hex ?? "#5fe8ff";
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const quality = runtime.quality;
  const floorMat = useRef<THREE.ShaderMaterial>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const ambLight = useRef<THREE.AmbientLight>(null);

  const floorUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#0a0d12") },
      uAccent: { value: new THREE.Color("#5fe8ff") },
      uFog: { value: new THREE.Color("#04060a") },
      uPool: { value: 0.5 },
      uGrid: { value: 0.5 },
      uContact: { value: 0.8 },
      uTime: { value: 0 },
      uRoad: { value: 0 },
      uDistance: { value: 0 },
    }),
    []
  );
  const bg = useMemo(() => new THREE.Color("#04060a"), []);
  const fog = useMemo(() => new THREE.Fog("#04060a", 5, 17), []);

  useMemo(() => {
    scene.background = bg;
    scene.fog = fog;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
  }, [scene, gl, bg, fog]);

  useFrame((_, dt) => {
    const dtc = Math.min(dt, 0.05);
    const th = runtime.driving ? { ...themeBlend(-1,0), bg:["#8fa8af","#8fa8af",0] as const, near:22,far:78,env:1.8,exp:1.1 } : themeBlend(runtime.chapter, runtime.local);
    bg.lerp(new THREE.Color(th.bg[2] ? th.bg[1] : th.bg[0]), 0.06);
    (scene.background as THREE.Color).copy(bg);
    fog.color.copy(bg);
    fog.near = damp(fog.near, th.near, 2, dtc);
    fog.far = damp(fog.far, th.far, 2, dtc);
    gl.toneMappingExposure = damp(gl.toneMappingExposure, th.exp, 2, dtc);
    const envI = (scene as any).environmentIntensity as number | undefined;
    if (envI !== undefined) (scene as any).environmentIntensity = damp(envI, th.env, 2.5, dtc);
    if (floorMat.current) {
      const u = floorMat.current.uniforms;
      (u.uColor.value as THREE.Color).lerp(new THREE.Color(th.floor[2] ? th.floor[1] : th.floor[0]), 0.06);
      (u.uFog.value as THREE.Color).copy(bg);
      u.uPool.value = damp(u.uPool.value, th.pool, 2.5, dtc);
      u.uGrid.value = damp(u.uGrid.value, th.grid, 2.5, dtc);
      u.uContact.value = damp(u.uContact.value, th.contact, 2.5, dtc);
      u.uTime.value += dtc;
      u.uRoad.value = damp(u.uRoad.value,runtime.driving ? 1 : 0,4,dtc);
      if (!runtime.reduced) u.uDistance.value += runtime.speed / 3.6 * dtc;
    }
    if (keyLight.current) keyLight.current.intensity = damp(keyLight.current.intensity, th.env * 1.1, 2.5, dtc);
    if (ambLight.current) ambLight.current.intensity = damp(ambLight.current.intensity, 0.25 + th.env * 0.35, 2.5, dtc);
  });

  return (
    <>
      <ambientLight ref={ambLight} intensity={0.5} color="#c7d9ea" />
      <directionalLight ref={keyLight} position={[5, 7, 4]} intensity={1.4} color="#eaf4ff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 3.5, -5]} intensity={0.72} color={isConfig ? "#ffffff" : "#7fd4ff"} />
      <directionalLight position={[1, 1.4, -8]} intensity={0.42} color="#ffbfa7" />
      <pointLight position={[0, 1.2, 4]} intensity={0.5} color={isConfig ? "#ffffff" : "#bfe9ff"} distance={12} />
      <pointLight position={[2.8, 0.65, 0]} intensity={3.5} color={signatureColor} distance={5} decay={2} />
      {/* Long studio strips reveal roof, shoulder and the wheel crowns in dark chapters. */}
      <rectAreaLight position={[0.2, 5, 1.8]} rotation={[-Math.PI / 2.8, 0, 0]} width={7.5} height={1.1} intensity={5.5} color="#e8f4ff" />
      <rectAreaLight position={[0, 2.2, -5.8]} rotation={[0, Math.PI, 0]} width={6.8} height={0.45} intensity={3.2} color={isConfig ? "#fff7ec" : "#78dfff"} />
      <rectAreaLight position={[5.7, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} width={4.5} height={0.7} intensity={2.2} color="#c5ecff" />
      <Environment resolution={quality === "LOW" ? 64 : 128} frames={1}>
        <Lightformer intensity={2.8} position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 3, 1]} color="#ffffff" />
        <Lightformer intensity={1.1} position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[6, 1.2, 1]} color="#cfe8ff" />
        <Lightformer intensity={0.9} position={[8, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 0.8, 1]} color="#ffe9d8" />
        <Lightformer intensity={0.5} position={[0, 1, -9]} scale={[7, 0.5, 1]} color="#5fe8ff" />
      </Environment>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <shaderMaterial ref={floorMat} vertexShader={FLOOR.vertex} fragmentShader={FLOOR.fragment} uniforms={floorUniforms} />
      </mesh>
      <Suspense fallback={null}>
        <Car />
      </Suspense>
      <AirFlow />
      <Road />
      <EnergyFlow />
      <HoloField />
    </>
  );
}

/* ------------------------------ root ------------------------------- */

export default function Scene() {
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange",sync);
    return () => document.removeEventListener("visibilitychange",sync);
  },[]);
  const quality = useExperience((s) => s.quality);
  const exploreOpen = useExperience((s) => s.exploreOpen);
  const driving = useExperience((s) => s.driving);
  return (
    <div className={`fixed inset-0 ${driving ? "z-[55] pointer-events-none" : exploreOpen ? "z-[20] pointer-events-auto" : "z-0 pointer-events-none"}`} aria-hidden={!exploreOpen && !driving}>
      <Canvas
        frameloop={visible ? "always" : "demand"}
        dpr={DPR[quality]}
        gl={{ antialias: quality !== "LOW", powerPreference: "high-performance", alpha: false }}
        camera={{ fov: 46, near: 0.1, far: 90, position: [0, 1.55, 11.5] }}
        shadows={quality !== "LOW"}
      >
        <Stage />
        <Rig />
      </Canvas>
    </div>
  );
}
