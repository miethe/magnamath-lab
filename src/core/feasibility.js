import { convexIntersectionArea2, toRadians } from './math.js';

function rotate(point, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [point[0] * cosine - point[1] * sine, point[0] * sine + point[1] * cosine];
}

function panelCrossSection(lengthMm, thicknessMm, axisOffsetMm) {
  const lower = -thicknessMm / 2 - axisOffsetMm;
  const upper = thicknessMm / 2 - axisOffsetMm;
  return [[0, lower], [lengthMm, lower], [lengthMm, upper], [0, upper]];
}

function boundaryTile(faceEntry) {
  if (faceEntry?.match) return faceEntry.match.tile;
  if (faceEntry?.compound) return faceEntry.compound.tile;
  return null;
}

function boundaryDimension(faceEntry, localEdgeIndex) {
  if (faceEntry?.match) return faceEntry.match.alignedDimensionsMm?.[localEdgeIndex] ?? null;
  return faceEntry?.compound?.boundary?.find((entry) => entry.localEdgeIndex === localEdgeIndex)?.dimensionMm ?? null;
}

/**
 * A deliberately bounded 2D slab model. It is not a magnetic-force or full
 * collision simulator. Results are only produced when the hinge-axis location
 * is measured, or when the caller explicitly requests a named assumption.
 */
export function analyzeThicknessClearance(analysis, buildability, options = {}) {
  const assumption = options.assumption ?? 'measured-only';
  const areaToleranceMm2 = options.areaToleranceMm2 ?? 0.02;
  const entries = [];
  const byEdgeKey = {};

  for (const edge of analysis.topology.edges) {
    if (edge.incidences.length !== 2) continue;
    const [leftIncidence, rightIncidence] = edge.incidences;
    const leftEntry = buildability.faceMatches[leftIncidence.faceIndex];
    const rightEntry = buildability.faceMatches[rightIncidence.faceIndex];
    const leftTile = boundaryTile(leftEntry);
    const rightTile = boundaryTile(rightEntry);
    const angleDegrees = analysis.dihedralAngles.find((item) => item.edgeKey === edge.key)?.degrees ?? null;
    let status = 'unmodeled';
    let reason = 'Thickness or hinge-axis location is unavailable.';
    let intersectionAreaMm2 = null;
    let model = null;

    if (!leftTile || !rightTile || angleDegrees == null) {
      status = 'unsupported';
      reason = 'One or both faces lack a physical boundary assignment.';
    } else if (!(leftTile.thicknessMm > 0) || !(rightTile.thicknessMm > 0)) {
      reason = 'One or both tile profiles lack measured thickness.';
    } else {
      const explicitLeftOffset = Number(leftTile.connector?.hingeAxisOffsetMm);
      const explicitRightOffset = Number(rightTile.connector?.hingeAxisOffsetMm);
      const hasMeasuredOffsets = Number.isFinite(explicitLeftOffset) && Number.isFinite(explicitRightOffset);
      let leftOffset = explicitLeftOffset;
      let rightOffset = explicitRightOffset;
      let evidence = 'measured-profile';
      if (!hasMeasuredOffsets && assumption === 'surface-axis') {
        leftOffset = leftTile.thicknessMm / 2;
        rightOffset = rightTile.thicknessMm / 2;
        evidence = 'surface-axis-scenario';
      }
      if (Number.isFinite(leftOffset) && Number.isFinite(rightOffset)) {
        const leftDimension = boundaryDimension(leftEntry, leftIncidence.localEdgeIndex);
        const rightDimension = boundaryDimension(rightEntry, rightIncidence.localEdgeIndex);
        const characteristic = Math.min(...[leftDimension, rightDimension].filter(Number.isFinite));
        const modeledLengthMm = Number.isFinite(characteristic)
          ? Math.max(10, Math.min(characteristic * 0.45, 40))
          : 25;
        const leftPolygon = panelCrossSection(modeledLengthMm, leftTile.thicknessMm, leftOffset);
        const rightPolygon = panelCrossSection(modeledLengthMm, rightTile.thicknessMm, rightOffset)
          .map((point) => rotate(point, toRadians(angleDegrees)));
        intersectionAreaMm2 = convexIntersectionArea2(leftPolygon, rightPolygon, 1e-8);
        status = intersectionAreaMm2 <= areaToleranceMm2 ? 'clear-under-model' : 'collision-under-model';
        reason = status === 'clear-under-model'
          ? `No slab intersection above ${areaToleranceMm2} mm² under the ${evidence} cross-section model.`
          : `${intersectionAreaMm2.toFixed(3)} mm² of slab intersection under the ${evidence} cross-section model.`;
        model = {
          evidence,
          assumption,
          modeledLengthMm,
          leftThicknessMm: leftTile.thicknessMm,
          rightThicknessMm: rightTile.thicknessMm,
          leftHingeAxisOffsetMm: leftOffset,
          rightHingeAxisOffsetMm: rightOffset,
          areaToleranceMm2,
        };
      }
    }

    const result = {
      edgeKey: edge.key,
      faces: [leftIncidence.faceIndex, rightIncidence.faceIndex],
      angleDegrees,
      status,
      reason,
      intersectionAreaMm2,
      model,
    };
    entries.push(result);
    byEdgeKey[edge.key] = result;
  }

  const counts = entries.reduce((result, entry) => {
    result[entry.status] = (result[entry.status] ?? 0) + 1;
    return result;
  }, {});
  return {
    model: 'finite-slab-cross-section-v1',
    assumption,
    entries,
    byEdgeKey,
    counts,
    modeledRatio: entries.length ? entries.filter((entry) => entry.status.endsWith('under-model')).length / entries.length : 0,
    collisionCount: counts['collision-under-model'] ?? 0,
    caveat: 'This is a local two-panel thickness screen only. It excludes connector deformation, bevels unless encoded in the hinge-axis offset, whole-model collisions, gravity, and magnetic forces.',
  };
}
