/** @typedef {[number, number]} Vec2 */
/** @typedef {[number, number, number]} Vec3 */
/** @typedef {[number, number, number, number, number, number]} Mat2D */

export const EPSILON = 1e-9;

/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
/** @param {Vec3} a @param {number} scalar @returns {Vec3} */
export const scale3 = (a, scalar) => [a[0] * scalar, a[1] * scalar, a[2] * scalar];
/** @param {Vec3} a @param {Vec3} b */
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
/** @param {Vec3} a */
export const length3 = (a) => Math.hypot(a[0], a[1], a[2]);
/** @param {Vec3} a @param {Vec3} b */
export const distance3 = (a, b) => length3(sub3(a, b));
/** @param {Vec3} a @returns {Vec3} */
export function normalize3(a) {
  const length = length3(a);
  return length <= EPSILON ? [0, 0, 0] : scale3(a, 1 / length);
}
/** @param {Vec3[]} points @returns {Vec3} */
export function centroid3(points) {
  if (points.length === 0) return [0, 0, 0];
  const total = points.reduce((sum, point) => add3(sum, point), /** @type {Vec3} */ ([0, 0, 0]));
  return scale3(total, 1 / points.length);
}
/** @param {number} value @param {number} min @param {number} max */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
/** @param {number} a @param {number} b @param {number} tolerance */
export const nearlyEqual = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
/** @param {number} radians */
export const toDegrees = (radians) => radians * 180 / Math.PI;
/** @param {number} degrees */
export const toRadians = (degrees) => degrees * Math.PI / 180;

/** Newell's method: stable for any planar polygon winding. @param {Vec3[]} points @returns {Vec3} */
export function polygonNormal3(points) {
  /** @type {Vec3} */
  const normal = [0, 0, 0];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    normal[0] += (current[1] - next[1]) * (current[2] + next[2]);
    normal[1] += (current[2] - next[2]) * (current[0] + next[0]);
    normal[2] += (current[0] - next[0]) * (current[1] + next[1]);
  }
  return normalize3(normal);
}

/** @param {Vec2} a @param {Vec2} b @returns {Vec2} */
export const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
/** @param {Vec2} a @param {Vec2} b @returns {Vec2} */
export const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
/** @param {Vec2} a @param {number} scalar @returns {Vec2} */
export const scale2 = (a, scalar) => [a[0] * scalar, a[1] * scalar];
/** @param {Vec2} a @param {Vec2} b */
export const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** @param {Vec2} a @param {Vec2} b */
export const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];
/** @param {Vec2} a */
export const length2 = (a) => Math.hypot(a[0], a[1]);
/** @param {Vec2} a @param {Vec2} b */
export const distance2 = (a, b) => length2(sub2(a, b));
/** @param {Vec2} a @returns {Vec2} */
export function normalize2(a) {
  const length = length2(a);
  return length <= EPSILON ? [0, 0] : scale2(a, 1 / length);
}
/** @param {Vec2[]} points @returns {Vec2} */
export function centroid2(points) {
  if (points.length === 0) return [0, 0];
  const total = points.reduce((sum, point) => add2(sum, point), /** @type {Vec2} */ ([0, 0]));
  return scale2(total, 1 / points.length);
}
/** Signed area; positive means counter-clockwise. @param {Vec2[]} points */
export function polygonArea2(points) {
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    twiceArea += cross2(points[index], points[(index + 1) % points.length]);
  }
  return twiceArea / 2;
}
/** @param {Vec2[]} points */
export function polygonPerimeter2(points) {
  let perimeter = 0;
  for (let index = 0; index < points.length; index += 1) {
    perimeter += distance2(points[index], points[(index + 1) % points.length]);
  }
  return perimeter;
}

/** Identity 2D affine transform. */
export const identity2 = /** @type {Mat2D} */ ([1, 0, 0, 1, 0, 0]);
/** @param {Mat2D} matrix @param {Vec2} point @returns {Vec2} */
export function apply2(matrix, point) {
  const [a, b, c, d, tx, ty] = matrix;
  return [a * point[0] + c * point[1] + tx, b * point[0] + d * point[1] + ty];
}
/** Returns left × right. @param {Mat2D} left @param {Mat2D} right @returns {Mat2D} */
export function multiply2(left, right) {
  const [a1, b1, c1, d1, tx1, ty1] = left;
  const [a2, b2, c2, d2, tx2, ty2] = right;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * tx2 + c1 * ty2 + tx1,
    b1 * tx2 + d1 * ty2 + ty1,
  ];
}
/** @param {Mat2D} matrix */
export const determinant2 = (matrix) => matrix[0] * matrix[3] - matrix[1] * matrix[2];

/**
 * Rigidly maps sourceA→targetA and sourceB→targetB. A tiny uniform scale is
 * tolerated to absorb floating point drift, but valid polyhedra should be 1:1.
 * @param {Vec2} sourceA @param {Vec2} sourceB @param {Vec2} targetA @param {Vec2} targetB
 * @returns {Mat2D}
 */
export function segmentTransform2(sourceA, sourceB, targetA, targetB) {
  const source = sub2(sourceB, sourceA);
  const target = sub2(targetB, targetA);
  const sourceLength = length2(source);
  const targetLength = length2(target);
  if (sourceLength <= EPSILON || targetLength <= EPSILON) {
    throw new Error('Cannot align a zero-length edge.');
  }
  const sourceAngle = Math.atan2(source[1], source[0]);
  const targetAngle = Math.atan2(target[1], target[0]);
  const angle = targetAngle - sourceAngle;
  const uniformScale = targetLength / sourceLength;
  const cosine = Math.cos(angle) * uniformScale;
  const sine = Math.sin(angle) * uniformScale;
  /** @type {Mat2D} */
  const rotation = [cosine, sine, -sine, cosine, 0, 0];
  const mappedSourceA = apply2(rotation, sourceA);
  rotation[4] = targetA[0] - mappedSourceA[0];
  rotation[5] = targetA[1] - mappedSourceA[1];
  return rotation;
}

/** @param {Vec2[]} points */
export function bounds2(points) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** @param {Vec2[]} polygon @param {Vec2} axis */
function projectPolygon(polygon, axis) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of polygon) {
    const projection = dot2(point, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }
  return { min, max };
}

/** Positive-area overlap test for convex polygons. Touching is allowed. */
export function convexPolygonsOverlap2(/** @type {Vec2[]} */ polygonA, /** @type {Vec2[]} */ polygonB, epsilon = 1e-7) {
  for (const polygon of [polygonA, polygonB]) {
    for (let index = 0; index < polygon.length; index += 1) {
      const edge = sub2(polygon[(index + 1) % polygon.length], polygon[index]);
      const axis = normalize2([-edge[1], edge[0]]);
      const a = projectPolygon(polygonA, axis);
      const b = projectPolygon(polygonB, axis);
      if (a.max <= b.min + epsilon || b.max <= a.min + epsilon) return false;
    }
  }
  return true;
}

/** Sutherland–Hodgman intersection area; both polygons must be convex and CCW. */
export function convexIntersectionArea2(/** @type {Vec2[]} */ subject, /** @type {Vec2[]} */ clip, epsilon = 1e-9) {
  if (!convexPolygonsOverlap2(subject, clip, epsilon)) return 0;
  let output = subject.slice();
  const clipArea = polygonArea2(clip);
  const clipSign = clipArea >= 0 ? 1 : -1;

  for (let edgeIndex = 0; edgeIndex < clip.length; edgeIndex += 1) {
    const edgeStart = clip[edgeIndex];
    const edgeEnd = clip[(edgeIndex + 1) % clip.length];
    const input = output;
    output = [];
    if (input.length === 0) break;

    const inside = (/** @type {Vec2} */ point) => clipSign * cross2(sub2(edgeEnd, edgeStart), sub2(point, edgeStart)) >= -epsilon;
    const intersection = (/** @type {Vec2} */ a, /** @type {Vec2} */ b) => {
      const segment = sub2(b, a);
      const clipEdge = sub2(edgeEnd, edgeStart);
      const denominator = cross2(segment, clipEdge);
      if (Math.abs(denominator) <= epsilon) return b;
      const t = cross2(sub2(edgeStart, a), clipEdge) / denominator;
      return add2(a, scale2(segment, t));
    };

    let previous = input[input.length - 1];
    let previousInside = inside(previous);
    for (const current of input) {
      const currentInside = inside(current);
      if (currentInside) {
        if (!previousInside) output.push(intersection(previous, current));
        output.push(current);
      } else if (previousInside) {
        output.push(intersection(previous, current));
      }
      previous = current;
      previousInside = currentInside;
    }
  }
  return Math.abs(polygonArea2(output));
}

/** @param {Vec2[]} polygon @returns {Vec2[]} */
export function ensureCounterClockwise2(polygon) {
  return polygonArea2(polygon) < 0 ? polygon.slice().reverse() : polygon.slice();
}

/** Deterministic PRNG for reproducible net search. */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** @template T @param {T[]} values @param {() => number} random */
export function shuffled(values, random) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

/** @param {number[]} values */
export function median(values) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** @param {number} value @param {number} digits */
export const roundTo = (value, digits = 4) => Number(value.toFixed(digits));
