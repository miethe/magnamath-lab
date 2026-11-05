import { distance3 } from './math.js';
import { analyzePoseCollisions } from './folding-collision.js';
import { foldingPosePolygons } from './folding.js';
import { matrixMaxError4, transformPoint4 } from './rigid.js';

function localVertex(frame, vertexIndex) {
  const local = frame.vertexToLocal.get(vertexIndex);
  if (!local) throw new Error(`Vertex ${vertexIndex} is not present in face ${frame.faceIndex}.`);
  return [local[0], local[1], 0];
}

function transformedFaceVertex(analysis, pose, faceIndex, vertexIndex) {
  return transformPoint4(pose.faceTransforms[faceIndex], localVertex(analysis.faceFrames[faceIndex], vertexIndex));
}

/** Exact and bounded diagnostic suite for one sampled folding pose. */
export function analyzeFoldingPose(polyhedron, analysis, foldingModel, pose, options = {}) {
  const hingeEntries = foldingModel.hinges.map((hinge) => {
    const edge = analysis.topology.edgeMap.get(hinge.edgeKey);
    const parentA = transformedFaceVertex(analysis, pose, hinge.parentFace, edge.a);
    const parentB = transformedFaceVertex(analysis, pose, hinge.parentFace, edge.b);
    const childA = transformedFaceVertex(analysis, pose, hinge.childFace, edge.a);
    const childB = transformedFaceVertex(analysis, pose, hinge.childFace, edge.b);
    return {
      edgeKey: hinge.edgeKey,
      parentFace: hinge.parentFace,
      childFace: hinge.childFace,
      endpointGapA: distance3(parentA, childA),
      endpointGapB: distance3(parentB, childB),
      maximumGap: Math.max(distance3(parentA, childA), distance3(parentB, childB)),
    };
  });
  const maximumHingeGap = Math.max(0, ...hingeEntries.map((entry) => entry.maximumGap));

  const closureEntries = [...foldingModel.cutEdgeKeys].map((edgeKey) => {
    const edge = analysis.topology.edgeMap.get(edgeKey);
    if (!edge || edge.incidences.length !== 2) return null;
    const [left, right] = edge.incidences;
    const leftA = transformedFaceVertex(analysis, pose, left.faceIndex, edge.a);
    const leftB = transformedFaceVertex(analysis, pose, left.faceIndex, edge.b);
    const rightA = transformedFaceVertex(analysis, pose, right.faceIndex, edge.a);
    const rightB = transformedFaceVertex(analysis, pose, right.faceIndex, edge.b);
    const gapA = distance3(leftA, rightA);
    const gapB = distance3(leftB, rightB);
    return {
      edgeKey,
      faces: [left.faceIndex, right.faceIndex],
      endpointGapA: gapA,
      endpointGapB: gapB,
      maximumGap: Math.max(gapA, gapB),
      averageGap: (gapA + gapB) / 2,
    };
  }).filter(Boolean);
  const maximumClosureGap = Math.max(0, ...closureEntries.map((entry) => entry.maximumGap));
  const averageClosureGap = closureEntries.length
    ? closureEntries.reduce((sum, entry) => sum + entry.averageGap, 0) / closureEntries.length
    : 0;

  const polygons = foldingPosePolygons(analysis, pose);
  let maximumRigidityError = 0;
  const faceRigidity = polygons.map((polygon, faceIndex) => {
    const source = analysis.faceFrames[faceIndex].local;
    let maximumEdgeError = 0;
    for (let index = 0; index < polygon.length; index += 1) {
      const currentLength = distance3(polygon[index], polygon[(index + 1) % polygon.length]);
      const from = source[index];
      const to = source[(index + 1) % source.length];
      const sourceLength = Math.hypot(to[0] - from[0], to[1] - from[1]);
      maximumEdgeError = Math.max(maximumEdgeError, Math.abs(currentLength - sourceLength));
    }
    maximumRigidityError = Math.max(maximumRigidityError, maximumEdgeError);
    return { faceIndex, maximumEdgeError };
  });

  let maximumTargetMatrixError = 0;
  for (let faceIndex = 0; faceIndex < foldingModel.faceCount; faceIndex += 1) {
    maximumTargetMatrixError = Math.max(
      maximumTargetMatrixError,
      matrixMaxError4(pose.faceTransforms[faceIndex], foldingModel.targetFaceTransforms[faceIndex]),
    );
  }

  const collision = options.collision === false
    ? null
    : analyzePoseCollisions(polyhedron, analysis, foldingModel, pose, options.collisionOptions);
  const tolerance = Number.isFinite(options.tolerance) ? Number(options.tolerance) : 1e-7;
  const closureTolerance = Number.isFinite(options.closureTolerance) ? Number(options.closureTolerance) : 1e-6;

  return {
    progress: pose.progress,
    hingeContinuity: {
      maximumGap: maximumHingeGap,
      valid: maximumHingeGap <= tolerance,
      entries: hingeEntries,
    },
    closure: {
      maximumGap: maximumClosureGap,
      averageGap: averageClosureGap,
      closedWithinTolerance: maximumClosureGap <= closureTolerance,
      entries: closureEntries,
    },
    rigidity: {
      maximumEdgeError: maximumRigidityError,
      valid: maximumRigidityError <= tolerance,
      faces: faceRigidity,
    },
    target: {
      maximumMatrixError: maximumTargetMatrixError,
      exactWithinTolerance: maximumTargetMatrixError <= tolerance,
    },
    collision,
    summary: {
      hingeContinuous: maximumHingeGap <= tolerance,
      rigidFaces: maximumRigidityError <= tolerance,
      collisionFreeAtSample: collision ? collision.collisionFree : null,
      targetClosed: pose.progress >= 1 - 1e-9 ? maximumClosureGap <= closureTolerance : null,
    },
  };
}
