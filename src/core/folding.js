import { clamp, distance3, dot3, length3, normalize3, sub3 } from './math.js';
import {
  IDENTITY_4,
  affine2ToMatrix4,
  axisFromPoints,
  faceFrameToMatrix4,
  identity4,
  invertRigid4,
  matrixMaxError4,
  multiply4,
  rotationAroundLine4,
  signedAngleAroundAxis,
  transformPoint4,
  transformVector4,
} from './rigid.js';

/** @typedef {import('./rigid.js').Mat4} Mat4 */
/** @typedef {import('./math.js').Vec3} Vec3 */

export const FOLDING_PLAN_SCHEMA = 'https://magnamath.app/schema/folding-plan/v1';

export const FOLD_SEQUENCE_MODES = Object.freeze({
  simultaneous: {
    id: 'simultaneous',
    label: 'Together',
    description: 'Every hinge advances over the full timeline.',
  },
  'root-out': {
    id: 'root-out',
    label: 'Root outward',
    description: 'Hinges near the anchor move first, followed by deeper branches.',
  },
  'leaves-in': {
    id: 'leaves-in',
    label: 'Leaves inward',
    description: 'Outer branches begin first and motion travels toward the anchor.',
  },
  assembly: {
    id: 'assembly',
    label: 'Build order',
    description: 'Hinges advance in the current rooted net order.',
  },
  custom: {
    id: 'custom',
    label: 'Custom timeline',
    description: 'Uses explicit per-hinge timeline windows.',
  },
});

export const FOLD_EASINGS = Object.freeze({
  linear: (value) => clamp(value, 0, 1),
  smoothstep: (value) => {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  },
  smootherstep: (value) => {
    const t = clamp(value, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  'ease-in-out-cubic': (value) => {
    const t = clamp(value, 0, 1);
    return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  },
});

function easingFunction(value) {
  if (typeof value === 'function') return value;
  return FOLD_EASINGS[value] ?? FOLD_EASINGS['ease-in-out-cubic'];
}

/** @param {any} net @param {number} faceCount */
function validateNetTree(net, faceCount) {
  if (!net || !Array.isArray(net.parentByFace) || !Array.isArray(net.order) || !Array.isArray(net.connectionByFace)) {
    throw new Error('A folding model requires a rooted net tree.');
  }
  if (net.parentByFace.length !== faceCount || net.connectionByFace.length !== faceCount || net.order.length !== faceCount) {
    throw new Error('The net tree does not contain exactly one entry for every face.');
  }
  if (!Number.isInteger(net.rootFace) || net.rootFace < 0 || net.rootFace >= faceCount) {
    throw new Error('The net root face is invalid.');
  }
  if (!(net.treeEdgeKeys instanceof Set) || net.treeEdgeKeys.size !== faceCount - 1) {
    throw new Error(`A one-piece folding tree requires exactly ${faceCount - 1} hinges.`);
  }
}

function faceDepths(net) {
  const depthByFace = new Array(net.parentByFace.length).fill(0);
  for (const faceIndex of net.order.slice(1)) {
    const parentFace = net.parentByFace[faceIndex];
    depthByFace[faceIndex] = depthByFace[parentFace] + 1;
  }
  return depthByFace;
}

/**
 * Constructs an exact tree-hinge kinematic model.
 *
 * The flat state is the selected 2D net. The target state is the exact source
 * polyhedron rigidly aligned so the root face remains fixed in the net plane.
 * Every non-root face has one rotational degree of freedom around its shared
 * edge with its tree parent.
 */
export function createFoldingModel(polyhedron, analysis, net, options = {}) {
  const faceCount = analysis.faces.length;
  validateNetTree(net, faceCount);

  const flatFaceTransforms = net.transforms.map((transform) => affine2ToMatrix4(transform));
  const sourceFoldedTransforms = analysis.faceFrames.map((frame) => faceFrameToMatrix4(frame));
  const rootFace = net.rootFace;
  const sourceToFlatRoot = multiply4(flatFaceTransforms[rootFace], invertRigid4(sourceFoldedTransforms[rootFace]));
  const targetFaceTransforms = sourceFoldedTransforms.map((transform) => multiply4(sourceToFlatRoot, transform));
  const depthByFace = faceDepths(net);
  const childrenByFace = Array.from({ length: faceCount }, () => []);
  const hinges = [];

  for (const [orderIndex, childFace] of net.order.slice(1).entries()) {
    const parentFace = net.parentByFace[childFace];
    const connection = net.connectionByFace[childFace];
    if (!connection?.edge || connection.edge.incidences?.length !== 2) {
      throw new Error(`Face ${childFace} has no valid parent hinge connection.`);
    }
    const edge = connection.edge;
    const parentFrame = analysis.faceFrames[parentFace];
    const parentA2 = parentFrame.vertexToLocal.get(edge.a);
    const parentB2 = parentFrame.vertexToLocal.get(edge.b);
    if (!parentA2 || !parentB2) throw new Error(`Hinge ${edge.key} is missing from parent face ${parentFace}.`);
    const pivot = /** @type {Vec3} */ ([parentA2[0], parentA2[1], 0]);
    const end = /** @type {Vec3} */ ([parentB2[0], parentB2[1], 0]);
    const axis = axisFromPoints(pivot, end);

    const flatRelativeTransform = multiply4(invertRigid4(flatFaceTransforms[parentFace]), flatFaceTransforms[childFace]);
    const targetRelativeTransform = multiply4(invertRigid4(targetFaceTransforms[parentFace]), targetFaceTransforms[childFace]);
    const flatChildNormal = transformVector4(flatRelativeTransform, [0, 0, 1]);
    const targetChildNormal = transformVector4(targetRelativeTransform, [0, 0, 1]);
    const targetAngleRadians = signedAngleAroundAxis(flatChildNormal, targetChildNormal, axis);
    const predictedTargetRelative = multiply4(
      rotationAroundLine4(pivot, axis, targetAngleRadians),
      flatRelativeTransform,
    );
    const targetFitError = matrixMaxError4(predictedTargetRelative, targetRelativeTransform);
    if (targetFitError > (options.targetFitTolerance ?? 1e-7)) {
      throw new Error(`Hinge ${edge.key} cannot reproduce its exact target transform (error ${targetFitError}).`);
    }

    const targetExteriorRadians = Math.abs(targetAngleRadians);
    const targetInteriorRadians = Math.PI - targetExteriorRadians;
    const hinge = {
      index: orderIndex,
      id: edge.key,
      edgeKey: edge.key,
      parentFace,
      childFace,
      depth: depthByFace[childFace],
      pivot,
      end,
      axis,
      edgeLength: distance3(pivot, end),
      flatRelativeTransform,
      targetRelativeTransform,
      targetAngleRadians,
      targetExteriorRadians,
      targetInteriorRadians,
      direction: targetAngleRadians >= 0 ? 'positive' : 'negative',
      targetFitError,
    };
    hinges.push(hinge);
    childrenByFace[parentFace].push(childFace);
  }

  const hingeByEdgeKey = new Map(hinges.map((hinge) => [hinge.edgeKey, hinge]));
  const hingeByChildFace = new Map(hinges.map((hinge) => [hinge.childFace, hinge]));
  const maximumDepth = Math.max(0, ...depthByFace);

  return {
    schema: FOLDING_PLAN_SCHEMA,
    polyhedronId: polyhedron.id,
    faceCount,
    rootFace,
    rootTransform: flatFaceTransforms[rootFace],
    sourceToFlatRoot,
    flatFaceTransforms,
    targetFaceTransforms,
    depthByFace,
    maximumDepth,
    childrenByFace,
    hinges,
    hingeByEdgeKey,
    hingeByChildFace,
    order: net.order.slice(),
    treeEdgeKeys: new Set(net.treeEdgeKeys),
    cutEdgeKeys: new Set(net.cutEdgeKeys),
    netSignature: [...net.treeEdgeKeys].sort().join('|'),
  };
}

function scheduleWindow(rank, maximumRank, duration) {
  if (maximumRank <= 0) return { start: 0, end: 1 };
  const boundedDuration = clamp(duration, 0.05, 1);
  const start = rank / maximumRank * (1 - boundedDuration);
  return { start, end: Math.min(1, start + boundedDuration) };
}

/**
 * Creates normalized timeline windows for every hinge.
 * @param {ReturnType<typeof createFoldingModel>} foldingModel
 */
export function createFoldingSchedule(foldingModel, options = {}) {
  const mode = options.mode in FOLD_SEQUENCE_MODES ? options.mode : 'simultaneous';
  const duration = Number.isFinite(options.hingeDuration) ? Number(options.hingeDuration) : 0.58;
  const custom = options.custom ?? {};
  const maximumDepth = Math.max(1, foldingModel.maximumDepth);
  const maximumOrder = Math.max(1, foldingModel.hinges.length - 1);
  const schedule = {};

  for (const hinge of foldingModel.hinges) {
    let window;
    if (mode === 'simultaneous') {
      window = { start: 0, end: 1 };
    } else if (mode === 'root-out') {
      window = scheduleWindow(Math.max(0, hinge.depth - 1), Math.max(1, maximumDepth - 1), duration);
    } else if (mode === 'leaves-in') {
      window = scheduleWindow(Math.max(0, maximumDepth - hinge.depth), Math.max(1, maximumDepth - 1), duration);
    } else if (mode === 'assembly') {
      window = scheduleWindow(hinge.index, maximumOrder, duration);
    } else {
      const supplied = custom[hinge.edgeKey];
      window = supplied && Number.isFinite(supplied.start) && Number.isFinite(supplied.end)
        ? { start: clamp(supplied.start, 0, 1), end: clamp(supplied.end, 0, 1) }
        : { start: 0, end: 1 };
    }
    if (window.end <= window.start) window.end = Math.min(1, window.start + 1e-6);
    schedule[hinge.edgeKey] = {
      edgeKey: hinge.edgeKey,
      start: window.start,
      end: window.end,
      easing: options.easing ?? 'ease-in-out-cubic',
    };
  }
  return { mode, hingeDuration: duration, entries: schedule };
}

/** @param {any} overrides */
function normalizeOverrides(overrides) {
  if (overrides instanceof Map) return overrides;
  const map = new Map();
  if (!overrides || typeof overrides !== 'object') return map;
  for (const [edgeKey, value] of Object.entries(overrides)) {
    if (Number.isFinite(value)) map.set(edgeKey, { angleRadians: Number(value) });
    else if (value && Number.isFinite(value.angleRadians)) map.set(edgeKey, { ...value, angleRadians: Number(value.angleRadians) });
  }
  return map;
}

/** @param {number} progress @param {{start:number,end:number,easing?:string|Function}} entry */
export function sampleTimelineWindow(progress, entry) {
  const denominator = Math.max(1e-9, entry.end - entry.start);
  const local = clamp((progress - entry.start) / denominator, 0, 1);
  return easingFunction(entry.easing)(local);
}

/**
 * Samples a hinge-constrained pose at normalized progress 0=flat, 1=folded.
 * @param {ReturnType<typeof createFoldingModel>} foldingModel
 */
export function sampleFoldingPose(foldingModel, progress, options = {}) {
  const normalizedProgress = clamp(Number(progress) || 0, 0, 1);
  const schedule = options.schedule?.entries
    ? options.schedule
    : createFoldingSchedule(foldingModel, {
      mode: options.sequenceMode ?? 'simultaneous',
      hingeDuration: options.hingeDuration,
      easing: options.easing,
      custom: options.customSchedule,
    });
  const overrides = normalizeOverrides(options.hingeOverrides);
  const rootPose = Array.isArray(options.rootPose) && options.rootPose.length === 16
    ? /** @type {Mat4} */ (options.rootPose.slice())
    : identity4();
  const faceTransforms = new Array(foldingModel.faceCount);
  faceTransforms[foldingModel.rootFace] = multiply4(rootPose, foldingModel.rootTransform);
  const hingeStates = [];

  for (const faceIndex of foldingModel.order.slice(1)) {
    const hinge = foldingModel.hingeByChildFace.get(faceIndex);
    const parentTransform = faceTransforms[hinge.parentFace];
    const timeline = schedule.entries[hinge.edgeKey] ?? { start: 0, end: 1, easing: 'linear' };
    const timelineProgress = sampleTimelineWindow(normalizedProgress, timeline);
    const override = overrides.get(hinge.edgeKey);
    const unclampedAngle = override?.angleRadians ?? hinge.targetAngleRadians * timelineProgress;
    const minimum = options.allowOverfold
      ? Math.min(hinge.targetAngleRadians, 0) - Math.PI / 2
      : Math.min(hinge.targetAngleRadians, 0);
    const maximum = options.allowOverfold
      ? Math.max(hinge.targetAngleRadians, 0) + Math.PI / 2
      : Math.max(hinge.targetAngleRadians, 0);
    const angleRadians = clamp(unclampedAngle, minimum, maximum);
    const relativeTransform = multiply4(
      rotationAroundLine4(hinge.pivot, hinge.axis, angleRadians),
      hinge.flatRelativeTransform,
    );
    const childTransform = multiply4(parentTransform, relativeTransform);
    faceTransforms[faceIndex] = childTransform;
    const pivotWorld = transformPoint4(parentTransform, hinge.pivot);
    const endWorld = transformPoint4(parentTransform, hinge.end);
    const axisWorld = normalize3(transformVector4(parentTransform, hinge.axis));
    hingeStates.push({
      ...hinge,
      angleRadians,
      angleDegrees: angleRadians * 180 / Math.PI,
      targetAngleDegrees: hinge.targetAngleRadians * 180 / Math.PI,
      normalizedAngle: Math.abs(hinge.targetAngleRadians) <= 1e-12 ? 1 : angleRadians / hinge.targetAngleRadians,
      timelineProgress,
      overridden: Boolean(override),
      pivotWorld,
      endWorld,
      axisWorld,
    });
  }

  return {
    schema: FOLDING_PLAN_SCHEMA,
    progress: normalizedProgress,
    sequenceMode: schedule.mode,
    schedule,
    rootPose,
    faceTransforms,
    hingeStates,
    hingeStateByEdgeKey: new Map(hingeStates.map((hinge) => [hinge.edgeKey, hinge])),
  };
}

/** Returns transformed polygons, one ordered 3D point list per mathematical face. */
export function foldingPosePolygons(analysis, pose) {
  return analysis.faceFrames.map((frame, faceIndex) => frame.local.map(([x, y]) => (
    transformPoint4(pose.faceTransforms[faceIndex], [x, y, 0])
  )));
}

/** Averages all face copies of each source vertex into one canonical pose vertex. */
export function foldingPoseVertices(polyhedron, analysis, pose) {
  const samples = Array.from({ length: polyhedron.vertices.length }, () => []);
  analysis.faceFrames.forEach((frame, faceIndex) => {
    frame.face.forEach((vertexIndex, localIndex) => {
      const [x, y] = frame.local[localIndex];
      samples[vertexIndex].push(transformPoint4(pose.faceTransforms[faceIndex], [x, y, 0]));
    });
  });
  return samples.map((points) => {
    const total = points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]], [0, 0, 0]);
    return /** @type {Vec3} */ (total.map((value) => value / Math.max(1, points.length)));
  });
}

/** Exact target-fit summary used by tests and release validation. */
export function foldingTargetFit(foldingModel) {
  const pose = sampleFoldingPose(foldingModel, 1, { sequenceMode: 'simultaneous' });
  let maximumMatrixError = 0;
  for (let faceIndex = 0; faceIndex < foldingModel.faceCount; faceIndex += 1) {
    maximumMatrixError = Math.max(maximumMatrixError, matrixMaxError4(pose.faceTransforms[faceIndex], foldingModel.targetFaceTransforms[faceIndex]));
  }
  return {
    maximumMatrixError,
    exactWithinTolerance: maximumMatrixError <= 1e-7,
  };
}

/** Serializes only stable plan/state fields, excluding Maps and derived matrices. */
export function serializeFoldingState(foldingModel, poseOptions = {}) {
  const schedule = poseOptions.schedule?.entries
    ? poseOptions.schedule
    : createFoldingSchedule(foldingModel, {
      mode: poseOptions.sequenceMode ?? 'simultaneous',
      hingeDuration: poseOptions.hingeDuration,
      easing: poseOptions.easing,
      custom: poseOptions.customSchedule,
    });
  const overrides = normalizeOverrides(poseOptions.hingeOverrides);
  return {
    schema: FOLDING_PLAN_SCHEMA,
    netSignature: foldingModel.netSignature,
    rootFace: foldingModel.rootFace,
    progress: clamp(Number(poseOptions.progress) || 0, 0, 1),
    sequenceMode: schedule.mode,
    hingeDuration: schedule.hingeDuration,
    schedule: Object.values(schedule.entries).map((entry) => ({ ...entry, easing: typeof entry.easing === 'string' ? entry.easing : 'custom' })),
    hingeOverrides: [...overrides.entries()].map(([edgeKey, value]) => ({ edgeKey, angleRadians: value.angleRadians })),
    selectedHingeEdgeKey: poseOptions.selectedHingeEdgeKey ?? null,
    showHinges: poseOptions.showHinges !== false,
    collisionScreen: poseOptions.collisionScreen !== false,
    rootPose: Array.isArray(poseOptions.rootPose) && poseOptions.rootPose.length === 16 ? poseOptions.rootPose.slice() : [...IDENTITY_4],
  };
}

/** Rehydrates the stable user-controlled folding state against a current model. */
export function parseFoldingState(value, foldingModel) {
  const input = value && typeof value === 'object' ? value : {};
  if (input.netSignature && input.netSignature !== foldingModel.netSignature) {
    throw new Error('The saved folding state belongs to a different fold tree.');
  }
  const sequenceMode = input.sequenceMode in FOLD_SEQUENCE_MODES ? input.sequenceMode : 'simultaneous';
  const scheduleEntries = {};
  for (const entry of Array.isArray(input.schedule) ? input.schedule : []) {
    if (!foldingModel.hingeByEdgeKey.has(entry.edgeKey)) continue;
    if (!Number.isFinite(entry.start) || !Number.isFinite(entry.end)) continue;
    scheduleEntries[entry.edgeKey] = {
      edgeKey: entry.edgeKey,
      start: clamp(entry.start, 0, 1),
      end: clamp(entry.end, 0, 1),
      easing: entry.easing in FOLD_EASINGS ? entry.easing : 'ease-in-out-cubic',
    };
  }
  const schedule = sequenceMode === 'custom' && Object.keys(scheduleEntries).length
    ? { mode: 'custom', hingeDuration: Number(input.hingeDuration) || 0.58, entries: scheduleEntries }
    : createFoldingSchedule(foldingModel, { mode: sequenceMode, hingeDuration: Number(input.hingeDuration) || 0.58 });
  const hingeOverrides = {};
  for (const override of Array.isArray(input.hingeOverrides) ? input.hingeOverrides : []) {
    if (foldingModel.hingeByEdgeKey.has(override.edgeKey) && Number.isFinite(override.angleRadians)) {
      hingeOverrides[override.edgeKey] = { angleRadians: override.angleRadians };
    }
  }
  return {
    progress: clamp(Number(input.progress) || 0, 0, 1),
    sequenceMode,
    hingeDuration: Number(input.hingeDuration) || 0.58,
    schedule,
    hingeOverrides,
    selectedHingeEdgeKey: foldingModel.hingeByEdgeKey.has(input.selectedHingeEdgeKey) ? input.selectedHingeEdgeKey : null,
    showHinges: input.showHinges !== false,
    collisionScreen: input.collisionScreen !== false,
    rootPose: Array.isArray(input.rootPose) && input.rootPose.length === 16 && input.rootPose.every(Number.isFinite)
      ? input.rootPose.slice()
      : [...IDENTITY_4],
  };
}
