#!/usr/bin/env node
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createShape, cube } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import {
  BUILTIN_TILE_PROFILES,
  INVENTORY_PRESETS,
  analyzeBuildability,
  tileProfilesToJson,
} from '../src/core/tiles.js';
import {
  calibrationSessionsToJson,
  createCalibrationSession,
} from '../src/core/calibration.js';
import { analyzeThicknessClearance } from '../src/core/feasibility.js';
import {
  calibrationSheetToSvg,
  netToSvg,
  polyhedronToJson,
} from '../src/core/export.js';
import {
  createPrintPackage,
  printPackageManifest,
  printPackageToHtml,
} from '../src/core/print.js';
import { createStoredZip } from '../src/core/zip.js';
import {
  createFoldingModel,
  createFoldingSchedule,
  serializeFoldingState,
} from '../src/core/folding.js';
import { createMotionClip, rootPoseKeyframe } from '../src/core/motion.js';
import { axisAngle4, multiply4, translation4 } from '../src/core/rigid.js';

const examplesUrl = new URL('../examples/', import.meta.url);
const EXAMPLE_TIMESTAMP = '2026-08-08T12:00:00.000Z';
const writeExample = (relative, data) => writeFile(new URL(relative, examplesUrl), data);

const shape = cube();
const analysis = analyzePolyhedron(shape);
const net = planNet(shape, analysis, { seed: 11, objective: 'compact' });
const buildability = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'],
});
const baselineClearance = analyzeThicknessClearance(analysis, buildability, { assumption: 'measured-only' });
const foldingModel = createFoldingModel(shape, analysis, net);
const foldingSchedule = createFoldingSchedule(foldingModel, { mode: 'root-out', hingeDuration: 0.58 });

const exampleMotionClip = createMotionClip({
  id: 'cube-fold-and-fly',
  name: 'Cube: fold, lift, and orbit',
  durationSeconds: 8,
  loop: false,
  rootPoseTrack: [
    rootPoseKeyframe(0, translation4([0, 0, 0]), 'smoothstep'),
    rootPoseKeyframe(4, translation4([0, 0, 0]), 'smoothstep'),
    rootPoseKeyframe(8, multiply4(translation4([1.6, 1.1, 0.8]), axisAngle4([0, 1, 0], Math.PI * 0.75)), 'ease-in-out-cubic'),
  ],
  progressTrack: [
    { time: 0, value: 0, easing: 'smoothstep' },
    { time: 4, value: 1, easing: 'smoothstep' },
    { time: 8, value: 1, easing: 'linear' },
  ],
  cameraTrack: [
    { time: 0, position: [0, -5.8, 7.2], target: [0, 0, 0], up: [0, 0, 1], fovDegrees: 42, easing: 'smoothstep' },
    { time: 4, position: [5.7, -4.2, 4.8], target: [0, 0, 0.8], up: [0, 0, 1], fovDegrees: 45, easing: 'ease-in-out-cubic' },
    { time: 8, position: [-4.8, -3.4, 5.6], target: [1.6, 1.1, 0.8], up: [0, 0, 1], fovDegrees: 48, easing: 'ease-in-out-cubic' },
  ],
  markers: [
    { time: 0, id: 'flat', label: 'Exact 2D net' },
    { time: 4, id: 'closed', label: 'Closed target solid' },
    { time: 8, id: 'spatial', label: 'Spatial inspection pose' },
  ],
  metadata: {
    purpose: 'handoff example',
    caveat: 'Camera and root-pose tracks are implemented at the schema/core layer; renderer playback integration is a subsequent increment.',
  },
});

const exampleFoldingState = serializeFoldingState(foldingModel, {
  progress: 0.56,
  schedule: foldingSchedule,
  sequenceMode: 'root-out',
  hingeDuration: 0.58,
  selectedHingeEdgeKey: foldingModel.hinges[0]?.edgeKey ?? null,
  showHinges: true,
  collisionScreen: true,
});

const baseSquare = BUILTIN_TILE_PROFILES.find((profile) => profile.id === 'square');
const { session: squareSession, profile: calibratedSquare } = createCalibrationSession(baseSquare, {
  id: 'cal-square-example-batch-a',
  title: 'Example three-piece caliper calibration',
  label: 'Square — example local batch',
  method: 'calipers',
  device: 'digital caliper, 0.01 mm resolution',
  instrumentResolutionMm: 0.01,
  setOrBatch: 'Synthetic documentation batch A',
  temperatureC: 22,
  humidityPercent: 45,
  notes: 'Synthetic documentation example; replace with measurements from owned pieces.',
  measuredAt: EXAMPLE_TIMESTAMP,
  minStableInteriorDegrees: 80,
  maxStableInteriorDegrees: 110,
  samples: [
    { edgeLengthsMm: [74.92, 74.94, 74.93, 74.92], thicknessMm: 6.46, cornerRadiusMm: 5.12 },
    { edgeLengthsMm: [74.94, 74.93, 74.92, 74.94], thicknessMm: 6.45, cornerRadiusMm: 5.10 },
    { edgeLengthsMm: [74.93, 74.92, 74.94, 74.93], thicknessMm: 6.47, cornerRadiusMm: 5.11 },
  ],
});
const calibratedBuildability = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts, {
  families: ['standard'],
  profileOverrides: [calibratedSquare],
  modelUnitMm: calibratedSquare.dimensionsMm[0],
});
const scenarioClearance = analyzeThicknessClearance(analysis, calibratedBuildability, { assumption: 'surface-axis' });
const calibratedProject = {
  generatedAt: EXAMPLE_TIMESTAMP,
  lockedFoldEdgeKeys: [],
  lockedCutEdgeKeys: [],
  parameter: null,
  inventoryPreset: 'classic37',
  inventory: INVENTORY_PRESETS.classic37.counts,
  tileFamilies: ['standard'],
  scaleMode: 'custom',
  customScale: calibratedSquare.dimensionsMm[0],
  calibrationProfileIds: [calibratedSquare.id],
  calibrationProfiles: [calibratedSquare],
  calibrationSessions: [squareSession],
  compoundMode: 'exact',
  clearanceAssumption: 'surface-axis',
  thicknessClearance: scenarioClearance,
  folding: exampleFoldingState,
  motionClips: [exampleMotionClip],
  activeMotionClipId: exampleMotionClip.id,
  printSettings: {
    page: 'letter', orientation: 'auto', mode: 'actual', marginMm: 10, overlapMm: 8,
    tabDepthMm: 8, glueTabs: true, labelCutPairs: true, labelFaces: true, cropMarks: true,
  },
};

const printPackage = createPrintPackage(shape, analysis, net, {
  modelUnitMm: calibratedBuildability.modelUnitMm,
  pagePreset: 'letter',
  orientation: 'auto',
  mode: 'actual',
  marginMm: 10,
  posterOverlapMm: 8,
  glueTabs: true,
  tabDepthMm: 8,
  calibrationRuler: true,
});
const printDirectory = new URL('./cube-print-package/', examplesUrl);
await rm(printDirectory, { recursive: true, force: true });
await mkdir(new URL('./pages/', printDirectory), { recursive: true });
const printFiles = [
  ...printPackage.pages.map((page) => ({ name: `pages/${page.filename}`, data: page.svg })),
  { name: 'print.html', data: printPackageToHtml(shape, printPackage) },
  { name: 'manifest.json', data: printPackageManifest(shape, printPackage, { generatedAt: EXAMPLE_TIMESTAMP }) },
  { name: 'README.txt', data: 'Open print.html and print at 100% / Actual Size. Verify the 50 mm ruler before cutting.\n' },
];
await Promise.all(printFiles.map(({ name, data }) => writeFile(new URL(name, printDirectory), data)));
const printZip = createStoredZip(printFiles, { modifiedAt: new Date(EXAMPLE_TIMESTAMP) });

const compoundShape = createShape('truncated-octahedron');
const compoundAnalysis = analyzePolyhedron(compoundShape);
const abundantInventory = {
  square: 999,
  'equilateral-triangle': 999,
  'right-triangle': 999,
  'isosceles-triangle': 999,
};
const compoundBuildability = analyzeBuildability(compoundAnalysis, abundantInventory, {
  families: ['standard'],
  enableCompoundFaces: true,
});
const compoundNet = planNet(compoundShape, compoundAnalysis, { seed: 23, objective: 'buildable' });
const compoundClearance = analyzeThicknessClearance(compoundAnalysis, compoundBuildability, { assumption: 'measured-only' });

await Promise.all([
  writeExample('cube-net.svg', netToSvg(shape, analysis, net, {
    physicalScale: true,
    modelUnitMm: buildability.modelUnitMm,
    labelFaces: true,
  })),
  writeExample('cube-snapshot.json', polyhedronToJson(shape, analysis, net, buildability, {
    generatedAt: EXAMPLE_TIMESTAMP,
    inventoryPreset: 'classic37',
    inventory: INVENTORY_PRESETS.classic37.counts,
    tileFamilies: ['standard'],
    scaleMode: 'standard',
    customScale: null,
    compoundMode: 'exact',
    clearanceAssumption: 'measured-only',
    thicknessClearance: baselineClearance,
    folding: exampleFoldingState,
    motionClips: [exampleMotionClip],
    activeMotionClipId: exampleMotionClip.id,
  })),
  writeExample('calibration-sheet.svg', calibrationSheetToSvg()),
  writeExample('cube-spatial-motion-clip.json', JSON.stringify(exampleMotionClip, null, 2)),
  writeExample('example-calibrated-square-profile.json', tileProfilesToJson([calibratedSquare], { exportedAt: EXAMPLE_TIMESTAMP })),
  writeExample('example-calibration-session.json', calibrationSessionsToJson([squareSession], { exportedAt: EXAMPLE_TIMESTAMP })),
  writeExample('calibrated-cube-project.json', polyhedronToJson(shape, analysis, net, calibratedBuildability, calibratedProject)),
  writeExample('cube-print-package.zip', printZip),
  writeExample('truncated-octahedron-compound-net.svg', netToSvg(compoundShape, compoundAnalysis, compoundNet, {
    physicalScale: true,
    modelUnitMm: compoundBuildability.modelUnitMm,
    labelFaces: true,
    compoundByFace: compoundBuildability.compoundByFace,
  })),
  writeExample('truncated-octahedron-compound-project.json', polyhedronToJson(
    compoundShape,
    compoundAnalysis,
    compoundNet,
    compoundBuildability,
    {
      generatedAt: EXAMPLE_TIMESTAMP,
      inventoryPreset: 'custom',
      inventory: abundantInventory,
      tileFamilies: ['standard'],
      scaleMode: 'auto',
      customScale: compoundBuildability.modelUnitMm,
      compoundMode: 'exact',
      clearanceAssumption: 'measured-only',
      thicknessClearance: compoundClearance,
    },
  )),
]);

console.log(`Generated snapshot v4 examples, raw calibration session, ${printPackage.pages.length}-page print package, and exact compound-panel artifacts.`);
