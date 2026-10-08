import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { KTX2Loader, type GLTFLoader } from "three-stdlib";
import { AERION_MODEL } from "../data/model";
import { CALIPERS, FINISHES, INTERIORS, PAINTS, SIGNATURES, WHEEL_FINISHES } from "../data/content";
import { runtime, useExperience, vehicleCamera } from "../store";
import Exhaust from "./Exhaust";
import { createWheelDesigns } from "./WheelDesigns";
import Cabin from "./Cabin";
import VehicleLights from "./VehicleLights";

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
  if (/^paint [12]( |$)/i.test(material.name) && material instanceof THREE.MeshStandardMaterial && !(material instanceof THREE.MeshPhysicalMaterial)) {
    const physical = new THREE.MeshPhysicalMaterial();
    THREE.MeshStandardMaterial.prototype.copy.call(physical, material);
    physical.clearcoat = 1;
    return physical;
  }
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
    if (/^InteriorSteering|^InteriorPedal/.test(object.name)) object.visible = false;
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
      if (/^paint [12]( |$)/.test(name) && material instanceof THREE.MeshPhysicalMaterial) {
        material.roughnessMap = null;
        material.normalScale.setScalar(0.13);
        material.clearcoatNormalScale.setScalar(0.08);
        catalog.paint.push(material);
      }
      if (name.includes("glass") || name.includes("mirror")) { material.roughnessMap = null; catalog.glass.push(material); }
      if (name.includes("glass")) {
        if (material instanceof THREE.MeshPhysicalMaterial) material.transmission = 0;
        material.transparent = true; material.opacity = 0.24; material.depthWrite = false;
        material.color.set("#91b6be");
      }
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
  const wheelDesigns: Record<string, THREE.Group>[] = [];
  const rimNodes: THREE.Object3D[] = [];
  root.traverse(object => { if (/^Wheel(Front|Rear)[LR]Rim$/.test(object.name)) rimNodes.push(object); });
  rimNodes.forEach(original => {
    original.visible = false;
    const replacement = new THREE.Group();
    replacement.name = `${original.name}Custom`;
    replacement.position.copy(original.position);
    replacement.quaternion.copy(original.quaternion);
    const designs = createWheelDesigns(original.name.includes("LRim") ? 1 : -1);
    Object.values(designs).forEach(design => { replacement.add(design); design.traverse(node => {
      if (node instanceof THREE.Mesh && isPbr(node.material)) {
        node.castShadow = true; node.receiveShadow = true;
        if (!catalog.rims.includes(node.material)) catalog.rims.push(node.material);
      }
    }); });
    original.parent!.add(replacement);
    wheelDesigns.push(designs);
  });
  root.traverse(object => {
    if (/^Wheel(Front|Rear)[LR]$/.test(object.name)) {
      if (object.name.startsWith("WheelFront")) object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/6));
      // Calipers stay fixed; only tire, rim and brake disc rotate on the axle.
      wheels.push(...object.children.filter(child => !/BrakePad/.test(child.name)));
    }
  });
  const doors = ["L", "R"].map(side => {
    const node = root.getObjectByName(`BodyDoor${side}Color1`)!;
    return { node, rest: node.quaternion.clone(), sign: side === "L" ? -1 : 1 };
  });
  return { root, catalog, wheels, wheelDesigns, doors };
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
  const doorRotation = useMemo(() => new THREE.Quaternion(), []);
  const doorLift = useMemo(() => new THREE.Quaternion(), []);
  const zAxis = useMemo(() => new THREE.Vector3(0,0,1), []);
  const xAxis = useMemo(() => new THREE.Vector3(1,0,0), []);
  const colors = useMemo(() => {
    const paint = PAINTS.find(p => p.id === cfg.paint) ?? PAINTS[0];
    const interior = INTERIORS.find(p => p.id === cfg.interior) ?? INTERIORS[0];
    return {
      paint: new THREE.Color(paint.hex), paintDark: new THREE.Color(paint.hex).multiplyScalar(0.82),
      interior: new THREE.Color(interior.hex), trim: new THREE.Color(interior.trim),
      brake: new THREE.Color((CALIPERS.find(p => p.id === cfg.caliper) ?? CALIPERS[0]).hex),
      rim: new THREE.Color((WHEEL_FINISHES.find(p => p.id === cfg.wheelFinish) ?? WHEEL_FINISHES[2]).hex),
      signature: new THREE.Color((SIGNATURES.find(p => p.id === cfg.signature) ?? SIGNATURES[0]).hex),
      relax: new THREE.Color("#ff986b"), range: new THREE.Color("#75ffa8"),
    };
  }, [cfg]);

  useEffect(() => {
    prepared.wheelDesigns.forEach(designs => Object.entries(designs).forEach(([id, group]) => { group.visible = id === cfg.wheel; }));
  }, [prepared, cfg.wheel]);

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
    const doorTarget = explore && useExperience.getState().doorsOpen && !runtime.driving ? 1 : 0;
    runtime.doorAmount = runtime.reduced ? doorTarget : damp(runtime.doorAmount, doorTarget, 4.2, dtc);
    prepared.doors.forEach(({node,rest,sign}) => {
      doorRotation.setFromAxisAngle(zAxis, sign * runtime.doorAmount * 1.05);
      doorLift.setFromAxisAngle(xAxis, runtime.doorAmount * 0.28);
      node.quaternion.copy(rest).multiply(doorRotation).multiply(doorLift);
    });
    const interactive = runtime.driving || explore || (ch === 7 && vehicleCamera.configActive);
    const portrait = state.size.width / state.size.height < 0.78;

    const paint = PAINTS.find((item) => item.id === cfg.paint) ?? PAINTS[0];
    const finish = FINISHES.find((item) => item.id === cfg.finish) ?? FINISHES[0];
    const wheelFinish = WHEEL_FINISHES.find((item) => item.id === cfg.wheelFinish) ?? WHEEL_FINISHES[2];
    const signatureColor = colors.signature;

    const ghost = ch === 3
      ? clamp(smoothstep(t, 0.1, 0.3) * (1 - smoothstep(t, 0.74, 0.96)), 0, 1)
      : 0;
    const finale = !runtime.driving && ch === 8 ? t : 0;
    const night = ch === 6 ? clamp(smoothstep(t, 0.04, 0.22) * (1 - smoothstep(t, 0.86, 1)), 0, 1) : 0;
    const headlight = !useExperience.getState().headlightsOn ? 0 : ch === -1 ? smoothstep(heroT, 0.2, 0.72) : night || ch === 8 ? 1 : 0.55;
    const lightTheme = runtime.driving || ch === 0 || ch === 7;

    prepared.catalog.paint.forEach((material, index) => {
      const target = index % 2 ? colors.paintDark : colors.paint;
      material.color.lerp(target, 0.055);
      material.metalness = damp(material.metalness, THREE.MathUtils.lerp(paint.metal, finish.metal, 0.48), 4, dtc);
      material.roughness = damp(material.roughness, Math.max(0.36, THREE.MathUtils.lerp(paint.rough, finish.rough, 0.55)), 4, dtc);
      material.clearcoat = damp(material.clearcoat, Math.min(0.4, THREE.MathUtils.lerp(paint.clear, finish.clear, 0.58)), 4, dtc);
      material.clearcoatRoughness = damp(material.clearcoatRoughness, finish.id === "satin" ? 0.42 : 0.3, 4, dtc);
      material.opacity = damp(material.opacity, 1 - ghost * 0.84, 5, dtc);
      material.transparent = material.opacity < 0.995;
      material.depthWrite = material.opacity > 0.65;
      material.envMapIntensity = damp(material.envMapIntensity, lightTheme ? 0.65 : 0.8, 3, dtc);
    });

    prepared.catalog.glass.forEach((material) => {
      material.envMapIntensity = damp(material.envMapIntensity, lightTheme ? 0.4 : 0.6, 3, dtc);
      material.roughness = damp(material.roughness, 0.16, 3, dtc);
      if (material instanceof THREE.MeshPhysicalMaterial) { material.clearcoat = 0; material.specularIntensity = 0.16; }
      if (material.name.toLowerCase().includes("glass")) material.opacity = damp(material.opacity, runtime.cabin ? 0.08 : 0.24 - ghost * 0.1, 4, dtc);
    });
    prepared.catalog.interior.forEach((material, index) => {
      const target = index % 3 === 0 ? colors.interior : colors.trim;
      material.color.lerp(target, 0.035);
    });
    prepared.catalog.brakes.forEach((material) => material.color.lerp(colors.brake, 0.06));

    prepared.catalog.rims.forEach((material) => {
      material.color.lerp(colors.rim, 0.055);
      material.metalness = damp(material.metalness, 0.65, 4, dtc);
      material.roughness = damp(material.roughness, wheelFinish.rough, 4, dtc);
    });
    prepared.catalog.headlights.forEach((material) => {
      material.emissive.lerp(signatureColor, 0.06);
      material.color.copy(signatureColor);
      material.emissiveIntensity = 0.06 + headlight * 1.35;
    });
    prepared.catalog.signalLights.forEach((material) => {
      material.emissive.lerp(signatureColor, 0.06);
      material.color.copy(signatureColor);
      material.emissiveIntensity = 0.05 + headlight * 0.8;
    });
    prepared.catalog.brakeLights.forEach((material) => {
      material.emissiveIntensity = 1.4 + night * 3.2 + finale * 2;
    });
    const aiAction = useExperience.getState().aiAction;
    const aiColor = aiAction === "relax" ? colors.relax : aiAction === "range" ? colors.range : signatureColor;
    prepared.catalog.dashboard.forEach((material) => {
      material.emissive.lerp(aiColor, 0.065);
      material.emissiveIntensity = useExperience.getState().aiStage === "responding" ? 2.8 : 0.9;
    });

    const targetScale = runtime.cabin ? 1 : portrait ? 0.86 : state.size.width < 1024 ? 0.94 : 1;
    car.scale.setScalar(damp(car.scale.x, targetScale, 3, dtc));
    car.position.x = damp(car.position.x, finale * finale * finale * 17, 3.5, dtc);
    car.position.y = damp(car.position.y, portrait && ch === -1 ? -0.04 : 0, 3, dtc);
    if (runtime.driving && !runtime.reduced) {
      car.position.y += Math.sin(state.clock.elapsedTime * 5) * 0.003 * Math.min(runtime.speed / 80, 1);
    }
    if (!runtime.reduced) {
      const demo = explore && useExperience.getState().showroomWheels && !useExperience.getState().doorsOpen;
      const wheelSpeed = runtime.driving ? runtime.speed / 3.6 / 0.36 : demo ? 1.65 : 0;
      prepared.wheels.forEach(w => w.rotateX(-wheelSpeed * dtc));
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
      <Cabin />
      <VehicleLights />
      <Exhaust />
    </group>
  );
}
