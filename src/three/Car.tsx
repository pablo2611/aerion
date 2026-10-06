import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { KTX2Loader, type GLTFLoader } from "three-stdlib";
import { AERION_MODEL } from "../data/model";
import { CALIPERS, FINISHES, INTERIORS, PAINTS, SIGNATURES, WHEEL_FINISHES } from "../data/content";
import { runtime, useExperience, vehicleCamera } from "../store";

const { clamp, damp, smoothstep } = THREE.MathUtils;

type PbrMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

interface MaterialCatalog {
  paint: THREE.MeshPhysicalMaterial[];
  glass: PbrMaterial[];
  interior: PbrMaterial[];
  brakes: PbrMaterial[];
  rims: PbrMaterial[];
  rim1: PbrMaterial[];
  rim2: PbrMaterial[];
  dashboard: PbrMaterial[];
  headlights: PbrMaterial[];
  signalLights: PbrMaterial[];
  brakeLights: PbrMaterial[];
  allPbr: PbrMaterial[];
}

function isPbr(material: THREE.Material): material is PbrMaterial {
  return material instanceof THREE.MeshStandardMaterial;
}

function cloneMaterial(material: THREE.Material) {
  return material.clone();
}

function prepareModel(source: THREE.Group) {
  const root = source.clone(true);
  const catalog: MaterialCatalog = {
    paint: [],
    glass: [],
    interior: [],
    brakes: [],
    rims: [],
    rim1: [],
    rim2: [],
    dashboard: [],
    headlights: [],
    signalLights: [],
    brakeLights: [],
    allPbr: [],
  };
  const seen = new Set<THREE.Material>();
  const clones = new Map<THREE.Material, THREE.Material>();

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = true;
    object.receiveShadow = true;

    const originals = Array.isArray(object.material) ? object.material : [object.material];
    const materials = originals.map(m => { if (!clones.has(m)) clones.set(m, cloneMaterial(m)); return clones.get(m)!; });
    object.material = Array.isArray(object.material) ? materials : materials[0];
    const identity = `${object.name} ${materials.map((m) => m.name).join(" ")}`;

    // The CC license explicitly excludes these trademarks. They are not used as AERION marks.
    if (/khronos|3d[ _-]?commerce|legalmark|logo|license/i.test(identity)) {
      object.visible = false;
      return;
    }

    materials.forEach((material) => {
      if (seen.has(material) || !isPbr(material)) return;
      seen.add(material);
      catalog.allPbr.push(material);
      material.envMapIntensity = 1.25;
      const name = material.name.toLowerCase();
      if (/^paint [12]( |$)/.test(name) && material instanceof THREE.MeshPhysicalMaterial) catalog.paint.push(material);
      if (name.includes("glass") || name.includes("mirror")) catalog.glass.push(material);
      if (/interior|dashboard|floormat|panel sides/.test(name)) catalog.interior.push(material);
      if (name === "brake") catalog.brakes.push(material);
      if (name.includes("rim")) catalog.rims.push(material);
      if (name.includes("rim1")) catalog.rim1.push(material);
      if (name.includes("rim2")) catalog.rim2.push(material);
      if (name.includes("dashboard")) catalog.dashboard.push(material);
      if (name === "headlight") catalog.headlights.push(material);
      if (name === "signallight") catalog.signalLights.push(material);
      if (name === "brakelight") catalog.brakeLights.push(material);
    });
  });

  // Normalize the official asset once without changing its authored geometry.
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 5.35 / Math.max(size.x, size.z);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  root.updateMatrixWorld(true);

  const wheels: THREE.Object3D[] = [];
  root.traverse(object => {
    if (/^Wheel(Front|Rear)[LR]$/.test(object.name)) {
      if (object.name.startsWith("WheelFront")) object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/6));
      wheels.push(object);
    }
  });
  return { root, catalog, wheels };
}

export default function Car() {
  const renderer = useThree((state) => state.gl);
  const group = useRef<THREE.Group>(null);
  const modelPivot = useRef<THREE.Group>(null);
  const cfg = useExperience((state) => state.config);
  const setModelReady = useExperience((state) => state.setModelReady);

  const extendLoader = useCallback(
    (loader: GLTFLoader) => {
      const ktx2 = new KTX2Loader()
        .setTranscoderPath(AERION_MODEL.basisPath)
        .detectSupport(renderer);
      loader.setKTX2Loader(ktx2);
    },
    [renderer]
  );

  const gltf = useGLTF(AERION_MODEL.url, AERION_MODEL.dracoPath, true, extendLoader);
  const prepared = useMemo(() => prepareModel(gltf.scene), [gltf.scene]);

  useEffect(() => {
    setModelReady(true);
    return () => setModelReady(false);
  }, [setModelReady]);

  useFrame((state, dt) => {
    const car = group.current;
    const pivot = modelPivot.current;
    if (!car || !pivot) return;
    const dtc = Math.min(dt, 0.05);
    const now = performance.now();
    const ch = runtime.chapter;
    const t = runtime.local;
    const heroT = runtime.bootAt ? clamp((now - runtime.bootAt) / 4200, 0, 1) : 0;
    const explore = useExperience.getState().exploreOpen;
    const interactive = explore || (ch === 7 && vehicleCamera.configActive);
    const portrait = state.size.width / state.size.height < 0.78;

    const paint = PAINTS.find((item) => item.id === cfg.paint) ?? PAINTS[0];
    const finish = FINISHES.find((item) => item.id === cfg.finish) ?? FINISHES[0];
    const interior = INTERIORS.find((item) => item.id === cfg.interior) ?? INTERIORS[0];
    const caliper = CALIPERS.find((item) => item.id === cfg.caliper) ?? CALIPERS[0];
    const signature = SIGNATURES.find((item) => item.id === cfg.signature) ?? SIGNATURES[0];
    const wheelFinish = WHEEL_FINISHES.find((item) => item.id === cfg.wheelFinish) ?? WHEEL_FINISHES[2];
    const signatureColor = new THREE.Color(signature.hex);
    const paintColor = new THREE.Color(paint.hex);

    const ghost = ch === 3
      ? clamp(smoothstep(t, 0.1, 0.3) * (1 - smoothstep(t, 0.74, 0.96)), 0, 1)
      : 0;
    const finale = !runtime.driving && ch === 8 ? t : 0;
    const night = ch === 6 ? clamp(smoothstep(t, 0.04, 0.22) * (1 - smoothstep(t, 0.86, 1)), 0, 1) : 0;
    const headlight = ch === -1 ? smoothstep(heroT, 0.2, 0.72) : night || ch === 8 ? 1 : 0.35;
    const lightTheme = runtime.driving || ch === 0 || ch === 7;

    prepared.catalog.paint.forEach((material, index) => {
      const target = index % 2 ? paintColor.clone().multiplyScalar(0.82) : paintColor;
      material.color.lerp(target, 0.055);
      material.metalness = damp(material.metalness, THREE.MathUtils.lerp(paint.metal, finish.metal, 0.48), 4, dtc);
      material.roughness = damp(material.roughness, THREE.MathUtils.lerp(paint.rough, finish.rough, 0.55), 4, dtc);
      material.clearcoat = damp(material.clearcoat, THREE.MathUtils.lerp(paint.clear, finish.clear, 0.58), 4, dtc);
      material.clearcoatRoughness = damp(material.clearcoatRoughness, finish.id === "satin" ? 0.28 : 0.06, 4, dtc);
      material.opacity = damp(material.opacity, 1 - ghost * 0.84, 5, dtc);
      material.transparent = material.opacity < 0.995;
      material.depthWrite = material.opacity > 0.65;
      material.envMapIntensity = damp(material.envMapIntensity, lightTheme ? 1.85 : 1.22, 3, dtc);
    });

    prepared.catalog.glass.forEach((material) => {
      material.envMapIntensity = damp(material.envMapIntensity, lightTheme ? 1.95 : 1.35, 3, dtc);
      material.opacity = damp(material.opacity, 1 - ghost * 0.2, 4, dtc);
    });
    prepared.catalog.interior.forEach((material, index) => {
      const target = new THREE.Color(index % 3 === 0 ? interior.hex : interior.trim);
      material.color.lerp(target, 0.035);
    });
    prepared.catalog.brakes.forEach((material) => material.color.lerp(new THREE.Color(caliper.hex), 0.06));

    prepared.catalog.rims.forEach((material) => {
      material.color.lerp(new THREE.Color(wheelFinish.hex), 0.055);
      material.metalness = damp(material.metalness, 1, 4, dtc);
      material.roughness = damp(material.roughness, wheelFinish.rough, 4, dtc);
    });
    // The authored wheel has two independent geometric surface layers (Rim1/Rim2).
    // The four packages use real visibility combinations of those imported surfaces.
    const layers: Record<string, [number, number]> = {
      aeroblade: [1, 1],
      turbine: [1, 0.08],
      monolith: [0.06, 1],
      vector: [1, 0.48],
    };
    const [rim1Opacity, rim2Opacity] = layers[cfg.wheel] ?? layers.aeroblade;
    prepared.catalog.rim1.forEach((material) => {
      material.transparent = rim1Opacity < 0.99;
      material.opacity = damp(material.opacity, rim1Opacity, 7, dtc);
      material.depthWrite = rim1Opacity > 0.5;
    });
    prepared.catalog.rim2.forEach((material) => {
      material.transparent = rim2Opacity < 0.99;
      material.opacity = damp(material.opacity, rim2Opacity, 7, dtc);
      material.depthWrite = rim2Opacity > 0.5;
    });

    prepared.catalog.headlights.forEach((material) => {
      material.emissive.lerp(signatureColor, 0.06);
      material.emissiveIntensity = 1.2 + headlight * 6.2;
    });
    prepared.catalog.signalLights.forEach((material) => {
      material.emissive.lerp(signatureColor, 0.06);
      material.emissiveIntensity = 0.8 + headlight * 3;
    });
    prepared.catalog.brakeLights.forEach((material) => {
      material.emissiveIntensity = 1.4 + night * 3.2 + finale * 2;
    });
    const aiAction = useExperience.getState().aiAction;
    const aiColor = aiAction === "relax" ? new THREE.Color("#ff986b") : aiAction === "range" ? new THREE.Color("#75ffa8") : signatureColor;
    prepared.catalog.dashboard.forEach((material) => {
      material.emissive.lerp(aiColor, 0.065);
      material.emissiveIntensity = useExperience.getState().aiStage === "responding" ? 2.8 : 0.9;
    });

    const targetScale = portrait ? 0.86 : state.size.width < 1024 ? 0.94 : 1;
    car.scale.setScalar(damp(car.scale.x, targetScale, 3, dtc));
    car.position.x = damp(car.position.x, finale * finale * finale * 17, 3.5, dtc);
    car.position.y = damp(car.position.y, portrait && ch === -1 ? -0.04 : 0, 3, dtc);
    if (runtime.driving && !runtime.reduced) {
      car.position.y += Math.sin(state.clock.elapsedTime * 5) * 0.003 * Math.min(runtime.speed / 80, 1);
      prepared.wheels.forEach(w => w.rotateX(-runtime.speed / 3.6 / 0.36 * dtc));
    }
    car.rotation.y = runtime.reduced || interactive ? 0 : runtime.pointer.x * 0.018 * (1 - finale);
    car.rotation.x = runtime.reduced || interactive ? 0 : runtime.pointer.y * 0.006;
  });

  return (
    <group ref={group}>
      {/* glTF faces +Z; this keeps the existing AERION camera convention (+X front). */}
      <group ref={modelPivot} rotation={[0, Math.PI / 2, 0]}>
        <primitive object={prepared.root} />
      </group>
    </group>
  );
}
