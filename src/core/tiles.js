import { clamp, median, roundTo, toDegrees, toRadians } from './math.js';
import { exactCompoundScaleEstimatesForFace, planExactCompoundFaces } from './compound.js';

export const STANDARD_TILE_EDGE_MM = 74.93;
export const MICRO_TILE_EDGE_MM = 37.465;
export const TILE_PROFILE_SCHEMA_V2 = 'https://magnamath.app/schema/tile-profile/v2';

const degrees = (values) => values.map(toRadians);
const tallSideRatio = 1 / (2 * Math.sin(Math.PI / 12)); // nominal 30° apex isosceles profile
const nowDate = '2026-08-08';

function source(kind, title, url, note = '') {
  return { kind, title, url, accessedAt: nowDate, note };
}

function profile({
  id,
  label,
  family,
  sideRatios,
  anglesDegrees,
  dimensionsMm,
  confidence = 'derived',
  scaleConfidence = 'derived',
  sourceInfo,
  systemId = 'magna-tiles',
  connectorCompatibility = 'magna-tiles-edge',
  thicknessMm = null,
  cornerRadiusMm = null,
  hingeRangeDegrees = null,
}) {
  return {
    schema: TILE_PROFILE_SCHEMA_V2,
    schemaVersion: 2,
    id,
    label,
    systemId,
    family,
    sideRatios,
    angles: degrees(anglesDegrees),
    anglesDegrees,
    dimensionsMm,
    thicknessMm,
    cornerRadiusMm,
    connector: {
      type: 'rotating-edge-magnet',
      compatibilityGroup: connectorCompatibility,
      coverage: 'edge',
    },
    hingeRangeDegrees,
    confidence,
    scaleConfidence,
    source: sourceInfo,
    builtin: true,
  };
}

const classicSource = source(
  'manufacturer',
  'MAGNA-TILES FAQ and product size diagrams',
  'https://magnatiles.com/pages/faq',
  'Manufacturer describes a 3-inch base; current product diagrams label the standard square at 74.93 mm / 2.95 in.',
);
const microSource = source(
  'manufacturer',
  'microMAGS 70 Piece Set size diagram',
  'https://magnatiles.com/products/micromags-70-piece-set',
  'Manufacturer diagram labels microMAGS at 37.465 mm / 1.475 in and standard at 74.93 mm / 2.95 in.',
);
const derivedTriangleSource = source(
  'derived',
  'Nominal classic triangle geometry pending sample calibration',
  'https://magnatiles.com/products/magna-tiles-classic-74-piece-set',
  'Shape family is manufacturer-listed; non-equilateral dimensions are geometric derivations and must be calibrated for metrology-grade use.',
);

/**
 * Built-in profiles distinguish manufacturer-published scale from dimensions
 * derived from nominal polygon geometry. User calibrations can override any
 * profile without mutating this immutable baseline.
 */
export const BUILTIN_TILE_PROFILES = Object.freeze([
  profile({
    id: 'square', label: 'Square', family: 'standard', sideRatios: [1, 1, 1, 1],
    anglesDegrees: [90, 90, 90, 90], dimensionsMm: [STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM],
    confidence: 'canonical', scaleConfidence: 'manufacturer', sourceInfo: classicSource,
  }),
  profile({
    id: 'large-square', label: 'Large square', family: 'standard', sideRatios: [1, 1, 1, 1],
    anglesDegrees: [90, 90, 90, 90], dimensionsMm: [2 * STANDARD_TILE_EDGE_MM, 2 * STANDARD_TILE_EDGE_MM, 2 * STANDARD_TILE_EDGE_MM, 2 * STANDARD_TILE_EDGE_MM],
    confidence: 'canonical', scaleConfidence: 'derived', sourceInfo: derivedTriangleSource,
  }),
  profile({
    id: 'equilateral-triangle', label: 'Equilateral triangle', family: 'standard', sideRatios: [1, 1, 1],
    anglesDegrees: [60, 60, 60], dimensionsMm: [STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM],
    confidence: 'canonical', scaleConfidence: 'manufacturer', sourceInfo: classicSource,
  }),
  profile({
    id: 'right-triangle', label: 'Right triangle', family: 'standard', sideRatios: [1, 1, Math.SQRT2],
    anglesDegrees: [45, 90, 45], dimensionsMm: [STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM * Math.SQRT2],
    confidence: 'nominal', scaleConfidence: 'derived', sourceInfo: derivedTriangleSource,
  }),
  profile({
    id: 'isosceles-triangle', label: 'Tall isosceles triangle', family: 'standard', sideRatios: [1, tallSideRatio, tallSideRatio],
    anglesDegrees: [75, 30, 75], dimensionsMm: [STANDARD_TILE_EDGE_MM, STANDARD_TILE_EDGE_MM * tallSideRatio, STANDARD_TILE_EDGE_MM * tallSideRatio],
    confidence: 'nominal', scaleConfidence: 'derived', sourceInfo: derivedTriangleSource,
  }),
  profile({
    id: 'micro-square', label: 'microMAGS square', family: 'micro', sideRatios: [1, 1, 1, 1],
    anglesDegrees: [90, 90, 90, 90], dimensionsMm: [MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM],
    confidence: 'canonical', scaleConfidence: 'manufacturer', sourceInfo: microSource,
  }),
  profile({
    id: 'micro-equilateral-triangle', label: 'microMAGS equilateral triangle', family: 'micro', sideRatios: [1, 1, 1],
    anglesDegrees: [60, 60, 60], dimensionsMm: [MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM],
    confidence: 'canonical', scaleConfidence: 'manufacturer', sourceInfo: microSource,
  }),
  profile({
    id: 'micro-right-triangle', label: 'microMAGS right triangle', family: 'micro', sideRatios: [1, 1, Math.SQRT2],
    anglesDegrees: [45, 90, 45], dimensionsMm: [MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM * Math.SQRT2],
    confidence: 'nominal', scaleConfidence: 'derived', sourceInfo: derivedTriangleSource,
  }),
  profile({
    id: 'micro-isosceles-triangle', label: 'microMAGS tall isosceles triangle', family: 'micro', sideRatios: [1, tallSideRatio, tallSideRatio],
    anglesDegrees: [75, 30, 75], dimensionsMm: [MICRO_TILE_EDGE_MM, MICRO_TILE_EDGE_MM * tallSideRatio, MICRO_TILE_EDGE_MM * tallSideRatio],
    confidence: 'nominal', scaleConfidence: 'derived', sourceInfo: derivedTriangleSource,
  }),
]);

// Backwards-compatible name used by the initial UI and tests.
export const TILE_LIBRARY = BUILTIN_TILE_PROFILES;

export const INVENTORY_PRESETS = {
  custom: {
    label: 'Custom inventory',
    pieceCount: null,
    families: ['standard'],
    counts: {
      square: 12, 'large-square': 0, 'equilateral-triangle': 20, 'right-triangle': 6, 'isosceles-triangle': 8,
      'micro-square': 0, 'micro-equilateral-triangle': 0, 'micro-right-triangle': 0, 'micro-isosceles-triangle': 0,
    },
  },
  classic37: {
    label: 'Classic 37-piece',
    pieceCount: 37,
    families: ['standard'],
    source: 'https://magnatiles.com/products/magna-tiles-classic-37-piece-set',
    counts: {
      square: 18, 'large-square': 2, 'equilateral-triangle': 7, 'right-triangle': 6, 'isosceles-triangle': 4,
      'micro-square': 0, 'micro-equilateral-triangle': 0, 'micro-right-triangle': 0, 'micro-isosceles-triangle': 0,
    },
  },
  classic74: {
    label: 'Classic 74-piece',
    pieceCount: 74,
    families: ['standard'],
    source: 'https://magnatiles.com/products/magna-tiles-classic-74-piece-set',
    counts: {
      square: 40, 'large-square': 6, 'equilateral-triangle': 14, 'right-triangle': 6, 'isosceles-triangle': 8,
      'micro-square': 0, 'micro-equilateral-triangle': 0, 'micro-right-triangle': 0, 'micro-isosceles-triangle': 0,
    },
  },
  classic100: {
    label: 'Classic 100-piece',
    pieceCount: 100,
    families: ['standard'],
    source: 'https://magnatiles.com/products/magna-tiles-classic-100-piece-set',
    counts: {
      square: 50, 'large-square': 4, 'equilateral-triangle': 20, 'right-triangle': 11, 'isosceles-triangle': 15,
      'micro-square': 0, 'micro-equilateral-triangle': 0, 'micro-right-triangle': 0, 'micro-isosceles-triangle': 0,
    },
  },
  micro70: {
    label: 'microMAGS 70-piece',
    pieceCount: 70,
    excludedPieces: { 'micro-large-rectangle': 2 },
    excludedNote: 'The manufacturer lists two large rectangles; exact edge dimensions are not published in the cited product data, so they remain inventory metadata until calibrated.',
    families: ['micro'],
    source: 'https://magnatiles.com/products/micromags-70-piece-set',
    counts: {
      square: 0, 'large-square': 0, 'equilateral-triangle': 0, 'right-triangle': 0, 'isosceles-triangle': 0,
      'micro-square': 40, 'micro-equilateral-triangle': 14, 'micro-right-triangle': 6, 'micro-isosceles-triangle': 8,
    },
  },
  combo46: {
    label: 'Combo 46-piece',
    pieceCount: 46,
    families: ['standard', 'micro'],
    source: 'https://magnatiles.com/products/combo-46-piece-set',
    counts: {
      square: 8, 'large-square': 0, 'equilateral-triangle': 6, 'right-triangle': 2, 'isosceles-triangle': 4,
      'micro-square': 8, 'micro-equilateral-triangle': 6, 'micro-right-triangle': 4, 'micro-isosceles-triangle': 8,
    },
  },
};

function confidenceScore(profileValue) {
  return {
    canonical: 1,
    manufacturer: 1,
    calibrated: 0.98,
    measured: 0.94,
    derived: 0.86,
    nominal: 0.78,
    approximate: 0.65,
    unknown: 0.45,
  }[profileValue] ?? 0.6;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function standardDeviation(values, average = mean(values)) {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function normalizeSides(values) {
  const representative = mean(values);
  return representative <= 1e-12 ? values.slice() : values.map((value) => value / representative);
}

function relativeError(left, right) {
  return Math.abs(left - right) / Math.max(Math.abs(right), 1e-9);
}

function alignmentIndices(length, offset, reversed) {
  const sideIndices = [];
  const angleIndices = [];
  for (let index = 0; index < length; index += 1) {
    if (!reversed) {
      sideIndices.push((offset + index) % length);
      angleIndices.push((offset + index) % length);
    } else {
      angleIndices.push((offset - index + length * 4) % length);
      sideIndices.push((offset - index - 1 + length * 4) % length);
    }
  }
  return { sideIndices, angleIndices, reversed, offset };
}

function allAlignments(length) {
  const alignments = [];
  for (let offset = 0; offset < length; offset += 1) {
    alignments.push(alignmentIndices(length, offset, false));
    alignments.push(alignmentIndices(length, offset, true));
  }
  return alignments;
}

function profileDimensions(profileValue) {
  if (Array.isArray(profileValue.dimensionsMm) && profileValue.dimensionsMm.length === profileValue.sideRatios.length) {
    return profileValue.dimensionsMm;
  }
  if (Number.isFinite(profileValue.referenceEdgeMm)) {
    return profileValue.sideRatios.map((ratio) => ratio * profileValue.referenceEdgeMm);
  }
  return null;
}

/** Combines built-ins with local profile overrides or additions. */
export function mergeTileProfiles(overrides = []) {
  const merged = new Map(BUILTIN_TILE_PROFILES.map((item) => [item.id, structuredClone(item)]));
  for (const override of overrides ?? []) {
    if (!override?.id) continue;
    const base = merged.get(override.id) ?? {};
    const anglesDegrees = override.anglesDegrees ?? base.anglesDegrees;
    merged.set(override.id, {
      ...base,
      ...structuredClone(override),
      schema: TILE_PROFILE_SCHEMA_V2,
      schemaVersion: 2,
      anglesDegrees,
      angles: anglesDegrees?.map(toRadians) ?? override.angles ?? base.angles,
      builtin: false,
    });
  }
  return [...merged.values()];
}

/** @param {Record<string, number>} counts @param {any[]=} profiles */
export function normalizeInventory(counts, profiles = BUILTIN_TILE_PROFILES) {
  return Object.fromEntries(profiles.map((tile) => [tile.id, Math.max(0, Math.round(Number(counts?.[tile.id] ?? 0)))]));
}

/**
 * Returns every cyclic/reflected fit for one face/profile, then selects the
 * lowest combined shape, angle, and optional fixed-scale error.
 */
export function matchFaceToProfile(faceAnalysis, tile, options = {}) {
  if (tile.sideRatios.length !== faceAnalysis.lengths.length) return null;
  const sideTolerance = options.sideTolerance ?? 0.025;
  const angleTolerance = toRadians(options.angleToleranceDegrees ?? 2.5);
  const dimensionTolerance = options.dimensionTolerance ?? 0.035;
  const tileDimensions = profileDimensions(tile);
  const faceNormalized = normalizeSides(faceAnalysis.lengths);
  let best = null;

  for (const alignment of allAlignments(faceAnalysis.lengths.length)) {
    const alignedRatios = alignment.sideIndices.map((index) => tile.sideRatios[index]);
    const alignedNormalized = normalizeSides(alignedRatios);
    const sideError = Math.max(...faceNormalized.map((value, index) => relativeError(value, alignedNormalized[index])));
    const alignedAngles = alignment.angleIndices.map((index) => tile.angles[index]);
    const angleErrors = faceAnalysis.angles.map((value, index) => Math.abs(value - alignedAngles[index]));
    const angleError = Math.max(...angleErrors);

    let alignedDimensionsMm = null;
    let estimatedScaleMmPerUnit = null;
    let scaleError = null;
    if (tileDimensions) {
      alignedDimensionsMm = alignment.sideIndices.map((index) => tileDimensions[index]);
      const estimates = alignedDimensionsMm.map((value, index) => value / Math.max(faceAnalysis.lengths[index], 1e-9));
      estimatedScaleMmPerUnit = median(estimates);
      const scale = Number.isFinite(options.modelUnitMm) ? options.modelUnitMm : estimatedScaleMmPerUnit;
      scaleError = Math.max(...alignedDimensionsMm.map((value, index) => relativeError(faceAnalysis.lengths[index] * scale, value)));
    }

    const compatibleShape = sideError <= sideTolerance && angleError <= angleTolerance;
    const compatibleScale = scaleError == null || !Number.isFinite(options.modelUnitMm) || scaleError <= dimensionTolerance;
    const score = sideError * 5 + angleError / Math.PI * 2 + (scaleError ?? 0) * 4
      + (1 - confidenceScore(tile.confidence)) * 0.015
      + (1 - confidenceScore(tile.scaleConfidence)) * 0.015;
    const candidate = {
      tile,
      sideError,
      angleError,
      angleErrors,
      scaleError,
      estimatedScaleMmPerUnit,
      alignedDimensionsMm,
      alignment,
      score,
      compatibleShape,
      compatibleScale,
      compatible: compatibleShape && compatibleScale,
    };
    if (!best || candidate.score < best.score) best = candidate;
  }
  return best;
}

/** @param {any} faceAnalysis @param {{profiles?: any[], sideTolerance?: number, angleToleranceDegrees?: number, dimensionTolerance?: number, modelUnitMm?: number, families?: string[], systemIds?: string[]}=} options */
export function matchFaceToTiles(faceAnalysis, options = {}) {
  const profiles = options.profiles ?? BUILTIN_TILE_PROFILES;
  const families = options.families ?? [...new Set(profiles.map((tile) => tile.family))];
  const systemIds = options.systemIds ?? null;
  return profiles
    .filter((tile) => families.includes(tile.family) && (!systemIds || systemIds.includes(tile.systemId)))
    .map((tile) => matchFaceToProfile(faceAnalysis, tile, options))
    .filter((candidate) => candidate?.compatible)
    .sort((left, right) => left.score - right.score);
}

/** Backwards-compatible best-match helper. */
export function matchFaceToTile(faceAnalysis, options = {}) {
  return matchFaceToTiles(faceAnalysis, options)[0] ?? null;
}

function clusterScaleCandidates(values, tolerance = 0.025) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const clusters = [];
  for (const value of sorted) {
    const cluster = clusters.find((item) => relativeError(value, item.center) <= tolerance);
    if (cluster) {
      cluster.values.push(value);
      cluster.center = median(cluster.values);
    } else {
      clusters.push({ center: value, values: [value] });
    }
  }
  return clusters.sort((left, right) => right.values.length - left.values.length || left.center - right.center);
}

class MinCostFlow {
  constructor(size) {
    this.graph = Array.from({ length: size }, () => []);
  }

  addEdge(from, to, capacity, cost, meta = null) {
    const forward = { to, reverse: this.graph[to].length, capacity, initialCapacity: capacity, cost, meta };
    const reverse = { to: from, reverse: this.graph[from].length, capacity: 0, initialCapacity: 0, cost: -cost, meta: null };
    this.graph[from].push(forward);
    this.graph[to].push(reverse);
    return forward;
  }

  solve(sourceNode, sinkNode, maximumFlow) {
    let flow = 0;
    let cost = 0;
    while (flow < maximumFlow) {
      const distance = new Array(this.graph.length).fill(Number.POSITIVE_INFINITY);
      const inQueue = new Array(this.graph.length).fill(false);
      const previousNode = new Array(this.graph.length).fill(-1);
      const previousEdge = new Array(this.graph.length).fill(-1);
      const queue = [sourceNode];
      distance[sourceNode] = 0;
      inQueue[sourceNode] = true;

      while (queue.length) {
        const node = queue.shift();
        inQueue[node] = false;
        this.graph[node].forEach((edge, edgeIndex) => {
          if (edge.capacity <= 0) return;
          const nextDistance = distance[node] + edge.cost;
          if (nextDistance >= distance[edge.to]) return;
          distance[edge.to] = nextDistance;
          previousNode[edge.to] = node;
          previousEdge[edge.to] = edgeIndex;
          if (!inQueue[edge.to]) {
            inQueue[edge.to] = true;
            queue.push(edge.to);
          }
        });
      }
      if (!Number.isFinite(distance[sinkNode])) break;

      let amount = maximumFlow - flow;
      for (let node = sinkNode; node !== sourceNode; node = previousNode[node]) {
        const edge = this.graph[previousNode[node]][previousEdge[node]];
        amount = Math.min(amount, edge.capacity);
      }
      for (let node = sinkNode; node !== sourceNode; node = previousNode[node]) {
        const from = previousNode[node];
        const edge = this.graph[from][previousEdge[node]];
        edge.capacity -= amount;
        this.graph[node][edge.reverse].capacity += amount;
      }
      flow += amount;
      cost += amount * distance[sinkNode];
    }
    return { flow, cost };
  }
}

function assignCandidates(faceCandidates, inventory, profiles) {
  const supportedFaces = faceCandidates.filter((entry) => entry.candidates.length > 0);
  const profileIds = [...new Set(supportedFaces.flatMap((entry) => entry.candidates.map((candidate) => candidate.tile.id)))];
  const profileIndex = new Map(profileIds.map((id, index) => [id, index]));
  const faceCount = supportedFaces.length;
  const sourceNode = 0;
  const firstFaceNode = 1;
  const firstProfileNode = firstFaceNode + faceCount;
  const sinkNode = firstProfileNode + profileIds.length;
  const network = new MinCostFlow(sinkNode + 1);
  const candidateEdges = [];
  const missingPenalty = 10_000_000;

  supportedFaces.forEach((entry, facePosition) => {
    const faceNode = firstFaceNode + facePosition;
    network.addEdge(sourceNode, faceNode, 1, 0);
    entry.candidates.forEach((candidate, candidatePosition) => {
      const tileNode = firstProfileNode + profileIndex.get(candidate.tile.id);
      const edge = network.addEdge(faceNode, tileNode, 1, Math.max(0, Math.round(candidate.score * 100_000)) + candidatePosition, {
        type: 'assignment', faceIndex: entry.faceIndex, candidate,
      });
      candidateEdges.push(edge);
    });
  });

  profileIds.forEach((id, index) => {
    const tileNode = firstProfileNode + index;
    network.addEdge(tileNode, sinkNode, Math.max(0, inventory[id] ?? 0), 0, { type: 'owned', tileId: id });
    network.addEdge(tileNode, sinkNode, faceCount, missingPenalty, { type: 'missing', tileId: id });
  });

  const solved = network.solve(sourceNode, sinkNode, faceCount);
  const assignments = new Map();
  for (const edge of candidateEdges) {
    if (edge.initialCapacity === 1 && edge.capacity === 0) assignments.set(edge.meta.faceIndex, edge.meta.candidate);
  }
  const required = Object.fromEntries(profiles.map((item) => [item.id, 0]));
  for (const candidate of assignments.values()) required[candidate.tile.id] = (required[candidate.tile.id] ?? 0) + 1;
  const shortages = Object.entries(required)
    .filter(([, count]) => count > 0)
    .map(([tileId, count]) => ({
      tileId,
      label: profiles.find((tile) => tile.id === tileId)?.label ?? tileId,
      required: count,
      available: inventory[tileId] ?? 0,
      missing: Math.max(0, count - (inventory[tileId] ?? 0)),
    }))
    .filter((entry) => entry.missing > 0);
  return { assignments, required, shortages, flow: solved.flow, assignmentCost: solved.cost };
}

function shortagesForRequired(required, inventory, profiles) {
  return Object.entries(required)
    .filter(([, count]) => count > 0)
    .map(([tileId, count]) => ({
      tileId,
      label: profiles.find((tile) => tile.id === tileId)?.label ?? tileId,
      required: count,
      available: inventory[tileId] ?? 0,
      missing: Math.max(0, count - (inventory[tileId] ?? 0)),
    }))
    .filter((entry) => entry.missing > 0);
}

function evaluateScale(analysis, profiles, inventory, modelUnitMm, options) {
  const faceCandidates = analysis.faces.map((face) => ({
    faceIndex: face.faceIndex,
    candidates: matchFaceToTiles(face, { ...options, profiles, modelUnitMm }),
  }));
  const directUnsupported = faceCandidates.filter((entry) => entry.candidates.length === 0);
  const assigned = assignCandidates(faceCandidates, inventory, profiles);
  const compound = options.enableCompoundFaces === false
    ? { assignments: new Map(), required: assigned.required, unresolved: directUnsupported.map((entry) => entry.faceIndex) }
    : planExactCompoundFaces(
      analysis,
      directUnsupported.map((entry) => entry.faceIndex),
      profiles,
      inventory,
      assigned.required,
      { ...options, modelUnitMm },
    );
  const unsupportedFaceSet = new Set(compound.unresolved);
  const unsupported = directUnsupported.filter((entry) => unsupportedFaceSet.has(entry.faceIndex));
  const required = compound.required;
  const shortages = shortagesForRequired(required, inventory, profiles);
  const shortageCount = shortages.reduce((sum, entry) => sum + entry.missing, 0);
  const fitCost = [...assigned.assignments.values()].reduce((sum, candidate) => sum + candidate.score, 0)
    + [...compound.assignments.values()].reduce((sum, candidate) => sum + candidate.scaleError * 4 + 0.03, 0);
  const confidencePenalty = [...assigned.assignments.values()].reduce((sum, candidate) => (
    sum + (1 - confidenceScore(candidate.tile.confidence)) + (1 - confidenceScore(candidate.tile.scaleConfidence))
  ), 0) + [...compound.assignments.values()].reduce((sum, candidate) => (
    sum + (1 - confidenceScore(candidate.tile.confidence)) + (1 - confidenceScore(candidate.tile.scaleConfidence)) + 0.04
  ), 0);
  const preferredScalePenalty = Number.isFinite(options.preferredScaleMmPerUnit)
    ? relativeError(modelUnitMm, options.preferredScaleMmPerUnit) * 10
    : 0;
  const score = unsupported.length * 1e9 + shortageCount * 1e7 + fitCost * 1e4 + confidencePenalty * 100 + preferredScalePenalty;
  return {
    modelUnitMm,
    faceCandidates,
    directUnsupported,
    unsupported,
    ...assigned,
    required,
    shortages,
    compoundAssignments: compound.assignments,
    shortageCount,
    fitCost,
    confidencePenalty,
    score,
  };
}

function boundaryAssignment(faceEntry, localEdgeIndex) {
  if (faceEntry?.match) {
    return {
      tile: faceEntry.match.tile,
      dimensionMm: faceEntry.match.alignedDimensionsMm?.[localEdgeIndex] ?? null,
      source: 'direct',
    };
  }
  if (faceEntry?.compound) {
    const boundary = faceEntry.compound.boundary?.find((item) => item.localEdgeIndex === localEdgeIndex);
    if (!boundary) return null;
    return {
      tile: faceEntry.compound.tile,
      dimensionMm: boundary.dimensionMm ?? null,
      source: 'compound',
    };
  }
  return null;
}

function analyzeHinges(analysis, faceMatches) {
  const byEdgeKey = {};
  const entries = [];
  for (const edge of analysis.topology.edges) {
    if (edge.incidences.length !== 2) continue;
    const [leftIncidence, rightIncidence] = edge.incidences;
    const left = boundaryAssignment(faceMatches[leftIncidence.faceIndex], leftIncidence.localEdgeIndex);
    const right = boundaryAssignment(faceMatches[rightIncidence.faceIndex], rightIncidence.localEdgeIndex);
    const angle = analysis.dihedralAngles.find((item) => item.edgeKey === edge.key)?.degrees ?? null;
    let status = 'unverified';
    let reason = 'Hinge range has not been measured for one or both tile profiles.';
    const leftDimension = left?.dimensionMm ?? null;
    const rightDimension = right?.dimensionMm ?? null;
    const lengthMismatchMm = leftDimension != null && rightDimension != null ? Math.abs(leftDimension - rightDimension) : null;
    if (!left || !right) {
      status = 'unsupported';
      reason = 'One or both faces do not have a compatible physical tile.';
    } else if (left.tile.connector?.compatibilityGroup !== right.tile.connector?.compatibilityGroup) {
      status = 'connector-mismatch';
      reason = 'The two tile connector systems are not declared compatible.';
    } else if (lengthMismatchMm != null && lengthMismatchMm > Math.max(1, Math.max(leftDimension, rightDimension) * 0.03)) {
      status = 'edge-length-mismatch';
      reason = `Matched physical edges differ by ${roundTo(lengthMismatchMm, 2)} mm.`;
    } else {
      const ranges = [left.tile.hingeRangeDegrees, right.tile.hingeRangeDegrees].filter(Boolean);
      if (ranges.length === 2 && angle != null) {
        const minimum = Math.max(...ranges.map((range) => range.minInterior));
        const maximum = Math.min(...ranges.map((range) => range.maxInterior));
        if (angle >= minimum && angle <= maximum) {
          status = 'verified';
          reason = `The ${roundTo(angle, 1)}° target lies inside the measured ${roundTo(minimum, 1)}–${roundTo(maximum, 1)}° stable range.`;
        } else {
          status = 'outside-range';
          reason = `The ${roundTo(angle, 1)}° target is outside the measured ${roundTo(minimum, 1)}–${roundTo(maximum, 1)}° stable range.`;
        }
      }
    }
    const entry = { edgeKey: edge.key, faces: [leftIncidence.faceIndex, rightIncidence.faceIndex], angleDegrees: angle, status, reason, lengthMismatchMm };
    byEdgeKey[edge.key] = entry;
    entries.push(entry);
  }
  return {
    entries,
    byEdgeKey,
    counts: entries.reduce((counts, entry) => ({ ...counts, [entry.status]: (counts[entry.status] ?? 0) + 1 }), {}),
    verifiedRatio: entries.length ? entries.filter((entry) => entry.status === 'verified').length / entries.length : 0,
  };
}

/** @param {any} analysis @param {Record<string, number>} inventory @param {any=} options */
export function analyzeBuildability(analysis, inventory, options = {}) {
  const profiles = mergeTileProfiles(options.profileOverrides ?? options.profiles ?? []);
  const families = options.families ?? ['standard'];
  const activeProfiles = profiles.filter((item) => families.includes(item.family) && (!options.systemIds || options.systemIds.includes(item.systemId)));
  const normalizedInventory = normalizeInventory(inventory, profiles);

  let scaleCandidates;
  if (Number.isFinite(options.modelUnitMm)) {
    scaleCandidates = [{ center: Number(options.modelUnitMm), values: [Number(options.modelUnitMm)] }];
  } else {
    const estimates = [];
    for (const face of analysis.faces) {
      for (const tile of activeProfiles) {
        const candidate = matchFaceToProfile(face, tile, options);
        if (candidate?.compatibleShape && Number.isFinite(candidate.estimatedScaleMmPerUnit)) estimates.push(candidate.estimatedScaleMmPerUnit);
      }
      if (options.enableCompoundFaces !== false) estimates.push(...exactCompoundScaleEstimatesForFace(face, activeProfiles));
    }
    scaleCandidates = clusterScaleCandidates(estimates, options.scaleClusterTolerance ?? 0.025).slice(0, options.maxScaleCandidates ?? 16);
  }

  if (!scaleCandidates.length) {
    const unsupported = analysis.faces.map((face) => ({ faceIndex: face.faceIndex, faceKind: face.kind, faceLabel: face.label, match: null, reason: 'No profile has a compatible polygon outline.' }));
    return {
      profiles,
      activeProfiles,
      inventory: normalizedInventory,
      faceMatches: unsupported,
      required: Object.fromEntries(profiles.map((tile) => [tile.id, 0])),
      unsupported,
      shortages: [],
      geometricallyBuildable: false,
      inventoryReady: false,
      ready: false,
      supportRatio: 0,
      confidence: 0,
      confidenceLabel: 'unsupported',
      modelUnitMm: null,
      scaleAlternatives: [],
      hinges: { entries: [], byEdgeKey: {}, counts: {}, verifiedRatio: 0 },
      summary: 'No active physical tile profile matches these face shapes.',
    };
  }

  const evaluations = scaleCandidates.map((cluster) => evaluateScale(
    analysis,
    activeProfiles,
    normalizedInventory,
    cluster.center,
    { ...options, families },
  )).sort((left, right) => left.score - right.score);
  const selected = evaluations[0];
  const faceMatches = analysis.faces.map((face) => {
    const match = selected.assignments.get(face.faceIndex) ?? null;
    const compound = selected.compoundAssignments?.get(face.faceIndex) ?? null;
    return {
      faceIndex: face.faceIndex,
      faceKind: face.kind,
      faceLabel: face.label,
      match,
      compound,
      candidates: selected.faceCandidates[face.faceIndex]?.candidates ?? [],
      reason: match || compound ? null : 'No direct or exact compound profile fits this face at the selected global physical scale.',
    };
  });
  const unsupported = faceMatches.filter((entry) => !entry.match && !entry.compound);
  const compoundFaces = faceMatches.filter((entry) => entry.compound);
  const totalSupported = faceMatches.length - unsupported.length;
  const supportRatio = faceMatches.length ? totalSupported / faceMatches.length : 0;
  const assignedMatches = faceMatches.map((entry) => entry.match).filter(Boolean);
  const compoundMatches = compoundFaces.map((entry) => entry.compound);
  const confidenceValues = [
    ...assignedMatches.map((entry) => Math.min(
      confidenceScore(entry.tile.confidence),
      confidenceScore(entry.tile.scaleConfidence),
      clamp(1 - (entry.scaleError ?? 0) * 8, 0, 1),
      clamp(1 - entry.sideError * 8, 0, 1),
    )),
    ...compoundMatches.map((entry) => Math.min(
      confidenceScore(entry.tile.confidence),
      confidenceScore(entry.tile.scaleConfidence),
      clamp(1 - (entry.scaleError ?? 0) * 8, 0, 1),
      0.92,
    )),
  ];
  const confidence = confidenceValues.length ? Math.min(...confidenceValues) : 0;
  const allUserCalibrated = confidenceValues.length > 0 && [...assignedMatches, ...compoundMatches].every((entry) => (
    entry.tile.confidence === 'calibrated' && entry.tile.scaleConfidence === 'calibrated'
  ));
  const confidenceLabel = allUserCalibrated ? 'user-calibrated'
    : confidence >= 0.96 ? 'published/high'
      : confidence >= 0.85 ? 'good'
        : confidence >= 0.7 ? 'nominal'
          : 'low';
  const hinges = analyzeHinges(analysis, faceMatches);
  const geometricallyBuildable = unsupported.length === 0;
  const inventoryReady = selected.shortages.length === 0;
  const ready = geometricallyBuildable && inventoryReady;
  const missingCount = selected.shortages.reduce((sum, entry) => sum + entry.missing, 0);
  const compoundText = compoundFaces.length
    ? ` ${compoundFaces.length} face${compoundFaces.length === 1 ? '' : 's'} use exact six-triangle panel${compoundFaces.length === 1 ? '' : 's'} whose mechanics remain unverified.`
    : '';
  const summary = unsupported.length
    ? `${unsupported.length} face${unsupported.length === 1 ? '' : 's'} still need a custom tile or a future compound recipe at ${roundTo(selected.modelUnitMm, 3)} mm per model unit.${compoundText}`
    : selected.shortages.length
      ? `${missingCount} more tile${missingCount === 1 ? '' : 's'} needed at ${roundTo(selected.modelUnitMm, 3)} mm per model unit.${compoundText}`
      : `Your inventory can represent this solid at ${roundTo(selected.modelUnitMm, 3)} mm per model unit.${compoundText}`;

  return {
    profiles,
    activeProfiles,
    inventory: normalizedInventory,
    faceMatches,
    required: selected.required,
    unsupported,
    compoundFaces,
    compoundByFace: Object.fromEntries(compoundFaces.map((entry) => [entry.faceIndex, entry.compound])),
    shortages: selected.shortages,
    geometricallyBuildable,
    inventoryReady,
    ready,
    supportRatio,
    confidence,
    confidenceLabel,
    modelUnitMm: selected.modelUnitMm,
    scaleAlternatives: evaluations.slice(0, 8).map((evaluation) => ({
      modelUnitMm: evaluation.modelUnitMm,
      unsupportedFaces: evaluation.unsupported.length,
      compoundFaces: evaluation.compoundAssignments?.size ?? 0,
      shortageCount: evaluation.shortageCount,
      score: evaluation.score,
    })),
    hinges,
    summary,
  };
}

/** @param {any} buildability */
export function formatBillOfMaterials(buildability) {
  return Object.entries(buildability.required)
    .filter(([, count]) => count > 0)
    .map(([tileId, count]) => ({
      tileId,
      label: buildability.profiles.find((tile) => tile.id === tileId)?.label ?? tileId,
      count,
      available: buildability.inventory[tileId] ?? 0,
      confidence: buildability.profiles.find((tile) => tile.id === tileId)?.confidence ?? 'unknown',
    }));
}

/** @param {any} match */
export function describeMatch(match) {
  if (!match) return 'No physical tile profile matches this face at the selected scale.';
  const scaleText = match.scaleError == null ? 'scale not verified' : `scale error ${roundTo(match.scaleError * 100, 2)}%`;
  return `${match.tile.label} · shape error ${roundTo(match.sideError * 100, 2)}% · angle error ${roundTo(toDegrees(match.angleError), 2)}° · ${scaleText} · ${match.tile.confidence}`;
}

function parseFinite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Computes repeatability statistics and creates a local profile override. */
export function createCalibratedProfile(baseProfile, session) {
  if (!baseProfile) throw new Error('A base tile profile is required.');
  const sideCount = baseProfile.sideRatios.length;
  const samples = (session.samples ?? []).map((sample, index) => {
    const edgeLengthsMm = (sample.edgeLengthsMm ?? []).map(Number);
    if (edgeLengthsMm.length !== sideCount || edgeLengthsMm.some((value) => !Number.isFinite(value) || value <= 0)) {
      throw new Error(`Calibration sample ${index + 1} must contain ${sideCount} positive edge lengths.`);
    }
    const anglesDegrees = sample.anglesDegrees?.map(Number);
    if (anglesDegrees && (anglesDegrees.length !== sideCount || anglesDegrees.some((value) => !Number.isFinite(value) || value <= 0 || value >= 180))) {
      throw new Error(`Calibration sample ${index + 1} has invalid interior angles.`);
    }
    return {
      edgeLengthsMm,
      anglesDegrees: anglesDegrees ?? null,
      thicknessMm: parseFinite(sample.thicknessMm),
      cornerRadiusMm: parseFinite(sample.cornerRadiusMm),
    };
  });
  if (!samples.length) throw new Error('Add at least one physical measurement sample.');

  const dimensionsMm = Array.from({ length: sideCount }, (_, edgeIndex) => mean(samples.map((sample) => sample.edgeLengthsMm[edgeIndex])));
  const dimensionStats = dimensionsMm.map((average, edgeIndex) => ({
    edgeIndex,
    meanMm: average,
    standardDeviationMm: standardDeviation(samples.map((sample) => sample.edgeLengthsMm[edgeIndex]), average),
    minimumMm: Math.min(...samples.map((sample) => sample.edgeLengthsMm[edgeIndex])),
    maximumMm: Math.max(...samples.map((sample) => sample.edgeLengthsMm[edgeIndex])),
  }));
  const angleSamples = samples.filter((sample) => sample.anglesDegrees);
  const anglesDegrees = angleSamples.length
    ? Array.from({ length: sideCount }, (_, angleIndex) => mean(angleSamples.map((sample) => sample.anglesDegrees[angleIndex])))
    : baseProfile.anglesDegrees;
  const thicknessValues = samples.map((sample) => sample.thicknessMm).filter(Number.isFinite);
  const cornerValues = samples.map((sample) => sample.cornerRadiusMm).filter(Number.isFinite);
  const minInterior = parseFinite(session.minStableInteriorDegrees);
  const maxInterior = parseFinite(session.maxStableInteriorDegrees);
  if ((minInterior == null) !== (maxInterior == null)) throw new Error('Enter both minimum and maximum stable interior angles, or leave both blank.');
  if (minInterior != null && (minInterior <= 0 || maxInterior >= 180 || minInterior > maxInterior)) throw new Error('Stable hinge range must be ordered inside 0–180°.');

  const relativeRepeatability = Math.max(...dimensionStats.map((stat) => stat.standardDeviationMm / Math.max(stat.meanMm, 1e-9)));
  const confidence = samples.length >= 3 && relativeRepeatability <= 0.01 ? 'calibrated' : 'measured';
  const sideRatios = normalizeSides(dimensionsMm);
  return {
    ...structuredClone(baseProfile),
    schema: TILE_PROFILE_SCHEMA_V2,
    schemaVersion: 2,
    label: session.label?.trim() || baseProfile.label,
    sideRatios,
    anglesDegrees,
    angles: anglesDegrees.map(toRadians),
    dimensionsMm,
    thicknessMm: thicknessValues.length ? mean(thicknessValues) : baseProfile.thicknessMm,
    cornerRadiusMm: cornerValues.length ? mean(cornerValues) : baseProfile.cornerRadiusMm,
    hingeRangeDegrees: minInterior == null ? baseProfile.hingeRangeDegrees : { minInterior, maxInterior },
    confidence,
    scaleConfidence: confidence,
    builtin: false,
    source: {
      kind: 'user-calibration',
      title: session.title?.trim() || `Local calibration of ${baseProfile.label}`,
      note: session.notes?.trim() || '',
      measuredAt: session.measuredAt ?? new Date().toISOString(),
      device: session.device?.trim() || 'manual measuring tool',
    },
    calibration: {
      method: session.method ?? 'manual',
      sampleCount: samples.length,
      samples,
      dimensionStats,
      relativeRepeatability,
      measuredAt: session.measuredAt ?? new Date().toISOString(),
    },
  };
}

/** Validates and parses imported v2 profile records. */
export function parseTileProfileRecords(text) {
  const parsed = typeof text === 'string' ? JSON.parse(text) : text;
  const records = Array.isArray(parsed) ? parsed : parsed?.profiles;
  if (!Array.isArray(records)) throw new Error('Profile import must be an array or an object with a profiles array.');
  return records.map((record, index) => {
    if (record.schema !== TILE_PROFILE_SCHEMA_V2 || record.schemaVersion !== 2) throw new Error(`Profile ${index + 1} is not a MagnaMath tile-profile v2 record.`);
    if (!record.id || !record.label || !record.family || !record.systemId) throw new Error(`Profile ${index + 1} is missing identity fields.`);
    if (!Array.isArray(record.sideRatios) || !Array.isArray(record.anglesDegrees) || record.sideRatios.length !== record.anglesDegrees.length) {
      throw new Error(`Profile ${index + 1} has inconsistent polygon arrays.`);
    }
    if (record.dimensionsMm && record.dimensionsMm.length !== record.sideRatios.length) throw new Error(`Profile ${index + 1} has inconsistent dimensions.`);
    return { ...structuredClone(record), angles: record.anglesDegrees.map(toRadians), builtin: false };
  });
}

export function tileProfilesToJson(profiles, options = {}) {
  return JSON.stringify({
    schema: 'https://magnamath.app/schema/tile-profile-collection/v1',
    schemaVersion: 1,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    profiles: profiles.map((item) => {
      const copy = structuredClone(item);
      delete copy.angles;
      return copy;
    }),
  }, null, 2);
}
