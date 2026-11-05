import test from 'node:test';
import assert from 'node:assert/strict';

import { SHAPE_CATALOG, createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import {
  FOLD_SEQUENCE_MODES,
  createFoldingModel,
  createFoldingSchedule,
  foldingPosePolygons,
  foldingTargetFit,
  parseFoldingState,
  sampleFoldingPose,
  serializeFoldingState,
} from '../src/core/folding.js';
import { analyzeFoldingPose } from '../src/core/folding-diagnostics.js';

function fixture(entry) {
  const model = createShape(entry.id, entry.parameter?.default);
  const analysis = analyzePolyhedron(model);
  const net = planNet(model, analysis, { seed: 7, rootFace: 0, attempts: 180 });
  const folding = createFoldingModel(model, analysis, net);
  return { model, analysis, net, folding };
}

const catalogFixtures = SHAPE_CATALOG.map(fixture);

test('every starter-catalog net produces an exact tree-hinge target', () => {
  for (const { model, folding } of catalogFixtures) {
    const fit = foldingTargetFit(folding);
    assert.ok(fit.maximumMatrixError < 1e-7, `${model.id} target error ${fit.maximumMatrixError}`);
    assert.equal(folding.hinges.length, folding.faceCount - 1);
  }
});

test('flat sampled polygons reproduce the exact selected net coordinates', () => {
  for (const { model, analysis, net, folding } of catalogFixtures) {
    const pose = sampleFoldingPose(folding, 0);
    const polygons = foldingPosePolygons(analysis, pose);
    for (let faceIndex = 0; faceIndex < polygons.length; faceIndex += 1) {
      for (let vertexIndex = 0; vertexIndex < polygons[faceIndex].length; vertexIndex += 1) {
        const [x, y, z] = polygons[faceIndex][vertexIndex];
        const [expectedX, expectedY] = net.polygons[faceIndex][vertexIndex];
        assert.ok(Math.abs(x - expectedX) < 1e-8, `${model.id} face ${faceIndex} x`);
        assert.ok(Math.abs(y - expectedY) < 1e-8, `${model.id} face ${faceIndex} y`);
        assert.ok(Math.abs(z) < 1e-8, `${model.id} face ${faceIndex} z`);
      }
    }
  }
});

test('hinges stay continuous and faces stay rigid throughout multiple timeline modes', () => {
  const progressSamples = [0, 0.13, 0.37, 0.61, 0.86, 1];
  for (const { model, analysis, folding } of catalogFixtures) {
    for (const sequenceMode of Object.keys(FOLD_SEQUENCE_MODES).filter((mode) => mode !== 'custom')) {
      for (const progress of progressSamples) {
        const pose = sampleFoldingPose(folding, progress, { sequenceMode });
        const diagnostics = analyzeFoldingPose(model, analysis, folding, pose, { collision: false });
        assert.ok(diagnostics.hingeContinuity.maximumGap < 1e-7, `${model.id}/${sequenceMode}/${progress} hinge gap ${diagnostics.hingeContinuity.maximumGap}`);
        assert.ok(diagnostics.rigidity.maximumEdgeError < 1e-7, `${model.id}/${sequenceMode}/${progress} rigidity ${diagnostics.rigidity.maximumEdgeError}`);
      }
    }
  }
});

test('all cut-edge copies close at the exact folded target', () => {
  for (const { model, analysis, folding } of catalogFixtures) {
    const pose = sampleFoldingPose(folding, 1, { sequenceMode: 'simultaneous' });
    const diagnostics = analyzeFoldingPose(model, analysis, folding, pose, { collision: false });
    assert.ok(diagnostics.closure.maximumGap < 1e-7, `${model.id} closure gap ${diagnostics.closure.maximumGap}`);
    assert.ok(diagnostics.target.maximumMatrixError < 1e-7, `${model.id} matrix error ${diagnostics.target.maximumMatrixError}`);
  }
});

test('signed hinge magnitudes agree with measured exterior dihedral angles', () => {
  for (const { model, analysis, folding } of catalogFixtures) {
    const byEdge = new Map(analysis.dihedralAngles.map((entry) => [entry.edgeKey, entry]));
    for (const hinge of folding.hinges) {
      const interior = byEdge.get(hinge.edgeKey).radians;
      const expectedExterior = Math.PI - interior;
      assert.ok(Math.abs(Math.abs(hinge.targetAngleRadians) - expectedExterior) < 1e-7, `${model.id}/${hinge.edgeKey}`);
    }
  }
});

test('timeline schedules are normalized, ordered, and sample exact endpoints', () => {
  const { folding } = catalogFixtures.find(({ model }) => model.id === 'truncated-octahedron');
  for (const mode of ['simultaneous', 'root-out', 'leaves-in', 'assembly']) {
    const schedule = createFoldingSchedule(folding, { mode, hingeDuration: 0.5 });
    for (const entry of Object.values(schedule.entries)) {
      assert.ok(entry.start >= 0 && entry.start <= 1);
      assert.ok(entry.end >= entry.start && entry.end <= 1);
    }
    const flat = sampleFoldingPose(folding, 0, { schedule });
    const folded = sampleFoldingPose(folding, 1, { schedule });
    assert.ok(flat.hingeStates.every((hinge) => Math.abs(hinge.angleRadians) < 1e-10));
    assert.ok(folded.hingeStates.every((hinge) => Math.abs(hinge.angleRadians - hinge.targetAngleRadians) < 1e-10));
  }
});

test('one manual hinge override remains exact at its shared edge and serializes safely', () => {
  const { model, analysis, folding } = catalogFixtures.find(({ model }) => model.id === 'cube');
  const hinge = folding.hinges[0];
  const overrideAngle = hinge.targetAngleRadians * 0.35;
  const hingeOverrides = { [hinge.edgeKey]: { angleRadians: overrideAngle } };
  const pose = sampleFoldingPose(folding, 0.8, { sequenceMode: 'root-out', hingeOverrides });
  const overridden = pose.hingeStateByEdgeKey.get(hinge.edgeKey);
  assert.ok(Math.abs(overridden.angleRadians - overrideAngle) < 1e-12);
  const diagnostics = analyzeFoldingPose(model, analysis, folding, pose, { collision: false });
  assert.ok(diagnostics.hingeContinuity.maximumGap < 1e-7);
  assert.ok(diagnostics.rigidity.maximumEdgeError < 1e-7);

  const serialized = serializeFoldingState(folding, {
    progress: 0.8,
    sequenceMode: 'root-out',
    hingeOverrides,
    selectedHingeEdgeKey: hinge.edgeKey,
  });
  const parsed = parseFoldingState(serialized, folding);
  assert.equal(parsed.selectedHingeEdgeKey, hinge.edgeKey);
  assert.ok(Math.abs(parsed.hingeOverrides[hinge.edgeKey].angleRadians - overrideAngle) < 1e-12);
});

test('discrete collision plumbing returns a bounded, explicit result contract', () => {
  const { model, analysis, folding } = catalogFixtures.find(({ model }) => model.id === 'cube');
  const pose = sampleFoldingPose(folding, 0.5, { sequenceMode: 'simultaneous' });
  const diagnostics = analyzeFoldingPose(model, analysis, folding, pose);
  assert.equal(diagnostics.collision.mode, 'discrete-zero-thickness');
  assert.ok(Number.isInteger(diagnostics.collision.broadPhasePairs));
  assert.ok(Array.isArray(diagnostics.collision.collisions));
  assert.ok(Array.isArray(diagnostics.collision.limitations));
});
