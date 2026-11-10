import { SHAPE_CATALOG, createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import {
  createFoldingModel,
  createFoldingSchedule,
  foldingTargetFit,
  sampleFoldingPose,
} from '../src/core/folding.js';
import { analyzeFoldingPose } from '../src/core/folding-diagnostics.js';

const MODES = ['simultaneous', 'root-out', 'leaves-in', 'assembly'];
const PROGRESS = [0, 0.08, 0.25, 0.5, 0.75, 0.92, 1];
const TOLERANCE = 1e-7;
let sampledPoses = 0;
let maximumHingeGap = 0;
let maximumRigidityError = 0;
let maximumTargetError = 0;
let maximumClosureAtTarget = 0;
let collisionSamples = 0;
let collisionFreeSamples = 0;
const rows = [];

for (const entry of SHAPE_CATALOG) {
  const model = entry.parameter ? createShape(entry.id, entry.parameter.default) : createShape(entry.id);
  const analysis = analyzePolyhedron(model);
  const net = planNet(model, analysis, { seed: 41, objective: 'compact', attempts: 240 });
  const folding = createFoldingModel(model, analysis, net);
  const targetFit = foldingTargetFit(folding);
  if (!targetFit.exactWithinTolerance) throw new Error(`${entry.id}: exact target error ${targetFit.maximumMatrixError}`);
  maximumTargetError = Math.max(maximumTargetError, targetFit.maximumMatrixError);

  let modelMaxHinge = 0;
  let modelMaxRigidity = 0;
  let modelClosure = 0;
  for (const mode of MODES) {
    const schedule = createFoldingSchedule(folding, { mode, hingeDuration: 0.58 });
    for (const progress of PROGRESS) {
      const pose = sampleFoldingPose(folding, progress, { schedule });
      const diagnostics = analyzeFoldingPose(model, analysis, folding, pose, {
        collision: progress === 0 || progress === 0.5 || progress === 1,
      });
      sampledPoses += 1;
      modelMaxHinge = Math.max(modelMaxHinge, diagnostics.hingeContinuity.maximumGap);
      modelMaxRigidity = Math.max(modelMaxRigidity, diagnostics.rigidity.maximumEdgeError);
      maximumHingeGap = Math.max(maximumHingeGap, diagnostics.hingeContinuity.maximumGap);
      maximumRigidityError = Math.max(maximumRigidityError, diagnostics.rigidity.maximumEdgeError);
      if (progress === 1) {
        modelClosure = Math.max(modelClosure, diagnostics.closure.maximumGap);
        maximumClosureAtTarget = Math.max(maximumClosureAtTarget, diagnostics.closure.maximumGap);
      }
      if (diagnostics.collision) {
        collisionSamples += 1;
        if (diagnostics.collision.collisionFree) collisionFreeSamples += 1;
      }
      if (diagnostics.hingeContinuity.maximumGap > TOLERANCE) {
        throw new Error(`${entry.id}/${mode}/${progress}: hinge gap ${diagnostics.hingeContinuity.maximumGap}`);
      }
      if (diagnostics.rigidity.maximumEdgeError > TOLERANCE) {
        throw new Error(`${entry.id}/${mode}/${progress}: rigidity error ${diagnostics.rigidity.maximumEdgeError}`);
      }
      if (progress === 1 && diagnostics.closure.maximumGap > 1e-6) {
        throw new Error(`${entry.id}/${mode}: closure gap ${diagnostics.closure.maximumGap}`);
      }
    }
  }
  rows.push({
    id: entry.id,
    faces: analysis.faces.length,
    hinges: folding.hinges.length,
    netValid: net.valid,
    maximumHingeGap: modelMaxHinge,
    maximumRigidityError: modelMaxRigidity,
    closureAtTarget: modelClosure,
    targetMatrixError: targetFit.maximumMatrixError,
  });
}

console.log(JSON.stringify({
  release: '0.4.1',
  catalogEntries: rows.length,
  modes: MODES,
  progressSamples: PROGRESS,
  sampledPoses,
  maximumHingeGap,
  maximumRigidityError,
  maximumClosureAtTarget,
  maximumTargetError,
  collisionScreen: {
    samples: collisionSamples,
    collisionFreeSamples,
    note: 'Discrete zero-thickness sample results are diagnostic only and are not a continuous-path proof.',
  },
  rows,
}, null, 2));
