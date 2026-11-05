import { createPolyhedron } from './polyhedron.js';
import { dualize, rectify, truncate } from './transforms.js';

const PHI = (1 + Math.sqrt(5)) / 2;

export function tetrahedron() {
  return createPolyhedron({
    id: 'tetrahedron',
    name: 'Tetrahedron',
    family: 'Platonic solid',
    vertices: [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1],
    ],
    faces: [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ],
    metadata: {
      symbol: '{3,3}',
      description: 'The simplest possible closed polyhedron: four congruent equilateral triangles.',
      lessonHooks: ['Euler characteristic', 'minimum faces', 'triangular stability'],
      exactTopology: true,
    },
  });
}

export function cube() {
  return createPolyhedron({
    id: 'cube',
    name: 'Cube',
    family: 'Platonic solid',
    vertices: [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ],
    faces: [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7],
    ],
    metadata: {
      symbol: '{4,3}',
      description: 'Six congruent squares meet three at every vertex.',
      lessonHooks: ['nets', 'right angles', 'surface area and volume'],
      exactTopology: true,
    },
  });
}

export function octahedron() {
  return createPolyhedron({
    id: 'octahedron',
    name: 'Octahedron',
    family: 'Platonic solid',
    vertices: [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ],
    faces: [
      [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
      [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
    ],
    metadata: {
      symbol: '{3,4}',
      description: 'Eight equilateral triangles; the geometric dual of the cube.',
      lessonHooks: ['duality', 'cross sections', 'symmetry'],
      exactTopology: true,
    },
  });
}

export function icosahedron() {
  return createPolyhedron({
    id: 'icosahedron',
    name: 'Icosahedron',
    family: 'Platonic solid',
    vertices: [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
    ],
    faces: [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ],
    metadata: {
      symbol: '{3,5}',
      description: 'Twenty equilateral triangles produce the finest rotational symmetry of the Platonic solids.',
      lessonHooks: ['golden ratio', 'geodesic subdivision', 'spherical approximation'],
      exactTopology: true,
    },
  });
}

export function dodecahedron() {
  const result = dualize(icosahedron(), {
    id: 'dodecahedron',
    name: 'Dodecahedron',
    family: 'Platonic solid',
  });
  result.metadata = {
    ...result.metadata,
    symbol: '{5,3}',
    description: 'Twelve regular pentagons; the geometric dual of the icosahedron.',
    lessonHooks: ['golden ratio', 'duality', 'pentagonal symmetry'],
  };
  return result;
}

/** A regular n-gonal prism with unit edges and square side faces. */
export function regularPrism(sides = 5) {
  const n = Math.max(3, Math.round(sides));
  const radius = 1 / (2 * Math.sin(Math.PI / n));
  const vertices = [];
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), -0.5]);
  }
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), 0.5]);
  }
  const faces = [
    [...Array(n).keys()],
    [...Array(n).keys()].map((index) => index + n),
  ];
  for (let index = 0; index < n; index += 1) {
    const next = (index + 1) % n;
    faces.push([index, next, next + n, index + n]);
  }
  const names = { 3: 'Triangular prism', 4: 'Cube', 5: 'Pentagonal prism', 6: 'Hexagonal prism', 8: 'Octagonal prism' };
  return createPolyhedron({
    id: `prism-${n}`,
    name: names[n] ?? `${n}-gonal prism`,
    family: 'Prism',
    vertices,
    faces,
    metadata: {
      parameters: { sides: n },
      description: `Two parallel regular ${n}-gons joined by ${n} squares.`,
      lessonHooks: ['cross sections', 'lateral area', 'extrusion'],
      exactTopology: true,
    },
  });
}

/** A regular n-antiprism with equilateral side triangles. */
export function regularAntiprism(sides = 5) {
  const n = Math.max(3, Math.round(sides));
  const radius = 1 / (2 * Math.sin(Math.PI / n));
  const horizontalOffset = 2 * radius * Math.sin(Math.PI / (2 * n));
  const height = Math.sqrt(Math.max(1 - horizontalOffset * horizontalOffset, 1e-8));
  const vertices = [];
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), height / 2]);
  }
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n + Math.PI / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), -height / 2]);
  }
  const faces = [
    [...Array(n).keys()],
    [...Array(n).keys()].map((index) => index + n),
  ];
  for (let index = 0; index < n; index += 1) {
    const next = (index + 1) % n;
    faces.push([index, index + n, next]);
    faces.push([next, index + n, next + n]);
  }
  return createPolyhedron({
    id: `antiprism-${n}`,
    name: `${n}-antiprism`,
    family: 'Antiprism',
    vertices,
    faces,
    metadata: {
      parameters: { sides: n },
      description: `Two rotated regular ${n}-gons joined by ${2 * n} equilateral triangles.`,
      lessonHooks: ['twist symmetry', 'triangulation', 'prism comparison'],
      exactTopology: true,
    },
  });
}

/** A regular-edge pyramid when n≤5. */
export function regularPyramid(sides = 4) {
  const n = Math.max(3, Math.min(5, Math.round(sides)));
  const radius = 1 / (2 * Math.sin(Math.PI / n));
  const height = Math.sqrt(Math.max(1 - radius * radius, 1e-8));
  const vertices = [];
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), 0]);
  }
  vertices.push([0, 0, height]);
  const apex = n;
  const faces = [[...Array(n).keys()]];
  for (let index = 0; index < n; index += 1) faces.push([index, (index + 1) % n, apex]);
  const names = { 3: 'Tetrahedron', 4: 'Square pyramid', 5: 'Pentagonal pyramid' };
  return createPolyhedron({
    id: `pyramid-${n}`,
    name: names[n],
    family: n === 5 ? 'Johnson solid' : 'Pyramid',
    vertices,
    faces,
    metadata: {
      parameters: { sides: n },
      description: `A regular ${n}-gon base joined to one apex by congruent equilateral triangles.`,
      lessonHooks: ['apex and base', 'slant height', 'volume as one third of a prism'],
      exactTopology: true,
    },
  });
}

/** A regular-edge n-gonal bipyramid when n≤5. */
export function regularBipyramid(sides = 5) {
  const n = Math.max(3, Math.min(5, Math.round(sides)));
  const radius = 1 / (2 * Math.sin(Math.PI / n));
  const height = Math.sqrt(Math.max(1 - radius * radius, 1e-8));
  const vertices = [];
  for (let index = 0; index < n; index += 1) {
    const angle = 2 * Math.PI * index / n;
    vertices.push([radius * Math.cos(angle), radius * Math.sin(angle), 0]);
  }
  vertices.push([0, 0, height], [0, 0, -height]);
  const top = n;
  const bottom = n + 1;
  const faces = [];
  for (let index = 0; index < n; index += 1) {
    const next = (index + 1) % n;
    faces.push([index, next, top]);
    faces.push([next, index, bottom]);
  }
  const names = { 3: 'Triangular bipyramid', 4: 'Octahedron', 5: 'Pentagonal bipyramid' };
  return createPolyhedron({
    id: `bipyramid-${n}`,
    name: names[n],
    family: n === 4 ? 'Platonic solid' : 'Johnson solid',
    vertices,
    faces,
    metadata: {
      parameters: { sides: n },
      description: `Two congruent ${n}-gonal pyramids joined base-to-base.`,
      lessonHooks: ['composition', 'equatorial ring', 'mirror symmetry'],
      exactTopology: true,
    },
  });
}

const baseFactories = { tetrahedron, cube, octahedron, dodecahedron, icosahedron };

function derived(factory, operation, options) {
  return operation(factory(), options);
}

export const SHAPE_CATALOG = [
  { id: 'tetrahedron', name: 'Tetrahedron', family: 'Platonic solids', create: tetrahedron },
  { id: 'cube', name: 'Cube', family: 'Platonic solids', create: cube },
  { id: 'octahedron', name: 'Octahedron', family: 'Platonic solids', create: octahedron },
  { id: 'dodecahedron', name: 'Dodecahedron', family: 'Platonic solids', create: dodecahedron },
  { id: 'icosahedron', name: 'Icosahedron', family: 'Platonic solids', create: icosahedron },

  { id: 'cuboctahedron', name: 'Cuboctahedron', family: 'Archimedean solids', create: () => derived(cube, rectify, { id: 'cuboctahedron', name: 'Cuboctahedron' }) },
  { id: 'icosidodecahedron', name: 'Icosidodecahedron', family: 'Archimedean solids', create: () => derived(icosahedron, rectify, { id: 'icosidodecahedron', name: 'Icosidodecahedron' }) },
  { id: 'truncated-tetrahedron', name: 'Truncated tetrahedron', family: 'Archimedean solids', create: () => derived(tetrahedron, truncate, { id: 'truncated-tetrahedron', name: 'Truncated tetrahedron' }) },
  { id: 'truncated-cube', name: 'Truncated cube', family: 'Archimedean solids', create: () => derived(cube, truncate, { id: 'truncated-cube', name: 'Truncated cube' }) },
  { id: 'truncated-octahedron', name: 'Truncated octahedron', family: 'Archimedean solids', create: () => derived(octahedron, truncate, { id: 'truncated-octahedron', name: 'Truncated octahedron' }) },
  { id: 'truncated-dodecahedron', name: 'Truncated dodecahedron', family: 'Archimedean solids', create: () => derived(dodecahedron, truncate, { id: 'truncated-dodecahedron', name: 'Truncated dodecahedron' }) },
  { id: 'truncated-icosahedron', name: 'Truncated icosahedron', family: 'Archimedean solids', create: () => derived(icosahedron, truncate, { id: 'truncated-icosahedron', name: 'Truncated icosahedron' }) },

  { id: 'prism', name: 'Adjustable prism', family: 'Generated families', parameter: { label: 'Sides', min: 3, max: 12, default: 5 }, create: regularPrism },
  { id: 'antiprism', name: 'Adjustable antiprism', family: 'Generated families', parameter: { label: 'Sides', min: 3, max: 12, default: 5 }, create: regularAntiprism },
  { id: 'pyramid', name: 'Adjustable pyramid', family: 'Generated families', parameter: { label: 'Base sides', min: 3, max: 5, default: 4 }, create: regularPyramid },
  { id: 'bipyramid', name: 'Adjustable bipyramid', family: 'Generated families', parameter: { label: 'Equator sides', min: 3, max: 5, default: 5 }, create: regularBipyramid },
];

export function createShape(id, parameter) {
  const entry = SHAPE_CATALOG.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown shape: ${id}`);
  return entry.parameter ? entry.create(parameter ?? entry.parameter.default) : entry.create();
}

export function catalogEntry(id) {
  return SHAPE_CATALOG.find((candidate) => candidate.id === id) ?? SHAPE_CATALOG[0];
}

export const BASE_FACTORIES = baseFactories;
