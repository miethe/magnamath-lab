import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createShape, cube } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet, searchNetPortfolio, treeFromEdgeKeys } from '../src/core/net.js';
import { analyzeBuildability, BUILTIN_TILE_PROFILES, INVENTORY_PRESETS, tileProfilesToJson } from '../src/core/tiles.js';
import {
  calibrationSessionsToJson,
  createCalibrationSession,
  parseCalibrationSessionRecords,
  profileFromCalibrationSession,
} from '../src/core/calibration.js';
import { createPrintPackage, printPackageManifest, printPackageToHtml } from '../src/core/print.js';
import { netToSvg, parseSnapshotProject, polyhedronToJson } from '../src/core/export.js';
import { analyzeThicknessClearance } from '../src/core/feasibility.js';
import { createStoredZip } from '../src/core/zip.js';

const abundantClassicInventory = {
  square: 999,
  'large-square': 999,
  'equilateral-triangle': 999,
  'right-triangle': 999,
  'isosceles-triangle': 999,
};

test('exact compound matching resolves regular hexagons without coercing pentagons', () => {
  const truncatedOctahedron = analyzePolyhedron(createShape('truncated-octahedron'));
  const build = analyzeBuildability(truncatedOctahedron, abundantClassicInventory, {
    families: ['standard'],
    enableCompoundFaces: true,
  });
  assert.equal(build.unsupported.length, 0);
  assert.equal(build.compoundFaces.length, 8);
  assert.equal(build.required.square, 6);
  assert.equal(build.required['equilateral-triangle'], 48);
  assert.equal(build.compoundFaces.every((entry) => entry.compound.exactGeometry), true);
  assert.equal(build.compoundFaces.every((entry) => entry.compound.mechanicalStatus === 'unverified-panel'), true);

  const football = analyzeBuildability(analyzePolyhedron(createShape('truncated-icosahedron')), abundantClassicInventory, {
    families: ['standard'],
    enableCompoundFaces: true,
  });
  assert.equal(football.compoundFaces.length, 20);
  assert.equal(football.unsupported.length, 12);
  assert.equal(football.unsupported.every((entry) => entry.faceKind === 'regular-5-gon'), true);
});

test('portfolio search returns diverse valid spanning trees and honors locks', () => {
  const shape = createShape('dodecahedron');
  const analysis = analyzePolyhedron(shape);
  const initial = planNet(shape, analysis, { seed: 4 });
  const lockedFold = [...initial.treeEdgeKeys][0];
  const lockedCut = [...initial.cutEdgeKeys][0];
  const portfolio = searchNetPortfolio(shape, analysis, {
    seed: 44,
    attempts: 72,
    localStarts: 2,
    localIterations: 2,
    maximumCandidates: 6,
    requiredFoldEdgeKeys: [lockedFold],
    requiredCutEdgeKeys: [lockedCut],
  });
  assert.ok(portfolio.candidates.length >= 2);
  assert.equal(portfolio.candidates.every((net) => net.valid), true);
  assert.equal(new Set(portfolio.candidates.map((net) => [...net.treeEdgeKeys].sort().join('|'))).size, portfolio.candidates.length);
  for (const net of portfolio.candidates) {
    assert.equal(net.treeEdgeKeys.has(lockedFold), true);
    assert.equal(net.treeEdgeKeys.has(lockedCut), false);
    assert.equal(treeFromEdgeKeys(analysis, net.treeEdgeKeys, net.rootFace).order.length, analysis.faces.length);
  }
});

test('print packages paginate at actual size and add one tab per cut edge', () => {
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 8 });
  const printPackage = createPrintPackage(shape, analysis, net, {
    modelUnitMm: 74.93,
    pagePreset: 'letter',
    orientation: 'auto',
    mode: 'actual',
    glueTabs: true,
    tabDepthMm: 8,
  });
  assert.equal(printPackage.layout.trueScale, true);
  assert.ok(printPackage.pages.length >= 1);
  assert.equal(printPackage.tabs.tabs.length + printPackage.tabs.omitted.length, net.cutEdgeKeys.size);
  assert.match(printPackage.pages[0].svg, /width="215\.9mm"|height="215\.9mm"/);
  assert.match(printPackage.pages[0].svg, /class="tab-fold"/);
  assert.match(printPackage.pages[0].svg, /C1/);
  assert.match(printPackage.pages[0].svg, /50 mm print check/);
  assert.match(printPackage.pages[0].svg, /class="calibration-ruler"/);
  const html = printPackageToHtml(shape, printPackage);
  assert.match(html, /@page/);
  assert.match(html, /page-break-after:always/);
});

test('raw calibration sessions preserve samples and re-derive profiles', () => {
  const base = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
  const input = {
    id: 'cal-square-test',
    label: 'Workshop square batch A',
    method: 'calipers',
    device: '0.01 mm digital calipers',
    instrumentResolutionMm: 0.01,
    setOrBatch: 'Classic 100 · batch A',
    samples: [
      { edgeLengthsMm: [74.90, 74.91, 74.90, 74.89], thicknessMm: 6.1 },
      { edgeLengthsMm: [74.91, 74.90, 74.89, 74.90], thicknessMm: 6.0 },
      { edgeLengthsMm: [74.90, 74.89, 74.91, 74.90], thicknessMm: 6.1 },
    ],
    minStableInteriorDegrees: 80,
    maxStableInteriorDegrees: 110,
  };
  const { session, profile } = createCalibrationSession(base, input);
  assert.equal(session.schemaVersion, 2);
  assert.equal(session.samples.length, 3);
  assert.equal(profile.calibration.sessionId, session.id);
  assert.equal(profile.calibration.uncertainty.length, 4);
  assert.ok(profile.calibration.uncertainty.every((entry) => entry.estimatedExpandedUncertaintyMm > 0));

  const [parsed] = parseCalibrationSessionRecords(calibrationSessionsToJson([session]));
  const rederived = profileFromCalibrationSession(base, parsed);
  assert.deepEqual(rederived.dimensionsMm, profile.dimensionsMm);
  assert.deepEqual(rederived.hingeRangeDegrees, profile.hingeRangeDegrees);
  assert.equal(rederived.calibration.sessionId, session.id);
});


test('print ZIP packages pass an independent unzip integrity check', () => {
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 13 });
  const printPackage = createPrintPackage(shape, analysis, net, {
    modelUnitMm: 74.93,
    pagePreset: 'letter',
    mode: 'actual',
  });
  const files = [
    ...printPackage.pages.map((page) => ({ name: `pages/${page.filename}`, data: page.svg })),
    { name: 'print.html', data: printPackageToHtml(shape, printPackage) },
    { name: 'manifest.json', data: printPackageManifest(shape, printPackage) },
  ];
  const archive = createStoredZip(files, { modifiedAt: new Date('2026-08-08T12:00:00Z') });
  const directory = mkdtempSync(join(tmpdir(), 'magnamath-zip-'));
  const filename = join(directory, 'package.zip');
  writeFileSync(filename, archive);
  const output = execFileSync('unzip', ['-t', filename], { encoding: 'utf8' });
  assert.match(output, /No errors detected/);
});

test('thickness clearance stays unmodeled without hinge-axis evidence and models explicit scenarios', () => {
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const base = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
  const { profile } = createCalibrationSession(base, {
    id: 'clearance-square',
    samples: [
      { edgeLengthsMm: [74.93, 74.93, 74.93, 74.93], thicknessMm: 6.2 },
      { edgeLengthsMm: [74.92, 74.94, 74.93, 74.93], thicknessMm: 6.2 },
      { edgeLengthsMm: [74.94, 74.92, 74.93, 74.93], thicknessMm: 6.2 },
    ],
  });
  const build = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, {
    profileOverrides: [profile],
    modelUnitMm: 74.93,
  });
  const evidenceOnly = analyzeThicknessClearance(analysis, build, { assumption: 'measured-only' });
  assert.equal(evidenceOnly.entries.every((entry) => entry.status === 'unmodeled'), true);
  const scenario = analyzeThicknessClearance(analysis, build, { assumption: 'surface-axis' });
  assert.equal(scenario.entries.every((entry) => entry.status.endsWith('under-model')), true);
  assert.equal(scenario.entries.every((entry) => entry.model.evidence === 'surface-axis-scenario'), true);
});


test('compound panel seams are preserved in SVG and paginated print output', () => {
  const shape = createShape('truncated-octahedron');
  const analysis = analyzePolyhedron(shape);
  const build = analyzeBuildability(analysis, abundantClassicInventory, {
    families: ['standard'],
    enableCompoundFaces: true,
  });
  const net = planNet(shape, analysis, { seed: 5 });
  const svg = netToSvg(shape, analysis, net, {
    compoundByFace: build.compoundByFace,
    physicalScale: true,
    modelUnitMm: build.modelUnitMm,
  });
  assert.match(svg, /class="compound-seam"/);
  const printPackage = createPrintPackage(shape, analysis, net, {
    modelUnitMm: build.modelUnitMm,
    compoundByFace: build.compoundByFace,
    pagePreset: 'tabloid',
    mode: 'poster',
  });
  assert.equal(printPackage.pages.some((page) => page.svg.includes('class="compound-seam"')), true);
});

test('snapshot v4 includes compound profile IDs and bounded clearance provenance', () => {
  const shape = createShape('truncated-octahedron');
  const analysis = analyzePolyhedron(shape);
  const build = analyzeBuildability(analysis, abundantClassicInventory, {
    families: ['standard'],
    enableCompoundFaces: true,
  });
  const clearance = analyzeThicknessClearance(analysis, build, { assumption: 'measured-only' });
  const net = planNet(shape, analysis, { seed: 17 });
  const snapshot = parseSnapshotProject(polyhedronToJson(shape, analysis, net, build, {
    thicknessClearance: clearance,
    clearanceAssumption: 'measured-only',
    compoundMode: 'exact',
  }));
  const compoundTileId = build.compoundFaces[0].compound.tile.id;
  assert.equal(snapshot.physicalBuild.profileIds.includes(compoundTileId), true);
  assert.equal(snapshot.physicalBuild.thicknessClearance.model, 'finite-slab-cross-section-v1');
  assert.equal(snapshot.project.clearanceAssumption, 'measured-only');
});

test('SVG and print exports XML-escape imported display metadata', () => {
  const shape = cube();
  shape.name = '<script>alert("x")</script> & cube';
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 21 });
  const svg = netToSvg(shape, analysis, net);
  assert.doesNotMatch(svg, /<script>alert/);
  assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; cube net/);
  const printPackage = createPrintPackage(shape, analysis, net, {
    modelUnitMm: 74.93,
    pagePreset: 'letter',
    mode: 'fit',
  });
  assert.doesNotMatch(printPackage.pages[0].svg, /<script>alert/);
  assert.match(printPackage.pages[0].svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; cube/);
});


test('generated examples can pin export timestamps for reproducible artifacts', () => {
  const generatedAt = '2026-08-08T12:00:00.000Z';
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 31 });
  const build = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, { families: ['standard'] });
  const snapshot = JSON.parse(polyhedronToJson(shape, analysis, net, build, { generatedAt }));
  assert.equal(snapshot.generatedAt, generatedAt);

  const printPackage = createPrintPackage(shape, analysis, net, {
    modelUnitMm: 74.93,
    pagePreset: 'letter',
    mode: 'fit',
  });
  assert.equal(JSON.parse(printPackageManifest(shape, printPackage, { generatedAt })).generatedAt, generatedAt);

  const base = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
  const { session, profile } = createCalibrationSession(base, {
    id: 'reproducible-example-session',
    measuredAt: generatedAt,
    samples: [
      { edgeLengthsMm: [74.93, 74.93, 74.93, 74.93] },
      { edgeLengthsMm: [74.92, 74.94, 74.93, 74.93] },
      { edgeLengthsMm: [74.94, 74.92, 74.93, 74.93] },
    ],
  });
  assert.equal(JSON.parse(calibrationSessionsToJson([session], { exportedAt: generatedAt })).exportedAt, generatedAt);
  assert.equal(JSON.parse(tileProfilesToJson([profile], { exportedAt: generatedAt })).exportedAt, generatedAt);
});
