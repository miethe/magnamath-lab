import {
  EPSILON,
  clamp,
  convexIntersectionArea2,
  cross3,
  distance3,
  dot3,
  length3,
  normalize3,
  polygonNormal3,
  sub3,
} from './math.js';
import { foldingPosePolygons } from './folding.js';

/** @typedef {[number,number]} Vec2 */
/** @typedef {[number,number,number]} Vec3 */

function bounds3(points) {
  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const point of points) {
    for (let axis = 0; axis < 3; axis += 1) {
      minimum[axis] = Math.min(minimum[axis], point[axis]);
      maximum[axis] = Math.max(maximum[axis], point[axis]);
    }
  }
  return { minimum, maximum };
}

function aabbOverlap(left, right, tolerance) {
  for (let axis = 0; axis < 3; axis += 1) {
    if (left.maximum[axis] < right.minimum[axis] - tolerance || right.maximum[axis] < left.minimum[axis] - tolerance) return false;
  }
  return true;
}

function dominantProjectionAxis(normal) {
  const absolute = normal.map(Math.abs);
  if (absolute[0] >= absolute[1] && absolute[0] >= absolute[2]) return 0;
  if (absolute[1] >= absolute[2]) return 1;
  return 2;
}

/** @param {Vec3} point @param {number} droppedAxis @returns {Vec2} */
function project2(point, droppedAxis) {
  if (droppedAxis === 0) return [point[1], point[2]];
  if (droppedAxis === 1) return [point[0], point[2]];
  return [point[0], point[1]];
}

function signedDistanceToPlane(point, origin, normal) {
  return dot3(sub3(point, origin), normal);
}

function pointInConvexPolygon3(point, polygon, normal, tolerance) {
  let sign = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const from = polygon[index];
    const to = polygon[(index + 1) % polygon.length];
    const side = dot3(cross3(sub3(to, from), sub3(point, from)), normal);
    if (Math.abs(side) <= tolerance) continue;
    const current = Math.sign(side);
    if (sign === 0) sign = current;
    else if (sign !== current) return false;
  }
  return true;
}

function pointSegmentDistance3(point, from, to) {
  const segment = sub3(to, from);
  const denominator = dot3(segment, segment);
  if (denominator <= EPSILON) return distance3(point, from);
  const t = clamp(dot3(sub3(point, from), segment) / denominator, 0, 1);
  const projection = [from[0] + segment[0] * t, from[1] + segment[1] * t, from[2] + segment[2] * t];
  return distance3(point, projection);
}

function segmentPlaneIntersection(from, to, planeOrigin, planeNormal, tolerance) {
  const fromDistance = signedDistanceToPlane(from, planeOrigin, planeNormal);
  const toDistance = signedDistanceToPlane(to, planeOrigin, planeNormal);
  if (Math.abs(fromDistance) <= tolerance && Math.abs(toDistance) <= tolerance) return null;
  if (fromDistance > tolerance && toDistance > tolerance) return null;
  if (fromDistance < -tolerance && toDistance < -tolerance) return null;
  const denominator = fromDistance - toDistance;
  if (Math.abs(denominator) <= tolerance) return null;
  const t = fromDistance / denominator;
  if (t < -tolerance || t > 1 + tolerance) return null;
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

function uniquePoints(points, tolerance) {
  const unique = [];
  for (const point of points) {
    if (!unique.some((candidate) => distance3(point, candidate) <= tolerance)) unique.push(point);
  }
  return unique;
}

function polygonIntersection(polyA, polyB, tolerance, areaTolerance) {
  const normalA = polygonNormal3(polyA);
  const normalB = polygonNormal3(polyB);
  if (length3(normalA) <= EPSILON || length3(normalB) <= EPSILON) return { intersects: false, kind: 'degenerate', points: [], overlapArea: 0 };
  const distancesB = polyB.map((point) => signedDistanceToPlane(point, polyA[0], normalA));
  const distancesA = polyA.map((point) => signedDistanceToPlane(point, polyB[0], normalB));
  if (distancesB.every((value) => value > tolerance) || distancesB.every((value) => value < -tolerance)) return { intersects: false, kind: 'separated-plane-a', points: [], overlapArea: 0 };
  if (distancesA.every((value) => value > tolerance) || distancesA.every((value) => value < -tolerance)) return { intersects: false, kind: 'separated-plane-b', points: [], overlapArea: 0 };

  const parallel = length3(cross3(normalA, normalB)) <= tolerance * 10;
  const planeDistance = Math.abs(signedDistanceToPlane(polyB[0], polyA[0], normalA));
  if (parallel && planeDistance <= tolerance * 4) {
    const axis = dominantProjectionAxis(normalA);
    const projectedA = polyA.map((point) => project2(point, axis));
    const projectedB = polyB.map((point) => project2(point, axis));
    const area = convexIntersectionArea2(projectedA, projectedB, tolerance);
    return {
      intersects: area > areaTolerance,
      kind: area > areaTolerance ? 'coplanar-overlap' : 'coplanar-touch',
      points: [],
      overlapArea: area,
    };
  }

  const points = [];
  for (let index = 0; index < polyA.length; index += 1) {
    const point = segmentPlaneIntersection(polyA[index], polyA[(index + 1) % polyA.length], polyB[0], normalB, tolerance);
    if (point && pointInConvexPolygon3(point, polyB, normalB, tolerance * 4)) points.push(point);
  }
  for (let index = 0; index < polyB.length; index += 1) {
    const point = segmentPlaneIntersection(polyB[index], polyB[(index + 1) % polyB.length], polyA[0], normalA, tolerance);
    if (point && pointInConvexPolygon3(point, polyA, normalA, tolerance * 4)) points.push(point);
  }
  const unique = uniquePoints(points, tolerance * 4);
  return {
    intersects: unique.length > 0,
    kind: unique.length > 1 ? 'line-crossing' : unique.length === 1 ? 'point-crossing' : 'separated',
    points: unique,
    overlapArea: 0,
  };
}

function pairTopology(analysis, leftFace, rightFace) {
  const connection = analysis.topology.adjacency[leftFace].find((item) => item.faceIndex === rightFace);
  const leftVertices = new Set(analysis.faceFrames[leftFace].face);
  const sharedVertices = analysis.faceFrames[rightFace].face.filter((vertex) => leftVertices.has(vertex));
  return {
    edgeKey: connection?.edgeKey ?? null,
    sharedVertices,
  };
}

function facePointForVertex(analysis, pose, faceIndex, vertexIndex) {
  const frame = analysis.faceFrames[faceIndex];
  const local = frame.vertexToLocal.get(vertexIndex);
  if (!local) return null;
  const matrix = pose.faceTransforms[faceIndex];
  return [
    matrix[0] * local[0] + matrix[1] * local[1] + matrix[3],
    matrix[4] * local[0] + matrix[5] * local[1] + matrix[7],
    matrix[8] * local[0] + matrix[9] * local[1] + matrix[11],
  ];
}

function contactMatchesTopology(result, topology, analysis, pose, leftFace, rightFace, tolerance) {
  if (!result.points.length) return false;
  if (topology.edgeKey) {
    const edge = analysis.topology.edgeMap.get(topology.edgeKey);
    const leftA = facePointForVertex(analysis, pose, leftFace, edge.a);
    const leftB = facePointForVertex(analysis, pose, leftFace, edge.b);
    const rightA = facePointForVertex(analysis, pose, rightFace, edge.a);
    const rightB = facePointForVertex(analysis, pose, rightFace, edge.b);
    const endpointGap = Math.max(distance3(leftA, rightA), distance3(leftB, rightB));
    if (endpointGap > tolerance * 8) return false;
    return result.points.every((point) => (
      pointSegmentDistance3(point, leftA, leftB) <= tolerance * 8
      && pointSegmentDistance3(point, rightA, rightB) <= tolerance * 8
    ));
  }
  if (topology.sharedVertices.length) {
    const targets = topology.sharedVertices.flatMap((vertexIndex) => [
      facePointForVertex(analysis, pose, leftFace, vertexIndex),
      facePointForVertex(analysis, pose, rightFace, vertexIndex),
    ]).filter(Boolean);
    return result.points.every((point) => targets.some((target) => distance3(point, target) <= tolerance * 8));
  }
  return false;
}

/**
 * Discrete zero-thickness self-intersection screen for a sampled folding pose.
 *
 * This is intentionally not continuous collision detection and not a thick
 * panel solver. It provides deterministic broad-phase/narrow-phase plumbing,
 * contact classification, and a stable result contract for later replacement
 * or augmentation by a dedicated geometry/physics engine.
 */
export function analyzePoseCollisions(polyhedron, analysis, foldingModel, pose, options = {}) {
  const tolerance = Number.isFinite(options.tolerance) ? Number(options.tolerance) : 1e-7;
  const areaTolerance = Number.isFinite(options.areaTolerance) ? Number(options.areaTolerance) : 1e-8;
  const skipHingeNeighbors = options.skipHingeNeighbors !== false;
  const polygons = foldingPosePolygons(analysis, pose);
  const boxes = polygons.map(bounds3);
  const collisions = [];
  const contacts = [];
  let broadPhasePairs = 0;
  let narrowPhasePairs = 0;

  for (let leftFace = 0; leftFace < polygons.length; leftFace += 1) {
    for (let rightFace = leftFace + 1; rightFace < polygons.length; rightFace += 1) {
      const topology = pairTopology(analysis, leftFace, rightFace);
      if (skipHingeNeighbors && topology.edgeKey && foldingModel.treeEdgeKeys.has(topology.edgeKey)) continue;
      if (!aabbOverlap(boxes[leftFace], boxes[rightFace], tolerance)) continue;
      broadPhasePairs += 1;
      const result = polygonIntersection(polygons[leftFace], polygons[rightFace], tolerance, areaTolerance);
      narrowPhasePairs += 1;
      if (!result.intersects) continue;
      const intendedContact = contactMatchesTopology(result, topology, analysis, pose, leftFace, rightFace, tolerance);
      const entry = {
        leftFace,
        rightFace,
        edgeKey: topology.edgeKey,
        sharedVertices: topology.sharedVertices,
        kind: result.kind,
        points: result.points,
        overlapArea: result.overlapArea,
        intendedContact,
      };
      if (intendedContact) contacts.push(entry);
      else collisions.push(entry);
    }
  }

  return {
    mode: 'discrete-zero-thickness',
    faceCount: polygons.length,
    broadPhasePairs,
    narrowPhasePairs,
    collisionCount: collisions.length,
    contactCount: contacts.length,
    collisions,
    contacts,
    collisionFree: collisions.length === 0,
    limitations: [
      'Samples only the current pose; motion between samples can still intersect.',
      'Faces have zero thickness and no connector geometry.',
      'Hinge-neighbor pairs are excluded by default to suppress their intentional shared edge.',
      'A collision-free result does not establish a physically feasible folding path.',
    ],
  };
}
