import { SHAPE_CATALOG, catalogEntry, createShape } from './core/catalog.js';
import { analyzePolyhedron } from './core/polyhedron.js';
import {
  NET_OBJECTIVES,
  buildStepsFromNet,
  editNetEdge,
  netFromEdgeKeys,
  planNet,
  rerootNet,
} from './core/net.js';
import {
  BUILTIN_TILE_PROFILES,
  INVENTORY_PRESETS,
  MICRO_TILE_EDGE_MM,
  STANDARD_TILE_EDGE_MM,
  analyzeBuildability,
  describeMatch,
  formatBillOfMaterials,
  mergeTileProfiles,
  normalizeInventory,
  parseTileProfileRecords,
  tileProfilesToJson,
} from './core/tiles.js';
import {
  calibrationSheetToSvg,
  downloadText,
  netToSvg,
  parseSnapshotProject,
  polyhedronToJson,
} from './core/export.js';
import {
  calibrationSessionsToJson,
  createCalibrationSession,
  parseCalibrationSessionRecords,
  profileFromCalibrationSession,
} from './core/calibration.js';
import { compoundAssignmentSummary } from './core/compound.js';
import { analyzeThicknessClearance } from './core/feasibility.js';
import { NetOptimizerClient } from './core/net-optimizer-client.js';
import {
  PRINT_PAGE_PRESETS,
  createPrintPackage,
  printPackageManifest,
  printPackageToHtml,
} from './core/print.js';
import { ProjectStore } from './core/project-store.js';
import { createStoredZip, downloadBytes } from './core/zip.js';
import { roundTo } from './core/math.js';
import {
  FOLD_SEQUENCE_MODES,
  createFoldingModel,
  createFoldingSchedule,
  parseFoldingState,
  sampleFoldingPose,
  serializeFoldingState,
} from './core/folding.js';
import { analyzeFoldingPose } from './core/folding-diagnostics.js';
import { IDENTITY_4 } from './core/rigid.js';
import { validateMotionClip } from './core/motion.js';
import { createCanvasRenderer } from './render/canvas-renderer.js';

const $ = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const stripXmlDeclaration = (value) => String(value ?? '').replace(/^<\?xml[^>]*>\s*/i, '');

const elements = {
  shapeSelect: $('#shape-select'),
  parameterField: $('#parameter-field'),
  parameterLabel: $('#parameter-label'),
  parameterInput: $('#shape-parameter'),
  parameterOutput: $('#parameter-output'),
  description: $('#shape-description'),
  shapeTitle: $('#shape-title'),
  kidsToggle: $('#kids-toggle'),
  kidsBar: $('#kids-bar'),
  kidsShapeName: $('#kids-shape-name'),
  kidsShapes: $('#kids-shapes'),
  kidsCaption: $('#kids-caption'),
  kidsConsole: $('#kids-console'),
  kidsFold: $('#kids-fold'),
  kidsCelebrate: $('#kids-celebrate'),
  shapeFamily: $('#shape-family'),
  validationBadge: $('#validation-badge'),
  vertices: $('#metric-vertices'),
  edges: $('#metric-edges'),
  faces: $('#metric-faces'),
  euler: $('#metric-euler'),
  area: $('#metric-area'),
  volume: $('#metric-volume'),
  genus: $('#metric-genus'),
  edgeSpread: $('#metric-edge-spread'),
  faceKinds: $('#face-kind-list'),
  viewport: $('#viewport'),
  loader: $('#viewport-loader'),
  rendererStatus: $('#renderer-status'),
  foldSlider: $('#fold-slider'),
  foldOutput: $('#fold-output'),
  foldPlay: $('#fold-play'),
  resetView: $('#reset-view'),
  toolInspect: $('#tool-inspect'),
  toolHinge: $('#tool-hinge'),
  toolMove: $('#tool-move'),
  transformMode: $('#transform-mode'),
  resetRoot: $('#reset-root'),
  foldSequence: $('#fold-sequence'),
  foldSpeed: $('#fold-speed'),
  hingeDuration: $('#hinge-duration'),
  hingeDurationOutput: $('#hinge-duration-output'),
  showHinges: $('#show-hinges'),
  collisionScreen: $('#collision-screen'),
  hingeEmpty: $('#hinge-empty'),
  hingeDetails: $('#hinge-details'),
  hingeKey: $('#hinge-key'),
  hingeDirection: $('#hinge-direction'),
  hingeFaces: $('#hinge-faces'),
  hingeTargetAngle: $('#hinge-target-angle'),
  hingeCurrentAngle: $('#hinge-current-angle'),
  hingeWindow: $('#hinge-window'),
  hingeAngle: $('#hinge-angle'),
  hingeAngleOutput: $('#hinge-angle-output'),
  hingeFollowTimeline: $('#hinge-follow-timeline'),
  hingeTarget: $('#hinge-target'),
  foldDiagnosticHinge: $('#fold-diagnostic-hinge'),
  foldDiagnosticClosure: $('#fold-diagnostic-closure'),
  foldDiagnosticCollisions: $('#fold-diagnostic-collisions'),
  foldDiagnosticTarget: $('#fold-diagnostic-target'),
  foldTimelineSummary: $('#fold-timeline-summary'),
  foldTimeline: $('#fold-timeline'),
  netPreview: $('#net-preview'),
  netValidity: $('#net-validity'),
  netScore: $('#net-score'),
  buildStatus: $('#build-status'),
  alternateNet: $('#alternate-net'),
  exportSvg: $('#export-svg'),
  exportJson: $('#export-json'),
  exportPrint: $('#export-print'),
  saveProject: $('#save-project'),
  openProjects: $('#open-projects'),
  importProject: $('#import-project'),
  projectImportFile: $('#project-import-file'),
  faceEmpty: $('#face-empty'),
  faceDetails: $('#face-details'),
  faceNumber: $('#face-number'),
  faceName: $('#face-name'),
  faceSides: $('#face-sides'),
  faceArea: $('#face-area'),
  faceTile: $('#face-tile'),
  faceRegular: $('#face-regular'),
  faceMatchNote: $('#face-match-note'),
  objective: $('#net-objective'),
  workshopUndo: $('#workshop-undo'),
  workshopRedo: $('#workshop-redo'),
  workshopOptimize: $('#workshop-optimize'),
  workshopMessage: $('#workshop-message'),
  optimizerStatus: $('#optimizer-status'),
  optimizerPhase: $('#optimizer-phase'),
  optimizerProgressLabel: $('#optimizer-progress-label'),
  optimizerProgress: $('#optimizer-progress'),
  optimizerCancel: $('#optimizer-cancel'),
  candidateSection: $('#net-candidate-section'),
  candidateSummary: $('#candidate-summary'),
  candidateGallery: $('#net-candidate-gallery'),
  edgeEmpty: $('#edge-empty'),
  edgeDetails: $('#edge-details'),
  edgeState: $('#edge-state'),
  edgeKey: $('#edge-key'),
  edgeFaces: $('#edge-faces'),
  edgeAngle: $('#edge-angle'),
  edgeConstraint: $('#edge-constraint'),
  edgeLock: $('#edge-lock'),
  edgeMakeCut: $('#edge-make-cut'),
  edgeMakeFold: $('#edge-make-fold'),
  setRootFace: $('#set-root-face'),
  diagnosticOverlaps: $('#diagnostic-overlaps'),
  diagnosticOverlapArea: $('#diagnostic-overlap-area'),
  diagnosticDepth: $('#diagnostic-depth'),
  diagnosticLocks: $('#diagnostic-locks'),
  inventoryPreset: $('#inventory-preset'),
  tileFamily: $('#tile-family'),
  scaleMode: $('#scale-mode'),
  customScaleField: $('#custom-scale-field'),
  customScale: $('#custom-scale'),
  compoundMode: $('#compound-mode'),
  clearanceAssumption: $('#clearance-assumption'),
  physicalScale: $('#physical-scale'),
  physicalConfidence: $('#physical-confidence'),
  physicalHinges: $('#physical-hinges'),
  physicalCompound: $('#physical-compound'),
  physicalClearance: $('#physical-clearance'),
  inventoryGrid: $('#inventory-grid'),
  bom: $('#bom'),
  calibrateTiles: $('#calibrate-tiles'),
  manageProfiles: $('#manage-profiles'),
  stepCount: $('#step-count'),
  stepProgress: $('#step-progress'),
  stepKicker: $('#step-kicker'),
  stepTitle: $('#step-title'),
  stepInstruction: $('#step-instruction'),
  stepPrevious: $('#step-previous'),
  stepNext: $('#step-next'),
  lessonV: $('#lesson-v'),
  lessonE: $('#lesson-e'),
  lessonF: $('#lesson-f'),
  lessonChi: $('#lesson-chi'),
  lessonEulerCopy: $('#lesson-euler-copy'),
  challengeFeedback: $('#challenge-feedback'),
  calibrationDialog: $('#calibration-dialog'),
  calibrationForm: $('#calibration-form'),
  calibrationProfile: $('#calibration-profile'),
  calibrationLabel: $('#calibration-label'),
  calibrationMethod: $('#calibration-method'),
  calibrationDevice: $('#calibration-device'),
  calibrationResolution: $('#calibration-resolution'),
  calibrationBatch: $('#calibration-batch'),
  calibrationTemperature: $('#calibration-temperature'),
  calibrationHumidity: $('#calibration-humidity'),
  calibrationAngles: $('#calibration-angles'),
  calibrationSamples: $('#calibration-samples'),
  addCalibrationSample: $('#add-calibration-sample'),
  hingeMin: $('#hinge-min'),
  hingeMax: $('#hinge-max'),
  calibrationNotes: $('#calibration-notes'),
  calibrationStats: $('#calibration-stats'),
  profilesDialog: $('#profiles-dialog'),
  profileList: $('#profile-list'),
  profileImportFile: $('#profile-import-file'),
  sessionImportFile: $('#session-import-file'),
  exportProfiles: $('#export-profiles'),
  importProfiles: $('#import-profiles'),
  exportSessions: $('#export-sessions'),
  importSessions: $('#import-sessions'),
  exportCalibrationSheet: $('#export-calibration-sheet'),
  printDialog: $('#print-dialog'),
  printForm: $('#print-form'),
  printPage: $('#print-page'),
  printOrientation: $('#print-orientation'),
  printMode: $('#print-mode'),
  printMargin: $('#print-margin'),
  printOverlap: $('#print-overlap'),
  printTabDepth: $('#print-tab-depth'),
  printTabs: $('#print-tabs'),
  printCutLabels: $('#print-cut-labels'),
  printFaceLabels: $('#print-face-labels'),
  printCropMarks: $('#print-crop-marks'),
  printSummary: $('#print-summary'),
  printPreview: $('#print-preview'),
  exportPrintHtml: $('#export-print-html'),
  downloadPrintPackage: $('#download-print-package'),
  projectsDialog: $('#projects-dialog'),
  projectList: $('#project-list'),
  aboutButton: $('#about-button'),
  aboutDialog: $('#about-dialog'),
};

const storageKey = 'magnamath-rebuilt-state-v4';
const legacyStorageKeys = ['magnamath-rebuilt-state-v3', 'magnamath-rebuilt-state-v2', 'magnamath-rebuilt-state-v1'];
const stored = (() => {
  try {
    const sourceKey = [storageKey, ...legacyStorageKeys].find((key) => localStorage.getItem(key)) ?? storageKey;
    const parsed = JSON.parse(localStorage.getItem(sourceKey) ?? '{}');
    return { ...parsed, __sourceStorageKey: sourceKey };
  } catch {
    return { __sourceStorageKey: storageKey };
  }
})();

const netOptimizer = new NetOptimizerClient();
const projectStore = new ProjectStore();

const query = new URLSearchParams(location.search);
const queryMode = query.get('mode');
const initialPreset = INVENTORY_PRESETS[stored.inventoryPreset] ?? INVENTORY_PRESETS.classic100;
const defaultInventory = normalizeInventory(initialPreset.counts, BUILTIN_TILE_PROFILES);
const storedFamilies = Array.isArray(stored.tileFamilies)
  ? stored.tileFamilies.filter((family) => ['standard', 'micro'].includes(family))
  : [];
const state = {
  mode: ['explore', 'fold', 'workshop', 'build', 'learn'].includes(queryMode)
    ? queryMode
    : (['explore', 'fold', 'workshop', 'build', 'learn'].includes(stored.mode) ? stored.mode : 'explore'),
  shapeId: stored.shapeId ?? 'cube',
  parameter: Number(stored.parameter ?? 5),
  netSeed: Number(stored.netSeed ?? 1),
  netObjective: stored.netObjective in NET_OBJECTIVES ? stored.netObjective : 'compact',
  progress: Number.isFinite(stored.foldProgress)
    ? Number(stored.foldProgress)
    : (stored.__sourceStorageKey === storageKey ? Number(stored.progress ?? 1) : 1 - Number(stored.progress ?? 0)),
  selectedFace: Number.isInteger(stored.selectedFace) ? stored.selectedFace : 0,
  selectedEdgeKey: stored.selectedEdgeKey ?? null,
  rootFace: Number.isInteger(stored.rootFace) ? stored.rootFace : 0,
  lockedFoldEdgeKeys: new Set(stored.lockedFoldEdgeKeys ?? []),
  lockedCutEdgeKeys: new Set(stored.lockedCutEdgeKeys ?? []),
  history: [],
  future: [],
  workshopMessage: '',
  buildStep: 0,
  inventoryPreset: stored.inventoryPreset in INVENTORY_PRESETS ? stored.inventoryPreset : 'classic100',
  inventory: normalizeInventory(stored.inventory ?? defaultInventory, BUILTIN_TILE_PROFILES),
  tileFamilies: storedFamilies.length ? storedFamilies : (initialPreset.families ?? ['standard']),
  scaleMode: ['auto', 'standard', 'micro', 'custom'].includes(stored.scaleMode) ? stored.scaleMode : 'auto',
  customScale: Number(stored.customScale ?? STANDARD_TILE_EDGE_MM),
  compoundMode: ['exact', 'off'].includes(stored.compoundMode) ? stored.compoundMode : 'exact',
  clearanceAssumption: ['measured-only', 'surface-axis'].includes(stored.clearanceAssumption) ? stored.clearanceAssumption : 'measured-only',
  profileOverrides: Array.isArray(stored.profileOverrides) ? stored.profileOverrides : [],
  calibrationSessions: Array.isArray(stored.calibrationSessions) ? stored.calibrationSessions : [],
  printSettings: {
    page: stored.printSettings?.page in PRINT_PAGE_PRESETS ? stored.printSettings.page : 'letter',
    orientation: ['auto', 'portrait', 'landscape'].includes(stored.printSettings?.orientation) ? stored.printSettings.orientation : 'auto',
    mode: ['actual', 'fit', 'poster'].includes(stored.printSettings?.mode) ? stored.printSettings.mode : 'actual',
    marginMm: Number(stored.printSettings?.marginMm ?? 10),
    overlapMm: Number(stored.printSettings?.overlapMm ?? 8),
    tabDepthMm: Number(stored.printSettings?.tabDepthMm ?? 8),
    glueTabs: stored.printSettings?.glueTabs !== false,
    labelCutPairs: stored.printSettings?.labelCutPairs !== false,
    labelFaces: stored.printSettings?.labelFaces !== false,
    cropMarks: stored.printSettings?.cropMarks !== false,
  },
  localProjectId: stored.localProjectId ?? null,
  foldSequenceMode: stored.foldSequenceMode in FOLD_SEQUENCE_MODES ? stored.foldSequenceMode : 'root-out',
  hingeDurationValue: Math.min(1, Math.max(0.1, Number(stored.hingeDurationValue ?? 0.58))),
  hingeOverrides: stored.hingeOverrides && typeof stored.hingeOverrides === 'object' ? stored.hingeOverrides : {},
  selectedHingeEdgeKey: stored.selectedHingeEdgeKey ?? null,
  showHinges: stored.showHinges !== false,
  collisionScreenEnabled: stored.collisionScreenEnabled !== false,
  kidsMode: false,
  interactionMode: ['inspect', 'hinge', 'move'].includes(stored.interactionMode) ? stored.interactionMode : 'inspect',
  transformModeValue: stored.transformModeValue === 'rotate' ? 'rotate' : 'translate',
  rootPose: Array.isArray(stored.rootPose) && stored.rootPose.length === 16 ? stored.rootPose : [...IDENTITY_4],
  foldSpeedValue: [0.5, 1, 1.5, 2].includes(Number(stored.foldSpeedValue)) ? Number(stored.foldSpeedValue) : 1,
  motionClips: Array.isArray(stored.motionClips) ? stored.motionClips : [],
  activeMotionClipId: typeof stored.activeMotionClipId === 'string' ? stored.activeMotionClipId : null,
  foldingModel: null,
  foldingPose: null,
  foldingSchedule: null,
  foldingDiagnostics: null,
  model: null,
  analysis: null,
  net: null,
  buildability: null,
  clearance: null,
  steps: [],
  netCandidates: [],
  optimizerRunning: false,
  optimizerProgress: null,
  currentPrintPackage: null,
  renderer: null,
  animationId: 0,
};

function persist() {
  localStorage.setItem(storageKey, JSON.stringify({
    mode: state.mode,
    shapeId: state.shapeId,
    parameter: state.parameter,
    netSeed: state.netSeed,
    netObjective: state.netObjective,
    foldProgress: state.progress,
    selectedFace: state.selectedFace,
    selectedEdgeKey: state.selectedEdgeKey,
    rootFace: state.rootFace,
    lockedFoldEdgeKeys: [...state.lockedFoldEdgeKeys],
    lockedCutEdgeKeys: [...state.lockedCutEdgeKeys],
    inventoryPreset: state.inventoryPreset,
    inventory: state.inventory,
    tileFamilies: state.tileFamilies,
    scaleMode: state.scaleMode,
    customScale: state.customScale,
    compoundMode: state.compoundMode,
    clearanceAssumption: state.clearanceAssumption,
    profileOverrides: state.profileOverrides,
    calibrationSessions: state.calibrationSessions,
    printSettings: state.printSettings,
    localProjectId: state.localProjectId,
    foldSequenceMode: state.foldSequenceMode,
    hingeDurationValue: state.hingeDurationValue,
    hingeOverrides: state.hingeOverrides,
    selectedHingeEdgeKey: state.selectedHingeEdgeKey,
    showHinges: state.showHinges,
    collisionScreenEnabled: state.collisionScreenEnabled,
    interactionMode: state.interactionMode,
    transformModeValue: state.transformModeValue,
    rootPose: state.rootPose,
    foldSpeedValue: state.foldSpeedValue,
    motionClips: state.motionClips,
    activeMotionClipId: state.activeMotionClipId,
  }));
}

function toast(message, kind = 'info') {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.append(host);
  }
  const item = document.createElement('div');
  item.className = `toast toast--${kind}`;
  item.textContent = message;
  host.append(item);
  requestAnimationFrame(() => item.classList.add('is-visible'));
  setTimeout(() => {
    item.classList.remove('is-visible');
    setTimeout(() => item.remove(), 250);
  }, 2800);
}

function activeProfiles() {
  return mergeTileProfiles(state.profileOverrides);
}

function invalidateDerivedWorkspaceState({ detachLocalProject = false } = {}) {
  state.netCandidates = [];
  state.optimizerProgress = null;
  state.currentPrintPackage = null;
  if (detachLocalProject) state.localProjectId = null;
}

function selectedModelScale() {
  if (state.scaleMode === 'standard') return STANDARD_TILE_EDGE_MM;
  if (state.scaleMode === 'micro') return MICRO_TILE_EDGE_MM;
  if (state.scaleMode === 'custom') return Number.isFinite(state.customScale) && state.customScale > 0 ? state.customScale : STANDARD_TILE_EDGE_MM;
  return undefined;
}

function populateShapeSelect() {
  const groups = new Map();
  for (const entry of SHAPE_CATALOG) {
    if (!groups.has(entry.family)) groups.set(entry.family, []);
    groups.get(entry.family).push(entry);
  }
  elements.shapeSelect.replaceChildren(...[...groups].map(([family, entries]) => {
    const group = document.createElement('optgroup');
    group.label = family;
    for (const entry of entries) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.name;
      group.append(option);
    }
    return group;
  }));
  if (!SHAPE_CATALOG.some((entry) => entry.id === state.shapeId)) state.shapeId = 'cube';
  elements.shapeSelect.value = state.shapeId;
}

function populateInventoryPresets() {
  elements.inventoryPreset.replaceChildren(...Object.entries(INVENTORY_PRESETS).map(([id, preset]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = preset.label;
    return option;
  }));
  elements.inventoryPreset.value = state.inventoryPreset;
}

function populateObjectives() {
  elements.objective.replaceChildren(...Object.values(NET_OBJECTIVES).map((objective) => {
    const option = document.createElement('option');
    option.value = objective.id;
    option.textContent = objective.label;
    option.title = objective.description;
    return option;
  }));
  elements.objective.value = state.netObjective;
}

function tileFamilyControlValue() {
  if (state.tileFamilies.includes('standard') && state.tileFamilies.includes('micro')) return 'both';
  return state.tileFamilies.includes('micro') ? 'micro' : 'standard';
}

function updateParameterControl() {
  const entry = catalogEntry(state.shapeId);
  if (!entry.parameter) {
    elements.parameterField.hidden = true;
    return;
  }
  elements.parameterField.hidden = false;
  elements.parameterLabel.textContent = entry.parameter.label;
  elements.parameterInput.min = entry.parameter.min;
  elements.parameterInput.max = entry.parameter.max;
  if (state.parameter < entry.parameter.min || state.parameter > entry.parameter.max) state.parameter = entry.parameter.default;
  elements.parameterInput.value = String(state.parameter);
  elements.parameterOutput.value = String(state.parameter);
}

/* ==============================================================
   Kids mode
   A presentation layer over the same exact core. It changes what
   is shown and which diagnostics are surfaced — never the
   geometry. Shape choices below were measured: each folds to
   closure (residual <= 3e-14) with an overlap-free net at the
   app's default seed.
   ============================================================== */

// `parameter` is explicit where the catalog entry is parameterised, because the
// generic change-handler would otherwise snap it to the entry default (prism -> 5).
const KID_SHAPES = [
  { id: 'cube', parameter: null, kid: 'Box', math: 'Cube', faces: 6, faceWord: 'squares', icon: 'cube' },
  { id: 'tetrahedron', parameter: null, kid: 'Triangle Pyramid', math: 'Tetrahedron', faces: 4, faceWord: 'triangles', icon: 'tetra' },
  { id: 'prism', parameter: 3, kid: 'Tent', math: 'Triangular prism', faces: 5, faceWord: 'flat sides', icon: 'tent' },
  { id: 'pyramid', parameter: 4, kid: 'Pyramid', math: 'Square pyramid', faces: 5, faceWord: 'flat sides', icon: 'pyramid' },
  { id: 'octahedron', parameter: null, kid: 'Diamond', math: 'Octahedron', faces: 8, faceWord: 'triangles', icon: 'octa' },
  { id: 'prism', parameter: 6, kid: 'Pencil', math: 'Hexagonal prism', faces: 8, faceWord: 'flat sides', icon: 'pencil' },
  { id: 'icosahedron', parameter: null, kid: 'Spiky Ball', math: 'Icosahedron', faces: 20, faceWord: 'triangles', icon: 'icosa' },
  { id: 'truncated-icosahedron', parameter: null, kid: 'Soccer Ball', math: 'Truncated icosahedron', faces: 32, faceWord: 'flat sides', icon: 'soccer' },
];

const KID_ICONS = {
  cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  tetra: '<path d="M12 3 3 19h18Z"/><path d="M12 3v16M3 19l9-8 9 8"/>',
  tent: '<path d="M3 19 9 4l6 15Z"/><path d="M9 4l6 3 6 12h-6"/>',
  pyramid: '<path d="M12 3 3 16l9 5 9-5Z"/><path d="M3 16l9-5 9 5M12 3v8"/>',
  octa: '<path d="M12 2 4 12l8 10 8-10Z"/><path d="M4 12h16M12 2v20"/>',
  pencil: '<path d="M7 4h10l3 4-3 4H7L4 8Z"/><path d="M7 12v8h10v-8"/>',
  icosa: '<path d="M12 2 3 8v8l9 6 9-6V8Z"/><path d="M12 2v20M3 8l9 6 9-6M3 16l9-6 9 6"/>',
  soccer: '<circle cx="12" cy="12" r="9"/><path d="M12 7l3.5 2.5-1.3 4.2h-4.4L8.5 9.5Z"/><path d="M12 3v4M4.2 9.6l4.3-.1M19.8 9.6l-4.3-.1M7 20l2.8-5.8M17 20l-2.8-5.8"/>',
};

function kidShapeKey(entry) {
  return entry.parameter === null ? entry.id : `${entry.id}:${entry.parameter}`;
}

function currentKidShapeKey() {
  const entry = catalogEntry(state.shapeId);
  return entry?.parameter ? `${state.shapeId}:${state.parameter}` : state.shapeId;
}

function renderKidShapes() {
  const active = currentKidShapeKey();
  elements.kidsShapes.replaceChildren(...KID_SHAPES.map((shape) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kids-shape';
    button.dataset.kidKey = kidShapeKey(shape);
    button.setAttribute('aria-pressed', String(kidShapeKey(shape) === active));
    // Plain word leads; the real mathematical name stays visible but subordinate.
    button.innerHTML =
      `<svg viewBox="0 0 24 24" aria-hidden="true">${KID_ICONS[shape.icon] ?? KID_ICONS.cube}</svg>`
      + `<span class="kids-shape-name">${shape.kid}</span>`
      + `<span class="kids-shape-math">${shape.math}</span>`;
    button.setAttribute('aria-label', `${shape.kid}, also called a ${shape.math}`);
    button.addEventListener('click', () => selectKidShape(shape));
    return button;
  }));
}

// Reuses the app's own shape-change sequence (invalidate -> set -> recompute) rather
// than calling createShape directly, so derived workspace state stays consistent.
function selectKidShape(shape) {
  invalidateDerivedWorkspaceState({ detachLocalProject: true });
  state.shapeId = shape.id;
  const entry = catalogEntry(shape.id);
  if (entry?.parameter) state.parameter = shape.parameter ?? entry.parameter.default;
  state.selectedFace = 0;
  state.buildStep = 0;
  state.progress = 0;
  elements.shapeSelect.value = state.shapeId;
  updateParameterControl();
  renderKidShapes();
  recomputeShape({ preserveSeed: false, resetWorkshop: true });
}

function updateKidCaption() {
  if (!state.kidsMode) return;
  const key = currentKidShapeKey();
  const shape = KID_SHAPES.find((candidate) => kidShapeKey(candidate) === key);
  const faceCount = state.analysis?.faces?.length ?? shape?.faces;
  // The kid name lives in a kids-owned node and is the largest text on the screen,
  // so it can never leak into the expert lab's #shape-title.
  elements.kidsShapeName.textContent = shape ? shape.kid : (state.model?.name ?? '');
  if (shape) {
    elements.kidsCaption.innerHTML =
      `${shape.kid} — ${faceCount} ${shape.faceWord} fold up into one solid shape.`
      + `<span class="kids-caption-math">Grown-up name: ${shape.math}</span>`;
  } else {
    const name = state.model?.name ?? 'This shape';
    elements.kidsCaption.innerHTML = `${name} — ${faceCount ?? '?'} flat sides fold up into one solid shape.`;
  }
}

let kidCelebrateTimer = null;
function celebrateClosure() {
  const key = currentKidShapeKey();
  const shape = KID_SHAPES.find((candidate) => kidShapeKey(candidate) === key);
  const word = shape ? shape.kid : (state.model?.name ?? 'Shape');
  elements.kidsCelebrate.firstElementChild.textContent = `It's a ${word}!`;
  elements.kidsCelebrate.hidden = false;
  // Re-trigger the animation on repeat folds.
  elements.kidsCelebrate.firstElementChild.style.animation = 'none';
  void elements.kidsCelebrate.firstElementChild.offsetWidth;
  elements.kidsCelebrate.firstElementChild.style.animation = '';
  clearTimeout(kidCelebrateTimer);
  kidCelebrateTimer = setTimeout(() => { elements.kidsCelebrate.hidden = true; }, 1700);
}

function updateKidFoldLabel() {
  if (!state.kidsMode) return;
  const label = elements.kidsFold.querySelector('.kids-fold-label');
  label.textContent = state.progress >= 0.5 ? 'Unfold it flat' : 'Fold it up!';
}

// What the expert lab looked like before kids mode borrowed it, so exiting restores
// rather than silently leaving the owner's collision diagnostic switched off.
let kidsRestore = null;

function applyKidsMode(enabled) {
  const next = Boolean(enabled);
  if (next && !state.kidsMode) {
    kidsRestore = { collisionScreenEnabled: state.collisionScreenEnabled, mode: state.mode };
  } else if (!next && state.kidsMode && kidsRestore) {
    state.collisionScreenEnabled = kidsRestore.collisionScreenEnabled;
    elements.collisionScreen.checked = kidsRestore.collisionScreenEnabled;
    state.mode = kidsRestore.mode;
    kidsRestore = null;
  }
  state.kidsMode = next;
  document.body.classList.toggle('is-kids', state.kidsMode);
  elements.kidsToggle.setAttribute('aria-pressed', String(state.kidsMode));
  for (const node of [elements.kidsBar, elements.kidsCaption, elements.kidsConsole]) node.hidden = !state.kidsMode;
  if (!state.kidsMode) elements.kidsCelebrate.hidden = true;

  if (state.kidsMode) {
    // Force the collision screen off in STATE rather than trusting the stored value:
    // the flag is shared with the expert UI and persisted, and every catalog shape
    // otherwise paints most faces alarm-red for ~90% of the fold on zero-measure
    // edge grazes. Suppressing it here changes presentation only.
    state.collisionScreenEnabled = false;
    elements.collisionScreen.checked = false;
    state.mode = 'fold';
    // Always open flat. A restored progress of 1 would hand a child an already-closed
    // solid, so their first press would UNfold it and they would never see it come
    // together — the whole point of the screen.
    state.progress = 0;
    elements.foldSlider.value = '0';
    elements.foldOutput.value = '0% folded';
    renderKidShapes();
    updateKidCaption();
    updateKidFoldLabel();
  }
  state.renderer?.setAutoFrame?.(state.kidsMode);
  state.renderer?.setKidsPalette?.(state.kidsMode);
  // Always persist. Previously boot passed persistChoice:false, so arriving via
  // ?kids=1 wrote nothing and a reload dropped the child back into the expert lab.
  try { localStorage.setItem('magnamath.kidsMode', state.kidsMode ? '1' : '0'); } catch { /* storage optional */ }
  if (!state.kidsMode) {
    elements.shapeTitle.textContent = state.model?.name ?? elements.shapeTitle.textContent;
    setMode(state.mode);
  }
  if (state.analysis) updateFoldingPose();
}

function initialKidsMode() {
  const param = new URLSearchParams(location.search).get('kids');
  if (param === '1' || param === 'true') return true;
  if (param === '0' || param === 'false') return false;
  try { return localStorage.getItem('magnamath.kidsMode') === '1'; } catch { return false; }
}

async function createRenderer() {
  const forceFallback = new URLSearchParams(location.search).get('renderer') === 'canvas';
  if (!forceFallback) {
    try {
      const module = await import('./render/three-renderer.js');
      const renderer = module.createThreeRenderer(elements.viewport, { onFaceSelect: selectFace, onHingeSelect: selectHinge, onRootPoseChange: updateRootPose, autoFrame: state.kidsMode, kidsPalette: state.kidsMode });
      elements.rendererStatus.textContent = 'Three.js · WebGL';
      elements.rendererStatus.classList.add('is-ready');
      return renderer;
    } catch (error) {
      console.warn('Three.js renderer unavailable; using Canvas fallback.', error);
    }
  }
  const renderer = createCanvasRenderer(elements.viewport, { onFaceSelect: selectFace, onHingeSelect: selectHinge });
  elements.rendererStatus.textContent = forceFallback ? 'Canvas preview mode' : 'Canvas fallback';
  elements.rendererStatus.classList.add('is-fallback');
  return renderer;
}

function showLoader(show) {
  elements.loader.hidden = !show;
}

function createCurrentShape() {
  const entry = catalogEntry(state.shapeId);
  return entry.parameter ? createShape(state.shapeId, state.parameter) : createShape(state.shapeId);
}

function buildabilityOptions() {
  return {
    profileOverrides: state.profileOverrides,
    families: state.tileFamilies,
    modelUnitMm: selectedModelScale(),
    preferredScaleMmPerUnit: state.tileFamilies.length === 1 && state.tileFamilies[0] === 'micro' ? MICRO_TILE_EDGE_MM : STANDARD_TILE_EDGE_MM,
    enableCompoundFaces: state.compoundMode === 'exact',
  };
}

function computeBuildability(analysis) {
  return analyzeBuildability(analysis, state.inventory, buildabilityOptions());
}

function applyNet(nextNet, { render = true } = {}) {
  state.currentPrintPackage = null;
  state.net = nextNet;
  state.rootFace = nextNet.rootFace;
  state.steps = buildStepsFromNet(state.model, state.analysis, nextNet, state.buildability);
  state.buildStep = Math.min(state.buildStep, Math.max(0, state.steps.length - 1));
  state.foldingModel = createFoldingModel(state.model, state.analysis, nextNet);
  state.foldingSchedule = createFoldingSchedule(state.foldingModel, {
    mode: state.foldSequenceMode,
    hingeDuration: state.hingeDurationValue,
  });
  state.selectedHingeEdgeKey = state.foldingModel.hingeByEdgeKey.has(state.selectedHingeEdgeKey)
    ? state.selectedHingeEdgeKey
    : null;
  state.hingeOverrides = Object.fromEntries(Object.entries(state.hingeOverrides).filter(([edgeKey]) => state.foldingModel.hingeByEdgeKey.has(edgeKey)));
  state.renderer?.setModel(state.model, state.analysis, nextNet, state.foldingModel);
  updateFoldingPose({ renderPanel: false });
  if (render) renderAll();
  persist();
}

async function recomputeShape({ preserveSeed = true, resetWorkshop = false } = {}) {
  netOptimizer.cancel('Shape changed.');
  state.optimizerRunning = false;
  state.optimizerProgress = null;
  state.netCandidates = [];
  showLoader(true);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    if (!preserveSeed) state.netSeed = 1;
    if (resetWorkshop) {
      state.lockedFoldEdgeKeys.clear();
      state.lockedCutEdgeKeys.clear();
      state.history = [];
      state.future = [];
      state.selectedEdgeKey = null;
      state.rootFace = 0;
    }
    const model = createCurrentShape();
    const analysis = analyzePolyhedron(model);
    state.rootFace = Math.min(Math.max(0, state.rootFace), analysis.faces.length - 1);
    const net = planNet(model, analysis, {
      seed: state.netSeed,
      rootFace: state.rootFace,
      objective: state.netObjective,
      requiredFoldEdgeKeys: state.lockedFoldEdgeKeys,
      requiredCutEdgeKeys: state.lockedCutEdgeKeys,
    });
    const buildability = computeBuildability(analysis);
    const clearance = analyzeThicknessClearance(analysis, buildability, { assumption: state.clearanceAssumption });
    Object.assign(state, { model, analysis, buildability, clearance });
    state.selectedFace = Math.min(Math.max(0, state.selectedFace), analysis.faces.length - 1);
    applyNet(net, { render: false });
    renderAll();
  } catch (error) {
    console.error(error);
    toast(error instanceof Error ? error.message : String(error), 'error');
  } finally {
    showLoader(false);
  }
}

function netSnapshot() {
  return {
    foldEdgeKeys: [...state.net.treeEdgeKeys],
    rootFace: state.rootFace,
    lockedFoldEdgeKeys: [...state.lockedFoldEdgeKeys],
    lockedCutEdgeKeys: [...state.lockedCutEdgeKeys],
    objective: state.netObjective,
    selectedEdgeKey: state.selectedEdgeKey,
  };
}

function pushHistory(snapshot = netSnapshot()) {
  state.history.push(snapshot);
  if (state.history.length > 60) state.history.shift();
  state.future = [];
}

function restoreSnapshot(snapshot) {
  invalidateDerivedWorkspaceState();
  state.lockedFoldEdgeKeys = new Set(snapshot.lockedFoldEdgeKeys);
  state.lockedCutEdgeKeys = new Set(snapshot.lockedCutEdgeKeys);
  state.netObjective = snapshot.objective in NET_OBJECTIVES ? snapshot.objective : 'compact';
  state.selectedEdgeKey = snapshot.selectedEdgeKey;
  const net = netFromEdgeKeys(state.model, state.analysis, snapshot.foldEdgeKeys, {
    rootFace: snapshot.rootFace,
    objective: state.netObjective,
    seed: state.netSeed,
    source: 'history',
  });
  applyNet(net);
}

function undoWorkshop() {
  if (!state.history.length) return;
  const previous = state.history.pop();
  state.future.push(netSnapshot());
  restoreSnapshot(previous);
  state.workshopMessage = 'Restored the previous cut/fold tree.';
  renderWorkshopPanel();
}

function redoWorkshop() {
  if (!state.future.length) return;
  const next = state.future.pop();
  state.history.push(netSnapshot());
  restoreSnapshot(next);
  state.workshopMessage = 'Reapplied the next workshop state.';
  renderWorkshopPanel();
}

async function searchNet({ push = true } = {}) {
  if (!state.model || !state.analysis) return;
  invalidateDerivedWorkspaceState();
  showLoader(true);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    const before = netSnapshot();
    const next = planNet(state.model, state.analysis, {
      seed: state.netSeed,
      rootFace: state.rootFace,
      objective: state.netObjective,
      requiredFoldEdgeKeys: state.lockedFoldEdgeKeys,
      requiredCutEdgeKeys: state.lockedCutEdgeKeys,
    });
    if (push) pushHistory(before);
    state.workshopMessage = `Searched ${next.attempts} constrained trees with the ${NET_OBJECTIVES[state.netObjective].label.toLowerCase()} objective.`;
    applyNet(next);
  } catch (error) {
    console.error(error);
    toast(error instanceof Error ? error.message : String(error), 'error');
  } finally {
    showLoader(false);
  }
}

function optimizerPercent(progress) {
  if (!progress) return 0;
  const total = Math.max(1, Number(progress.total) || 1);
  return Math.min(100, Math.max(0, Math.round(((Number(progress.completed) || 0) / total) * 100)));
}

function renderOptimizerStatus() {
  elements.optimizerStatus.hidden = !state.optimizerRunning;
  if (!state.optimizerRunning) return;
  const progress = state.optimizerProgress ?? {};
  const percent = optimizerPercent(progress);
  elements.optimizerPhase.textContent = progress.phase === 'local'
    ? `Improving candidate ${progress.localStart ?? 1}/${progress.localStarts ?? 1}…`
    : 'Sampling constrained fold trees…';
  elements.optimizerProgressLabel.textContent = `${percent}%`;
  elements.optimizerProgress.style.width = `${percent}%`;
  elements.workshopOptimize.disabled = true;
}

function applyCandidate(index) {
  const candidate = state.netCandidates[index];
  if (!candidate) return;
  pushHistory();
  state.workshopMessage = `Applied portfolio candidate ${index + 1}: ${candidate.valid ? 'overlap-free' : `${candidate.overlapPairs.length} overlap(s)`}, area ${roundTo(candidate.boundingArea, 3)}, cut perimeter ${roundTo(candidate.boundaryPerimeter, 3)}.`;
  applyNet(candidate);
}

function renderCandidateGallery() {
  const candidates = state.netCandidates ?? [];
  elements.candidateSection.hidden = candidates.length === 0;
  if (!candidates.length) {
    elements.candidateGallery.replaceChildren();
    return;
  }
  elements.candidateSummary.textContent = `${candidates.length} diverse non-dominated option${candidates.length === 1 ? '' : 's'}`;
  elements.candidateGallery.replaceChildren(...candidates.map((candidate, index) => {
    const article = document.createElement('article');
    article.className = `net-candidate-card${candidate.valid ? '' : ' is-invalid'}`;
    const preview = netToSvg(state.model, state.analysis, candidate, { labelFaces: false, compoundByFace: state.buildability?.compoundByFace });
    article.innerHTML = `<div class="candidate-preview">${stripXmlDeclaration(preview)}</div>
      <div class="candidate-meta"><strong>Option ${index + 1}</strong><span>${candidate.valid ? 'Overlap-free' : `${candidate.overlapPairs.length} overlap(s)`}</span></div>
      <dl><div><dt>Area</dt><dd>${roundTo(candidate.boundingArea, 2)}</dd></div><div><dt>Cut</dt><dd>${roundTo(candidate.boundaryPerimeter, 2)}</dd></div><div><dt>Depth</dt><dd>${candidate.treeMetrics.maxDepth}</dd></div><div><dt>Leaves</dt><dd>${candidate.treeMetrics.leaves}</dd></div></dl>
      <button type="button" class="${index === 0 ? 'primary-button' : 'secondary-button'}" data-apply-candidate="${index}">Apply option</button>`;
    return article;
  }));
  elements.candidateGallery.querySelectorAll('[data-apply-candidate]').forEach((button) => {
    button.addEventListener('click', () => applyCandidate(Number(button.dataset.applyCandidate)));
  });
}

async function optimizeNetPortfolio() {
  if (!state.model || !state.analysis || state.optimizerRunning) return;
  state.optimizerRunning = true;
  state.optimizerProgress = { phase: 'random', completed: 0, total: 1 };
  state.netCandidates = [];
  renderOptimizerStatus();
  renderCandidateGallery();
  try {
    const faceCount = state.analysis.faces.length;
    const result = await netOptimizer.search(state.model, {
      seed: state.netSeed,
      rootFace: state.rootFace,
      objective: state.netObjective,
      requiredFoldEdgeKeys: [...state.lockedFoldEdgeKeys],
      requiredCutEdgeKeys: [...state.lockedCutEdgeKeys],
      attempts: Math.min(640, Math.max(144, faceCount * 18)),
      localStarts: 4,
      localIterations: 5,
      maximumCandidates: 8,
    }, {
      onProgress: (progress) => {
        state.optimizerProgress = progress;
        renderOptimizerStatus();
      },
    });
    state.netCandidates = result.candidates;
    state.workshopMessage = `Evaluated ${result.stats.uniqueTrees} unique constrained trees; ${result.stats.validTrees} were overlap-free and ${result.paretoCount} were non-dominated.`;
    renderCandidateGallery();
    toast(`Found ${result.candidates.length} diverse net options.`, 'success');
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error(error);
      toast(error instanceof Error ? error.message : String(error), 'error');
    } else {
      state.workshopMessage = 'Net portfolio search cancelled; the current workshop state was preserved.';
    }
  } finally {
    state.optimizerRunning = false;
    state.optimizerProgress = null;
    elements.workshopOptimize.disabled = false;
    renderOptimizerStatus();
    renderWorkshopPanel();
  }
}

function updateBuildability() {
  if (!state.analysis || !state.net || !state.model) return;
  state.currentPrintPackage = null;
  state.buildability = computeBuildability(state.analysis);
  state.clearance = analyzeThicknessClearance(state.analysis, state.buildability, { assumption: state.clearanceAssumption });
  state.steps = buildStepsFromNet(state.model, state.analysis, state.net, state.buildability);
  state.buildStep = Math.min(state.buildStep, Math.max(0, state.steps.length - 1));
  renderBuildPanel();
  renderStatusBadges();
  renderFaceDetails();
  persist();
}

function foldingPoseOptions() {
  return {
    schedule: state.foldingSchedule,
    sequenceMode: state.foldSequenceMode,
    hingeDuration: state.hingeDurationValue,
    hingeOverrides: state.hingeOverrides,
    rootPose: state.rootPose,
  };
}

function updateFoldingPose({ renderPanel = true } = {}) {
  if (!state.foldingModel || !state.analysis || !state.model) return;
  state.foldingPose = sampleFoldingPose(state.foldingModel, state.progress, foldingPoseOptions());
  state.foldingDiagnostics = analyzeFoldingPose(
    state.model,
    state.analysis,
    state.foldingModel,
    state.foldingPose,
    { collision: state.collisionScreenEnabled },
  );
  state.renderer?.setFoldingState({
    progress: state.progress,
    schedule: state.foldingSchedule,
    sequenceMode: state.foldSequenceMode,
    hingeDuration: state.hingeDurationValue,
    hingeOverrides: state.hingeOverrides,
    rootPose: state.rootPose,
  });
  state.renderer?.setSelectedHinge(state.selectedHingeEdgeKey);
  state.renderer?.setShowHinges(state.showHinges);
  state.renderer?.setInteractionMode(state.interactionMode);
  state.renderer?.setTransformMode?.(state.transformModeValue);
  state.renderer?.setDiagnostics(state.foldingDiagnostics);
  if (renderPanel) renderFoldPanel();
}

function setInteractionMode(mode) {
  state.interactionMode = ['inspect', 'hinge', 'move'].includes(mode) ? mode : 'inspect';
  const controls = [
    [elements.toolInspect, 'inspect'],
    [elements.toolHinge, 'hinge'],
    [elements.toolMove, 'move'],
  ];
  controls.forEach(([button, id]) => {
    const active = state.interactionMode === id;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const moving = state.interactionMode === 'move';
  elements.transformMode.disabled = !moving;
  elements.resetRoot.disabled = !moving;
  state.renderer?.setInteractionMode(state.interactionMode);
  persist();
}

function updateRootPose(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 16 || matrix.some((value) => !Number.isFinite(value))) return;
  state.rootPose = matrix.slice();
  updateFoldingPose();
  persist();
}

function resetRootPose() {
  state.rootPose = [...IDENTITY_4];
  state.renderer?.resetRootPose?.();
  updateFoldingPose();
  persist();
}

function selectHinge(edgeKey) {
  if (!state.foldingModel?.hingeByEdgeKey.has(edgeKey)) return;
  state.selectedHingeEdgeKey = edgeKey;
  state.renderer?.setSelectedHinge(edgeKey);
  if (state.mode !== 'fold') setMode('fold');
  renderFoldPanel();
  persist();
}

function setHingeOverrideFraction(fraction) {
  const hinge = state.foldingModel?.hingeByEdgeKey.get(state.selectedHingeEdgeKey);
  if (!hinge) return;
  state.hingeOverrides = {
    ...state.hingeOverrides,
    [hinge.edgeKey]: { angleRadians: hinge.targetAngleRadians * Math.min(1, Math.max(0, Number(fraction))) },
  };
  updateFoldingPose();
  persist();
}

function clearSelectedHingeOverride() {
  if (!state.selectedHingeEdgeKey) return;
  const next = { ...state.hingeOverrides };
  delete next[state.selectedHingeEdgeKey];
  state.hingeOverrides = next;
  updateFoldingPose();
  persist();
}

function timelineStops() {
  if (!state.foldingSchedule) return [0, 1];
  return [...new Set([0, 1, ...Object.values(state.foldingSchedule.entries).flatMap((entry) => [entry.start, entry.end])])]
    .sort((left, right) => left - right);
}

function stepFold(direction) {
  const stops = timelineStops();
  const epsilon = 1e-5;
  const target = direction > 0
    ? stops.find((stop) => stop > state.progress + epsilon) ?? 1
    : [...stops].reverse().find((stop) => stop < state.progress - epsilon) ?? 0;
  setProgress(target);
}

function setMode(mode) {
  state.mode = ['explore', 'fold', 'workshop', 'build', 'learn'].includes(mode) ? mode : 'explore';
  document.querySelectorAll('.mode-button').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === state.mode));
  document.querySelectorAll('.mode-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === state.mode));
  if (state.mode === 'explore' && state.progress < 0.75) setProgress(1);
  if (state.mode === 'build' && state.progress < 0.45) setProgress(0.7);
  if (state.mode === 'workshop' && state.progress > 0.18) setProgress(0);
  updateActiveFace();
  persist();
}

function setProgress(value) {
  const previous = state.progress;
  state.progress = Math.min(1, Math.max(0, Number(value)));
  elements.foldSlider.value = String(Math.round(state.progress * 100));
  elements.foldOutput.value = `${Math.round(state.progress * 100)}% folded`;
  updateFoldingPose();
  if (state.kidsMode) {
    updateKidFoldLabel();
    // Fire once, on the transition into full closure — the payoff moment.
    if (state.progress >= 1 && previous < 1) celebrateClosure();
  }
  persist();
}

function animateFold() {
  // Tap while running = true pause: stop where you are and keep the progress. The
  // previous behaviour bumped the animation id (which just cancelled the tick) and
  // then re-entered here with `target = start < 0.5 ? 1 : 0`, so a tap at 60% ran
  // the fold in REVERSE back to flat — the "pause" icon threw the child's work
  // away. Explicit playback state fixes that; direction remembers which way the
  // child was going so a resume continues instead of flipping at the 0.5 midpoint.
  if (state.foldPlaybackRunning) {
    state.animationId += 1;
    state.foldPlaybackRunning = false;
    elements.foldPlay.classList.remove('is-playing');
    return;
  }
  state.animationId += 1;
  const animationId = state.animationId;
  const start = state.progress;
  // Direction: if we're at an endpoint, go the only way we can. Otherwise resume
  // the direction the child last picked (default: fold forward).
  let direction = state.foldDirection ?? 1;
  if (start <= 0.001) direction = 1;
  else if (start >= 0.999) direction = -1;
  state.foldDirection = direction;
  const target = direction > 0 ? 1 : 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reduced motion must not delete the core mechanic. For a child the fold IS the
  // lesson, so tween it linearly and slowly instead of jump-cutting to the answer.
  if (reduceMotion && !state.kidsMode) {
    setProgress(target);
    return;
  }
  const remaining = Math.max(Math.abs(target - start), 0.05);
  const duration = (reduceMotion ? 2600 : 1850 / state.foldSpeedValue) * remaining;
  const startedAt = performance.now();
  state.foldPlaybackRunning = true;
  elements.foldPlay.classList.add('is-playing');
  const tick = (now) => {
    if (animationId !== state.animationId) return;
    const raw = Math.min(1, (now - startedAt) / duration);
    const eased = reduceMotion ? raw : (raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2);
    setProgress(start + (target - start) * eased);
    if (raw < 1) requestAnimationFrame(tick);
    else {
      state.foldPlaybackRunning = false;
      elements.foldPlay.classList.remove('is-playing');
      // We just finished going this way; a subsequent tap should go the other way.
      state.foldDirection = -direction;
    }
  };
  requestAnimationFrame(tick);
}

function selectFace(faceIndex) {
  if (!state.analysis || faceIndex < 0 || faceIndex >= state.analysis.faces.length) return;
  state.selectedFace = faceIndex;
  state.renderer?.setSelectedFace(faceIndex);
  renderFaceDetails();
  updateNetSelection();
  renderWorkshopPanel();
  persist();
}

function selectEdge(edgeKey) {
  if (!state.analysis?.topology.edgeMap.has(edgeKey)) return;
  state.selectedEdgeKey = edgeKey;
  state.workshopMessage = '';
  updateNetSelection();
  renderWorkshopPanel();
  persist();
}

function updateActiveFace() {
  const activeFace = state.mode === 'build' ? state.steps[state.buildStep]?.faceIndex ?? -1 : -1;
  state.renderer?.setActiveFace(activeFace);
  updateNetSelection();
}

function editSelectedEdge(desiredState) {
  if (!state.selectedEdgeKey || !state.net) return;
  try {
    invalidateDerivedWorkspaceState();
    const before = netSnapshot();
    const result = editNetEdge(state.model, state.analysis, state.net, state.selectedEdgeKey, desiredState, {
      lockedFoldEdgeKeys: state.lockedFoldEdgeKeys,
      lockedCutEdgeKeys: state.lockedCutEdgeKeys,
      rootFace: state.rootFace,
      objective: state.netObjective,
    });
    if (!result.edit.changed) return;
    pushHistory(before);
    state.workshopMessage = desiredState === 'fold'
      ? `Folded ${result.edit.addedEdgeKey}; automatically cut ${result.edit.removedEdgeKey} to break the induced cycle.`
      : `Cut ${result.edit.removedEdgeKey}; automatically folded ${result.edit.addedEdgeKey} to reconnect the two components.`;
    applyNet(result.net);
  } catch (error) {
    toast(error instanceof Error ? error.message : String(error), 'error');
  }
}

function edgeIsFold(edgeKey) {
  return state.net?.treeEdgeKeys.has(edgeKey) ?? false;
}

function toggleSelectedEdgeLock() {
  const key = state.selectedEdgeKey;
  if (!key) return;
  invalidateDerivedWorkspaceState();
  const before = netSnapshot();
  const folds = edgeIsFold(key);
  const target = folds ? state.lockedFoldEdgeKeys : state.lockedCutEdgeKeys;
  const other = folds ? state.lockedCutEdgeKeys : state.lockedFoldEdgeKeys;
  other.delete(key);
  if (target.has(key)) {
    target.delete(key);
    state.workshopMessage = `Unlocked ${folds ? 'fold' : 'cut'} edge ${key}.`;
  } else {
    target.add(key);
    state.workshopMessage = `Locked ${key} as a ${folds ? 'fold' : 'cut'} constraint.`;
  }
  pushHistory(before);
  renderNet();
  renderWorkshopPanel();
  persist();
}

function setSelectedFaceAsRoot() {
  if (!state.net || state.selectedFace === state.rootFace) return;
  try {
    invalidateDerivedWorkspaceState();
    const before = netSnapshot();
    const next = rerootNet(state.model, state.analysis, state.net, state.selectedFace, { objective: state.netObjective });
    pushHistory(before);
    state.workshopMessage = `Face ${state.selectedFace + 1} is now the anchor and first build step.`;
    applyNet(next);
  } catch (error) {
    toast(error instanceof Error ? error.message : String(error), 'error');
  }
}

function renderHeaderAndStats() {
  if (!state.model || !state.analysis) return;
  const entry = catalogEntry(state.shapeId);
  // Always the catalog name. The kid word lives only in kids-owned nodes, so exiting
  // the mode cannot leave "Box" sitting in the expert lab's title.
  elements.shapeTitle.textContent = state.model.name;
  elements.shapeFamily.textContent = state.model.family;
  if (state.kidsMode) updateKidCaption();
  elements.description.textContent = entry.description;
  elements.vertices.textContent = state.analysis.counts.vertices;
  elements.edges.textContent = state.analysis.counts.edges;
  elements.faces.textContent = state.analysis.counts.faces;
  elements.euler.textContent = roundTo(state.analysis.eulerCharacteristic, 4);
  elements.area.textContent = `${roundTo(state.analysis.surfaceArea, 4)} u²`;
  elements.volume.textContent = `${roundTo(state.analysis.volume, 4)} u³`;
  elements.genus.textContent = state.analysis.genus == null ? 'Undefined' : roundTo(state.analysis.genus, 4);
  elements.edgeSpread.textContent = `${(state.analysis.edgeStats.relativeSpread * 100).toExponential(2)}%`;
  const valid = state.analysis.validation.valid;
  elements.validationBadge.textContent = valid ? 'Validated' : 'Review';
  elements.validationBadge.classList.toggle('is-error', !valid);
  elements.lessonV.textContent = state.analysis.counts.vertices;
  elements.lessonE.textContent = state.analysis.counts.edges;
  elements.lessonF.textContent = state.analysis.counts.faces;
  elements.lessonChi.textContent = roundTo(state.analysis.eulerCharacteristic, 4);
  elements.lessonEulerCopy.textContent = state.analysis.topology.closed && state.analysis.topology.connected && state.analysis.genus === 0
    ? 'For this closed, connected, sphere-like polyhedron, V − E + F equals 2.'
    : 'Euler characteristic depends on topology and on the assumptions shown by the validator.';
}

function renderFaceKinds() {
  if (!state.analysis) return;
  const counts = new Map();
  for (const face of state.analysis.faces) counts.set(face.label, (counts.get(face.label) ?? 0) + 1);
  elements.faceKinds.replaceChildren(...[...counts].map(([label, count], index) => {
    const row = document.createElement('div');
    row.className = 'face-kind-row';
    row.innerHTML = `<i style="filter:hue-rotate(${index * 47}deg)"></i><span>${escapeHtml(label)}</span><strong>${count}</strong>`;
    return row;
  }));
}

function renderStatusBadges() {
  if (!state.net || !state.buildability) return;
  elements.netValidity.classList.remove('is-warning', 'is-error');
  if (state.net.valid) {
    elements.netValidity.textContent = 'Overlap-free net';
  } else {
    elements.netValidity.textContent = `${state.net.overlapPairs.length} overlap${state.net.overlapPairs.length === 1 ? '' : 's'}`;
    elements.netValidity.classList.add('is-error');
  }

  elements.buildStatus.classList.remove('is-warning', 'is-error');
  const verifiedHinges = state.buildability.hinges?.counts?.verified ?? 0;
  const totalHinges = state.buildability.hinges?.entries?.length ?? 0;
  if (state.buildability.ready) {
    const compoundCount = state.buildability.compoundFaces?.length ?? 0;
    elements.buildStatus.textContent = compoundCount
      ? `Tile-ready · ${compoundCount} panel${compoundCount === 1 ? '' : 's'} unverified`
      : (verifiedHinges === totalHinges && totalHinges > 0 ? 'Build + hinge verified' : 'Tile-ready · hinges unverified');
  } else if (state.buildability.geometricallyBuildable) {
    const missing = state.buildability.shortages.reduce((sum, item) => sum + item.missing, 0);
    elements.buildStatus.textContent = `Need ${missing} tile${missing === 1 ? '' : 's'}`;
    elements.buildStatus.classList.add('is-warning');
  } else {
    const supportedPercent = Math.round(state.buildability.supportRatio * 100);
    elements.buildStatus.textContent = `${supportedPercent}% physical representation`;
    elements.buildStatus.classList.add('is-error');
  }
}

function renderNet() {
  if (!state.model || !state.analysis || !state.net) return;
  const svg = netToSvg(state.model, state.analysis, state.net, {
    labelFaces: true,
    interactive: true,
    lockedFoldEdgeKeys: state.lockedFoldEdgeKeys,
    lockedCutEdgeKeys: state.lockedCutEdgeKeys,
    compoundByFace: state.buildability?.compoundByFace,
  });
  elements.netPreview.innerHTML = stripXmlDeclaration(svg);
  elements.netPreview.querySelectorAll('[data-face].net-face').forEach((polygon) => {
    polygon.addEventListener('click', () => selectFace(Number(polygon.dataset.face)));
  });
  elements.netPreview.querySelectorAll('.edge-hit').forEach((line) => {
    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectEdge(line.dataset.edgeKey);
    };
    line.addEventListener('click', activate);
    line.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') activate(event);
    });
  });
  const objectiveLabel = NET_OBJECTIVES[state.net.objective]?.label ?? state.net.objective;
  elements.netScore.textContent = state.net.valid
    ? `${objectiveLabel} · seed ${state.netSeed}`
    : `${state.net.overlapPairs.length} overlaps · seed ${state.netSeed}`;
  updateNetSelection();
}

function updateNetSelection() {
  const activeFace = state.mode === 'build' ? state.steps[state.buildStep]?.faceIndex ?? -1 : -1;
  elements.netPreview.querySelectorAll('[data-face].net-face').forEach((polygon) => {
    const faceIndex = Number(polygon.dataset.face);
    polygon.classList.toggle('is-selected', faceIndex === state.selectedFace);
    polygon.classList.toggle('is-active', faceIndex === activeFace);
  });
  elements.netPreview.querySelectorAll('[data-edge-key]').forEach((edge) => {
    edge.classList.toggle('is-selected-edge', edge.dataset.edgeKey === state.selectedEdgeKey);
  });
}

function renderFaceDetails() {
  if (!state.analysis || !state.buildability || state.selectedFace < 0) {
    elements.faceEmpty.hidden = false;
    elements.faceDetails.hidden = true;
    return;
  }
  const face = state.analysis.faces[state.selectedFace];
  const faceMatch = state.buildability.faceMatches[state.selectedFace];
  elements.faceEmpty.hidden = true;
  elements.faceDetails.hidden = false;
  elements.faceNumber.textContent = `Face ${state.selectedFace + 1}`;
  elements.faceName.textContent = face.label;
  elements.faceSides.textContent = String(face.sideCount);
  elements.faceArea.textContent = `${roundTo(face.area, 4)} u²`;
  elements.faceTile.textContent = faceMatch.match?.tile.label
    ?? faceMatch.compound?.label
    ?? 'No physical representation';
  elements.faceRegular.textContent = face.regular ? 'Yes' : 'No';
  elements.faceMatchNote.textContent = faceMatch.match
    ? describeMatch(faceMatch.match)
    : faceMatch.compound
      ? compoundAssignmentSummary(faceMatch.compound)
      : 'The face remains mathematically valid, but needs a custom tile, a future compound recipe, or a virtual-only simulation at the selected scale.';
  state.renderer?.setSelectedFace(state.selectedFace);
}

function renderWorkshopPanel() {
  if (!state.net || !state.analysis) return;
  elements.objective.value = state.netObjective;
  elements.workshopUndo.disabled = state.history.length === 0 || state.optimizerRunning;
  elements.workshopRedo.disabled = state.future.length === 0 || state.optimizerRunning;
  elements.workshopOptimize.disabled = state.optimizerRunning;
  elements.diagnosticOverlaps.textContent = String(state.net.overlapPairs.length);
  elements.diagnosticOverlapArea.textContent = roundTo(state.net.overlapArea, 4);
  elements.diagnosticDepth.textContent = String(state.net.treeMetrics.maxDepth);
  elements.diagnosticLocks.textContent = String(state.lockedFoldEdgeKeys.size + state.lockedCutEdgeKeys.size);
  elements.workshopMessage.textContent = state.workshopMessage || NET_OBJECTIVES[state.netObjective].description;
  elements.setRootFace.textContent = state.selectedFace === state.rootFace
    ? `Face ${state.selectedFace + 1} is the build anchor`
    : `Use face ${state.selectedFace + 1} as build anchor`;
  elements.setRootFace.disabled = state.selectedFace === state.rootFace;

  const key = state.selectedEdgeKey;
  const edge = key ? state.analysis.topology.edgeMap.get(key) : null;
  if (!edge || edge.incidences.length !== 2) {
    elements.edgeEmpty.hidden = false;
    elements.edgeDetails.hidden = true;
    renderOptimizerStatus();
    renderCandidateGallery();
    return;
  }
  const fold = edgeIsFold(key);
  const locked = fold ? state.lockedFoldEdgeKeys.has(key) : state.lockedCutEdgeKeys.has(key);
  const angle = state.analysis.dihedralAngles.find((item) => item.edgeKey === key)?.degrees;
  elements.edgeEmpty.hidden = true;
  elements.edgeDetails.hidden = false;
  elements.edgeState.textContent = fold ? 'Fold edge' : 'Cut edge';
  elements.edgeState.classList.toggle('is-cut', !fold);
  elements.edgeKey.textContent = key;
  elements.edgeFaces.textContent = edge.incidences.map((item) => item.faceIndex + 1).join(' ↔ ');
  elements.edgeAngle.textContent = angle == null ? '—' : `${roundTo(angle, 2)}°`;
  elements.edgeConstraint.textContent = locked ? `Locked ${fold ? 'fold' : 'cut'}` : 'Unlocked';
  elements.edgeLock.classList.toggle('is-active', locked);
  elements.edgeLock.title = locked ? 'Unlock edge choice' : 'Lock edge choice';
  elements.edgeMakeCut.disabled = !fold || (fold && state.lockedFoldEdgeKeys.has(key));
  elements.edgeMakeFold.disabled = fold || (!fold && state.lockedCutEdgeKeys.has(key));
  renderOptimizerStatus();
  renderCandidateGallery();
}

function renderInventoryGrid() {
  if (!state.buildability) return;
  const visibleTiles = state.buildability.activeProfiles;
  elements.inventoryGrid.replaceChildren(...visibleTiles.map((tile) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'inventory-item';
    const label = document.createElement('label');
    const inputId = `inventory-${tile.id}`;
    label.htmlFor = inputId;
    label.innerHTML = `<span>${escapeHtml(tile.label)}</span><small>${escapeHtml(tile.confidence)}</small>`;
    const input = document.createElement('input');
    input.id = inputId;
    input.type = 'number';
    input.min = '0';
    input.max = '999';
    input.step = '1';
    input.value = String(state.inventory[tile.id] ?? 0);
    input.addEventListener('change', () => {
      state.inventoryPreset = 'custom';
      elements.inventoryPreset.value = 'custom';
      state.inventory[tile.id] = Math.max(0, Math.round(Number(input.value) || 0));
      updateBuildability();
    });
    wrapper.append(label, input);
    return wrapper;
  }));
}

function renderBuildPanel() {
  if (!state.buildability) return;
  elements.inventoryPreset.value = state.inventoryPreset;
  elements.tileFamily.value = tileFamilyControlValue();
  elements.scaleMode.value = state.scaleMode;
  elements.customScaleField.hidden = state.scaleMode !== 'custom';
  elements.customScale.value = String(state.customScale);
  elements.compoundMode.value = state.compoundMode;
  elements.clearanceAssumption.value = state.clearanceAssumption;
  elements.physicalScale.textContent = state.buildability.modelUnitMm == null ? 'No fit' : `${roundTo(state.buildability.modelUnitMm, 3)} mm/u`;
  elements.physicalConfidence.textContent = `${Math.round(state.buildability.confidence * 100)}% · ${state.buildability.confidenceLabel}`;
  const verified = state.buildability.hinges?.counts?.verified ?? 0;
  const total = state.buildability.hinges?.entries?.length ?? 0;
  elements.physicalHinges.textContent = `${verified}/${total}`;
  const compoundCount = state.buildability.compoundFaces?.length ?? 0;
  elements.physicalCompound.textContent = compoundCount ? `${compoundCount} exact / unverified` : '0';
  const modeled = state.clearance?.entries?.filter((entry) => entry.status.endsWith('under-model')).length ?? 0;
  const clearanceTotal = state.clearance?.entries?.length ?? 0;
  const collisions = state.clearance?.collisionCount ?? 0;
  elements.physicalClearance.textContent = modeled
    ? `${modeled}/${clearanceTotal}${collisions ? ` · ${collisions} collision${collisions === 1 ? '' : 's'}` : ' clear'}`
    : `0/${clearanceTotal} · insufficient data`;
  renderInventoryGrid();

  const rows = formatBillOfMaterials(state.buildability).map((item) => {
    const row = document.createElement('div');
    row.className = `bom-row${item.available < item.count ? ' is-short' : ''}`;
    row.innerHTML = `<span>${escapeHtml(item.label)}<small>${escapeHtml(item.confidence)}</small></span><strong>${item.count} required · ${item.available} owned</strong>`;
    return row;
  });
  const note = document.createElement('p');
  note.className = `bom-note${state.buildability.ready ? ' is-ready' : ''}`;
  note.textContent = state.buildability.summary;
  if (state.buildability.unsupported.length) {
    const unsupportedKinds = [...new Set(state.buildability.unsupported.map((item) => item.faceLabel))].join(', ');
    note.textContent += ` Unsupported face types: ${unsupportedKinds}.`;
  }
  if (total && verified < total) note.textContent += ` ${total - verified} hinge relationships remain unverified by a measured stable-angle range.`;
  if (state.clearance?.collisionCount) note.textContent += ` ${state.clearance.collisionCount} local thickness collision${state.clearance.collisionCount === 1 ? '' : 's'} detected under the selected bounded model.`;
  else if (state.clearance && state.clearance.modeledRatio < 1) note.textContent += ' Thickness clearance is reported only where profile evidence or the selected explicit scenario supports it.';
  const preset = INVENTORY_PRESETS[state.inventoryPreset];
  if (preset?.excludedNote) note.textContent += ` Inventory note: ${preset.excludedNote}`;
  elements.bom.replaceChildren(...rows, note);
  renderBuildStep();
}

function formatDiagnostic(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1e-6) return value === 0 ? '0' : value.toExponential(1);
  return roundTo(value, digits);
}

function renderFoldPanel() {
  if (!state.foldingModel || !state.foldingPose || !state.foldingSchedule) return;
  elements.foldSequence.value = state.foldSequenceMode;
  elements.foldSpeed.value = String(state.foldSpeedValue);
  elements.hingeDuration.value = String(Math.round(state.hingeDurationValue * 100));
  elements.hingeDurationOutput.value = `${Math.round(state.hingeDurationValue * 100)}%`;
  elements.showHinges.checked = state.showHinges;
  elements.collisionScreen.checked = state.collisionScreenEnabled;
  elements.transformMode.value = state.transformModeValue;
  setInteractionMode(state.interactionMode);

  const diagnostics = state.foldingDiagnostics;
  elements.foldDiagnosticHinge.textContent = formatDiagnostic(diagnostics?.hingeContinuity.maximumGap, 5);
  elements.foldDiagnosticClosure.textContent = formatDiagnostic(diagnostics?.closure.maximumGap, 4);
  elements.foldDiagnosticCollisions.textContent = diagnostics?.collision ? String(diagnostics.collision.collisionCount) : 'Off';
  elements.foldDiagnosticTarget.textContent = formatDiagnostic(diagnostics?.target.maximumMatrixError, 4);

  const hinge = state.foldingModel.hingeByEdgeKey.get(state.selectedHingeEdgeKey);
  const hingeState = state.foldingPose.hingeStateByEdgeKey.get(state.selectedHingeEdgeKey);
  elements.hingeEmpty.hidden = Boolean(hinge && hingeState);
  elements.hingeDetails.hidden = !hinge || !hingeState;
  if (hinge && hingeState) {
    const timeline = state.foldingSchedule.entries[hinge.edgeKey];
    const normalized = Math.abs(hinge.targetAngleRadians) <= 1e-12 ? 1 : hingeState.angleRadians / hinge.targetAngleRadians;
    elements.hingeKey.textContent = hinge.edgeKey;
    elements.hingeDirection.textContent = hinge.direction === 'positive' ? 'Positive fold' : 'Negative fold';
    elements.hingeFaces.textContent = `${hinge.parentFace + 1} → ${hinge.childFace + 1}`;
    elements.hingeTargetAngle.textContent = `${roundTo(hinge.targetAngleRadians * 180 / Math.PI, 2)}°`;
    elements.hingeCurrentAngle.textContent = `${roundTo(hingeState.angleRadians * 180 / Math.PI, 2)}°`;
    elements.hingeWindow.textContent = `${Math.round(timeline.start * 100)}–${Math.round(timeline.end * 100)}%`;
    elements.hingeAngle.value = String(Math.round(Math.min(1, Math.max(0, normalized)) * 100));
    elements.hingeAngleOutput.value = `${Math.round(Math.min(1, Math.max(0, normalized)) * 100)}%`;
    elements.hingeFollowTimeline.disabled = !Object.prototype.hasOwnProperty.call(state.hingeOverrides, hinge.edgeKey);
  }

  const entries = state.foldingModel.hinges;
  const activeCount = state.foldingPose.hingeStates.filter((entry) => entry.timelineProgress > 0 && entry.timelineProgress < 1).length;
  elements.foldTimelineSummary.textContent = `${entries.length} hinge${entries.length === 1 ? '' : 's'} · ${activeCount} moving`;
  const cursor = Math.round(state.progress * 10000) / 100;
  elements.foldTimeline.replaceChildren(...entries.map((entry) => {
    const timeline = state.foldingSchedule.entries[entry.edgeKey];
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `fold-timeline-row${entry.edgeKey === state.selectedHingeEdgeKey ? ' is-selected' : ''}`;
    row.dataset.hingeEdgeKey = entry.edgeKey;
    row.innerHTML = `<strong>${escapeHtml(entry.edgeKey)}</strong><span class="fold-timeline-track"><i class="fold-timeline-window" style="left:${timeline.start * 100}%;width:${Math.max(.5, (timeline.end - timeline.start) * 100)}%"></i><b class="fold-timeline-cursor" style="left:${cursor}%"></b></span><small>${entry.childFace + 1}</small>`;
    row.addEventListener('click', () => selectHinge(entry.edgeKey));
    return row;
  }));
}

function renderBuildStep() {
  const step = state.steps[state.buildStep];
  if (!step) return;
  elements.stepCount.textContent = `Step ${state.buildStep + 1} of ${state.steps.length}`;
  elements.stepProgress.style.width = `${((state.buildStep + 1) / state.steps.length) * 100}%`;
  elements.stepKicker.textContent = state.buildStep === 0 ? 'Anchor face' : `Hinge ${state.buildStep} · ${step.hingeStatus ?? 'unverified'}`;
  elements.stepTitle.textContent = step.title;
  elements.stepInstruction.textContent = step.instruction;
  elements.stepPrevious.disabled = state.buildStep === 0;
  elements.stepNext.disabled = state.buildStep === state.steps.length - 1;
  elements.stepNext.textContent = state.buildStep === state.steps.length - 1 ? 'Build complete' : 'Next step';
  updateActiveFace();
}

function renderAll() {
  updateParameterControl();
  renderHeaderAndStats();
  renderFaceKinds();
  renderStatusBadges();
  renderNet();
  renderFaceDetails();
  renderWorkshopPanel();
  renderFoldPanel();
  renderBuildPanel();
  setMode(state.mode);
  setProgress(state.progress);
}

function openCalibrationDialog(profileId = null) {
  const profiles = activeProfiles();
  elements.calibrationProfile.replaceChildren(...profiles.map((tile) => {
    const option = document.createElement('option');
    option.value = tile.id;
    option.textContent = `${tile.label} · ${tile.family}`;
    return option;
  }));
  const preferred = profileId ?? state.buildability?.faceMatches[state.selectedFace]?.match?.tile.id ?? profiles[0]?.id;
  elements.calibrationProfile.value = profiles.some((item) => item.id === preferred) ? preferred : profiles[0]?.id;
  resetCalibrationFormForProfile();
  elements.calibrationDialog.showModal();
}

function calibrationBaseProfile() {
  return activeProfiles().find((item) => item.id === elements.calibrationProfile.value);
}

function resetCalibrationFormForProfile() {
  const base = calibrationBaseProfile();
  if (!base) return;
  elements.calibrationLabel.value = base.label;
  elements.calibrationAngles.value = base.anglesDegrees.join(', ');
  elements.hingeMin.value = base.hingeRangeDegrees?.minInterior ?? '';
  elements.hingeMax.value = base.hingeRangeDegrees?.maxInterior ?? '';
  elements.calibrationResolution.value = base.calibration?.instrumentResolutionMm ?? '';
  elements.calibrationBatch.value = base.source?.setOrBatch ?? '';
  elements.calibrationTemperature.value = '';
  elements.calibrationHumidity.value = '';
  elements.calibrationNotes.value = '';
  elements.calibrationSamples.replaceChildren();
  for (let index = 0; index < 3; index += 1) addCalibrationSampleRow();
  updateCalibrationStats();
}

function addCalibrationSampleRow() {
  const base = calibrationBaseProfile();
  if (!base) return;
  const index = elements.calibrationSamples.children.length;
  const row = document.createElement('article');
  row.className = 'calibration-sample';
  row.innerHTML = `
    <div class="calibration-sample__heading"><strong>Sample ${index + 1}</strong><button type="button" class="sample-remove" aria-label="Remove sample">×</button></div>
    <div class="sample-edges"></div>
    <div class="form-grid form-grid--two sample-secondary">
      <label>Thickness mm<input class="field-input sample-thickness" type="number" min="0" step="0.001" placeholder="Optional"></label>
      <label>Corner radius mm<input class="field-input sample-corner" type="number" min="0" step="0.001" placeholder="Optional"></label>
    </div>`;
  const edgeHost = row.querySelector('.sample-edges');
  base.sideRatios.forEach((_, edgeIndex) => {
    const label = document.createElement('label');
    label.textContent = `Edge ${edgeIndex + 1} mm`;
    const input = document.createElement('input');
    input.className = 'field-input sample-edge';
    input.type = 'number';
    input.min = '0.001';
    input.step = '0.001';
    input.placeholder = base.dimensionsMm?.[edgeIndex] ? roundTo(base.dimensionsMm[edgeIndex], 3) : 'Measure';
    input.dataset.edgeIndex = String(edgeIndex);
    label.append(input);
    edgeHost.append(label);
  });
  row.querySelector('.sample-remove').addEventListener('click', () => {
    if (elements.calibrationSamples.children.length <= 1) return;
    row.remove();
    [...elements.calibrationSamples.children].forEach((item, rowIndex) => {
      item.querySelector('.calibration-sample__heading strong').textContent = `Sample ${rowIndex + 1}`;
    });
    updateCalibrationStats();
  });
  row.addEventListener('input', updateCalibrationStats);
  elements.calibrationSamples.append(row);
}

function parseAnglesInput(sideCount) {
  const value = elements.calibrationAngles.value.trim();
  if (!value) return null;
  const angles = value.split(',').map((item) => Number(item.trim()));
  if (angles.length !== sideCount || angles.some((item) => !Number.isFinite(item) || item <= 0 || item >= 180)) {
    throw new Error(`Enter exactly ${sideCount} valid interior angles.`);
  }
  return angles;
}

function readCalibrationSamples({ strict = true } = {}) {
  const base = calibrationBaseProfile();
  if (!base) return [];
  let angles = null;
  try { angles = parseAnglesInput(base.sideRatios.length); } catch (error) { if (strict) throw error; }
  const samples = [];
  for (const row of elements.calibrationSamples.children) {
    const edgeInputs = [...row.querySelectorAll('.sample-edge')];
    const raw = edgeInputs.map((input) => input.value.trim());
    if (raw.every((value) => value === '')) continue;
    if (raw.some((value) => value === '')) {
      if (strict) throw new Error('Complete every edge in a sample or leave the entire sample blank.');
      continue;
    }
    const edgeLengthsMm = raw.map(Number);
    if (edgeLengthsMm.some((value) => !Number.isFinite(value) || value <= 0)) {
      if (strict) throw new Error('Every measured edge must be a positive number.');
      continue;
    }
    samples.push({
      edgeLengthsMm,
      anglesDegrees: angles,
      thicknessMm: row.querySelector('.sample-thickness').value || null,
      cornerRadiusMm: row.querySelector('.sample-corner').value || null,
    });
  }
  return samples;
}

function updateCalibrationStats() {
  const samples = readCalibrationSamples({ strict: false });
  if (!samples.length) {
    elements.calibrationStats.textContent = 'Add measurements to calculate mean dimensions and repeatability.';
    return;
  }
  const sideCount = samples[0].edgeLengthsMm.length;
  const means = Array.from({ length: sideCount }, (_, edgeIndex) => samples.reduce((sum, sample) => sum + sample.edgeLengthsMm[edgeIndex], 0) / samples.length);
  let maximumSpread = 0;
  for (let edgeIndex = 0; edgeIndex < sideCount; edgeIndex += 1) {
    const values = samples.map((sample) => sample.edgeLengthsMm[edgeIndex]);
    maximumSpread = Math.max(maximumSpread, (Math.max(...values) - Math.min(...values)) / Math.max(means[edgeIndex], 1e-9));
  }
  elements.calibrationStats.textContent = `${samples.length} complete sample${samples.length === 1 ? '' : 's'} · mean edges ${means.map((value) => roundTo(value, 3)).join(' / ')} mm · max sample range ${roundTo(maximumSpread * 100, 2)}%.`;
}

function saveCalibration(event) {
  event.preventDefault();
  try {
    const base = calibrationBaseProfile();
    const samples = readCalibrationSamples({ strict: true });
    const { session, profile } = createCalibrationSession(base, {
      label: elements.calibrationLabel.value,
      method: elements.calibrationMethod.value,
      device: elements.calibrationDevice.value,
      instrumentResolutionMm: elements.calibrationResolution.value,
      setOrBatch: elements.calibrationBatch.value,
      temperatureC: elements.calibrationTemperature.value,
      humidityPercent: elements.calibrationHumidity.value,
      anglesDegrees: parseAnglesInput(base.sideRatios.length),
      samples,
      minStableInteriorDegrees: elements.hingeMin.value,
      maxStableInteriorDegrees: elements.hingeMax.value,
      notes: elements.calibrationNotes.value,
    });
    state.calibrationSessions = [...state.calibrationSessions.filter((item) => item.id !== session.id), session];
    state.profileOverrides = [...state.profileOverrides.filter((item) => item.id !== profile.id), profile];
    state.inventory = normalizeInventory(state.inventory, activeProfiles());
    updateBuildability();
    renderProfileManager();
    elements.calibrationDialog.close();
    toast(`Saved raw session and ${profile.calibration.sampleCount}-sample profile for ${profile.label}.`, 'success');
  } catch (error) {
    toast(error instanceof Error ? error.message : String(error), 'error');
  }
}

function renderProfileManager() {
  const profiles = activeProfiles();
  const overrideIds = new Set(state.profileOverrides.map((item) => item.id));
  elements.profileList.replaceChildren(...profiles.map((tile) => {
    const dimensions = tile.dimensionsMm?.map((value) => roundTo(value, 3)).join(' × ') ?? 'No absolute dimensions';
    const sessions = state.calibrationSessions.filter((session) => session.baseProfileId === tile.id || session.outputProfileId === tile.id);
    const uncertaintyValues = tile.calibration?.uncertainty?.map((entry) => entry.estimatedExpandedUncertaintyMm).filter(Number.isFinite) ?? [];
    const uncertainty = uncertaintyValues.length ? `±${roundTo(Math.max(...uncertaintyValues), 3)} mm est.` : '—';
    const article = document.createElement('article');
    article.className = 'profile-card';
    const sourceCaveat = tile.calibration?.uncertainty?.[0]?.caveat
      ? ` · ${tile.calibration.uncertainty[0].caveat}`
      : '';
    article.innerHTML = `
      <div class="profile-card__heading"><div><span>${escapeHtml(tile.family)} · ${escapeHtml(tile.systemId)}</span><strong>${escapeHtml(tile.label)}</strong></div><em>${overrideIds.has(tile.id) ? 'Local override' : 'Built-in'}</em></div>
      <p>${escapeHtml(dimensions)} mm</p>
      <dl><div><dt>Geometry</dt><dd>${escapeHtml(tile.confidence)}</dd></div><div><dt>Scale</dt><dd>${escapeHtml(tile.scaleConfidence)}</dd></div><div><dt>Samples</dt><dd>${escapeHtml(tile.calibration?.sampleCount ?? '—')}</dd></div><div><dt>Raw sessions</dt><dd>${sessions.length}</dd></div><div><dt>Uncertainty</dt><dd>${escapeHtml(uncertainty)}</dd></div><div><dt>Batch</dt><dd>${escapeHtml(tile.source?.setOrBatch || '—')}</dd></div></dl>
      <small>${escapeHtml(tile.source?.title ?? 'No source metadata')}${escapeHtml(sourceCaveat)}</small>
      <div class="profile-card__actions"><button type="button" class="secondary-button" data-calibrate-profile="${escapeHtml(tile.id)}">Calibrate</button>${overrideIds.has(tile.id) ? `<button type="button" class="secondary-button" data-reset-profile="${escapeHtml(tile.id)}">Reset</button>` : ''}</div>`;
    return article;
  }));
  elements.profileList.querySelectorAll('[data-calibrate-profile]').forEach((button) => button.addEventListener('click', () => {
    elements.profilesDialog.close();
    openCalibrationDialog(button.dataset.calibrateProfile);
  }));
  elements.profileList.querySelectorAll('[data-reset-profile]').forEach((button) => button.addEventListener('click', () => {
    state.profileOverrides = state.profileOverrides.filter((item) => item.id !== button.dataset.resetProfile);
    updateBuildability();
    renderProfileManager();
    toast('Restored the built-in profile. Raw calibration sessions were retained for re-derivation.', 'success');
  }));
}


function projectExportOptions(overrides = {}) {
  return {
    title: overrides.title ?? `${state.model?.name ?? 'MagnaMath'} workshop`,
    lockedFoldEdgeKeys: state.lockedFoldEdgeKeys,
    lockedCutEdgeKeys: state.lockedCutEdgeKeys,
    parameter: state.parameter,
    inventoryPreset: state.inventoryPreset,
    inventory: state.inventory,
    tileFamilies: state.tileFamilies,
    scaleMode: state.scaleMode,
    customScale: state.customScale,
    calibrationProfileIds: state.profileOverrides.map((item) => item.id),
    calibrationProfiles: state.profileOverrides,
    calibrationSessions: state.calibrationSessions,
    compoundMode: state.compoundMode,
    printSettings: state.printSettings,
    thicknessClearance: state.clearance,
    clearanceAssumption: state.clearanceAssumption,
    localProjectId: state.localProjectId,
    motionClips: state.motionClips,
    activeMotionClipId: state.activeMotionClipId,
    folding: state.foldingModel ? serializeFoldingState(state.foldingModel, {
      progress: state.progress,
      schedule: state.foldingSchedule,
      sequenceMode: state.foldSequenceMode,
      hingeDuration: state.hingeDurationValue,
      hingeOverrides: state.hingeOverrides,
      selectedHingeEdgeKey: state.selectedHingeEdgeKey,
      showHinges: state.showHinges,
      collisionScreen: state.collisionScreenEnabled,
      rootPose: state.rootPose,
    }) : null,
    ...overrides,
  };
}

function currentSnapshotText(overrides = {}) {
  if (!state.model || !state.analysis || !state.net || !state.buildability) {
    throw new Error('No active MagnaMath project is available.');
  }
  return polyhedronToJson(
    state.model,
    state.analysis,
    state.net,
    state.buildability,
    projectExportOptions(overrides),
  );
}

function currentSnapshotObject(overrides = {}) {
  return JSON.parse(currentSnapshotText(overrides));
}

function mergeCalibrationSessions(records) {
  const sessions = parseCalibrationSessionRecords(records);
  const byId = new Map(state.calibrationSessions.map((item) => [item.id, item]));
  sessions.forEach((item) => byId.set(item.id, item));
  state.calibrationSessions = [...byId.values()];
  return sessions;
}

function deriveProfilesFromSessions(sessions) {
  const byId = new Map(state.profileOverrides.map((item) => [item.id, item]));
  for (const session of sessions) {
    const base = BUILTIN_TILE_PROFILES.find((item) => item.id === session.baseProfileId)
      ?? activeProfiles().find((item) => item.id === session.baseProfileId);
    if (!base) continue;
    const profile = profileFromCalibrationSession(base, session);
    byId.set(profile.id, profile);
  }
  state.profileOverrides = [...byId.values()];
}

function applyImportedProject(imported, options = {}) {
  const catalogShape = SHAPE_CATALOG.find((entry) => entry.id === imported.polyhedron.id);
  if (!catalogShape) throw new Error(`This release can import editable workshop state only for catalog shape ${imported.polyhedron.id}.`);

  const embeddedProfiles = imported.project?.calibrationProfiles?.length
    ? parseTileProfileRecords(imported.project.calibrationProfiles)
    : [];
  const profileMap = new Map(state.profileOverrides.map((item) => [item.id, item]));
  embeddedProfiles.forEach((item) => profileMap.set(item.id, item));
  state.profileOverrides = [...profileMap.values()];

  const embeddedSessions = imported.project?.calibrationSessions?.length
    ? mergeCalibrationSessions(imported.project.calibrationSessions)
    : [];
  if (!embeddedProfiles.length && embeddedSessions.length) deriveProfilesFromSessions(embeddedSessions);

  state.shapeId = imported.polyhedron.id;
  state.parameter = Number(imported.project?.parameter ?? imported.polyhedron.metadata?.parameters?.sides ?? catalogShape.parameter?.default ?? state.parameter);
  state.netObjective = imported.net.objective in NET_OBJECTIVES ? imported.net.objective : 'compact';
  state.netSeed = Number.isFinite(imported.net.seed) ? imported.net.seed : 1;
  state.rootFace = imported.net.rootFace;
  state.selectedFace = imported.net.rootFace;
  state.selectedEdgeKey = null;
  state.lockedFoldEdgeKeys = new Set(imported.net.lockedFoldEdgeKeys ?? []);
  state.lockedCutEdgeKeys = new Set(imported.net.lockedCutEdgeKeys ?? []);
  state.history = [];
  state.future = [];
  state.netCandidates = [];
  state.inventoryPreset = imported.project?.inventoryPreset in INVENTORY_PRESETS ? imported.project.inventoryPreset : 'custom';
  state.tileFamilies = Array.isArray(imported.project?.tileFamilies)
    ? imported.project.tileFamilies.filter((family) => ['standard', 'micro'].includes(family))
    : ['standard'];
  if (!state.tileFamilies.length) state.tileFamilies = ['standard'];
  state.scaleMode = ['auto', 'standard', 'micro', 'custom'].includes(imported.project?.scaleMode) ? imported.project.scaleMode : 'auto';
  state.customScale = Number(imported.project?.customScale ?? STANDARD_TILE_EDGE_MM);
  state.compoundMode = ['exact', 'off'].includes(imported.project?.compoundMode) ? imported.project.compoundMode : 'exact';
  state.clearanceAssumption = ['measured-only', 'surface-axis'].includes(imported.project?.clearanceAssumption)
    ? imported.project.clearanceAssumption
    : (['measured-only', 'surface-axis'].includes(imported.physicalBuild?.thicknessClearance?.assumption)
      ? imported.physicalBuild.thicknessClearance.assumption
      : 'measured-only');
  state.printSettings = { ...state.printSettings, ...(imported.project?.printSettings ?? {}) };
  state.localProjectId = Object.prototype.hasOwnProperty.call(options, 'localProjectId')
    ? options.localProjectId
    : (imported.project?.localProjectId ?? null);
  state.inventory = normalizeInventory(imported.project?.inventory ?? INVENTORY_PRESETS[state.inventoryPreset]?.counts ?? {}, activeProfiles());

  const model = structuredClone(imported.polyhedron);
  const analysis = analyzePolyhedron(model);
  if (!analysis.validation.valid) throw new Error(`Imported geometry is invalid: ${analysis.validation.issues.join(' ')}`);
  const knownEdges = analysis.topology.edgeMap;
  for (const key of [...state.lockedFoldEdgeKeys, ...state.lockedCutEdgeKeys, ...imported.net.foldEdgeKeys]) {
    if (!knownEdges.has(key)) throw new Error(`Imported net references unknown edge ${key}.`);
  }
  for (const key of state.lockedFoldEdgeKeys) {
    if (!imported.net.foldEdgeKeys.includes(key)) throw new Error(`Locked fold ${key} is not a fold in the imported tree.`);
  }
  for (const key of state.lockedCutEdgeKeys) {
    if (imported.net.foldEdgeKeys.includes(key)) throw new Error(`Locked cut ${key} is a fold in the imported tree.`);
  }

  state.model = model;
  state.analysis = analysis;
  state.buildability = computeBuildability(analysis);
  state.clearance = analyzeThicknessClearance(analysis, state.buildability, { assumption: state.clearanceAssumption });
  const net = netFromEdgeKeys(model, analysis, imported.net.foldEdgeKeys, {
    rootFace: state.rootFace,
    objective: state.netObjective,
    seed: state.netSeed,
    source: options.source ?? 'imported-workshop',
  });
  elements.shapeSelect.value = state.shapeId;
  updateParameterControl();
  applyNet(net, { render: false });
  state.motionClips = (imported.project?.motionClips ?? []).filter((clip) => validateMotionClip(clip, state.foldingModel).valid);
  state.activeMotionClipId = state.motionClips.some((clip) => clip.id === imported.project?.activeMotionClipId)
    ? imported.project.activeMotionClipId
    : null;
  if (imported.project?.folding) {
    const restored = parseFoldingState(imported.project.folding, state.foldingModel);
    state.progress = restored.progress;
    state.foldSequenceMode = restored.sequenceMode;
    state.hingeDurationValue = restored.hingeDuration;
    state.foldingSchedule = restored.schedule;
    state.hingeOverrides = restored.hingeOverrides;
    state.selectedHingeEdgeKey = restored.selectedHingeEdgeKey;
    state.showHinges = restored.showHinges;
    state.collisionScreenEnabled = restored.collisionScreen;
    state.rootPose = restored.rootPose;
    updateFoldingPose({ renderPanel: false });
  } else {
    state.progress = 0;
    state.hingeOverrides = {};
    state.selectedHingeEdgeKey = null;
    state.rootPose = [...IDENTITY_4];
    updateFoldingPose({ renderPanel: false });
  }
  state.workshopMessage = `Loaded ${model.name} with ${state.lockedFoldEdgeKeys.size + state.lockedCutEdgeKeys.size} locked edge choices, ${embeddedProfiles.length} embedded profile(s), and ${embeddedSessions.length} raw session(s).`;
  setMode(imported.project?.folding ? 'fold' : 'workshop');
  renderAll();
  persist();
}

function readPrintSettingsFromForm() {
  state.printSettings = {
    page: elements.printPage.value in PRINT_PAGE_PRESETS ? elements.printPage.value : 'letter',
    orientation: elements.printOrientation.value,
    mode: elements.printMode.value,
    marginMm: Math.max(0, Number(elements.printMargin.value) || 0),
    overlapMm: Math.max(0, Number(elements.printOverlap.value) || 0),
    tabDepthMm: Math.max(2, Number(elements.printTabDepth.value) || 8),
    glueTabs: elements.printTabs.checked,
    labelCutPairs: elements.printCutLabels.checked,
    labelFaces: elements.printFaceLabels.checked,
    cropMarks: elements.printCropMarks.checked,
  };
  persist();
  return state.printSettings;
}

function applyPrintSettingsToForm() {
  const settings = state.printSettings;
  elements.printPage.value = settings.page;
  elements.printOrientation.value = settings.orientation;
  elements.printMode.value = settings.mode;
  elements.printMargin.value = String(settings.marginMm);
  elements.printOverlap.value = String(settings.overlapMm);
  elements.printTabDepth.value = String(settings.tabDepthMm);
  elements.printTabs.checked = settings.glueTabs;
  elements.printCutLabels.checked = settings.labelCutPairs;
  elements.printFaceLabels.checked = settings.labelFaces;
  elements.printCropMarks.checked = settings.cropMarks;
}

function currentPrintOptions() {
  const settings = readPrintSettingsFromForm();
  return {
    pagePreset: settings.page,
    orientation: settings.orientation,
    mode: settings.mode,
    marginMm: settings.marginMm,
    posterOverlapMm: settings.overlapMm,
    tabDepthMm: settings.tabDepthMm,
    glueTabs: settings.glueTabs,
    labelCutPairs: settings.labelCutPairs,
    labelFaces: settings.labelFaces,
    cropMarks: settings.cropMarks,
    registrationMarks: settings.cropMarks,
    modelUnitMm: state.buildability?.modelUnitMm,
    compoundByFace: state.buildability?.compoundByFace,
  };
}

function renderPrintPreview() {
  try {
    if (!state.buildability?.modelUnitMm) throw new Error('Select a physical scale before creating a print package.');
    const printPackage = createPrintPackage(state.model, state.analysis, state.net, currentPrintOptions());
    state.currentPrintPackage = printPackage;
    const layout = printPackage.layout;
    elements.printSummary.classList.toggle('is-warning', printPackage.warnings.length > 0);
    elements.printSummary.textContent = `${layout.pages.length} page${layout.pages.length === 1 ? '' : 's'} · ${layout.page.label} ${layout.orientation} · ${layout.trueScale ? '100% actual size' : `${roundTo(layout.printScale * 100, 2)}% scale`} · ${printPackage.tabs.tabs.length} tabs · ${printPackage.tabs.collisions.length} tab warning${printPackage.tabs.collisions.length === 1 ? '' : 's'}.${printPackage.warnings.length ? ` ${printPackage.warnings.join(' ')}` : ''}`;
    const visiblePages = printPackage.pages.slice(0, 6);
    elements.printPreview.replaceChildren(...visiblePages.map((page) => {
      const wrapper = document.createElement('article');
      wrapper.className = 'print-preview-page';
      wrapper.innerHTML = `<span>${page.index + 1}/${printPackage.pages.length}</span>${page.svg}`;
      return wrapper;
    }));
    if (printPackage.pages.length > visiblePages.length) {
      const more = document.createElement('p');
      more.className = 'micro-note';
      more.textContent = `${printPackage.pages.length - visiblePages.length} additional pages are included in the export package.`;
      elements.printPreview.append(more);
    }
  } catch (error) {
    state.currentPrintPackage = null;
    elements.printSummary.classList.add('is-warning');
    elements.printSummary.textContent = error instanceof Error ? error.message : String(error);
    elements.printPreview.replaceChildren();
  }
}

function openPrintDialog() {
  applyPrintSettingsToForm();
  renderPrintPreview();
  elements.printDialog.showModal();
}

function printPackageFiles(printPackage) {
  const html = printPackageToHtml(state.model, printPackage);
  const manifest = printPackageManifest(state.model, printPackage);
  return [
    ...printPackage.pages.map((page) => ({ name: `pages/${page.filename}`, data: page.svg })),
    { name: 'print.html', data: html },
    { name: 'manifest.json', data: manifest },
    { name: 'README.txt', data: `MagnaMath print package for ${state.model.name}\n\nOpen print.html and print at 100% / Actual Size. Disable browser scaling. Verify registration and measurement marks before fabrication.\n\nThis package does not establish physical stability or collision-free folding.\n` },
  ];
}

async function saveLocalProject() {
  if (!projectStore.supported) throw new Error('Local project storage is unavailable in this browser.');
  state.localProjectId ??= crypto.randomUUID();
  const title = `${state.model.name} · ${NET_OBJECTIVES[state.netObjective]?.label ?? state.netObjective}`;
  const snapshot = currentSnapshotObject({ title, localProjectId: state.localProjectId });
  await projectStore.save({
    id: state.localProjectId,
    title,
    shapeId: state.model.id,
    thumbnailSvg: netToSvg(state.model, state.analysis, state.net, { labelFaces: false, compoundByFace: state.buildability?.compoundByFace }),
    snapshot,
  });
  persist();
  toast('Saved the complete project in this browser.', 'success');
}

async function renderProjectLibrary() {
  elements.projectList.replaceChildren();
  if (!projectStore.supported) {
    elements.projectList.textContent = 'IndexedDB is unavailable in this browser.';
    return;
  }
  const projects = await projectStore.list();
  if (!projects.length) {
    const empty = document.createElement('p');
    empty.className = 'panel-copy';
    empty.textContent = 'No local projects yet. Save the current workshop to create one.';
    elements.projectList.append(empty);
    return;
  }
  elements.projectList.replaceChildren(...projects.map((project) => {
    const article = document.createElement('article');
    article.className = 'project-card';
    let thumbnail = '';
    try {
      const snapshot = parseSnapshotProject(project.snapshot);
      const model = snapshot.polyhedron;
      const analysis = analyzePolyhedron(model);
      const net = netFromEdgeKeys(model, analysis, snapshot.net.foldEdgeKeys, {
        rootFace: snapshot.net.rootFace,
        seed: snapshot.net.seed,
        objective: snapshot.net.objective,
        source: 'local-project-thumbnail',
      });
      thumbnail = stripXmlDeclaration(netToSvg(model, analysis, net, { labelFaces: false }));
    } catch (error) {
      console.warn('Could not regenerate a local project thumbnail.', error);
    }
    article.innerHTML = `<div class="project-card__preview">${thumbnail}</div><div class="project-card__body"><span>${escapeHtml(new Date(project.updatedAt).toLocaleString())}</span><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.shapeId)}</small><div><button type="button" class="primary-button" data-load-project="${escapeHtml(project.id)}">Open</button><button type="button" class="secondary-button" data-delete-project="${escapeHtml(project.id)}">Delete</button></div></div>`;
    return article;
  }));
  elements.projectList.querySelectorAll('[data-load-project]').forEach((button) => button.addEventListener('click', async () => {
    try {
      const record = await projectStore.get(button.dataset.loadProject);
      if (!record) throw new Error('The local project no longer exists.');
      applyImportedProject(parseSnapshotProject(record.snapshot), { localProjectId: record.id, source: 'local-project' });
      elements.projectsDialog.close();
      toast(`Opened ${record.title}.`, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), 'error');
    }
  }));
  elements.projectList.querySelectorAll('[data-delete-project]').forEach((button) => button.addEventListener('click', async () => {
    await projectStore.delete(button.dataset.deleteProject);
    if (state.localProjectId === button.dataset.deleteProject) state.localProjectId = null;
    await renderProjectLibrary();
    persist();
    toast('Deleted the local project.', 'success');
  }));
}

function bindEvents() {
  elements.shapeSelect.addEventListener('change', () => {
    invalidateDerivedWorkspaceState({ detachLocalProject: true });
    state.shapeId = elements.shapeSelect.value;
    const entry = catalogEntry(state.shapeId);
    if (entry.parameter) state.parameter = entry.parameter.default;
    state.selectedFace = 0;
    state.buildStep = 0;
    updateParameterControl();
    recomputeShape({ preserveSeed: false, resetWorkshop: true });
  });
  elements.parameterInput.addEventListener('input', () => {
    state.parameter = Number(elements.parameterInput.value);
    elements.parameterOutput.value = String(state.parameter);
  });
  elements.parameterInput.addEventListener('change', () => {
    invalidateDerivedWorkspaceState({ detachLocalProject: true });
    state.selectedFace = 0;
    state.buildStep = 0;
    recomputeShape({ preserveSeed: false, resetWorkshop: true });
  });
  document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  elements.toolInspect.addEventListener('click', () => setInteractionMode('inspect'));
  elements.toolHinge.addEventListener('click', () => setInteractionMode('hinge'));
  elements.toolMove.addEventListener('click', () => setInteractionMode('move'));
  elements.transformMode.addEventListener('change', () => {
    state.transformModeValue = elements.transformMode.value === 'rotate' ? 'rotate' : 'translate';
    state.renderer?.setTransformMode?.(state.transformModeValue);
    persist();
  });
  elements.resetRoot.addEventListener('click', resetRootPose);
  elements.foldSequence.addEventListener('change', () => {
    state.foldSequenceMode = elements.foldSequence.value in FOLD_SEQUENCE_MODES ? elements.foldSequence.value : 'simultaneous';
    state.foldingSchedule = createFoldingSchedule(state.foldingModel, { mode: state.foldSequenceMode, hingeDuration: state.hingeDurationValue });
    updateFoldingPose();
    persist();
  });
  elements.foldSpeed.addEventListener('change', () => {
    state.foldSpeedValue = Number(elements.foldSpeed.value) || 1;
    persist();
  });
  elements.hingeDuration.addEventListener('input', () => {
    state.hingeDurationValue = Number(elements.hingeDuration.value) / 100;
    state.foldingSchedule = createFoldingSchedule(state.foldingModel, { mode: state.foldSequenceMode, hingeDuration: state.hingeDurationValue });
    updateFoldingPose();
    persist();
  });
  elements.showHinges.addEventListener('change', () => {
    state.showHinges = elements.showHinges.checked;
    state.renderer?.setShowHinges(state.showHinges);
    renderFoldPanel();
    persist();
  });
  elements.collisionScreen.addEventListener('change', () => {
    state.collisionScreenEnabled = elements.collisionScreen.checked;
    updateFoldingPose();
    persist();
  });
  elements.hingeAngle.addEventListener('input', () => setHingeOverrideFraction(Number(elements.hingeAngle.value) / 100));
  elements.hingeFollowTimeline.addEventListener('click', clearSelectedHingeOverride);
  elements.hingeTarget.addEventListener('click', () => setHingeOverrideFraction(1));
  elements.foldSlider.addEventListener('input', () => {
    state.animationId += 1;
    elements.foldPlay.classList.remove('is-playing');
    setProgress(Number(elements.foldSlider.value) / 100);
  });
  elements.foldPlay.addEventListener('click', animateFold);
  elements.kidsFold.addEventListener('click', () => {
    elements.kidsFold.classList.add('is-busy');
    setTimeout(() => elements.kidsFold.classList.remove('is-busy'), 400);
    animateFold();
  });
  elements.kidsToggle.addEventListener('click', () => applyKidsMode(!state.kidsMode));
  elements.resetView.addEventListener('click', () => state.renderer?.resetView());
  elements.alternateNet.addEventListener('click', () => {
    state.netSeed += 1;
    searchNet();
  });
  elements.objective.addEventListener('change', () => {
    const before = netSnapshot();
    invalidateDerivedWorkspaceState();
    state.netObjective = elements.objective.value;
    searchNet({ push: false }).then(() => {
      pushHistory(before);
      renderWorkshopPanel();
    });
  });
  elements.workshopUndo.addEventListener('click', undoWorkshop);
  elements.workshopRedo.addEventListener('click', redoWorkshop);
  elements.workshopOptimize.addEventListener('click', optimizeNetPortfolio);
  elements.optimizerCancel.addEventListener('click', () => netOptimizer.cancel('Cancelled by user.'));
  elements.edgeMakeCut.addEventListener('click', () => editSelectedEdge('cut'));
  elements.edgeMakeFold.addEventListener('click', () => editSelectedEdge('fold'));
  elements.edgeLock.addEventListener('click', toggleSelectedEdgeLock);
  elements.setRootFace.addEventListener('click', setSelectedFaceAsRoot);

  elements.inventoryPreset.addEventListener('change', () => {
    state.inventoryPreset = elements.inventoryPreset.value;
    const preset = INVENTORY_PRESETS[state.inventoryPreset];
    if (preset && state.inventoryPreset !== 'custom') {
      state.inventory = normalizeInventory(preset.counts, activeProfiles());
      state.tileFamilies = preset.families.slice();
    }
    updateBuildability();
  });
  elements.tileFamily.addEventListener('change', () => {
    state.tileFamilies = elements.tileFamily.value === 'both' ? ['standard', 'micro'] : [elements.tileFamily.value];
    updateBuildability();
  });
  elements.scaleMode.addEventListener('change', () => {
    state.scaleMode = elements.scaleMode.value;
    elements.customScaleField.hidden = state.scaleMode !== 'custom';
    updateBuildability();
  });
  elements.customScale.addEventListener('change', () => {
    state.customScale = Math.max(0.001, Number(elements.customScale.value) || STANDARD_TILE_EDGE_MM);
    updateBuildability();
  });
  elements.compoundMode.addEventListener('change', () => {
    state.compoundMode = elements.compoundMode.value;
    updateBuildability();
  });
  elements.clearanceAssumption.addEventListener('change', () => {
    state.clearanceAssumption = elements.clearanceAssumption.value;
    updateBuildability();
  });
  elements.stepPrevious.addEventListener('click', () => {
    state.buildStep = Math.max(0, state.buildStep - 1);
    renderBuildStep();
  });
  elements.stepNext.addEventListener('click', () => {
    state.buildStep = Math.min(state.steps.length - 1, state.buildStep + 1);
    renderBuildStep();
  });
  elements.exportSvg.addEventListener('click', () => {
    if (!state.model || !state.analysis || !state.net) return;
    if (!state.buildability?.modelUnitMm) {
      toast('No verified physical scale is available. Select a compatible tile family or enter a custom scale before exporting.', 'error');
      return;
    }
    const svg = netToSvg(state.model, state.analysis, state.net, {
      labelFaces: true,
      physicalScale: true,
      modelUnitMm: state.buildability.modelUnitMm,
      compoundByFace: state.buildability.compoundByFace,
      lockedFoldEdgeKeys: state.lockedFoldEdgeKeys,
      lockedCutEdgeKeys: state.lockedCutEdgeKeys,
    });
    downloadText(`${state.model.id}-net-${roundTo(state.buildability.modelUnitMm, 3)}mm-per-unit.svg`, svg, 'image/svg+xml;charset=utf-8');
    toast(`Exported true-scale SVG at ${roundTo(state.buildability.modelUnitMm, 3)} mm per model unit.`, 'success');
  });
  elements.exportJson.addEventListener('click', () => {
    if (!state.model || !state.analysis || !state.net || !state.buildability) return;
    downloadText(
      `${state.model.id}-magnamath-v4.json`,
      polyhedronToJson(state.model, state.analysis, state.net, state.buildability, projectExportOptions()),
      'application/json;charset=utf-8',
    );
    toast('Exported geometry, exact fold tree, folding timeline, spatial pose, physical scale, and profile assignments.', 'success');
  });

  elements.importProject.addEventListener('click', () => elements.projectImportFile.click());
  elements.projectImportFile.addEventListener('change', async () => {
    const [file] = elements.projectImportFile.files;
    if (!file) return;
    try {
      applyImportedProject(parseSnapshotProject(await file.text()), { localProjectId: null, source: 'external-project' });
      toast('Imported geometry, fold tree, folding state, spatial pose, constraints, inventory, calibrations, and print settings.', 'success');
    } catch (error) {
      console.error(error);
      toast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      elements.projectImportFile.value = '';
    }
  });

  elements.exportPrint.addEventListener('click', openPrintDialog);
  elements.saveProject.addEventListener('click', async () => {
    try { await saveLocalProject(); } catch (error) { toast(error instanceof Error ? error.message : String(error), 'error'); }
  });
  elements.openProjects.addEventListener('click', async () => {
    try {
      await renderProjectLibrary();
      elements.projectsDialog.showModal();
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), 'error');
    }
  });

  elements.printForm.addEventListener('input', renderPrintPreview);
  elements.printForm.addEventListener('change', renderPrintPreview);
  elements.exportPrintHtml.addEventListener('click', () => {
    renderPrintPreview();
    if (!state.currentPrintPackage) return;
    downloadText(`${state.model.id}-print-package.html`, printPackageToHtml(state.model, state.currentPrintPackage), 'text/html;charset=utf-8');
    toast('Exported printable HTML. Print at 100% / Actual Size.', 'success');
  });
  elements.printForm.addEventListener('submit', (event) => {
    event.preventDefault();
    renderPrintPreview();
    if (!state.currentPrintPackage) return;
    const bytes = createStoredZip(printPackageFiles(state.currentPrintPackage));
    downloadBytes(`${state.model.id}-magnamath-print-package.zip`, bytes);
    toast(`Exported ${state.currentPrintPackage.pages.length}-page print package.`, 'success');
  });

  elements.calibrateTiles.addEventListener('click', () => openCalibrationDialog());
  elements.manageProfiles.addEventListener('click', () => {
    renderProfileManager();
    elements.profilesDialog.showModal();
  });
  elements.calibrationProfile.addEventListener('change', resetCalibrationFormForProfile);
  elements.addCalibrationSample.addEventListener('click', addCalibrationSampleRow);
  elements.calibrationAngles.addEventListener('input', updateCalibrationStats);
  elements.calibrationForm.addEventListener('submit', saveCalibration);
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById(button.dataset.closeDialog)?.close();
  }));
  elements.exportProfiles.addEventListener('click', () => {
    downloadText('magnamath-local-tile-profiles.json', tileProfilesToJson(state.profileOverrides), 'application/json;charset=utf-8');
    toast('Exported local calibrated profile overrides.', 'success');
  });
  elements.importProfiles.addEventListener('click', () => elements.profileImportFile.click());
  elements.profileImportFile.addEventListener('change', async () => {
    const [file] = elements.profileImportFile.files;
    if (!file) return;
    try {
      const imported = parseTileProfileRecords(await file.text());
      const byId = new Map(state.profileOverrides.map((item) => [item.id, item]));
      imported.forEach((item) => byId.set(item.id, item));
      state.profileOverrides = [...byId.values()];
      state.inventory = normalizeInventory(state.inventory, activeProfiles());
      updateBuildability();
      renderProfileManager();
      toast(`Imported ${imported.length} profile${imported.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      elements.profileImportFile.value = '';
    }
  });
  elements.exportSessions.addEventListener('click', () => {
    downloadText('magnamath-calibration-sessions.json', calibrationSessionsToJson(state.calibrationSessions), 'application/json;charset=utf-8');
    toast(`Exported ${state.calibrationSessions.length} raw calibration session${state.calibrationSessions.length === 1 ? '' : 's'}.`, 'success');
  });
  elements.importSessions.addEventListener('click', () => elements.sessionImportFile.click());
  elements.sessionImportFile.addEventListener('change', async () => {
    const [file] = elements.sessionImportFile.files;
    if (!file) return;
    try {
      const imported = mergeCalibrationSessions(await file.text());
      deriveProfilesFromSessions(imported);
      state.inventory = normalizeInventory(state.inventory, activeProfiles());
      updateBuildability();
      renderProfileManager();
      toast(`Imported and re-derived ${imported.length} raw session${imported.length === 1 ? '' : 's'}.`, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      elements.sessionImportFile.value = '';
    }
  });

  elements.exportCalibrationSheet.addEventListener('click', () => {
    downloadText('magnamath-tile-calibration-sheet.svg', calibrationSheetToSvg(), 'image/svg+xml;charset=utf-8');
    toast('Exported a print-at-100% measurement sheet.', 'success');
  });

  elements.aboutButton.addEventListener('click', () => elements.aboutDialog.showModal());
  document.querySelectorAll('[data-euler-answer]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-euler-answer]').forEach((candidate) => candidate.classList.remove('is-correct', 'is-wrong'));
    const correct = button.dataset.eulerAnswer === '2';
    button.classList.add(correct ? 'is-correct' : 'is-wrong');
    elements.challengeFeedback.textContent = correct
      ? 'Correct—under the stated closed, connected, sphere-like assumptions.'
      : 'Not for this class of solid. Try 2, then compare a torus later.';
  }));
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && state.mode === 'workshop') {
      event.preventDefault();
      event.shiftKey ? redoWorkshop() : undoWorkshop();
      return;
    }
    if (event.key === 'ArrowRight' && state.mode === 'fold' && !typing) {
      event.preventDefault();
      stepFold(1);
      return;
    }
    if (event.key === 'ArrowLeft' && state.mode === 'fold' && !typing) {
      event.preventDefault();
      stepFold(-1);
      return;
    }
    if (event.key.toLowerCase() === 'h' && !typing) {
      setInteractionMode(state.interactionMode === 'hinge' ? 'inspect' : 'hinge');
      return;
    }
    if (event.key === 'ArrowRight' && state.mode === 'build' && !typing) {
      state.buildStep = Math.min(state.steps.length - 1, state.buildStep + 1);
      renderBuildStep();
    }
    if (event.key === 'ArrowLeft' && state.mode === 'build' && !typing) {
      state.buildStep = Math.max(0, state.buildStep - 1);
      renderBuildStep();
    }
    if (event.key === ' ' && !typing) {
      event.preventDefault();
      animateFold();
    }
  });
}

async function registerPwa() {
  if (!import.meta.env?.PROD) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch (error) {
    console.warn('PWA registration skipped.', error);
  }
}

async function start() {
  populateShapeSelect();
  populateInventoryPresets();
  populateObjectives();
  updateParameterControl();
  elements.tileFamily.value = tileFamilyControlValue();
  elements.scaleMode.value = state.scaleMode;
  elements.compoundMode.value = state.compoundMode;
  elements.clearanceAssumption.value = state.clearanceAssumption;
  elements.foldSequence.value = state.foldSequenceMode;
  elements.foldSpeed.value = String(state.foldSpeedValue);
  elements.hingeDuration.value = String(Math.round(state.hingeDurationValue * 100));
  elements.showHinges.checked = state.showHinges;
  elements.collisionScreen.checked = state.collisionScreenEnabled;
  elements.transformMode.value = state.transformModeValue;
  elements.customScaleField.hidden = state.scaleMode !== 'custom';
  applyPrintSettingsToForm();
  bindEvents();
  // Resolve kids mode BEFORE the renderer is built so autoFrame is set from the start
  // and the collision screen never gets a chance to paint the first pose red.
  applyKidsMode(initialKidsMode());
  setMode(state.mode);
  state.renderer = await createRenderer();
  await recomputeShape();
  registerPwa();
}

start().catch((error) => {
  console.error(error);
  showLoader(false);
  toast(error instanceof Error ? error.message : String(error), 'error');
});
