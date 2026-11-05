import { EPSILON, clamp, cross3, dot3, length3, normalize3, sub3 } from './math.js';

/** @typedef {[number, number, number]} Vec3 */
/**
 * Row-major homogeneous 4×4 matrix.
 *
 * The upper-left 3×3 block is rotation, and translation occupies indices
 * 3, 7, and 11. `THREE.Matrix4#set(...matrix)` accepts the same row-major
 * argument order, which keeps the pure core and renderer boundary explicit.
 * @typedef {[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]} Mat4
 */

export const IDENTITY_4 = /** @type {Mat4} */ ([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

/** @returns {Mat4} */
export const identity4 = () => /** @type {Mat4} */ ([...IDENTITY_4]);

/** Returns left × right. @param {Mat4} left @param {Mat4} right @returns {Mat4} */
export function multiply4(left, right) {
  const result = new Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      for (let index = 0; index < 4; index += 1) {
        result[row * 4 + column] += left[row * 4 + index] * right[index * 4 + column];
      }
    }
  }
  return /** @type {Mat4} */ (result);
}

/** @param {Mat4} matrix @param {Vec3} point @returns {Vec3} */
export function transformPoint4(matrix, point) {
  return [
    matrix[0] * point[0] + matrix[1] * point[1] + matrix[2] * point[2] + matrix[3],
    matrix[4] * point[0] + matrix[5] * point[1] + matrix[6] * point[2] + matrix[7],
    matrix[8] * point[0] + matrix[9] * point[1] + matrix[10] * point[2] + matrix[11],
  ];
}

/** @param {Mat4} matrix @param {Vec3} vector @returns {Vec3} */
export function transformVector4(matrix, vector) {
  return [
    matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2],
    matrix[4] * vector[0] + matrix[5] * vector[1] + matrix[6] * vector[2],
    matrix[8] * vector[0] + matrix[9] * vector[1] + matrix[10] * vector[2],
  ];
}

/** Inverse of a rigid transform with an orthonormal rotation block. @param {Mat4} matrix @returns {Mat4} */
export function invertRigid4(matrix) {
  const tx = matrix[3];
  const ty = matrix[7];
  const tz = matrix[11];
  return [
    matrix[0], matrix[4], matrix[8], -(matrix[0] * tx + matrix[4] * ty + matrix[8] * tz),
    matrix[1], matrix[5], matrix[9], -(matrix[1] * tx + matrix[5] * ty + matrix[9] * tz),
    matrix[2], matrix[6], matrix[10], -(matrix[2] * tx + matrix[6] * ty + matrix[10] * tz),
    0, 0, 0, 1,
  ];
}

/** @param {{u:Vec3,v:Vec3,normal:Vec3,origin:Vec3}} frame @returns {Mat4} */
export function faceFrameToMatrix4(frame) {
  const { u, v, normal, origin } = frame;
  return [
    u[0], v[0], normal[0], origin[0],
    u[1], v[1], normal[1], origin[1],
    u[2], v[2], normal[2], origin[2],
    0, 0, 0, 1,
  ];
}

/** Converts MagnaMath's [a,b,c,d,tx,ty] affine matrix into a 3D rigid transform. @param {[number,number,number,number,number,number]} matrix @returns {Mat4} */
export function affine2ToMatrix4(matrix) {
  const [a, b, c, d, tx, ty] = matrix;
  return [
    a, c, 0, tx,
    b, d, 0, ty,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

/** @param {Vec3} translation @returns {Mat4} */
export function translation4(translation) {
  return [
    1, 0, 0, translation[0],
    0, 1, 0, translation[1],
    0, 0, 1, translation[2],
    0, 0, 0, 1,
  ];
}

/** @param {Vec3} axis @param {number} angle @returns {Mat4} */
export function axisAngle4(axis, angle) {
  const normalized = normalize3(axis);
  if (length3(normalized) <= EPSILON) throw new Error('A rotation axis must have non-zero length.');
  const [x, y, z] = normalized;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const complement = 1 - cosine;
  return [
    cosine + x * x * complement,
    x * y * complement - z * sine,
    x * z * complement + y * sine,
    0,
    y * x * complement + z * sine,
    cosine + y * y * complement,
    y * z * complement - x * sine,
    0,
    z * x * complement - y * sine,
    z * y * complement + x * sine,
    cosine + z * z * complement,
    0,
    0, 0, 0, 1,
  ];
}

/** Rotation around an arbitrary world-space line. @param {Vec3} point @param {Vec3} axis @param {number} angle @returns {Mat4} */
export function rotationAroundLine4(point, axis, angle) {
  return multiply4(
    multiply4(translation4(point), axisAngle4(axis, angle)),
    translation4([-point[0], -point[1], -point[2]]),
  );
}

/** Signed angle rotating `from` to `to` around `axis`. @param {Vec3} from @param {Vec3} to @param {Vec3} axis */
export function signedAngleAroundAxis(from, to, axis) {
  const normalizedFrom = normalize3(from);
  const normalizedTo = normalize3(to);
  const normalizedAxis = normalize3(axis);
  const sine = dot3(normalizedAxis, cross3(normalizedFrom, normalizedTo));
  const cosine = clamp(dot3(normalizedFrom, normalizedTo), -1, 1);
  return Math.atan2(sine, cosine);
}

/** @param {Mat4} left @param {Mat4} right */
export function matrixMaxError4(left, right) {
  let maximum = 0;
  for (let index = 0; index < 16; index += 1) maximum = Math.max(maximum, Math.abs(left[index] - right[index]));
  return maximum;
}

/** Maximum deviation of RᵀR from identity. @param {Mat4} matrix */
export function orthonormalityError4(matrix) {
  const columns = [
    /** @type {Vec3} */ ([matrix[0], matrix[4], matrix[8]]),
    /** @type {Vec3} */ ([matrix[1], matrix[5], matrix[9]]),
    /** @type {Vec3} */ ([matrix[2], matrix[6], matrix[10]]),
  ];
  let error = 0;
  for (let left = 0; left < 3; left += 1) {
    for (let right = 0; right < 3; right += 1) {
      const expected = left === right ? 1 : 0;
      error = Math.max(error, Math.abs(dot3(columns[left], columns[right]) - expected));
    }
  }
  return error;
}

/** Extracts a normalized axis from two points. @param {Vec3} from @param {Vec3} to */
export function axisFromPoints(from, to) {
  const axis = normalize3(sub3(to, from));
  if (length3(axis) <= EPSILON) throw new Error('A hinge edge cannot have zero length.');
  return axis;
}

/** Applies an optional scene/root transform. @param {Mat4} rootPose @param {Mat4[]} transforms */
export function applyRootPose(rootPose, transforms) {
  return transforms.map((transform) => multiply4(rootPose, transform));
}

/** @typedef {[number, number, number, number]} Quaternion */

/** @param {Quaternion} quaternion @returns {Quaternion} */
export function normalizeQuaternion(quaternion) {
  const magnitude = Math.hypot(quaternion[0], quaternion[1], quaternion[2], quaternion[3]);
  if (magnitude <= EPSILON) return [0, 0, 0, 1];
  return [
    quaternion[0] / magnitude,
    quaternion[1] / magnitude,
    quaternion[2] / magnitude,
    quaternion[3] / magnitude,
  ];
}

/** Shortest-path spherical interpolation. @param {Quaternion} from @param {Quaternion} to @param {number} amount @returns {Quaternion} */
export function slerpQuaternion(from, to, amount) {
  const left = normalizeQuaternion(from);
  let right = normalizeQuaternion(to);
  let cosine = left[0] * right[0] + left[1] * right[1] + left[2] * right[2] + left[3] * right[3];
  if (cosine < 0) {
    right = /** @type {Quaternion} */ (right.map((value) => -value));
    cosine = -cosine;
  }
  const t = clamp(amount, 0, 1);
  if (cosine > 0.9995) {
    return normalizeQuaternion(/** @type {Quaternion} */ (left.map((value, index) => value + t * (right[index] - value))));
  }
  const theta = Math.acos(clamp(cosine, -1, 1));
  const sine = Math.sin(theta);
  const leftWeight = Math.sin((1 - t) * theta) / sine;
  const rightWeight = Math.sin(t * theta) / sine;
  return normalizeQuaternion([
    left[0] * leftWeight + right[0] * rightWeight,
    left[1] * leftWeight + right[1] * rightWeight,
    left[2] * leftWeight + right[2] * rightWeight,
    left[3] * leftWeight + right[3] * rightWeight,
  ]);
}

/** Composes a rigid transform from translation and an [x,y,z,w] quaternion. @param {Vec3} translation @param {Quaternion} quaternion @returns {Mat4} */
export function composeRigid4(translation, quaternion) {
  const [x, y, z, w] = normalizeQuaternion(quaternion);
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), translation[0],
    2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), translation[1],
    2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), translation[2],
    0, 0, 0, 1,
  ];
}

/** Decomposes a rigid transform into translation and an [x,y,z,w] quaternion. @param {Mat4} matrix */
export function decomposeRigid4(matrix) {
  const translation = /** @type {Vec3} */ ([matrix[3], matrix[7], matrix[11]]);
  const m00 = matrix[0];
  const m11 = matrix[5];
  const m22 = matrix[10];
  const trace = m00 + m11 + m22;
  let quaternion;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    quaternion = [(matrix[9] - matrix[6]) / s, (matrix[2] - matrix[8]) / s, (matrix[4] - matrix[1]) / s, 0.25 * s];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    quaternion = [0.25 * s, (matrix[1] + matrix[4]) / s, (matrix[2] + matrix[8]) / s, (matrix[9] - matrix[6]) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    quaternion = [(matrix[1] + matrix[4]) / s, 0.25 * s, (matrix[6] + matrix[9]) / s, (matrix[2] - matrix[8]) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    quaternion = [(matrix[2] + matrix[8]) / s, (matrix[6] + matrix[9]) / s, 0.25 * s, (matrix[4] - matrix[1]) / s];
  }
  return { translation, quaternion: normalizeQuaternion(/** @type {Quaternion} */ (quaternion)) };
}
