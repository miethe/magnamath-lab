import {
  EPSILON,
  add3,
  centroid3,
  cross3,
  distance3,
  dot3,
  length3,
  median,
  normalize3,
  scale3,
  sub3,
} from './math.js';
import {
  analyzePolyhedron,
  createPolyhedron,
  edgeKey,
  orderedIncidentFaces,
  uniqueEdges,
} from './polyhedron.js';

/** @typedef {import('./math.js').Vec3} Vec3 */
/** @typedef {import('./polyhedron.js').Polyhedron} Polyhedron */

/** @param {Polyhedron} base @param {{id?: string, name?: string, family?: string}=} options */
export function dualize(base, options = {}) {
  const analysis = analyzePolyhedron(base);
  const dualVertices = analysis.faceFrames.map((frame) => {
    const planeDistance = dot3(frame.normal, frame.origin);
    if (Math.abs(planeDistance) <= EPSILON) {
      throw new Error(`Cannot dualize ${base.name}: a face plane passes through the origin.`);
    }
    return scale3(frame.normal, 1 / planeDistance);
  });

  const dualFaces = base.vertices.map((_, vertexIndex) => (
    orderedIncidentFaces(base, analysis.faceFrames, vertexIndex)
  ));

  return createPolyhedron({
    id: options.id ?? `dual-${base.id}`,
    name: options.name ?? `Dual of ${base.name}`,
    family: options.family ?? 'Dual solid',
    vertices: dualVertices,
    faces: dualFaces,
    metadata: {
      generatedBy: 'polar-dual',
      sourceSolid: base.id,
      exactTopology: true,
      ...base.metadata?.dualMetadata,
    },
  });
}

/** @param {Polyhedron} base */
function uniformTruncationFraction(base) {
  const ratios = [];
  for (const face of base.faces) {
    for (let index = 0; index < face.length; index += 1) {
      const previous = base.vertices[face[(index - 1 + face.length) % face.length]];
      const vertex = base.vertices[face[index]];
      const next = base.vertices[face[(index + 1) % face.length]];
      const incomingLength = distance3(vertex, previous);
      const outgoingLength = distance3(vertex, next);
      const representative = (incomingLength + outgoingLength) / 2;
      if (representative > EPSILON) ratios.push(distance3(previous, next) / representative);
    }
  }
  const cornerChordRatio = median(ratios);
  return 1 / (2 + cornerChordRatio);
}

/**
 * Uniformly truncates a regular polyhedron. Unlike a render subdivision, this
 * creates the actual new vertices and polygon topology.
 * @param {Polyhedron} base
 * @param {{fraction?: number|'uniform', id?: string, name?: string, family?: string}=} options
 */
export function truncate(base, options = {}) {
  const fraction = options.fraction === undefined || options.fraction === 'uniform'
    ? uniformTruncationFraction(base)
    : options.fraction;
  if (!(fraction > 0 && fraction < 0.5)) throw new Error('Truncation fraction must be between 0 and 0.5.');

  /** @type {Vec3[]} */
  const vertices = [];
  const directedVertex = new Map();
  const getDirectedVertex = (from, to) => {
    const key = `${from}>${to}`;
    if (!directedVertex.has(key)) {
      const point = add3(scale3(base.vertices[from], 1 - fraction), scale3(base.vertices[to], fraction));
      directedVertex.set(key, vertices.length);
      vertices.push(point);
    }
    return directedVertex.get(key);
  };

  const centralFaces = base.faces.map((face) => {
    const result = [];
    for (let index = 0; index < face.length; index += 1) {
      const previous = face[(index - 1 + face.length) % face.length];
      const vertex = face[index];
      const next = face[(index + 1) % face.length];
      result.push(getDirectedVertex(vertex, previous));
      result.push(getDirectedVertex(vertex, next));
    }
    return result;
  });

  const topology = analyzePolyhedron(base).topology;
  const cornerFaces = base.vertices.map((vertex, vertexIndex) => {
    const axis = normalize3(vertex);
    let tangentU = normalize3(cross3(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]));
    if (length3(tangentU) <= EPSILON) tangentU = [1, 0, 0];
    const tangentV = normalize3(cross3(axis, tangentU));
    const neighbors = new Set();
    for (const edge of topology.edges) {
      if (edge.a === vertexIndex) neighbors.add(edge.b);
      if (edge.b === vertexIndex) neighbors.add(edge.a);
    }
    return [...neighbors]
      .map((neighbor) => {
        const direction = sub3(base.vertices[neighbor], vertex);
        return {
          index: getDirectedVertex(vertexIndex, neighbor),
          angle: Math.atan2(dot3(direction, tangentV), dot3(direction, tangentU)),
        };
      })
      .sort((left, right) => left.angle - right.angle)
      .map((entry) => entry.index);
  });

  return createPolyhedron({
    id: options.id ?? `truncated-${base.id}`,
    name: options.name ?? `Truncated ${base.name}`,
    family: options.family ?? 'Archimedean solid',
    vertices,
    faces: [...centralFaces, ...cornerFaces],
    metadata: {
      generatedBy: 'uniform-truncation',
      sourceSolid: base.id,
      truncationFraction: fraction,
      exactTopology: true,
    },
  });
}

/**
 * Rectifies a polyhedron by replacing every edge with its midpoint. This
 * creates the exact cuboctahedron/icosidodecahedron topology from regular bases.
 * @param {Polyhedron} base
 * @param {{id?: string, name?: string, family?: string}=} options
 */
export function rectify(base, options = {}) {
  const edges = uniqueEdges(base);
  /** @type {Vec3[]} */
  const vertices = edges.map((edge) => scale3(add3(base.vertices[edge.a], base.vertices[edge.b]), 0.5));
  const midpointIndex = new Map(edges.map((edge, index) => [edge.key, index]));

  const inheritedFaces = base.faces.map((face) => face.map((vertexIndex, index) => (
    midpointIndex.get(edgeKey(vertexIndex, face[(index + 1) % face.length]))
  )));

  const vertexFaces = base.vertices.map((vertex, vertexIndex) => {
    const axis = normalize3(vertex);
    let tangentU = normalize3(cross3(axis, Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]));
    if (length3(tangentU) <= EPSILON) tangentU = [1, 0, 0];
    const tangentV = normalize3(cross3(axis, tangentU));
    return edges
      .filter((edge) => edge.a === vertexIndex || edge.b === vertexIndex)
      .map((edge) => {
        const other = edge.a === vertexIndex ? edge.b : edge.a;
        const direction = sub3(base.vertices[other], vertex);
        return {
          midpoint: midpointIndex.get(edge.key),
          angle: Math.atan2(dot3(direction, tangentV), dot3(direction, tangentU)),
        };
      })
      .sort((left, right) => left.angle - right.angle)
      .map((entry) => entry.midpoint);
  });

  return createPolyhedron({
    id: options.id ?? `rectified-${base.id}`,
    name: options.name ?? `Rectified ${base.name}`,
    family: options.family ?? 'Archimedean solid',
    vertices,
    faces: [...inheritedFaces, ...vertexFaces],
    metadata: {
      generatedBy: 'rectification',
      sourceSolid: base.id,
      exactTopology: true,
    },
  });
}
