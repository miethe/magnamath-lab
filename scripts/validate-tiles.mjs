#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { cube, tetrahedron } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import {
  BUILTIN_TILE_PROFILES,
  INVENTORY_PRESETS,
  MICRO_TILE_EDGE_MM,
  STANDARD_TILE_EDGE_MM,
  analyzeBuildability,
  createCalibratedProfile,
} from '../src/core/tiles.js';

const started = performance.now();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const relativeError = (left, right) => Math.abs(left - right) / Math.max(Math.abs(right), 1e-9);

for (const tile of BUILTIN_TILE_PROFILES) {
  const count = tile.sideRatios.length;
  check(count >= 3, `${tile.id}: fewer than three sides.`);
  check(tile.anglesDegrees.length === count, `${tile.id}: angle count mismatch.`);
  check(tile.dimensionsMm == null || tile.dimensionsMm.length === count, `${tile.id}: dimension count mismatch.`);
  const expectedAngleSum = (count - 2) * 180;
  const actualAngleSum = tile.anglesDegrees.reduce((sum, value) => sum + value, 0);
  check(Math.abs(actualAngleSum - expectedAngleSum) < 1e-6, `${tile.id}: polygon angle sum is ${actualAngleSum}, expected ${expectedAngleSum}.`);
  if (tile.dimensionsMm) {
    const meanRatio = tile.sideRatios.reduce((sum, value) => sum + value, 0) / count;
    const meanDimension = tile.dimensionsMm.reduce((sum, value) => sum + value, 0) / count;
    tile.dimensionsMm.forEach((dimension, index) => {
      const expected = tile.sideRatios[index] / meanRatio;
      const actual = dimension / meanDimension;
      check(relativeError(actual, expected) < 1e-9, `${tile.id}: dimension ratios diverge from polygon ratios.`);
    });
  }
}

for (const [id, preset] of Object.entries(INVENTORY_PRESETS)) {
  if (id === 'custom') continue;
  const modeled = Object.values(preset.counts).reduce((sum, count) => sum + count, 0);
  const excluded = Object.values(preset.excludedPieces ?? {}).reduce((sum, count) => sum + count, 0);
  check(modeled + excluded === preset.pieceCount, `${id}: ${modeled + excluded} pieces do not equal published total ${preset.pieceCount}.`);
}

const cubeAnalysis = analyzePolyhedron(cube());
const standardCube = analyzeBuildability(cubeAnalysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'], preferredScaleMmPerUnit: STANDARD_TILE_EDGE_MM,
});
const microCube = analyzeBuildability(cubeAnalysis, INVENTORY_PRESETS.micro70.counts, {
  families: ['micro'], preferredScaleMmPerUnit: MICRO_TILE_EDGE_MM,
});
const tetraAnalysis = analyzePolyhedron(tetrahedron());
const standardTetra = analyzeBuildability(tetraAnalysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'], preferredScaleMmPerUnit: STANDARD_TILE_EDGE_MM,
});
check(standardCube.ready && standardCube.required.square === 6, 'Classic cube assignment failed.');
check(microCube.ready && microCube.required['micro-square'] === 6, 'microMAGS cube assignment failed.');
check(standardTetra.ready && standardTetra.required['equilateral-triangle'] === 4, 'Classic tetrahedron assignment failed.');
check(relativeError(standardCube.modelUnitMm, STANDARD_TILE_EDGE_MM) < 1e-9, 'Classic scale fit changed unexpectedly.');
check(relativeError(microCube.modelUnitMm, MICRO_TILE_EDGE_MM) < 1e-9, 'microMAGS scale fit changed unexpectedly.');

const base = BUILTIN_TILE_PROFILES.find((tile) => tile.id === 'square');
const calibrated = createCalibratedProfile(base, {
  method: 'calipers',
  samples: [
    { edgeLengthsMm: [74.90, 74.91, 74.89, 74.90] },
    { edgeLengthsMm: [74.92, 74.90, 74.91, 74.89] },
    { edgeLengthsMm: [74.91, 74.90, 74.90, 74.92] },
  ],
  minStableInteriorDegrees: 85,
  maxStableInteriorDegrees: 100,
});
const calibratedCube = analyzeBuildability(cubeAnalysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'], profileOverrides: [calibrated], preferredScaleMmPerUnit: 74.9,
});
check(calibrated.confidence === 'calibrated', 'Repeat-sample calibration did not reach calibrated confidence.');
check(calibratedCube.hinges.verifiedRatio === 1, 'Measured cube hinge range did not verify every 90° hinge.');

console.table([
  { scenario: 'Classic cube', scaleMmPerUnit: standardCube.modelUnitMm, ready: standardCube.ready, confidence: standardCube.confidenceLabel },
  { scenario: 'microMAGS cube', scaleMmPerUnit: microCube.modelUnitMm, ready: microCube.ready, confidence: microCube.confidenceLabel },
  { scenario: 'Classic tetrahedron', scaleMmPerUnit: standardTetra.modelUnitMm, ready: standardTetra.ready, confidence: standardTetra.confidenceLabel },
  { scenario: 'Calibrated cube', scaleMmPerUnit: calibratedCube.modelUnitMm, ready: calibratedCube.ready, confidence: calibratedCube.confidenceLabel },
]);

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`${BUILTIN_TILE_PROFILES.length} profiles, ${Object.keys(INVENTORY_PRESETS).length - 1} published inventories, global scale fitting, and hinge calibration validated in ${(performance.now() - started).toFixed(1)} ms.`);
}
