import test from 'node:test';
import assert from 'node:assert/strict';

import { createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import { createFoldingModel } from '../src/core/folding.js';
import {
  createMotionClip,
  rootPoseKeyframe,
  sampleMotionClip,
  serializeMotionClip,
  upsertProgressKeyframe,
  upsertRootPoseKeyframe,
  validateMotionClip,
} from '../src/core/motion.js';
import {
  axisAngle4,
  composeRigid4,
  decomposeRigid4,
  matrixMaxError4,
  multiply4,
  translation4,
} from '../src/core/rigid.js';

function cubeFoldingModel() {
  const polyhedron = createShape('cube');
  const analysis = analyzePolyhedron(polyhedron);
  const net = planNet(polyhedron, analysis, { seed: 3, objective: 'compact', attempts: 120 });
  return createFoldingModel(polyhedron, analysis, net);
}

test('rigid transform quaternion decomposition round-trips', () => {
  const matrix = multiply4(translation4([3, -2, 5]), axisAngle4([1, 2, 3], 0.73));
  const decomposed = decomposeRigid4(matrix);
  const rebuilt = composeRigid4(decomposed.translation, decomposed.quaternion);
  assert.ok(matrixMaxError4(matrix, rebuilt) < 1e-12);
});

test('motion clips interpolate folding progress and 6DOF root pose', () => {
  const model = cubeFoldingModel();
  const endPose = multiply4(translation4([4, 2, -1]), axisAngle4([0, 1, 0], Math.PI));
  const clip = createMotionClip({
    id: 'cube-flight',
    name: 'Cube flight',
    durationSeconds: 4,
    rootPoseTrack: [rootPoseKeyframe(0, composeRigid4([0, 0, 0], [0, 0, 0, 1]), 'linear'), rootPoseKeyframe(4, endPose, 'linear')],
    progressTrack: [{ time: 0, value: 0, easing: 'linear' }, { time: 4, value: 1, easing: 'linear' }],
  });
  const sampled = sampleMotionClip(clip, 2, model);
  assert.ok(Math.abs(sampled.progress - 0.5) < 1e-12);
  const pose = decomposeRigid4(sampled.rootPose);
  assert.deepEqual(pose.translation.map((value) => Number(value.toFixed(9))), [2, 1, -0.5]);
  assert.ok(validateMotionClip(clip, model).valid);
});

test('per-hinge progress tracks become exact angle overrides', () => {
  const model = cubeFoldingModel();
  const hinge = model.hinges[0];
  const clip = createMotionClip({
    id: 'hinge-detail',
    name: 'Hinge detail',
    durationSeconds: 2,
    hingeTracks: {
      [hinge.edgeKey]: [
        { time: 0, value: 0, mode: 'progress', easing: 'linear' },
        { time: 2, value: 1, mode: 'progress', easing: 'linear' },
      ],
    },
  });
  const sampled = sampleMotionClip(clip, 1, model);
  assert.ok(Math.abs(sampled.hingeOverrides[hinge.edgeKey].angleRadians - hinge.targetAngleRadians / 2) < 1e-12);
});

test('camera tracks, markers, and stable serialization are supported', () => {
  const clip = createMotionClip({
    id: 'camera-tour',
    name: 'Camera tour',
    durationSeconds: 3,
    cameraTrack: [
      { time: 0, position: [0, 0, 5], target: [0, 0, 0], up: [0, 1, 0], fovDegrees: 45, easing: 'linear' },
      { time: 3, position: [5, 2, 0], target: [0, 0, 0], up: [0, 1, 0], fovDegrees: 60, easing: 'linear' },
    ],
    markers: [{ time: 1.5, id: 'midpoint', label: 'Halfway' }],
  });
  const sampled = sampleMotionClip(clip, 1.5);
  assert.deepEqual(sampled.camera.position, [2.5, 1, 2.5]);
  assert.equal(sampled.camera.fovDegrees, 52.5);
  assert.equal(sampled.activeMarkers[0].id, 'midpoint');
  assert.deepEqual(serializeMotionClip(clip), clip);
});

test('motion clip keyframes can be immutably upserted', () => {
  const clip = createMotionClip({ id: 'editable', name: 'Editable', durationSeconds: 5 });
  const root = upsertRootPoseKeyframe(clip, 2, translation4([2, 0, 0]));
  const progress = upsertProgressKeyframe(root, 2, 0.4);
  assert.equal(clip.rootPoseTrack.length, 0);
  assert.equal(progress.rootPoseTrack.length, 1);
  assert.equal(progress.progressTrack.find((entry) => entry.time === 2).value, 0.4);
});

test('invalid and unknown hinge tracks are rejected', () => {
  const model = cubeFoldingModel();
  const clip = createMotionClip({
    id: 'invalid-hinge',
    name: 'Invalid hinge',
    durationSeconds: 1,
    hingeTracks: {
      '999:1000': [{ time: 0, value: 0, mode: 'progress', easing: 'linear' }],
    },
  });
  const result = validateMotionClip(clip, model);
  assert.equal(result.valid, false);
  assert.match(result.issues.join(' '), /Unknown hinge track/);
});
