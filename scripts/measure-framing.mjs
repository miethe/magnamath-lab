/** Numerical before/after reproduction; does not replace browser screenshots. */
import * as THREE from 'three';
import { createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import { createFoldingModel, sampleFoldingPose, foldingPosePolygons } from '../src/core/folding.js';
import { centreFoldingPose } from '../src/render/fold-framing.js';

const measurements = [];
for (const id of ['truncated-icosahedron', 'cube']) {
  const model = createShape(id);
  const analysis = analyzePolyhedron(model);
  const net = planNet(model, analysis, { seed: 1, rootFace: 0 });
  const folding = createFoldingModel(model, analysis, net);
  const points = pose => foldingPosePolygons(analysis, pose).flat().map(point => new THREE.Vector3(...point));
  const trajectory = new THREE.Box3().setFromPoints(Array.from({ length: 17 }, (_, i) => points(sampleFoldingPose(folding, i / 16))).flat());
  const pose = sampleFoldingPose(folding, 1);
  const folded = new THREE.Box3().setFromPoints(points(pose)).getCenter(new THREE.Vector3());
  const union = trajectory.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  centreFoldingPose(pivot, analysis, pose);
  measurements.push({
    id,
    unionCentre: union.toArray(),
    foldedCentre: folded.toArray(),
    beforeOffset: folded.clone().sub(union).toArray(),
    afterOffset: folded.clone().add(pivot.position).toArray(),
  });
}
console.log(JSON.stringify(measurements, null, 2));
