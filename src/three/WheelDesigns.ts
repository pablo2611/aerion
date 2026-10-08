import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// All packages share the authored rim envelope: radius .3033, width .2785.
// Axle is local X. Tires, discs, calipers and wheel mounting transforms stay intact.
const radius = 0.3032967;
const alloy = new THREE.MeshStandardMaterial({ color: "#505b66", metalness: 1, roughness: 0.26 });
const ring = new THREE.TorusGeometry(radius - 0.012, 0.012, 8, 64);
const barrel = new THREE.CylinderGeometry(radius - 0.018, radius - 0.018, 0.25, 48, 1, true);
const hub = new THREE.CylinderGeometry(0.056, 0.056, 0.033, 24);
const bolt = new THREE.CylinderGeometry(0.007, 0.007, 0.006, 8);
const spokes = {
  wide: new THREE.BoxGeometry(0.026, 0.058, 0.234),
  turbine: new THREE.BoxGeometry(0.023, 0.03, 0.225),
  split: new THREE.BoxGeometry(0.025, 0.018, 0.232),
};
const discShape = new THREE.Shape();
discShape.absarc(0, 0, radius - 0.018, 0, Math.PI * 2, false);
for (let i = 0; i < 8; i++) {
  const angle = i * Math.PI / 4;
  const hole = new THREE.Path();
  hole.absarc(Math.cos(angle) * 0.207, Math.sin(angle) * 0.207, 0.037, 0, Math.PI * 2, true);
  discShape.holes.push(hole);
}
const disc = new THREE.ExtrudeGeometry(discShape, { depth: 0.024, bevelEnabled: false, curveSegments: 16 });

function mesh(geometry: THREE.BufferGeometry) { return new THREE.Mesh(geometry, alloy); }

export function createWheelDesigns(side: number): Record<string, THREE.Group> {
  const designs: Record<string, THREE.Group> = {};
  for (const id of ["aeroblade", "turbine", "monolith", "vector"]) {
    const group = new THREE.Group();
    group.name = `AERION_${id}`;
    const shell = mesh(barrel); shell.rotation.z = Math.PI / 2; group.add(shell);
    for (const x of [-0.126, 0.126]) {
      const lip = mesh(ring); lip.rotation.y = Math.PI / 2; lip.position.x = x; group.add(lip);
    }
    const face = new THREE.Group(); face.position.x = side * 0.113; group.add(face);
    const center = mesh(hub); center.rotation.z = Math.PI / 2; face.add(center);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const fastener = mesh(bolt); fastener.rotation.z = Math.PI / 2;
      fastener.position.set(side * 0.02, Math.sin(a) * 0.036, Math.cos(a) * 0.036); face.add(fastener);
    }
    if (id === "monolith") {
      const plate = mesh(disc); plate.rotation.y = side * Math.PI / 2; plate.position.x = -side * 0.012; face.add(plate);
    } else {
      const count = id === "turbine" ? 12 : 5;
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI * 2 / count;
        const arm = new THREE.Group(); arm.rotation.x = angle; face.add(arm);
        if (id === "vector") {
          for (const offset of [-0.023, 0.023]) {
            const spoke = mesh(spokes.split); spoke.position.set(0, offset, 0.165);
            spoke.rotation.x = offset > 0 ? -0.1 : 0.1; arm.add(spoke);
          }
        } else {
          const spoke = mesh(id === "turbine" ? spokes.turbine : spokes.wide);
          spoke.position.z = 0.163; spoke.rotation.x = id === "turbine" ? 0.3 : -0.12; arm.add(spoke);
        }
      }
    }
    // A single draw call per rim, including spokes, bolts, barrel and lips.
    group.updateMatrixWorld(true);
    const parts: THREE.BufferGeometry[] = [];
    group.traverse(node => {
      if (node instanceof THREE.Mesh) {
        const copy = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
        copy.applyMatrix4(node.matrixWorld);
        parts.push(copy);
      }
    });
    const merged = mergeGeometries(parts);
    parts.forEach(part => part.dispose());
    group.clear();
    if (merged) group.add(mesh(merged));
    group.visible = id === "aeroblade";
    designs[id] = group;
  }
  return designs;
}
