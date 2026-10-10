const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
(async () => {
  const THREE = await import('three');
  const utils = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
  const exports = {};
  const source = fs.readFileSync('src/three/batchStaticMeshes.ts', 'utf8');
  new Function('require', 'exports', ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText)(id => id === 'three' ? THREE : utils, exports);
  const root = new THREE.Group(); root.scale.setScalar(.73); root.position.set(2, .1, -3); root.rotation.y = .6;
  const material = new THREE.MeshStandardMaterial();
  const fixed = new THREE.Group(); fixed.position.set(1, .2, 0); fixed.rotation.z = .2; root.add(fixed);
  for (let i = 0; i < 8; i++) {const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material); mesh.position.set(i, i / 2, i / 3); fixed.add(mesh);}
  const door = new THREE.Mesh(new THREE.BoxGeometry(), material); door.name = 'BodyDoorLColor1'; root.add(door);
  const wheel = new THREE.Group(); wheel.name = 'WheelFrontL'; root.add(wheel);
  const tire = new THREE.Mesh(new THREE.BoxGeometry(), material); wheel.add(tire);
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(), material); hatch.name = 'BodyRearPanelsColor1'; root.add(hatch);
  const bodyParent = new THREE.Mesh(new THREE.BoxGeometry(), material); bodyParent.name = 'BodyMain'; root.add(bodyParent);
  const nestedDoor = new THREE.Mesh(new THREE.BoxGeometry(), material); nestedDoor.name = 'BodyDoorRColor1'; bodyParent.add(nestedDoor);
  const before = new THREE.Box3().setFromObject(root, true);
  const geometries = exports.batchStaticMeshes(root);
  const after = new THREE.Box3().setFromObject(root, true);
  assert.ok(before.min.distanceTo(after.min) < 1e-5 && before.max.distanceTo(after.max) < 1e-5, 'World-space shape and scale must stay identical');
  assert.equal(geometries.length, 1, 'Eight fixed pieces should become one draw');
  assert.equal(root.getObjectByName('BodyDoorLColor1'), door);
  assert.equal(root.getObjectByName('BodyRearPanelsColor1'), hatch);
  assert.equal(root.getObjectByName('BodyDoorRColor1'), nestedDoor, 'A fixed mesh must not detach its animated descendants');
  assert.equal(nestedDoor.parent, bodyParent);
  assert.equal(tire.parent, wheel, 'Wheel axle joint stays intact');
  const merged = root.children.find(node => node.name.startsWith('AERION_Batched_'));
  assert.equal(merged.material, material, 'Configurator still changes the original material');
  const count = geometries[0].getIndex().count;
  assert.equal(count, 8 * 36, 'Batching preserves every original face');
  console.log('PASS: fewer draws preserve exact body shape, paint, doors, wheels and hatch');
  const clock = {};
  new Function('exports', ts.transpileModule(fs.readFileSync('src/three/renderClock.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(clock);
  for (const refresh of [60, 120]) for (const target of [12, 30, 45]) {
    let last = 0, frames = 0;
    for (let i = 1; i <= refresh * 5; i++) {
      const next = clock.stepRenderClock(i * 1000 / refresh, last, 1000 / target);
      if (next !== undefined) {last = next; frames++;}
    }
    assert.ok(Math.abs(frames - target * 5) <= 1, `${target} FPS stays bounded on ${refresh} Hz displays: ${frames}`);
  }
  console.log('PASS: 12/30/45 FPS budgets stay bounded on 60/120 Hz displays');
})();
