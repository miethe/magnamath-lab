#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { SHAPE_CATALOG, createShape, cube } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet, searchNetPortfolio, treeFromEdgeKeys } from '../src/core/net.js';
import { analyzeBuildability, BUILTIN_TILE_PROFILES, INVENTORY_PRESETS } from '../src/core/tiles.js';
import { createCalibrationSession, calibrationSessionsToJson, parseCalibrationSessionRecords, profileFromCalibrationSession } from '../src/core/calibration.js';
import { analyzeThicknessClearance } from '../src/core/feasibility.js';
import { createPrintPackage, printPackageManifest, printPackageToHtml } from '../src/core/print.js';
import { netToSvg, parseSnapshotProject, polyhedronToJson } from '../src/core/export.js';
import { createStoredZip } from '../src/core/zip.js';

const started = performance.now();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const inventory = Object.fromEntries(BUILTIN_TILE_PROFILES.map((profile) => [profile.id, 999]));

const portfolioRows = [];
for (const entry of SHAPE_CATALOG) {
  const shape = createShape(entry.id, entry.parameter?.default);
  const analysis = analyzePolyhedron(shape);
  const initial = planNet(shape, analysis, { seed: 31, objective: 'compact' });
  const lockedFold = [...initial.treeEdgeKeys][0];
  const lockedCut = [...initial.cutEdgeKeys][0];
  const portfolio = searchNetPortfolio(shape, analysis, {
    seed: 3100 + portfolioRows.length,
    attempts: 32,
    localStarts: 2,
    localIterations: 2,
    maximumCandidates: 5,
    requiredFoldEdgeKeys: [lockedFold],
    requiredCutEdgeKeys: [lockedCut],
  });
  const unique = new Set(portfolio.candidates.map((candidate) => [...candidate.treeEdgeKeys].sort().join('|')));
  check(portfolio.candidates.length > 0, `${shape.name}: portfolio returned no candidates.`);
  check(unique.size === portfolio.candidates.length, `${shape.name}: portfolio contains duplicate trees.`);
  for (const candidate of portfolio.candidates) {
    check(candidate.valid, `${shape.name}: portfolio returned an overlapping candidate.`);
    check(candidate.treeEdgeKeys.has(lockedFold), `${shape.name}: portfolio lost a required fold.`);
    check(!candidate.treeEdgeKeys.has(lockedCut), `${shape.name}: portfolio violated a required cut.`);
    check(treeFromEdgeKeys(analysis, candidate.treeEdgeKeys, candidate.rootFace).order.length === analysis.faces.length,
      `${shape.name}: portfolio candidate is not a spanning tree.`);
  }
  portfolioRows.push({
    shape: shape.name,
    candidates: portfolio.candidates.length,
    uniqueExplored: portfolio.stats.uniqueTrees,
    pareto: portfolio.paretoCount,
    overlapFree: portfolio.stats.validTrees,
  });
}

const compoundShape = createShape('truncated-octahedron');
const compoundAnalysis = analyzePolyhedron(compoundShape);
const compoundBuild = analyzeBuildability(compoundAnalysis, inventory, {
  families: ['standard'],
  enableCompoundFaces: true,
});
check(compoundBuild.unsupported.length === 0, 'Truncated octahedron should resolve through direct squares plus exact hexagon panels.');
check(compoundBuild.compoundFaces.length === 8, 'Truncated octahedron should have eight exact compound hexagons.');
check(compoundBuild.required['equilateral-triangle'] === 48, 'Eight compound hexagons should require 48 equilateral triangles.');
const compoundNet = planNet(compoundShape, compoundAnalysis, { seed: 41 });
const compoundSvg = netToSvg(compoundShape, compoundAnalysis, compoundNet, {
  physicalScale: true,
  modelUnitMm: compoundBuild.modelUnitMm,
  compoundByFace: compoundBuild.compoundByFace,
});
check(compoundSvg.includes('class="compound-seam"'), 'Compound SVG is missing interior piece seams.');

const shape = cube();
const analysis = analyzePolyhedron(shape);
const net = planNet(shape, analysis, { seed: 43 });
const baseSquare = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
const { session, profile } = createCalibrationSession(baseSquare, {
  id: 'validation-square-session',
  measuredAt: '2026-08-08T12:00:00.000Z',
  method: 'calipers',
  device: '0.01 mm digital calipers',
  instrumentResolutionMm: 0.01,
  samples: [
    { edgeLengthsMm: [74.92, 74.93, 74.94, 74.93], thicknessMm: 6.2 },
    { edgeLengthsMm: [74.93, 74.94, 74.92, 74.93], thicknessMm: 6.2 },
    { edgeLengthsMm: [74.94, 74.92, 74.93, 74.93], thicknessMm: 6.2 },
  ],
  minStableInteriorDegrees: 80,
  maxStableInteriorDegrees: 110,
});
const [parsedSession] = parseCalibrationSessionRecords(calibrationSessionsToJson([session]));
const rederived = profileFromCalibrationSession(baseSquare, parsedSession);
check(JSON.stringify(rederived.dimensionsMm) === JSON.stringify(profile.dimensionsMm), 'Calibration session did not re-derive the same dimensions.');
const build = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'],
  profileOverrides: [profile],
  modelUnitMm: profile.dimensionsMm[0],
});
const clearance = analyzeThicknessClearance(analysis, build, { assumption: 'surface-axis' });
const snapshot = parseSnapshotProject(polyhedronToJson(shape, analysis, net, build, {
  calibrationProfiles: [profile],
  calibrationProfileIds: [profile.id],
  calibrationSessions: [session],
  inventoryPreset: 'classic37',
  inventory: INVENTORY_PRESETS.classic37.counts,
  tileFamilies: ['standard'],
  scaleMode: 'custom',
  customScale: profile.dimensionsMm[0],
  compoundMode: 'exact',
  clearanceAssumption: 'surface-axis',
  thicknessClearance: clearance,
}));
check(snapshot.schemaVersion === 4, 'Snapshot v4 did not round-trip.');
check(snapshot.project.calibrationSessions.length === 1, 'Snapshot lost its raw calibration session.');
check(snapshot.physicalBuild.thicknessClearance?.assumption === 'surface-axis', 'Snapshot lost thickness-screen provenance.');

const printPackage = createPrintPackage(shape, analysis, net, {
  modelUnitMm: build.modelUnitMm,
  pagePreset: 'letter',
  mode: 'actual',
  glueTabs: true,
  calibrationRuler: true,
});
check(printPackage.pages.length > 0, 'Print package contains no pages.');
check(printPackage.pages.every((page) => page.svg.includes('50 mm print check')), 'A print page is missing the physical scale ruler.');
check(printPackage.tabs.tabs.length + printPackage.tabs.omitted.length === net.cutEdgeKeys.size, 'Print tabs do not account for every cut edge.');
const archive = createStoredZip([
  ...printPackage.pages.map((page) => ({ name: `pages/${page.filename}`, data: page.svg })),
  { name: 'print.html', data: printPackageToHtml(shape, printPackage) },
  { name: 'manifest.json', data: printPackageManifest(shape, printPackage) },
]);
check(archive.byteLength > 1024, 'Generated print ZIP is unexpectedly small.');
check(String.fromCharCode(...archive.slice(0, 4)) === 'PK\u0003\u0004', 'Generated print ZIP lacks a local-file header.');

const schemaDirectory = new URL('../schemas/', import.meta.url);
const schemaFiles = (await readdir(schemaDirectory)).filter((filename) => filename.endsWith('.json'));
const schemaIds = new Set();
for (const filename of schemaFiles) {
  const schema = JSON.parse(await readFile(new URL(filename, schemaDirectory), 'utf8'));
  check(schema.$schema?.includes('json-schema.org'), `${filename}: missing JSON Schema dialect.`);
  check(typeof schema.$id === 'string' && schema.$id.length > 0, `${filename}: missing $id.`);
  check(!schemaIds.has(schema.$id), `${filename}: duplicate $id ${schema.$id}.`);
  schemaIds.add(schema.$id);
}

console.table(portfolioRows);
console.table([
  { gate: 'Exact compound panels', result: `${compoundBuild.compoundFaces.length} faces / ${compoundBuild.required['equilateral-triangle']} triangles` },
  { gate: 'Calibration session round-trip', result: `${session.samples.length} samples / ${profile.calibration.uncertainty.length} edge estimates` },
  { gate: 'Thickness screen', result: `${clearance.entries.length} hinges / ${clearance.modeledRatio * 100}% modeled scenario` },
  { gate: 'Print package', result: `${printPackage.pages.length} pages / ${printPackage.tabs.tabs.length} tabs / ${archive.byteLength} bytes` },
  { gate: 'Schema documents', result: `${schemaFiles.length} parsed / unique IDs` },
]);

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  console.error(`${failures.length} advanced validation failure(s).`);
  process.exitCode = 1;
} else {
  console.log(`Advanced workflow validation passed in ${(performance.now() - started).toFixed(1)} ms.`);
}
