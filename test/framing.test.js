import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import { createFoldingModel, sampleFoldingPose, foldingPosePolygons } from '../src/core/folding.js';
import { centreFoldingPose } from '../src/render/fold-framing.js';

function bounds(points) {
  return new THREE.Box3().setFromPoints(points.map(point => new THREE.Vector3(...point)));
}

for (const id of ['truncated-icosahedron', 'cube']) {
  const model = createShape(id);
  const analysis = analyzePolyhedron(model);
  const net = planNet(model, analysis, { seed: 1, rootFace: 0 });
  const folding = createFoldingModel(model, analysis, net);
  const vertices = pose => foldingPosePolygons(analysis, pose).flat();
  const trajectory = bounds(Array.from({ length: 17 }, (_, i) => vertices(sampleFoldingPose(folding, i / 16))).flat());
  const radius = trajectory.getSize(new THREE.Vector3()).length() / 2;

  test(`${id}: legacy trajectory centre displaces the folded solid`, () => {
    const foldedCentre = bounds(vertices(sampleFoldingPose(folding, 1))).getCenter(new THREE.Vector3());
    assert.ok(foldedCentre.distanceTo(trajectory.getCenter(new THREE.Vector3())) > 0.5);
  });

  test(`${id}: flat, intermediate and folded poses stay centred and fit at desktop/mobile aspects`, () => {
    for (const aspect of [1440 / 900, 390 / 844]) {
      const camera = new THREE.PerspectiveCamera(38, aspect, 0.01, 1000);
      const halfAngle = Math.atan(Math.tan(THREE.MathUtils.degToRad(19)) * Math.min(1, aspect));
      camera.position.set(0.63, 0.48, 0.71).normalize().multiplyScalar(radius / Math.tan(halfAngle) * 1.35);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(true);
      const initialCamera = camera.matrixWorld.clone();
      const pivot = new THREE.Group();
      for (const sequenceMode of ['simultaneous', 'root-out', 'leaves-in', 'assembly']) {
        for (let i = 0; i <= 64; i += 1) {
          const pose = sampleFoldingPose(folding, i / 64, { sequenceMode });
          const original = JSON.stringify(pose.faceTransforms);
          centreFoldingPose(pivot, analysis, pose);
          const framed = vertices(pose).map(point => new THREE.Vector3(...point).add(pivot.position));
          assert.ok(new THREE.Box3().setFromPoints(framed).getCenter(new THREE.Vector3()).length() < 1e-9);
          for (const point of framed) {
            const screen = point.project(camera);
            assert.ok(Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && Math.abs(screen.z) < 1, `${sequenceMode}/${i}: clipped`);
          }
          assert.equal(JSON.stringify(pose.faceTransforms), original, 'framing must not alter kinematics');
          assert.ok(camera.matrixWorld.equals(initialCamera), 'framing must preserve orbit and zoom');
        }
      }
    }
  });

  test(`${id}: unfolded coordinates and user root transform survive recentring`, () => {
    const pose = sampleFoldingPose(folding, 0);
    const pivot = new THREE.Group();
    const root = new THREE.Group();
    pivot.add(root);
    root.position.set(2, -3, 4);
    root.rotation.set(0.2, 0.3, -0.4);
    root.updateMatrix();
    const authored = root.matrix.clone();
    centreFoldingPose(pivot, analysis, pose);
    pivot.updateMatrixWorld(true);
    assert.ok(root.matrix.equals(authored));
    const flat = foldingPosePolygons(analysis, pose);
    flat.forEach((polygon, face) => polygon.forEach(([x, y, z], vertex) => {
      assert.ok(Math.abs(x - net.polygons[face][vertex][0]) < 1e-9);
      assert.ok(Math.abs(y - net.polygons[face][vertex][1]) < 1e-9);
      assert.ok(Math.abs(z) < 1e-9);
    }));
    // Changing progress and then scrubbing backwards must not accumulate offsets.
    const initialPivot = pivot.position.clone();
    centreFoldingPose(pivot, analysis, sampleFoldingPose(folding, 1));
    centreFoldingPose(pivot, analysis, pose);
    assert.ok(pivot.position.distanceTo(initialPivot) < 1e-12);
  });
}
