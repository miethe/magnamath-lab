import { polygonArea2 } from './math.js';

export const COMPOUND_RECIPE_SCHEMA = 'https://magnamath.app/schema/compound-face-recipe/v1';

const radians = (degrees) => degrees * Math.PI / 180;
const relativeError = (left, right) => Math.abs(left - right) / Math.max(Math.abs(right), 1e-9);

function profileDimensions(profile) {
  if (Array.isArray(profile.dimensionsMm) && profile.dimensionsMm.length === profile.sideRatios.length) {
    return profile.dimensionsMm;
  }
  if (Number.isFinite(profile.referenceEdgeMm)) {
    return profile.sideRatios.map((ratio) => ratio * profile.referenceEdgeMm);
  }
  return null;
}

function isEquilateralTriangleProfile(profile, tolerance = 0.015, angleToleranceDegrees = 2) {
  if (profile.sideRatios?.length !== 3 || profile.anglesDegrees?.length !== 3) return false;
  const mean = profile.sideRatios.reduce((sum, value) => sum + value, 0) / 3;
  const sideSpread = Math.max(...profile.sideRatios.map((value) => relativeError(value, mean)));
  const angleSpread = Math.max(...profile.anglesDegrees.map((value) => Math.abs(value - 60)));
  return sideSpread <= tolerance && angleSpread <= angleToleranceDegrees;
}

function averagePoint(points) {
  return points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / Math.max(1, points.length));
}


export function exactCompoundScaleEstimatesForFace(face, profiles) {
  if (!(face?.sideCount === 6 && face.regular && face.kind === 'regular-6-gon')) return [];
  const representativeFaceEdge = face.lengths.reduce((sum, value) => sum + value, 0) / face.lengths.length;
  if (!(representativeFaceEdge > 0)) return [];
  return profiles
    .filter((profile) => isEquilateralTriangleProfile(profile))
    .map((profile) => {
      const dimensions = profileDimensions(profile);
      if (!dimensions) return null;
      const representativeTileEdge = dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length;
      return representativeTileEdge / representativeFaceEdge;
    })
    .filter(Number.isFinite);
}

/**
 * Returns mathematically exact compound-panel recipes that can be supported
 * without making assumptions about multi-edge-to-single-edge magnetic joins.
 *
 * The initial safe recipe is a regular hexagon decomposed into six congruent
 * equilateral triangles meeting at its center. Every exterior boundary edge is
 * still one physical tile edge, so neighboring faces retain one-to-one hinges.
 */
export function exactCompoundRecipesForFace(analysis, faceIndex, profiles, options = {}) {
  const face = analysis.faces[faceIndex];
  const frame = analysis.faceFrames[faceIndex];
  const modelUnitMm = Number(options.modelUnitMm);
  const dimensionTolerance = options.dimensionTolerance ?? 0.035;
  if (!face || !frame || !Number.isFinite(modelUnitMm) || modelUnitMm <= 0) return [];
  if (!(face.sideCount === 6 && face.regular && face.kind === 'regular-6-gon')) return [];

  const center = averagePoint(frame.local);
  const orientation = Math.sign(polygonArea2(frame.local)) || 1;
  const recipes = [];

  for (const tile of profiles) {
    if (!isEquilateralTriangleProfile(tile)) continue;
    const dimensions = profileDimensions(tile);
    if (!dimensions) continue;
    const physicalTargetEdges = face.lengths.map((length) => length * modelUnitMm);
    const representativeTileEdge = dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length;
    const scaleError = Math.max(...physicalTargetEdges.map((target) => relativeError(target, representativeTileEdge)));
    if (scaleError > dimensionTolerance) continue;

    const pieces = frame.local.map((point, index) => {
      const next = frame.local[(index + 1) % frame.local.length];
      const polygon = orientation > 0 ? [center, point, next] : [center, next, point];
      return {
        pieceIndex: index,
        tileId: tile.id,
        polygon,
        boundaryLocalEdgeIndex: index,
      };
    });

    recipes.push({
      schema: COMPOUND_RECIPE_SCHEMA,
      schemaVersion: 1,
      id: `regular-hexagon-six-${tile.id}`,
      label: `Six ${tile.label.toLowerCase()}s`,
      faceIndex,
      faceKind: face.kind,
      pieceCount: 6,
      pieces,
      required: { [tile.id]: 6 },
      boundary: frame.local.map((_, localEdgeIndex) => ({
        localEdgeIndex,
        tileId: tile.id,
        tileEdgeIndex: 0,
        dimensionMm: representativeTileEdge,
      })),
      tile,
      scaleError,
      exactGeometry: true,
      mechanicalStatus: 'unverified-panel',
      confidence: tile.confidence === 'calibrated' && tile.scaleConfidence === 'calibrated'
        ? 'user-calibrated-components'
        : 'exact-derived-assembly',
      note: 'The planar subdivision is exact. Whole-panel rigidity, center-joint behavior, and folded structural stability have not been physically verified.',
    });
  }

  return recipes.sort((left, right) => left.scaleError - right.scaleError);
}

export function planExactCompoundFaces(analysis, faceIndices, profiles, inventory, currentRequired, options = {}) {
  const assignments = new Map();
  const required = { ...currentRequired };
  const unresolved = [];

  for (const faceIndex of faceIndices) {
    const recipes = exactCompoundRecipesForFace(analysis, faceIndex, profiles, options);
    if (!recipes.length) {
      unresolved.push(faceIndex);
      continue;
    }
    recipes.sort((left, right) => {
      const leftMissing = Object.entries(left.required).reduce(
        (sum, [tileId, count]) => sum + Math.max(0, (required[tileId] ?? 0) + count - (inventory[tileId] ?? 0)),
        0,
      );
      const rightMissing = Object.entries(right.required).reduce(
        (sum, [tileId, count]) => sum + Math.max(0, (required[tileId] ?? 0) + count - (inventory[tileId] ?? 0)),
        0,
      );
      return leftMissing - rightMissing || left.scaleError - right.scaleError;
    });
    const selected = recipes[0];
    assignments.set(faceIndex, selected);
    for (const [tileId, count] of Object.entries(selected.required)) {
      required[tileId] = (required[tileId] ?? 0) + count;
    }
  }

  return { assignments, required, unresolved };
}

export function compoundAssignmentSummary(compound) {
  if (!compound) return null;
  return `${compound.label} · exact planar subdivision · ${Math.round(compound.scaleError * 10_000) / 100}% scale error · mechanics unverified`;
}


function pointKey(point, precision = 8) {
  return `${Number(point[0]).toFixed(precision)},${Number(point[1]).toFixed(precision)}`;
}

/** Returns unique interior seams in recipe-local face coordinates. */
export function compoundInternalSegments(compound, precision = 8) {
  if (!compound?.pieces?.length) return [];
  const edges = new Map();
  for (const piece of compound.pieces) {
    const polygon = piece.polygon ?? [];
    for (let index = 0; index < polygon.length; index += 1) {
      const from = polygon[index];
      const to = polygon[(index + 1) % polygon.length];
      const fromKey = pointKey(from, precision);
      const toKey = pointKey(to, precision);
      const key = fromKey < toKey ? `${fromKey}|${toKey}` : `${toKey}|${fromKey}`;
      const current = edges.get(key) ?? { from, to, count: 0, pieceIndices: [] };
      current.count += 1;
      current.pieceIndices.push(piece.pieceIndex);
      edges.set(key, current);
    }
  }
  return [...edges.values()]
    .filter((edge) => edge.count > 1)
    .map((edge, index) => ({ seamIndex: index, from: edge.from, to: edge.to, pieceIndices: edge.pieceIndices }));
}
