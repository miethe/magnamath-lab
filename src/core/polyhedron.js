import {
  EPSILON,
  add3,
  centroid3,
  clamp,
  cross3,
  distance3,
  dot3,
  length3,
  median,
  normalize3,
  polygonArea2,
  polygonNormal3,
  roundTo,
  scale3,
  sub3,
  toDegrees,
} from './math.js';

/** @typedef {import('./math.js').Vec2} Vec2 */
/** @typedef {import('./math.js').Vec3} Vec3 */

/**
 * @typedef {Object} Polyhedron
 * @property {string} id
 * @property {string} name
 * @property {string} family
 * @property {Vec3[]} vertices
 * @property {number[][]} faces
 * @property {Record<string, any>} metadata
 */

/** @param {number} a @param {number} b */
export const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;

/** @param {Polyhedron} polyhedron @returns {Polyhedron} */
export function clonePolyhedron(polyhedron) {
  return {
    ...polyhedron,
    vertices: polyhedron.vertices.map((vertex) => /** @type {Vec3} */ ([...vertex])),
    faces: polyhedron.faces.map((face) => face.slice()),
    metadata: structuredCloneSafe(polyhedron.metadata ?? {}),
  };
}

/** @param {any} value */
function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

/** @param {Vec3[]} vertices @param {number[]} face */
export const facePoints = (vertices, face) => face.map((index) => vertices[index]);

/** @param {Polyhedron} polyhedron */
export function centerPolyhedron(polyhedron) {
  const center = centroid3(polyhedron.vertices);
  polyhedron.vertices = polyhedron.vertices.map((vertex) => sub3(vertex, center));
  return polyhedron;
}

/** Ensures every face normal points away from the solid centroid. @param {Polyhedron} polyhedron */
export function orientFacesOutward(polyhedron) {
  const solidCenter = centroid3(polyhedron.vertices);
  polyhedron.faces = polyhedron.faces.map((face) => {
    const points = facePoints(polyhedron.vertices, face);
    const normal = polygonNormal3(points);
    const faceCenter = centroid3(points);
    return dot3(normal, sub3(faceCenter, solidCenter)) < 0 ? face.slice().reverse() : face.slice();
  });
  return polyhedron;
}

/** @param {Polyhedron} polyhedron */
export function uniqueEdges(polyhedron) {
  const edges = new Map();
  polyhedron.faces.forEach((face, faceIndex) => {
    face.forEach((from, localEdgeIndex) => {
      const to = face[(localEdgeIndex + 1) % face.length];
      const key = edgeKey(from, to);
      if (!edges.has(key)) edges.set(key, { key, a: Math.min(from, to), b: Math.max(from, to), incidences: [] });
      edges.get(key).incidences.push({ faceIndex, localEdgeIndex, from, to });
    });
  });
  return [...edges.values()];
}

/** Normalizes median edge length and recenters the model. @param {Polyhedron} polyhedron @param {number} targetEdgeLength */
export function normalizePolyhedron(polyhedron, targetEdgeLength = 1) {
  centerPolyhedron(polyhedron);
  const lengths = uniqueEdges(polyhedron).map((edge) => distance3(polyhedron.vertices[edge.a], polyhedron.vertices[edge.b]));
  const representativeLength = median(lengths.filter((length) => length > EPSILON));
  if (representativeLength <= EPSILON) throw new Error(`${polyhedron.name} has no non-zero edges.`);
  const factor = targetEdgeLength / representativeLength;
  polyhedron.vertices = polyhedron.vertices.map((vertex) => scale3(vertex, factor));
  return polyhedron;
}

/**
 * Creates a normalized, outward-oriented model. The supplied topology is never
 * inferred from render triangles: faces remain first-class polygons.
 */
export function createPolyhedron({ id, name, family, vertices, faces, metadata = {} }, targetEdgeLength = 1) {
  /** @type {Polyhedron} */
  const polyhedron = {
    id,
    name,
    family,
    vertices: vertices.map((vertex) => /** @type {Vec3} */ ([...vertex])),
    faces: faces.map((face) => face.slice()),
    metadata: { ...metadata },
  };
  centerPolyhedron(polyhedron);
  orientFacesOutward(polyhedron);
  normalizePolyhedron(polyhedron, targetEdgeLength);
  orientFacesOutward(polyhedron);
  return polyhedron;
}

/** @param {Polyhedron} polyhedron */
export function buildTopology(polyhedron) {
  const edges = uniqueEdges(polyhedron);
  const adjacency = Array.from({ length: polyhedron.faces.length }, () => []);
  const boundaryEdges = [];
  const nonManifoldEdges = [];
  const inconsistentEdges = [];

  for (const edge of edges) {
    if (edge.incidences.length === 1) boundaryEdges.push(edge);
    if (edge.incidences.length > 2) nonManifoldEdges.push(edge);
    if (edge.incidences.length === 2) {
      const [left, right] = edge.incidences;
      adjacency[left.faceIndex].push({
        faceIndex: right.faceIndex,
        edgeKey: edge.key,
        edge,
        own: left,
        other: right,
      });
      adjacency[right.faceIndex].push({
        faceIndex: left.faceIndex,
        edgeKey: edge.key,
        edge,
        own: right,
        other: left,
      });
      if (left.from !== right.to || left.to !== right.from) inconsistentEdges.push(edge);
    }
  }

  const components = [];
  const seen = new Set();
  for (let root = 0; root < polyhedron.faces.length; root += 1) {
    if (seen.has(root)) continue;
    const component = [];
    const queue = [root];
    seen.add(root);
    while (queue.length) {
      const faceIndex = queue.shift();
      component.push(faceIndex);
      for (const neighbor of adjacency[faceIndex]) {
        if (!seen.has(neighbor.faceIndex)) {
          seen.add(neighbor.faceIndex);
          queue.push(neighbor.faceIndex);
        }
      }
    }
    components.push(component);
  }

  return {
    edges,
    edgeMap: new Map(edges.map((edge) => [edge.key, edge])),
    adjacency,
    boundaryEdges,
    nonManifoldEdges,
    inconsistentEdges,
    components,
    manifold: nonManifoldEdges.length === 0,
    closed: boundaryEdges.length === 0 && nonManifoldEdges.length === 0,
    connected: components.length === 1,
    orientable: inconsistentEdges.length === 0,
  };
}

/** @param {Vec3[]} points */
function polygonArea3(points) {
  if (points.length < 3) return 0;
  const anchor = points[0];
  let area = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    area += length3(cross3(sub3(points[index], anchor), sub3(points[index + 1], anchor))) / 2;
  }
  return area;
}

/** @param {Vec3[]} points */
function polygonSignedVolume(points) {
  if (points.length < 3) return 0;
  const anchor = points[0];
  let volume = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    volume += dot3(anchor, cross3(points[index], points[index + 1])) / 6;
  }
  return volume;
}

/** @param {Vec2[]} polygon */
function interiorAngles2(polygon) {
  return polygon.map((point, index) => {
    const previous = polygon[(index - 1 + polygon.length) % polygon.length];
    const next = polygon[(index + 1) % polygon.length];
    const towardPrevious = normalize3([previous[0] - point[0], previous[1] - point[1], 0]);
    const towardNext = normalize3([next[0] - point[0], next[1] - point[1], 0]);
    return Math.acos(clamp(dot3(towardPrevious, towardNext), -1, 1));
  });
}

/** @param {number[]} values */
function relativeSpread(values) {
  if (values.length === 0) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (Math.abs(average) <= EPSILON) return 0;
  return Math.max(...values.map((value) => Math.abs(value - average) / average));
}

/** @param {number[]} values @param {number} expected */
function absoluteSpread(values, expected) {
  return Math.max(...values.map((value) => Math.abs(value - expected)));
}

/**
 * Defines a stable 2D coordinate system for a polygonal face.
 * @param {Polyhedron} polyhedron @param {number} faceIndex
 */
export function createFaceFrame(polyhedron, faceIndex) {
  const face = polyhedron.faces[faceIndex];
  const points = facePoints(polyhedron.vertices, face);
  const origin = centroid3(points);
  const normal = polygonNormal3(points);
  let u = normalize3(sub3(points[1], points[0]));
  if (length3(u) <= EPSILON) u = [1, 0, 0];
  let v = normalize3(cross3(normal, u));
  /** @type {Vec2[]} */
  let local = points.map((point) => {
    const offset = sub3(point, origin);
    return [dot3(offset, u), dot3(offset, v)];
  });
  if (polygonArea2(local) < 0) {
    v = scale3(v, -1);
    local = points.map((point) => {
      const offset = sub3(point, origin);
      return [dot3(offset, u), dot3(offset, v)];
    });
  }
  const vertexToLocal = new Map(face.map((vertexIndex, localIndex) => [vertexIndex, local[localIndex]]));
  return { faceIndex, face, points, origin, normal, u, v, local, vertexToLocal };
}

/** @param {ReturnType<typeof createFaceFrame>} frame */
export function classifyFace(frame) {
  const polygon = frame.local;
  const sideCount = polygon.length;
  const lengths = polygon.map((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return Math.hypot(next[0] - point[0], next[1] - point[1]);
  });
  const angles = interiorAngles2(polygon);
  const expectedRegularAngle = (sideCount - 2) * Math.PI / sideCount;
  const equalSides = relativeSpread(lengths) <= 0.015;
  const equalAngles = absoluteSpread(angles, expectedRegularAngle) <= 2 * Math.PI / 180;
  const regular = equalSides && equalAngles;
  let kind = `${sideCount}-gon`;
  let label = `${sideCount}-sided polygon`;

  if (sideCount === 3) {
    const sorted = lengths.slice().sort((a, b) => a - b);
    const [a, b, c] = sorted;
    const right = Math.abs(a * a + b * b - c * c) / Math.max(c * c, EPSILON) <= 0.02;
    const isosceles = Math.abs(a - b) / Math.max(b, EPSILON) <= 0.015
      || Math.abs(b - c) / Math.max(c, EPSILON) <= 0.015;
    if (equalSides) {
      kind = 'equilateral-triangle';
      label = 'Equilateral triangle';
    } else if (right && isosceles) {
      kind = 'right-isosceles-triangle';
      label = 'Right isosceles triangle';
    } else if (right) {
      kind = 'right-triangle';
      label = 'Right triangle';
    } else if (isosceles) {
      kind = 'isosceles-triangle';
      label = 'Isosceles triangle';
    } else {
      const largestAngle = Math.max(...angles);
      kind = largestAngle > Math.PI / 2 + 0.01 ? 'obtuse-scalene-triangle' : 'acute-scalene-triangle';
      label = largestAngle > Math.PI / 2 + 0.01 ? 'Obtuse scalene triangle' : 'Acute scalene triangle';
    }
  } else if (sideCount === 4) {
    const rightAngles = absoluteSpread(angles, Math.PI / 2) <= 2 * Math.PI / 180;
    if (equalSides && rightAngles) {
      kind = 'square';
      label = 'Square';
    } else if (rightAngles) {
      kind = 'rectangle';
      label = 'Rectangle';
    } else if (equalSides) {
      kind = 'rhombus';
      label = 'Rhombus';
    } else {
      kind = 'quadrilateral';
      label = 'Quadrilateral';
    }
  } else if (regular) {
    const names = { 5: 'Pentagon', 6: 'Hexagon', 8: 'Octagon', 10: 'Decagon', 12: 'Dodecagon' };
    kind = `regular-${sideCount}-gon`;
    label = `Regular ${names[sideCount]?.toLowerCase() ?? `${sideCount}-gon`}`;
  }

  return {
    sideCount,
    lengths,
    angles,
    regular,
    equalSides,
    equalAngles,
    kind,
    label,
    perimeter: lengths.reduce((sum, length) => sum + length, 0),
    area: Math.abs(polygonArea2(polygon)),
  };
}

/** @param {Polyhedron} polyhedron */
export function validatePolyhedron(polyhedron) {
  const issues = [];
  const warnings = [];
  const vertexUsage = new Array(polyhedron.vertices.length).fill(0);

  polyhedron.faces.forEach((face, faceIndex) => {
    if (face.length < 3) issues.push(`Face ${faceIndex} has fewer than three vertices.`);
    if (new Set(face).size !== face.length) issues.push(`Face ${faceIndex} repeats a vertex.`);
    for (const vertexIndex of face) {
      if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= polyhedron.vertices.length) {
        issues.push(`Face ${faceIndex} references invalid vertex ${vertexIndex}.`);
      } else {
        vertexUsage[vertexIndex] += 1;
      }
    }
    if (face.every((vertexIndex) => vertexIndex >= 0 && vertexIndex < polyhedron.vertices.length)) {
      const frame = createFaceFrame(polyhedron, faceIndex);
      const maximumPlaneError = Math.max(...frame.points.map((point) => Math.abs(dot3(sub3(point, frame.origin), frame.normal))));
      if (maximumPlaneError > 1e-6) issues.push(`Face ${faceIndex} is non-planar by ${maximumPlaneError.toExponential(2)} units.`);
      if (Math.abs(polygonArea2(frame.local)) <= EPSILON) issues.push(`Face ${faceIndex} has near-zero area.`);
    }
  });

  vertexUsage.forEach((count, vertexIndex) => {
    if (count === 0) warnings.push(`Vertex ${vertexIndex} is unused.`);
  });

  const topology = buildTopology(polyhedron);
  if (topology.boundaryEdges.length) issues.push(`${topology.boundaryEdges.length} boundary edge(s) leave the model open.`);
  if (topology.nonManifoldEdges.length) issues.push(`${topology.nonManifoldEdges.length} edge(s) have more than two incident faces.`);
  if (topology.inconsistentEdges.length) issues.push(`${topology.inconsistentEdges.length} shared edge(s) have inconsistent face winding.`);
  if (!topology.connected) warnings.push(`The model has ${topology.components.length} disconnected components.`);

  return { valid: issues.length === 0, issues, warnings, topology };
}

/** @param {Polyhedron} polyhedron */
export function analyzePolyhedron(polyhedron) {
  const validation = validatePolyhedron(polyhedron);
  const topology = validation.topology;
  const faceFrames = polyhedron.faces.map((_, faceIndex) => createFaceFrame(polyhedron, faceIndex));
  const faceAnalyses = faceFrames.map((frame) => ({
    ...classifyFace(frame),
    faceIndex: frame.faceIndex,
    vertexIndices: frame.face.slice(),
    centroid: frame.origin,
    normal: frame.normal,
  }));

  const edgeLengths = topology.edges.map((edge) => distance3(polyhedron.vertices[edge.a], polyhedron.vertices[edge.b]));
  const averageEdgeLength = edgeLengths.reduce((sum, value) => sum + value, 0) / Math.max(edgeLengths.length, 1);
  const minEdgeLength = edgeLengths.length ? Math.min(...edgeLengths) : 0;
  const maxEdgeLength = edgeLengths.length ? Math.max(...edgeLengths) : 0;
  const surfaceArea = faceFrames.reduce((sum, frame) => sum + polygonArea3(frame.points), 0);
  const signedVolume = faceFrames.reduce((sum, frame) => sum + polygonSignedVolume(frame.points), 0);
  const volume = Math.abs(signedVolume);
  const eulerCharacteristic = polyhedron.vertices.length - topology.edges.length + polyhedron.faces.length;
  const rawGenus = (2 - eulerCharacteristic) / 2;
  const genus = topology.closed && topology.connected && topology.orientable && Math.abs(rawGenus - Math.round(rawGenus)) <= 1e-7
    ? Math.round(rawGenus)
    : null;

  const dihedralAngles = topology.edges
    .filter((edge) => edge.incidences.length === 2)
    .map((edge) => {
      const leftFace = edge.incidences[0].faceIndex;
      const rightFace = edge.incidences[1].faceIndex;
      const normalAngle = Math.acos(clamp(dot3(faceFrames[leftFace].normal, faceFrames[rightFace].normal), -1, 1));
      const interior = Math.PI - normalAngle;
      return {
        edgeKey: edge.key,
        faces: [leftFace, rightFace],
        radians: interior,
        degrees: toDegrees(interior),
      };
    });

  const countsByFaceKind = Object.fromEntries(
    [...new Set(faceAnalyses.map((face) => face.kind))]
      .map((kind) => [kind, faceAnalyses.filter((face) => face.kind === kind).length]),
  );

  return {
    validation,
    topology,
    faceFrames,
    faces: faceAnalyses,
    counts: {
      vertices: polyhedron.vertices.length,
      edges: topology.edges.length,
      faces: polyhedron.faces.length,
      byFaceKind: countsByFaceKind,
    },
    eulerCharacteristic,
    genus,
    edgeLengths,
    edgeStats: {
      minimum: minEdgeLength,
      maximum: maxEdgeLength,
      average: averageEdgeLength,
      relativeSpread: averageEdgeLength <= EPSILON ? 0 : (maxEdgeLength - minEdgeLength) / averageEdgeLength,
    },
    surfaceArea,
    volume,
    dihedralAngles,
    compact: {
      surfaceArea: roundTo(surfaceArea, 4),
      volume: roundTo(volume, 4),
      averageEdgeLength: roundTo(averageEdgeLength, 4),
    },
  };
}

/** Gives all face indices incident to a vertex, cyclically ordered around it. */
export function orderedIncidentFaces(polyhedron, faceFrames, vertexIndex) {
  const axis = normalize3(polyhedron.vertices[vertexIndex]);
  let tangentU = normalize3(cross3(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]));
  if (length3(tangentU) <= EPSILON) tangentU = [1, 0, 0];
  const tangentV = normalize3(cross3(axis, tangentU));
  return polyhedron.faces
    .map((face, faceIndex) => face.includes(vertexIndex) ? faceIndex : -1)
    .filter((faceIndex) => faceIndex >= 0)
    .map((faceIndex) => {
      const direction = sub3(faceFrames[faceIndex].origin, polyhedron.vertices[vertexIndex]);
      return {
        faceIndex,
        angle: Math.atan2(dot3(direction, tangentV), dot3(direction, tangentU)),
      };
    })
    .sort((left, right) => left.angle - right.angle)
    .map((entry) => entry.faceIndex);
}
