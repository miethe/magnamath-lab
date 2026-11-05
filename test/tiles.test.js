import test from 'node:test';
import assert from 'node:assert/strict';
import { cube, dodecahedron } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import {
  BUILTIN_TILE_PROFILES,
  INVENTORY_PRESETS,
  MICRO_TILE_EDGE_MM,
  STANDARD_TILE_EDGE_MM,
  analyzeBuildability,
  createCalibratedProfile,
  parseTileProfileRecords,
  tileProfilesToJson,
} from '../src/core/tiles.js';

const closeTo = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);
};

test('one global physical scale prevents mixed-size face assignments', () => {
  const analysis = analyzePolyhedron(cube());
  const standard = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, {
    families: ['standard'],
    preferredScaleMmPerUnit: STANDARD_TILE_EDGE_MM,
  });
  closeTo(standard.modelUnitMm, STANDARD_TILE_EDGE_MM);
  assert.equal(standard.required.square, 6);
  assert.equal(standard.faceMatches.every((entry) => entry.match?.tile.family === 'standard'), true);

  const micro = analyzeBuildability(analysis, INVENTORY_PRESETS.micro70.counts, {
    families: ['micro'],
    preferredScaleMmPerUnit: MICRO_TILE_EDGE_MM,
  });
  closeTo(micro.modelUnitMm, MICRO_TILE_EDGE_MM);
  assert.equal(micro.required['micro-square'], 6);
  assert.equal(micro.faceMatches.every((entry) => entry.match?.tile.family === 'micro'), true);

  const combo = analyzeBuildability(analysis, INVENTORY_PRESETS.combo46.counts, {
    families: ['standard', 'micro'],
    preferredScaleMmPerUnit: STANDARD_TILE_EDGE_MM,
  });
  closeTo(combo.modelUnitMm, STANDARD_TILE_EDGE_MM);
  assert.equal(combo.required.square, 6);
  assert.equal(combo.required['micro-square'], 0);
});

test('repeat-sample calibration computes means, repeatability, and hinge verification', () => {
  const base = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
  const calibrated = createCalibratedProfile(base, {
    label: 'Measured classic square',
    method: 'calipers',
    device: 'Test calipers',
    samples: [
      { edgeLengthsMm: [74.90, 74.91, 74.89, 74.90], thicknessMm: 6.10, cornerRadiusMm: 2.40 },
      { edgeLengthsMm: [74.92, 74.90, 74.91, 74.89], thicknessMm: 6.00, cornerRadiusMm: 2.50 },
      { edgeLengthsMm: [74.91, 74.90, 74.90, 74.92], thicknessMm: 6.10, cornerRadiusMm: 2.40 },
    ],
    minStableInteriorDegrees: 85,
    maxStableInteriorDegrees: 100,
  });

  assert.equal(calibrated.confidence, 'calibrated');
  assert.equal(calibrated.calibration.sampleCount, 3);
  assert.ok(calibrated.calibration.relativeRepeatability < 0.001);
  closeTo(calibrated.thicknessMm, 6.0666666667, 1e-6);
  assert.deepEqual(calibrated.hingeRangeDegrees, { minInterior: 85, maxInterior: 100 });

  const build = analyzeBuildability(analyzePolyhedron(cube()), INVENTORY_PRESETS.classic37.counts, {
    families: ['standard'],
    profileOverrides: [calibrated],
    preferredScaleMmPerUnit: 74.9,
  });
  assert.equal(build.faceMatches.every((entry) => entry.match?.tile.confidence === 'calibrated'), true);
  assert.equal(build.hinges.counts.verified, 12);
  assert.equal(build.hinges.verifiedRatio, 1);
});

test('unsupported polygons remain explicit rather than being coerced to a tile', () => {
  const build = analyzeBuildability(analyzePolyhedron(dodecahedron()), INVENTORY_PRESETS.classic100.counts, {
    families: ['standard'],
  });
  assert.equal(build.ready, false);
  assert.equal(build.geometricallyBuildable, false);
  assert.equal(build.unsupported.length, 12);
  assert.equal(build.activeProfiles.length > 0, true);
});

test('calibrated profile collections round-trip through the v2 contract', () => {
  const base = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'equilateral-triangle');
  const calibrated = createCalibratedProfile(base, {
    samples: [
      { edgeLengthsMm: [74.88, 74.90, 74.89] },
      { edgeLengthsMm: [74.91, 74.89, 74.90] },
      { edgeLengthsMm: [74.89, 74.90, 74.91] },
    ],
  });
  const text = tileProfilesToJson([calibrated]);
  const [parsed] = parseTileProfileRecords(text);
  assert.equal(parsed.schemaVersion, 2);
  assert.equal(parsed.id, calibrated.id);
  assert.equal(parsed.builtin, false);
  assert.equal(parsed.angles.length, 3);
  assert.deepEqual(parsed.dimensionsMm, calibrated.dimensionsMm);
});

test('inventory presets preserve published totals while flagging unmodeled pieces', () => {
  for (const [id, preset] of Object.entries(INVENTORY_PRESETS)) {
    if (id === 'custom') continue;
    const modeled = Object.values(preset.counts).reduce((sum, count) => sum + count, 0);
    const excluded = Object.values(preset.excludedPieces ?? {}).reduce((sum, count) => sum + count, 0);
    assert.equal(modeled + excluded, preset.pieceCount, id);
  }
  assert.equal(INVENTORY_PRESETS.micro70.excludedPieces['micro-large-rectangle'], 2);
});
