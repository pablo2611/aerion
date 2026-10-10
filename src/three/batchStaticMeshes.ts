import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Bake only fixed pieces. Doors, axles and the inspection hatch keep their joints. */
export function batchStaticMeshes(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map<string, THREE.Mesh[]>();
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh) || node instanceof THREE.SkinnedMesh || Array.isArray(node.material) || node.children.length) return;
    for (let p: THREE.Object3D | null = node; p && p !== root; p = p.parent) {
      if (!p.visible || /^(Wheel|BodyDoor|BodyRearPanels|BodyRearwindow|InteriorRearHatch|InteriorRearPanels)/.test(p.name)) return;
    }
    if (Object.keys(node.geometry.morphAttributes).length) return;
    const attributes = Object.keys(node.geometry.attributes).sort().map(name => {
      const attr = node.geometry.getAttribute(name);
      const array = attr instanceof THREE.InterleavedBufferAttribute ? attr.data.array : attr.array;
      return `${name}:${attr.itemSize}:${attr.normalized}:${array.constructor.name}`;
    }).join('|');
    const key = `${node.material.uuid}:${!!node.geometry.index}:${attributes}`;
    const list = buckets.get(key) ?? [];
    list.push(node); buckets.set(key, list);
  });
  const geometries: THREE.BufferGeometry[] = [];
  for (const nodes of buckets.values()) {
    if (nodes.length < 2) continue;
    const pieces = nodes.map(node => node.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld)));
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const material = nodes[0].material as THREE.Material;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `AERION_Batched_${material.name}`;
    mesh.castShadow = true; mesh.receiveShadow = true;
    nodes.forEach(node => node.removeFromParent());
    root.add(mesh); geometries.push(geometry);
  }
  return geometries;
}
