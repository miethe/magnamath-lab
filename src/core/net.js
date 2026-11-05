import {
  apply2,
  bounds2,
  convexIntersectionArea2,
  distance3,
  identity2,
  mulberry32,
  polygonArea2,
  polygonPerimeter2,
  segmentTransform2,
  shuffled,
} from './math.js';

/** @typedef {import('./math.js').Vec2} Vec2 */
/** @typedef {import('./math.js').Mat2D} Mat2D */

export const NET_OBJECTIVES = {
  compact: {
    id: 'compact',
    label: 'Compact',
    description: 'Minimizes occupied area while strongly rejecting overlap.',
    weights: { overlapArea: 1e8, overlapPairs: 1e6, boundingArea: 1, perimeter: 0.01, compactness: -0.1, aspect: 0.03, depth: 0.015, leaves: -0.008 },
  },
  printable: {
    id: 'printable',
    label: 'Print-efficient',
    description: 'Favors balanced page-shaped bounds and a short cut perimeter.',
    weights: { overlapArea: 1e8, overlapPairs: 1e6, boundingArea: 0.8, perimeter: 0.06, compactness: -0.08, aspect: 0.28, depth: 0.01, leaves: -0.004 },
  },
  buildable: {
    id: 'buildable',
    label: 'Build-friendly',
    description: 'Favors shallow hinge trees with more branches near the anchor face.',
    weights: { overlapArea: 1e8, overlapPairs: 1e6, boundingArea: 0.72, perimeter: 0.018, compactness: -0.06, aspect: 0.04, depth: 0.14, leaves: -0.04 },
  },
  classroom: {
    id: 'classroom',
    label: 'Classroom wide',
    description: 'Prefers a wider, less vertically dense layout for projection and labeling.',
    weights: { overlapArea: 1e8, overlapPairs: 1e6, boundingArea: 0.85, perimeter: 0.015, compactness: -0.05, aspect: 0.2, depth: 0.025, leaves: -0.01 },
    targetAspect: 1.75,
  },
};

function objectiveProfile(objective) {
  if (typeof objective === 'string' && NET_OBJECTIVES[objective]) return NET_OBJECTIVES[objective];
  if (objective?.weights) return objective;
  return NET_OBJECTIVES.compact;
}

class DisjointSet {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = new Array(size).fill(0);
  }

  find(value) {
    if (this.parent[value] !== value) this.parent[value] = this.find(this.parent[value]);
    return this.parent[value];
  }

  union(left, right) {
    let a = this.find(left);
    let b = this.find(right);
    if (a === b) return false;
    if (this.rank[a] < this.rank[b]) [a, b] = [b, a];
    this.parent[b] = a;
    if (this.rank[a] === this.rank[b]) this.rank[a] += 1;
    return true;
  }
}

/** Returns each dual-graph edge once. */
export function dualEdges(analysis) {
  return analysis.topology.edges
    .filter((edge) => edge.incidences.length === 2)
    .map((edge) => ({
      edgeKey: edge.key,
      edge,
      leftFace: edge.incidences[0].faceIndex,
      rightFace: edge.incidences[1].faceIndex,
    }));
}

function validateConstraintKeys(analysis, keys, label) {
  for (const key of keys) {
    if (!analysis.topology.edgeMap.has(key)) throw new Error(`${label} contains unknown polyhedron edge ${key}.`);
    const edge = analysis.topology.edgeMap.get(key);
    if (edge.incidences.length !== 2) throw new Error(`${label} edge ${key} does not join exactly two faces.`);
  }
}

/**
 * Builds a rooted face tree from an exact set of fold edges.
 * The set must contain F-1 edges and connect every face without a cycle.
 */
export function treeFromEdgeKeys(analysis, foldEdgeKeys, rootFace = 0) {
  const selected = new Set(foldEdgeKeys);
  const faceCount = analysis.faces.length;
  if (!Number.isInteger(rootFace) || rootFace < 0 || rootFace >= faceCount) throw new Error('Root face is out of range.');
  validateConstraintKeys(analysis, selected, 'Fold-edge set');
  if (selected.size !== faceCount - 1) {
    throw new Error(`A connected net needs exactly ${faceCount - 1} fold edges; received ${selected.size}.`);
  }

  const parentByFace = new Array(faceCount).fill(-1);
  const connectionByFace = new Array(faceCount).fill(null);
  const order = [rootFace];
  const visited = new Set([rootFace]);
  const queue = [rootFace];

  while (queue.length) {
    const parent = queue.shift();
    for (const connection of analysis.topology.adjacency[parent]) {
      if (!selected.has(connection.edgeKey) || visited.has(connection.faceIndex)) continue;
      visited.add(connection.faceIndex);
      parentByFace[connection.faceIndex] = parent;
      connectionByFace[connection.faceIndex] = connection;
      order.push(connection.faceIndex);
      queue.push(connection.faceIndex);
    }
  }

  if (visited.size !== faceCount) throw new Error('Fold-edge set is disconnected or cyclic and cannot define one net.');
  return { root: rootFace, parentByFace, connectionByFace, order, edgeKeys: selected };
}

/** @param {any} analysis @param {number} root @param {() => number} random @param {any} constraints */
function randomConstrainedSpanningTree(analysis, root, random, constraints = {}) {
  const requiredFold = new Set(constraints.requiredFoldEdgeKeys ?? []);
  const requiredCut = new Set(constraints.requiredCutEdgeKeys ?? []);
  validateConstraintKeys(analysis, requiredFold, 'Required-fold constraints');
  validateConstraintKeys(analysis, requiredCut, 'Required-cut constraints');
  for (const key of requiredFold) {
    if (requiredCut.has(key)) throw new Error(`Edge ${key} cannot be both a required fold and a required cut.`);
  }

  const faceCount = analysis.faces.length;
  const dsu = new DisjointSet(faceCount);
  const selected = new Set();
  const edges = dualEdges(analysis);
  const byKey = new Map(edges.map((edge) => [edge.edgeKey, edge]));

  for (const key of requiredFold) {
    const edge = byKey.get(key);
    if (!edge) throw new Error(`Required fold ${key} is not a valid dual edge.`);
    if (!dsu.union(edge.leftFace, edge.rightFace)) throw new Error('Required fold constraints already contain a cycle.');
    selected.add(key);
  }

  const candidates = shuffled(
    edges.filter((edge) => !requiredFold.has(edge.edgeKey) && !requiredCut.has(edge.edgeKey)),
    random,
  );
  for (const edge of candidates) {
    if (selected.size >= faceCount - 1) break;
    if (dsu.union(edge.leftFace, edge.rightFace)) selected.add(edge.edgeKey);
  }

  if (selected.size !== faceCount - 1) {
    throw new Error('The locked fold/cut choices prevent a connected spanning-tree net.');
  }
  return treeFromEdgeKeys(analysis, selected, root);
}

/** @param {any} analysis @param {ReturnType<typeof treeFromEdgeKeys>} tree */
export function placeTree(analysis, tree) {
  /** @type {Mat2D[]} */
  const transforms = new Array(analysis.faces.length);
  /** @type {Vec2[][]} */
  const polygons = new Array(analysis.faces.length);
  transforms[tree.root] = [...identity2];
  polygons[tree.root] = analysis.faceFrames[tree.root].local.map((point) => apply2(transforms[tree.root], point));

  for (const faceIndex of tree.order.slice(1)) {
    const parentIndex = tree.parentByFace[faceIndex];
    const connection = tree.connectionByFace[faceIndex];
    const edge = connection.edge;
    const parentFrame = analysis.faceFrames[parentIndex];
    const childFrame = analysis.faceFrames[faceIndex];
    const parentA = apply2(transforms[parentIndex], parentFrame.vertexToLocal.get(edge.a));
    const parentB = apply2(transforms[parentIndex], parentFrame.vertexToLocal.get(edge.b));
    const childA = childFrame.vertexToLocal.get(edge.a);
    const childB = childFrame.vertexToLocal.get(edge.b);
    transforms[faceIndex] = segmentTransform2(childA, childB, parentA, parentB);
    polygons[faceIndex] = childFrame.local.map((point) => apply2(transforms[faceIndex], point));
  }
  return { transforms, polygons };
}

function treeMetrics(tree) {
  const depth = new Array(tree.parentByFace.length).fill(0);
  const childCounts = new Array(tree.parentByFace.length).fill(0);
  for (const faceIndex of tree.order.slice(1)) {
    const parent = tree.parentByFace[faceIndex];
    depth[faceIndex] = depth[parent] + 1;
    childCounts[parent] += 1;
  }
  const leaves = childCounts.filter((count) => count === 0).length;
  const maxDepth = Math.max(...depth);
  const averageDepth = depth.reduce((sum, value) => sum + value, 0) / Math.max(1, depth.length);
  return { depth, childCounts, leaves, maxDepth, averageDepth };
}

/** @param {Vec2[][]} polygons @param {any=} options */
export function scorePlacement(polygons, options = {}) {
  let overlapArea = 0;
  const overlapPairs = [];
  for (let left = 0; left < polygons.length; left += 1) {
    for (let right = left + 1; right < polygons.length; right += 1) {
      const area = convexIntersectionArea2(polygons[left], polygons[right], 1e-7);
      if (area > 1e-7) {
        overlapArea += area;
        overlapPairs.push([left, right, area]);
      }
    }
  }
  const allPoints = polygons.flat();
  const bounds = bounds2(allPoints);
  const boundingArea = Math.max(bounds.width * bounds.height, 1e-9);
  const totalFaceArea = polygons.reduce((sum, polygon) => sum + Math.abs(polygonArea2(polygon)), 0);
  // The sum of all face perimeters is constant and therefore cannot rank nets.
  // For a closed polyhedron, the visible outline of an unfolded net is exactly
  // two copies of every cut edge. Use that true cut perimeter whenever the
  // source polyhedron and tree are available.
  const boundaryPerimeter = options.polyhedron && options.analysis && options.tree
    ? options.analysis.topology.edges
      .filter((edge) => !options.tree.edgeKeys.has(edge.key))
      .reduce((sum, edge) => sum + 2 * distance3(
        options.polyhedron.vertices[edge.a],
        options.polyhedron.vertices[edge.b],
      ), 0)
    : polygons.reduce((sum, polygon) => sum + polygonPerimeter2(polygon), 0);
  const compactness = totalFaceArea / boundingArea;
  const profile = objectiveProfile(options.objective);
  const metrics = options.tree ? treeMetrics(options.tree) : { leaves: 0, maxDepth: 0, averageDepth: 0 };
  const aspect = bounds.height <= 1e-9 ? bounds.width : bounds.width / bounds.height;
  const targetAspect = profile.targetAspect ?? 1;
  const aspectPenalty = Math.abs(Math.log(Math.max(aspect, 1e-9) / targetAspect));
  const weights = profile.weights;
  const breakdown = {
    overlapArea: overlapArea * weights.overlapArea,
    overlapPairs: overlapPairs.length * weights.overlapPairs,
    boundingArea: boundingArea * weights.boundingArea,
    perimeter: boundaryPerimeter * weights.perimeter,
    compactness: compactness * weights.compactness,
    aspect: aspectPenalty * weights.aspect,
    depth: metrics.maxDepth * weights.depth,
    leaves: metrics.leaves * weights.leaves,
  };
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  return {
    score,
    scoreBreakdown: breakdown,
    overlapArea,
    overlapPairs,
    bounds,
    boundingArea,
    totalFaceArea,
    boundaryPerimeter,
    compactness,
    aspect,
    objective: profile.id,
    treeMetrics: metrics,
  };
}

/** @param {Mat2D[]} transforms @param {Vec2[][]} polygons */
function centerPlacement(transforms, polygons) {
  const bounds = bounds2(polygons.flat());
  const offsetX = -(bounds.minX + bounds.maxX) / 2;
  const offsetY = -(bounds.minY + bounds.maxY) / 2;
  const centeredTransforms = transforms.map((matrix) => /** @type {Mat2D} */ ([
    matrix[0], matrix[1], matrix[2], matrix[3], matrix[4] + offsetX, matrix[5] + offsetY,
  ]));
  const centeredPolygons = polygons.map((polygon) => polygon.map(([x, y]) => /** @type {Vec2} */ ([x + offsetX, y + offsetY])));
  return { transforms: centeredTransforms, polygons: centeredPolygons, bounds: bounds2(centeredPolygons.flat()) };
}

/** @param {any} analysis @param {any} tree @param {Mat2D[]} transforms */
function buildNetEdges(analysis, tree, transforms) {
  const treeEdgeKeys = new Set(tree.order.slice(1).map((faceIndex) => tree.connectionByFace[faceIndex].edgeKey));
  const foldEdges = [];
  const cutEdges = [];
  const emittedFolds = new Set();

  analysis.faceFrames.forEach((frame, faceIndex) => {
    frame.face.forEach((vertexIndex, localEdgeIndex) => {
      const nextVertex = frame.face[(localEdgeIndex + 1) % frame.face.length];
      const key = vertexIndex < nextVertex ? `${vertexIndex}:${nextVertex}` : `${nextVertex}:${vertexIndex}`;
      const segment = {
        key,
        faceIndex,
        localEdgeIndex,
        from: apply2(transforms[faceIndex], frame.local[localEdgeIndex]),
        to: apply2(transforms[faceIndex], frame.local[(localEdgeIndex + 1) % frame.local.length]),
      };
      if (treeEdgeKeys.has(key)) {
        if (!emittedFolds.has(key)) {
          emittedFolds.add(key);
          foldEdges.push(segment);
        }
      } else {
        cutEdges.push(segment);
      }
    });
  });
  return {
    treeEdgeKeys,
    cutEdgeKeys: new Set(analysis.topology.edges.filter((edge) => !treeEdgeKeys.has(edge.key)).map((edge) => edge.key)),
    foldEdges,
    cutEdges,
  };
}

/** Creates a net from a known valid face spanning tree. */
export function netFromTree(polyhedron, analysis, tree, options = {}) {
  const placement = placeTree(analysis, tree);
  const centered = centerPlacement(placement.transforms, placement.polygons);
  const edges = buildNetEdges(analysis, tree, centered.transforms);
  const scoring = scorePlacement(centered.polygons, { objective: options.objective, tree, polyhedron, analysis });
  return {
    polyhedronId: polyhedron.id,
    seed: options.seed ?? null,
    attempts: options.attempts ?? 1,
    selectedAttempt: options.selectedAttempt ?? 0,
    rootFace: tree.root,
    parentByFace: tree.parentByFace,
    connectionByFace: tree.connectionByFace,
    order: tree.order,
    transforms: centered.transforms,
    polygons: centered.polygons,
    ...scoring,
    ...edges,
    valid: scoring.overlapPairs.length === 0,
    source: options.source ?? 'tree',
    constraints: {
      requiredFoldEdgeKeys: [...(options.requiredFoldEdgeKeys ?? [])],
      requiredCutEdgeKeys: [...(options.requiredCutEdgeKeys ?? [])],
    },
  };
}

/** Creates a net directly from a fold-edge set. */
export function netFromEdgeKeys(polyhedron, analysis, foldEdgeKeys, options = {}) {
  const tree = treeFromEdgeKeys(analysis, foldEdgeKeys, options.rootFace ?? 0);
  return netFromTree(polyhedron, analysis, tree, options);
}

/**
 * Searches deterministic randomized spanning trees, honoring optional locked
 * fold/cut constraints and ranking candidates with a selectable objective.
 */
export function planNet(polyhedron, analysis, options = {}) {
  if (!analysis.topology.closed || !analysis.topology.connected) {
    throw new Error('Automatic nets currently require one closed, connected manifold.');
  }
  const faceCount = analysis.faces.length;
  const attempts = Math.max(1, options.attempts ?? Math.min(320, Math.max(64, faceCount * 8)));
  const seed = Number.isFinite(options.seed) ? options.seed : 1;
  const random = mulberry32(seed * 2654435761);
  const requiredFoldEdgeKeys = new Set(options.requiredFoldEdgeKeys ?? []);
  const requiredCutEdgeKeys = new Set(options.requiredCutEdgeKeys ?? []);
  const seenTrees = new Set();
  let best = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const root = Number.isInteger(options.rootFace) ? options.rootFace : Math.floor(random() * faceCount);
    const tree = randomConstrainedSpanningTree(analysis, root, random, { requiredFoldEdgeKeys, requiredCutEdgeKeys });
    const signature = [...tree.edgeKeys].sort().join('|');
    if (seenTrees.has(signature) && attempt < attempts - 1) continue;
    seenTrees.add(signature);
    const candidate = netFromTree(polyhedron, analysis, tree, {
      seed,
      attempts,
      selectedAttempt: attempt,
      objective: options.objective,
      source: requiredFoldEdgeKeys.size || requiredCutEdgeKeys.size ? 'constrained-search' : 'search',
      requiredFoldEdgeKeys,
      requiredCutEdgeKeys,
    });
    if (!best || candidate.score < best.score) best = candidate;
    if (best.valid && options.stopAtFirstValid === true) break;
  }
  if (!best) throw new Error(`No net candidate was generated for ${polyhedron.name}.`);
  return best;
}

function treePathEdgeKeys(analysis, treeEdgeKeys, startFace, endFace) {
  const queue = [startFace];
  const parent = new Map([[startFace, null]]);
  const viaEdge = new Map();
  while (queue.length) {
    const face = queue.shift();
    if (face === endFace) break;
    for (const connection of analysis.topology.adjacency[face]) {
      if (!treeEdgeKeys.has(connection.edgeKey) || parent.has(connection.faceIndex)) continue;
      parent.set(connection.faceIndex, face);
      viaEdge.set(connection.faceIndex, connection.edgeKey);
      queue.push(connection.faceIndex);
    }
  }
  if (!parent.has(endFace)) return [];
  const path = [];
  let current = endFace;
  while (current !== startFace) {
    path.push(viaEdge.get(current));
    current = parent.get(current);
  }
  return path.reverse();
}

function componentsAfterRemovingEdge(analysis, treeEdgeKeys, removedKey) {
  const allowed = new Set(treeEdgeKeys);
  allowed.delete(removedKey);
  const firstEdge = analysis.topology.edgeMap.get(removedKey);
  const firstRoot = firstEdge.incidences[0].faceIndex;
  const first = new Set([firstRoot]);
  const queue = [firstRoot];
  while (queue.length) {
    const face = queue.shift();
    for (const connection of analysis.topology.adjacency[face]) {
      if (!allowed.has(connection.edgeKey) || first.has(connection.faceIndex)) continue;
      first.add(connection.faceIndex);
      queue.push(connection.faceIndex);
    }
  }
  const second = new Set(Array.from({ length: analysis.faces.length }, (_, index) => index).filter((index) => !first.has(index)));
  return [first, second];
}


function netCandidateCompare(left, right) {
  if (left.valid !== right.valid) return left.valid ? -1 : 1;
  if (left.overlapPairs.length !== right.overlapPairs.length) return left.overlapPairs.length - right.overlapPairs.length;
  if (Math.abs(left.overlapArea - right.overlapArea) > 1e-9) return left.overlapArea - right.overlapArea;
  return left.score - right.score;
}

export function netTreeSignature(value) {
  const keys = value?.treeEdgeKeys ?? value?.edgeKeys ?? value;
  return [...keys].sort().join('|');
}

function portfolioVector(net, targetAspect = 1) {
  return [
    net.overlapArea,
    net.overlapPairs.length,
    net.boundingArea,
    net.boundaryPerimeter,
    net.treeMetrics.maxDepth,
    Math.abs(Math.log(Math.max(net.aspect, 1e-9) / targetAspect)),
    -net.treeMetrics.leaves,
  ];
}

function vectorDominates(left, right, epsilon = 1e-9) {
  let strictlyBetter = false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] > right[index] + epsilon) return false;
    if (left[index] < right[index] - epsilon) strictlyBetter = true;
  }
  return strictlyBetter;
}

/** Returns the non-dominated set across geometry, print, and assembly metrics. */
export function paretoNetCandidates(candidates, options = {}) {
  const targetAspect = options.targetAspect ?? 1;
  const pool = candidates.some((candidate) => candidate.valid)
    ? candidates.filter((candidate) => candidate.valid)
    : candidates;
  return pool.filter((candidate, index) => {
    const vector = portfolioVector(candidate, targetAspect);
    return !pool.some((other, otherIndex) => (
      otherIndex !== index && vectorDominates(portfolioVector(other, targetAspect), vector)
    ));
  }).sort(netCandidateCompare);
}

function jaccardTreeDistance(left, right) {
  const a = left.treeEdgeKeys;
  const b = right.treeEdgeKeys;
  let intersection = 0;
  for (const key of a) if (b.has(key)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union ? 1 - intersection / union : 0;
}

function diversifyCandidates(candidates, maximum) {
  if (candidates.length <= maximum) return candidates.slice();
  const remaining = candidates.slice().sort(netCandidateCompare);
  const selected = [remaining.shift()];
  while (selected.length < maximum && remaining.length) {
    let bestIndex = 0;
    let bestValue = -Infinity;
    remaining.forEach((candidate, index) => {
      const distance = Math.min(...selected.map((existing) => jaccardTreeDistance(candidate, existing)));
      const objectiveRankPenalty = index / Math.max(1, remaining.length - 1);
      const value = distance * 0.82 - objectiveRankPenalty * 0.18;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return selected;
}

function swapNeighborEdgeSets(analysis, currentKeys, constraints, random, maximumNeighbors) {
  const lockedFold = new Set(constraints.requiredFoldEdgeKeys ?? []);
  const lockedCut = new Set(constraints.requiredCutEdgeKeys ?? []);
  const neighbors = [];
  const seen = new Set();
  const removable = shuffled([...currentKeys].filter((key) => !lockedFold.has(key)), random);
  for (const removedKey of removable) {
    const [first, second] = componentsAfterRemovingEdge(analysis, currentKeys, removedKey);
    const replacements = shuffled(dualEdges(analysis).filter((edge) => (
      !currentKeys.has(edge.edgeKey)
      && !lockedCut.has(edge.edgeKey)
      && ((first.has(edge.leftFace) && second.has(edge.rightFace))
        || (first.has(edge.rightFace) && second.has(edge.leftFace)))
    )), random);
    for (const replacement of replacements) {
      const next = new Set(currentKeys);
      next.delete(removedKey);
      next.add(replacement.edgeKey);
      const signature = netTreeSignature(next);
      if (seen.has(signature)) continue;
      seen.add(signature);
      neighbors.push({ keys: next, removedKey, addedEdgeKey: replacement.edgeKey, signature });
      if (neighbors.length >= maximumNeighbors) return neighbors;
    }
  }
  return neighbors;
}

/**
 * Deterministic, bounded one-edge-exchange hill climbing. This intentionally
 * stays simple until the dedicated solver research is incorporated.
 */
export function improveNetLocally(polyhedron, analysis, initialNet, options = {}) {
  const seed = Number.isFinite(options.seed) ? options.seed : 1;
  const random = mulberry32((seed + 17) * 2246822519);
  const iterations = Math.max(0, options.iterations ?? 5);
  const maximumNeighbors = Math.max(1, options.maximumNeighbors ?? Math.min(96, analysis.topology.edges.length * 2));
  const constraints = {
    requiredFoldEdgeKeys: new Set(options.requiredFoldEdgeKeys ?? []),
    requiredCutEdgeKeys: new Set(options.requiredCutEdgeKeys ?? []),
  };
  let current = initialNet;
  const visited = new Map([[netTreeSignature(current), current]]);
  const trajectory = [current];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    if (options.shouldCancel?.()) break;
    const neighbors = swapNeighborEdgeSets(analysis, current.treeEdgeKeys, constraints, random, maximumNeighbors);
    let selected = current;
    for (let index = 0; index < neighbors.length; index += 1) {
      const neighbor = neighbors[index];
      if (visited.has(neighbor.signature)) continue;
      const net = netFromEdgeKeys(polyhedron, analysis, neighbor.keys, {
        rootFace: options.rootFace ?? current.rootFace,
        objective: options.objective ?? current.objective,
        source: 'local-edge-search',
        seed,
      });
      visited.set(neighbor.signature, net);
      if (netCandidateCompare(net, selected) < 0) selected = net;
      options.onProgress?.({
        phase: 'local',
        iteration,
        completed: index + 1,
        total: neighbors.length,
        bestScore: selected.score,
        valid: selected.valid,
      });
    }
    if (selected === current || netCandidateCompare(selected, current) >= 0) break;
    current = selected;
    trajectory.push(current);
  }
  return { best: current, trajectory, evaluated: [...visited.values()] };
}

/**
 * Produces a diverse Pareto portfolio rather than collapsing all objectives to
 * one opaque winner. Intended to run in a Web Worker for larger solids.
 */
export function searchNetPortfolio(polyhedron, analysis, options = {}) {
  if (!analysis.topology.closed || !analysis.topology.connected) {
    throw new Error('Net portfolios currently require one closed, connected manifold.');
  }
  const faceCount = analysis.faces.length;
  const attempts = Math.max(1, options.attempts ?? Math.min(640, Math.max(128, faceCount * 16)));
  const seed = Number.isFinite(options.seed) ? options.seed : 1;
  const random = mulberry32(seed * 2654435761);
  const requiredFoldEdgeKeys = new Set(options.requiredFoldEdgeKeys ?? []);
  const requiredCutEdgeKeys = new Set(options.requiredCutEdgeKeys ?? []);
  const objective = options.objective ?? 'compact';
  const seen = new Set();
  const candidates = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (options.shouldCancel?.()) break;
    const root = Number.isInteger(options.rootFace) ? options.rootFace : Math.floor(random() * faceCount);
    const tree = randomConstrainedSpanningTree(analysis, root, random, { requiredFoldEdgeKeys, requiredCutEdgeKeys });
    const signature = netTreeSignature(tree);
    if (seen.has(signature)) continue;
    seen.add(signature);
    const candidate = netFromTree(polyhedron, analysis, tree, {
      seed,
      attempts,
      selectedAttempt: attempt,
      objective,
      source: requiredFoldEdgeKeys.size || requiredCutEdgeKeys.size ? 'portfolio-constrained-search' : 'portfolio-search',
      requiredFoldEdgeKeys,
      requiredCutEdgeKeys,
    });
    candidates.push(candidate);
    if (attempt % 8 === 0 || attempt === attempts - 1) {
      const currentBest = candidates.slice().sort(netCandidateCompare)[0];
      options.onProgress?.({
        phase: 'random',
        completed: attempt + 1,
        total: attempts,
        unique: candidates.length,
        bestScore: currentBest?.score ?? null,
        valid: currentBest?.valid ?? false,
      });
    }
  }

  if (!candidates.length) throw new Error(`No net candidate was generated for ${polyhedron.name}.`);
  const localStarts = Math.max(0, Math.min(options.localStarts ?? 3, candidates.length));
  const starts = candidates.slice().sort(netCandidateCompare).slice(0, localStarts);
  starts.forEach((candidate, index) => {
    if (options.shouldCancel?.()) return;
    const improved = improveNetLocally(polyhedron, analysis, candidate, {
      seed: seed + index * 97,
      objective,
      rootFace: options.rootFace ?? candidate.rootFace,
      requiredFoldEdgeKeys,
      requiredCutEdgeKeys,
      iterations: options.localIterations ?? 4,
      maximumNeighbors: options.maximumNeighbors,
      shouldCancel: options.shouldCancel,
      onProgress: (progress) => options.onProgress?.({ ...progress, localStart: index + 1, localStarts }),
    });
    for (const net of improved.evaluated) {
      const signature = netTreeSignature(net);
      if (!seen.has(signature)) {
        seen.add(signature);
        candidates.push(net);
      }
    }
  });

  const targetAspect = objectiveProfile(objective).targetAspect ?? 1;
  const pareto = paretoNetCandidates(candidates, { targetAspect });
  const portfolio = diversifyCandidates(pareto.length ? pareto : candidates.slice().sort(netCandidateCompare), options.maximumCandidates ?? 8);
  const best = candidates.slice().sort(netCandidateCompare)[0];
  const validCount = candidates.filter((candidate) => candidate.valid).length;
  return {
    best,
    candidates: portfolio,
    paretoCount: pareto.length,
    stats: {
      attempts,
      uniqueTrees: candidates.length,
      validTrees: validCount,
      validRatio: candidates.length ? validCount / candidates.length : 0,
      objective,
      seed,
      localStarts,
    },
  };
}

function rankManualCandidates(candidates) {
  if (!candidates.length) return null;
  candidates.sort((left, right) => {
    if (left.net.valid !== right.net.valid) return left.net.valid ? -1 : 1;
    if (left.net.overlapPairs.length !== right.net.overlapPairs.length) return left.net.overlapPairs.length - right.net.overlapPairs.length;
    return left.net.score - right.net.score;
  });
  return candidates[0];
}

/**
 * Changes one edge to fold or cut while automatically exchanging the minimum
 * other edge needed to preserve a connected acyclic face tree.
 */
export function editNetEdge(polyhedron, analysis, net, edgeKey, desiredState, options = {}) {
  if (!analysis.topology.edgeMap.has(edgeKey)) throw new Error(`Unknown edge ${edgeKey}.`);
  const edge = analysis.topology.edgeMap.get(edgeKey);
  if (edge.incidences.length !== 2) throw new Error('Only shared manifold edges can be edited.');
  const foldKeys = new Set(net.treeEdgeKeys);
  const lockedFold = new Set(options.lockedFoldEdgeKeys ?? []);
  const lockedCut = new Set(options.lockedCutEdgeKeys ?? []);
  const rootFace = options.rootFace ?? net.rootFace ?? 0;
  const objective = options.objective ?? net.objective ?? 'compact';

  if (desiredState === 'fold' && foldKeys.has(edgeKey)) return { net, edit: { changed: false, edgeKey, desiredState } };
  if (desiredState === 'cut' && !foldKeys.has(edgeKey)) return { net, edit: { changed: false, edgeKey, desiredState } };
  if (desiredState === 'fold' && lockedCut.has(edgeKey)) throw new Error('That edge is locked as a cut. Unlock it before changing it.');
  if (desiredState === 'cut' && lockedFold.has(edgeKey)) throw new Error('That edge is locked as a fold. Unlock it before changing it.');

  const candidates = [];
  if (desiredState === 'fold') {
    const [left, right] = edge.incidences.map((incidence) => incidence.faceIndex);
    const cyclePath = treePathEdgeKeys(analysis, foldKeys, left, right);
    for (const removedKey of cyclePath) {
      if (lockedFold.has(removedKey)) continue;
      const next = new Set(foldKeys);
      next.add(edgeKey);
      next.delete(removedKey);
      try {
        const candidateNet = netFromEdgeKeys(polyhedron, analysis, next, { rootFace, objective, source: 'manual-edge-swap' });
        candidates.push({ net: candidateNet, addedEdgeKey: edgeKey, removedEdgeKey: removedKey });
      } catch {
        // Invalid exchanges are simply omitted from ranking.
      }
    }
  } else if (desiredState === 'cut') {
    const [first, second] = componentsAfterRemovingEdge(analysis, foldKeys, edgeKey);
    for (const dual of dualEdges(analysis)) {
      if (dual.edgeKey === edgeKey || foldKeys.has(dual.edgeKey) || lockedCut.has(dual.edgeKey)) continue;
      const crosses = (first.has(dual.leftFace) && second.has(dual.rightFace))
        || (first.has(dual.rightFace) && second.has(dual.leftFace));
      if (!crosses) continue;
      const next = new Set(foldKeys);
      next.delete(edgeKey);
      next.add(dual.edgeKey);
      try {
        const candidateNet = netFromEdgeKeys(polyhedron, analysis, next, { rootFace, objective, source: 'manual-edge-swap' });
        candidates.push({ net: candidateNet, addedEdgeKey: dual.edgeKey, removedEdgeKey: edgeKey });
      } catch {
        // Invalid exchanges are simply omitted from ranking.
      }
    }
  } else {
    throw new Error(`Unknown desired edge state ${desiredState}.`);
  }

  const selected = rankManualCandidates(candidates);
  if (!selected) throw new Error('No legal edge exchange satisfies the current locks.');
  selected.net.seed = net.seed;
  selected.net.attempts = net.attempts;
  selected.net.selectedAttempt = net.selectedAttempt;
  return {
    net: selected.net,
    edit: {
      changed: true,
      desiredState,
      selectedEdgeKey: edgeKey,
      addedEdgeKey: selected.addedEdgeKey,
      removedEdgeKey: selected.removedEdgeKey,
      alternativesEvaluated: candidates.length,
    },
  };
}

/** Re-roots an existing fold tree without changing which physical edges are cut. */
export function rerootNet(polyhedron, analysis, net, rootFace, options = {}) {
  return netFromEdgeKeys(polyhedron, analysis, net.treeEdgeKeys, {
    rootFace,
    objective: options.objective ?? net.objective,
    source: 'manual-reroot',
    seed: net.seed,
    attempts: net.attempts,
  });
}

/** Produces face attachment instructions from a planned net. */
export function buildStepsFromNet(polyhedron, analysis, net, buildability) {
  const assignment = (faceIndex) => {
    const entry = buildability.faceMatches[faceIndex];
    if (entry?.match) {
      return {
        kind: 'direct',
        tileId: entry.match.tile.id,
        label: entry.match.tile.label,
        pieceCount: 1,
        preassembly: null,
      };
    }
    if (entry?.compound) {
      return {
        kind: 'compound',
        tileId: entry.compound.tile.id,
        label: `${entry.compound.label} panel`,
        pieceCount: entry.compound.pieceCount,
        preassembly: `First arrange ${entry.compound.pieceCount} ${entry.compound.tile.label.toLowerCase()}s into one flat regular hexagon. The subdivision is exact, but keep the panel supported because whole-panel rigidity is not yet physically verified.`,
      };
    }
    return {
      kind: 'unsupported',
      tileId: null,
      label: analysis.faces[faceIndex].label,
      pieceCount: 0,
      preassembly: 'This face has no supported direct or exact compound physical assignment in the current profile set.',
    };
  };

  const steps = [];
  const rootAssignment = assignment(net.rootFace);
  steps.push({
    index: 0,
    faceIndex: net.rootFace,
    parentFaceIndex: null,
    edgeKey: null,
    tileId: rootAssignment.tileId,
    tileLabel: rootAssignment.label,
    assignmentKind: rootAssignment.kind,
    pieceCount: rootAssignment.pieceCount,
    title: rootAssignment.kind === 'compound'
      ? `Preassemble and place ${rootAssignment.label.toLowerCase()}`
      : `Start with ${rootAssignment.label.toLowerCase()}`,
    instruction: `${rootAssignment.preassembly ? `${rootAssignment.preassembly} ` : ''}Place this face flat as the anchor. Keep the numbered side facing up so every later hinge matches the on-screen net.`,
  });

  for (const faceIndex of net.order.slice(1)) {
    const parentFaceIndex = net.parentByFace[faceIndex];
    const connection = net.connectionByFace[faceIndex];
    const edgeAngle = analysis.dihedralAngles.find((entry) => entry.edgeKey === connection.edgeKey);
    const faceAssignment = assignment(faceIndex);
    const parentAssignment = assignment(parentFaceIndex);
    const hinge = buildability.hinges?.byEdgeKey?.[connection.edgeKey];
    const verification = hinge?.status === 'verified' ? ' Verified by your hinge calibration.'
      : hinge?.status === 'outside-range' ? ' This angle is outside your measured stable hinge range.'
        : hinge?.status === 'unsupported' ? ' One side of this hinge is not physically assigned.'
          : ' Hinge clearance is not yet physically calibrated.';
    steps.push({
      index: steps.length,
      faceIndex,
      parentFaceIndex,
      edgeKey: connection.edgeKey,
      tileId: faceAssignment.tileId,
      tileLabel: faceAssignment.label,
      assignmentKind: faceAssignment.kind,
      pieceCount: faceAssignment.pieceCount,
      title: faceAssignment.kind === 'compound'
        ? `Preassemble and attach ${faceAssignment.label.toLowerCase()}`
        : `Attach ${faceAssignment.label.toLowerCase()}`,
      instruction: `${faceAssignment.preassembly ? `${faceAssignment.preassembly} ` : ''}Join it to face ${parentFaceIndex + 1} (${parentAssignment.label.toLowerCase()}) along the highlighted edge, then fold toward an interior angle of ${edgeAngle ? edgeAngle.degrees.toFixed(1) : 'the shown'}°.${verification}`,
      dihedralDegrees: edgeAngle?.degrees ?? null,
      hingeStatus: hinge?.status ?? 'unverified',
    });
  }
  return steps;
}
