import { STANDARD_TILE_EDGE_MM, TILE_PROFILE_SCHEMA_V2 } from './tiles.js';
import { compoundInternalSegments } from './compound.js';
import { apply2 } from './math.js';
import { APP_VERSION, CORE_VERSION, LEGACY_SNAPSHOT_SCHEMAS, SNAPSHOT_SCHEMA } from './version.js';

const palette = {
  square: '#4dddc2',
  'equilateral-triangle': '#7f9bff',
  'right-isosceles-triangle': '#ffbf69',
  'right-triangle': '#ffbf69',
  'isosceles-triangle': '#f38bc0',
  'regular-5-gon': '#c68cff',
  'regular-6-gon': '#7fd9ff',
  'regular-8-gon': '#85e68d',
  default: '#9eafc8',
};

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

/** @param {number} value */
const f = (value) => Number(value.toFixed(5));

/**
 * Exports or renders an overlap-aware net. Interactive previews receive wide
 * transparent edge hit-targets; print exports remain clean and true-scale.
 */
export function netToSvg(polyhedron, analysis, net, options = {}) {
  const margin = options.margin ?? 0.35;
  const labelFaces = options.labelFaces ?? true;
  const physicalScale = options.physicalScale ?? false;
  const interactive = options.interactive ?? false;
  const modelUnitMm = options.modelUnitMm ?? STANDARD_TILE_EDGE_MM;
  const lockedFoldEdgeKeys = new Set(options.lockedFoldEdgeKeys ?? []);
  const lockedCutEdgeKeys = new Set(options.lockedCutEdgeKeys ?? []);
  const overlapFaces = new Set(net.overlapPairs.flatMap(([left, right]) => [left, right]));
  const bounds = net.bounds;
  const width = bounds.width + margin * 2;
  const height = bounds.height + margin * 2;
  const offsetX = -bounds.minX + margin;
  const offsetY = bounds.maxY + margin;
  const widthAttribute = physicalScale ? ` width="${f(width * modelUnitMm)}mm"` : '';
  const heightAttribute = physicalScale ? ` height="${f(height * modelUnitMm)}mm"` : '';

  const facePaths = net.polygons.map((polygon, faceIndex) => {
    const points = polygon.map(([x, y]) => `${f(x + offsetX)},${f(offsetY - y)}`).join(' ');
    const face = analysis.faces[faceIndex];
    const fill = palette[face.kind] ?? palette.default;
    const centroid = polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
      .map((value) => value / polygon.length);
    const classes = ['net-face'];
    if (overlapFaces.has(faceIndex)) classes.push('has-overlap');
    return [
      `<polygon data-face="${faceIndex}" class="${classes.join(' ')}" points="${points}" fill="${fill}" fill-opacity="0.42" stroke="none"/>`,
      labelFaces
        ? `<text x="${f(centroid[0] + offsetX)}" y="${f(offsetY - centroid[1])}" class="face-label">${faceIndex + 1}</text>`
        : '',
    ].join('');
  }).join('\n');

  const compoundByFace = options.compoundByFace ?? {};
  const compoundMarkup = analysis.faces.map((_, faceIndex) => {
    const compound = compoundByFace instanceof Map ? compoundByFace.get(faceIndex) : compoundByFace[faceIndex];
    if (!compound) return '';
    return compoundInternalSegments(compound).map((seam) => {
      const from = apply2(net.transforms[faceIndex], seam.from);
      const to = apply2(net.transforms[faceIndex], seam.to);
      return `<line data-compound-face="${faceIndex}" data-compound-seam="${seam.seamIndex}" x1="${f(from[0] + offsetX)}" y1="${f(offsetY - from[1])}" x2="${f(to[0] + offsetX)}" y2="${f(offsetY - to[1])}" class="compound-seam"/>`;
    }).join('');
  }).join('\n');

  const segment = (edge, state) => {
    const locked = state === 'fold' ? lockedFoldEdgeKeys.has(edge.key) : lockedCutEdgeKeys.has(edge.key);
    const classes = [state, locked ? 'is-locked' : ''].filter(Boolean).join(' ');
    const attributes = `data-edge-key="${escapeXml(edge.key)}" data-edge-state="${state}" data-face="${edge.faceIndex}" data-local-edge="${edge.localEdgeIndex ?? 0}"`;
    const visible = `<line x1="${f(edge.from[0] + offsetX)}" y1="${f(offsetY - edge.from[1])}" x2="${f(edge.to[0] + offsetX)}" y2="${f(offsetY - edge.to[1])}" class="${classes}" ${attributes}/>`;
    if (!interactive) return visible;
    const hit = `<line x1="${f(edge.from[0] + offsetX)}" y1="${f(offsetY - edge.from[1])}" x2="${f(edge.to[0] + offsetX)}" y2="${f(offsetY - edge.to[1])}" class="edge-hit" ${attributes} tabindex="0" role="button" aria-label="${state} edge ${escapeXml(edge.key)}"/>`;
    return `${visible}${hit}`;
  };
  const cuts = net.cutEdges.map((edge) => segment(edge, 'cut')).join('\n');
  const folds = net.foldEdges.map((edge) => segment(edge, 'fold')).join('\n');
  const metadata = escapeXml(JSON.stringify({
    generator: 'MagnaMath Rebuilt',
    appVersion: APP_VERSION,
    coreVersion: CORE_VERSION,
    shape: polyhedron.id,
    netSeed: net.seed,
    objective: net.objective,
    overlapFree: net.valid,
    overlapArea: net.overlapArea,
    modelUnitMm: physicalScale ? modelUnitMm : null,
    foldEdgeKeys: [...net.treeEdgeKeys],
    compoundFaceCount: Object.keys(compoundByFace instanceof Map ? Object.fromEntries(compoundByFace) : compoundByFace).length,
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(width)} ${f(height)}"${widthAttribute}${heightAttribute} role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(polyhedron.name)} net</title>
  <description id="description">A two-dimensional net with solid cut lines, dashed fold lines, and overlap diagnostics.</description>
  <metadata>${metadata}</metadata>
  <style>
    .cut { stroke: #13233a; stroke-width: 0.025; stroke-linecap: round; }
    .fold { stroke: #596b84; stroke-width: 0.018; stroke-dasharray: 0.09 0.07; stroke-linecap: round; }
    .cut.is-locked, .fold.is-locked { stroke: #8b5cf6; stroke-width: 0.032; }
    .net-face.has-overlap { fill: #ff5578 !important; fill-opacity: 0.62; }
    .compound-seam { stroke: #34506f; stroke-width: 0.012; stroke-dasharray: 0.035 0.025; pointer-events: none; }
    .edge-hit { stroke: transparent; stroke-width: 0.18; pointer-events: stroke; cursor: pointer; }
    .face-label { fill: #13233a; font: 600 0.2px ui-sans-serif, system-ui, sans-serif; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
    @media print { .cut { stroke-width: 0.2mm; } .fold { stroke-width: 0.16mm; } .edge-hit { display: none; } }
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>
${facePaths}
${compoundMarkup}
${cuts}
${folds}
</svg>`;
}

export function polyhedronToJson(polyhedron, analysis, net, buildability, project = {}) {
  const profileIds = [...new Set(buildability.faceMatches
    .map((entry) => entry.match?.tile.id ?? entry.compound?.tile.id)
    .filter(Boolean))];
  return JSON.stringify({
    schema: SNAPSHOT_SCHEMA,
    schemaVersion: 4,
    appVersion: APP_VERSION,
    coreVersion: CORE_VERSION,
    generatedAt: project.generatedAt ?? new Date().toISOString(),
    polyhedron: {
      id: polyhedron.id,
      name: polyhedron.name,
      family: polyhedron.family,
      vertices: polyhedron.vertices,
      faces: polyhedron.faces,
      metadata: polyhedron.metadata,
    },
    analysis: {
      counts: analysis.counts,
      eulerCharacteristic: analysis.eulerCharacteristic,
      genus: analysis.genus,
      surfaceArea: analysis.surfaceArea,
      volume: analysis.volume,
      edgeStats: analysis.edgeStats,
      validation: {
        valid: analysis.validation.valid,
        issues: analysis.validation.issues,
        warnings: analysis.validation.warnings,
        closed: analysis.topology.closed,
        connected: analysis.topology.connected,
        orientable: analysis.topology.orientable,
        manifold: analysis.topology.manifold,
      },
      faceKinds: analysis.faces.map((face) => ({ faceIndex: face.faceIndex, kind: face.kind, label: face.label })),
    },
    net: {
      seed: net.seed,
      source: net.source,
      objective: net.objective,
      valid: net.valid,
      overlapArea: net.overlapArea,
      overlapPairs: net.overlapPairs,
      score: net.score,
      scoreBreakdown: net.scoreBreakdown,
      rootFace: net.rootFace,
      parentByFace: net.parentByFace,
      transforms: net.transforms,
      foldEdgeKeys: [...net.treeEdgeKeys],
      cutEdgeKeys: [...net.cutEdgeKeys],
      lockedFoldEdgeKeys: [...(project.lockedFoldEdgeKeys ?? [])],
      lockedCutEdgeKeys: [...(project.lockedCutEdgeKeys ?? [])],
    },
    physicalBuild: {
      modelUnitMm: buildability.modelUnitMm,
      confidence: buildability.confidence,
      confidenceLabel: buildability.confidenceLabel,
      profileSchema: TILE_PROFILE_SCHEMA_V2,
      profileIds,
      required: buildability.required,
      shortages: buildability.shortages,
      unsupportedFaces: buildability.unsupported.map((face) => face.faceIndex),
      compoundFaces: (buildability.compoundFaces ?? []).map((entry) => ({
        faceIndex: entry.faceIndex,
        recipeId: entry.compound.id,
        tileId: entry.compound.tile.id,
        pieceCount: entry.compound.pieceCount,
        scaleError: entry.compound.scaleError,
        mechanicalStatus: entry.compound.mechanicalStatus,
      })),
      faceAssignments: buildability.faceMatches.map((entry) => ({
        faceIndex: entry.faceIndex,
        assignmentKind: entry.match ? 'direct' : entry.compound ? 'compound' : 'unsupported',
        tileId: entry.match?.tile.id ?? entry.compound?.tile.id ?? null,
        recipeId: entry.compound?.id ?? null,
        pieceCount: entry.match ? 1 : entry.compound?.pieceCount ?? 0,
        scaleError: entry.match?.scaleError ?? entry.compound?.scaleError ?? null,
        sideError: entry.match?.sideError ?? null,
        angleErrorDegrees: entry.match ? toDegrees(entry.match.angleError) : null,
      })),
      hingeCounts: buildability.hinges?.counts ?? {},
      thicknessClearance: project.thicknessClearance ?? null,
      summary: buildability.summary,
    },
    project: {
      title: project.title ?? `${polyhedron.name} workshop`,
      notes: project.notes ?? '',
      parameter: project.parameter ?? polyhedron.metadata?.parameters?.sides ?? null,
      inventoryPreset: project.inventoryPreset ?? null,
      inventory: project.inventory ?? null,
      tileFamilies: project.tileFamilies ?? null,
      scaleMode: project.scaleMode ?? null,
      customScale: project.customScale ?? null,
      calibrationProfileIds: project.calibrationProfileIds ?? [],
      calibrationProfiles: project.calibrationProfiles ?? [],
      calibrationSessions: project.calibrationSessions ?? [],
      compoundMode: project.compoundMode ?? 'exact',
      clearanceAssumption: project.clearanceAssumption ?? project.thicknessClearance?.assumption ?? 'measured-only',
      printSettings: project.printSettings ?? null,
      localProjectId: project.localProjectId ?? null,
      folding: project.folding ?? null,
      motionClips: project.motionClips ?? [],
      activeMotionClipId: project.activeMotionClipId ?? null,
    },
  }, null, 2);
}

/** Performs strict structural checks before a snapshot is trusted by the UI. */
export function parseSnapshotProject(value) {
  const parsed = typeof value === 'string' ? JSON.parse(value) : structuredClone(value);
  if (!parsed || typeof parsed !== 'object') throw new Error('Project import must contain one JSON object.');
  const isCurrent = parsed.schema === SNAPSHOT_SCHEMA && parsed.schemaVersion === 4;
  const isLegacyV3 = LEGACY_SNAPSHOT_SCHEMAS.includes(parsed.schema) && parsed.schemaVersion === 3;
  const isLegacyV2 = LEGACY_SNAPSHOT_SCHEMAS.includes(parsed.schema) && parsed.schemaVersion === 2;
  if (!isCurrent && !isLegacyV3 && !isLegacyV2) {
    throw new Error('Project is not a supported MagnaMath snapshot v2, v3, or v4 document.');
  }
  if (isLegacyV3 || isLegacyV2) {
    parsed.schema = SNAPSHOT_SCHEMA;
    parsed.schemaVersion = 4;
    parsed.migratedFrom = isLegacyV3 ? 'snapshot/v3' : 'snapshot/v2';
    parsed.project = {
      ...(parsed.project ?? {}),
      calibrationSessions: parsed.project?.calibrationSessions ?? [],
      compoundMode: parsed.project?.compoundMode ?? 'exact',
      clearanceAssumption: parsed.project?.clearanceAssumption ?? 'measured-only',
      printSettings: parsed.project?.printSettings ?? null,
      localProjectId: parsed.project?.localProjectId ?? null,
      folding: parsed.project?.folding ?? null,
      motionClips: parsed.project?.motionClips ?? [],
      activeMotionClipId: parsed.project?.activeMotionClipId ?? null,
    };
  }
  const polyhedron = parsed.polyhedron;
  if (!polyhedron?.id || !polyhedron?.name || !Array.isArray(polyhedron.vertices) || !Array.isArray(polyhedron.faces)) {
    throw new Error('Project polyhedron is missing identity, vertices, or faces.');
  }
  if (polyhedron.vertices.length < 4 || polyhedron.vertices.some((vertex) => !Array.isArray(vertex) || vertex.length !== 3 || vertex.some((coordinate) => !Number.isFinite(coordinate)))) {
    throw new Error('Project contains invalid three-dimensional vertices.');
  }
  if (polyhedron.faces.length < 4 || polyhedron.faces.some((face) => !Array.isArray(face) || face.length < 3 || face.some((index) => !Number.isInteger(index) || index < 0 || index >= polyhedron.vertices.length))) {
    throw new Error('Project contains invalid polygon faces.');
  }
  if (!parsed.net || !Array.isArray(parsed.net.foldEdgeKeys) || !Array.isArray(parsed.net.cutEdgeKeys)) {
    throw new Error('Project is missing the manual net edge state.');
  }
  for (const field of ['foldEdgeKeys', 'cutEdgeKeys', 'lockedFoldEdgeKeys', 'lockedCutEdgeKeys']) {
    const values = parsed.net[field] ?? [];
    if (!Array.isArray(values) || values.some((key) => typeof key !== 'string')) throw new Error(`Project field net.${field} must be an array of edge keys.`);
    if (new Set(values).size !== values.length) throw new Error(`Project field net.${field} contains duplicate edge keys.`);
  }
  if (!Number.isInteger(parsed.net.rootFace) || parsed.net.rootFace < 0 || parsed.net.rootFace >= polyhedron.faces.length) {
    throw new Error('Project root face is out of range.');
  }
  return parsed;
}

/** Produces a printable measurement card without asserting unmeasured geometry. */
export function calibrationSheetToSvg(options = {}) {
  const pageWidthMm = options.pageWidthMm ?? 215.9;
  const pageHeightMm = options.pageHeightMm ?? 279.4;
  const standard = options.standardEdgeMm ?? STANDARD_TILE_EDGE_MM;
  const micro = options.microEdgeMm ?? standard / 2;
  const line = (x1, y1, x2, y2, label) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="measure"/><text x="${(x1 + x2) / 2}" y="${y1 - 3}" class="label">${escapeXml(label)}</text>`;
  const ticks = Array.from({ length: 11 }, (_, index) => {
    const x = 25 + index * 10;
    return `<line x1="${x}" y1="45" x2="${x}" y2="${index % 5 === 0 ? 52 : 49}" class="tick"/><text x="${x}" y="58" class="tiny">${index * 10}</text>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidthMm}mm" height="${pageHeightMm}mm" viewBox="0 0 ${pageWidthMm} ${pageHeightMm}">
  <title>MagnaMath physical tile calibration sheet</title>
  <style>
    text { fill:#111827; font-family:ui-sans-serif,system-ui,sans-serif; }
    .title { font-size:7px; font-weight:700; } .copy { font-size:3.5px; } .label { font-size:3.2px; text-anchor:middle; }
    .tiny { font-size:2.4px; text-anchor:middle; } .measure { stroke:#111827; stroke-width:.35; } .tick { stroke:#475569; stroke-width:.25; }
    .guide { fill:none; stroke:#2563eb; stroke-width:.3; stroke-dasharray:1.5 1; }
  </style>
  <rect width="100%" height="100%" fill="white"/>
  <text x="20" y="20" class="title">MagnaMath tile calibration sheet</text>
  <text x="20" y="28" class="copy">Print at 100% / Actual Size. Disable Fit to Page. Verify the 100 mm ruler before measuring a tile.</text>
  ${line(25, 45, 125, 45, '100 mm verification line')}${ticks}
  <rect x="25" y="75" width="${standard}" height="${standard}" class="guide"/>
  <text x="${25 + standard / 2}" y="${75 + standard + 7}" class="label">Nominal standard square guide · ${f(standard)} mm</text>
  <rect x="125" y="75" width="${micro}" height="${micro}" class="guide"/>
  <text x="${125 + micro / 2}" y="${75 + micro + 7}" class="label">Nominal micro guide · ${f(micro)} mm</text>
  <text x="20" y="178" class="copy">Record three or more samples with calipers when possible. Measure edge-to-edge, thickness, corner radius, and the stable interior-angle range separately.</text>
  <text x="20" y="190" class="copy">Sample 1: ____________________   Sample 2: ____________________   Sample 3: ____________________</text>
  <text x="20" y="202" class="copy">Thickness: ___________________   Corner radius: _______________   Tool/device: __________________</text>
  <text x="20" y="214" class="copy">Stable hinge range: __________° to __________°   Notes: __________________________________________</text>
</svg>`;
}

export function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}
