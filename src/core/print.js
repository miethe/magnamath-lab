import {
  apply2,
  bounds2,
  convexIntersectionArea2,
  polygonArea2,
} from './math.js';
import { APP_VERSION, CORE_VERSION } from './version.js';
import { compoundInternalSegments } from './compound.js';

export const PRINT_PAGE_PRESETS = Object.freeze({
  letter: { id: 'letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4 },
  legal: { id: 'legal', label: 'US Legal', widthMm: 215.9, heightMm: 355.6 },
  tabloid: { id: 'tabloid', label: 'US Tabloid', widthMm: 279.4, heightMm: 431.8 },
  a4: { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  a3: { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
});

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
const format = (value) => Number(value.toFixed(4));

function pageDimensions(presetId, orientation) {
  const preset = PRINT_PAGE_PRESETS[presetId] ?? PRINT_PAGE_PRESETS.letter;
  if (orientation === 'landscape') return { ...preset, widthMm: preset.heightMm, heightMm: preset.widthMm, orientation };
  return { ...preset, orientation: 'portrait' };
}

function polygonCentroid(polygon) {
  return polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / Math.max(1, polygon.length));
}

function tabForSegment(segment, facePolygon, depthModelUnits, shoulderRatio = 0.18) {
  const [x1, y1] = segment.from;
  const [x2, y2] = segment.to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length <= 1e-9) return null;
  const ux = dx / length;
  const uy = dy / length;
  const orientation = Math.sign(polygonArea2(facePolygon)) || 1;
  const outward = orientation > 0 ? [uy, -ux] : [-uy, ux];
  const depth = Math.min(depthModelUnits, length * 0.34);
  const shoulder = Math.min(length * shoulderRatio, depth * 0.72, length * 0.28);
  const outerFrom = [x1 + ux * shoulder + outward[0] * depth, y1 + uy * shoulder + outward[1] * depth];
  const outerTo = [x2 - ux * shoulder + outward[0] * depth, y2 - uy * shoulder + outward[1] * depth];
  return {
    edgeKey: segment.key,
    faceIndex: segment.faceIndex,
    localEdgeIndex: segment.localEdgeIndex,
    baseFrom: segment.from,
    baseTo: segment.to,
    polygon: [segment.from, segment.to, outerTo, outerFrom],
    outerSegments: [
      [segment.from, outerFrom],
      [outerFrom, outerTo],
      [outerTo, segment.to],
    ],
    depthModelUnits: depth,
  };
}

function collisionArea(tab, net, selectedTabs = []) {
  let area = 0;
  net.polygons.forEach((polygon, faceIndex) => {
    if (faceIndex === tab.faceIndex) return;
    area += convexIntersectionArea2(tab.polygon, polygon, 1e-7);
  });
  selectedTabs.forEach((other) => {
    area += convexIntersectionArea2(tab.polygon, other.polygon, 1e-7);
  });
  return area;
}

/** Chooses the less-colliding side of every cut edge and reports unsafe tabs. */
export function createGlueTabs(net, options = {}) {
  const modelUnitMm = Number(options.modelUnitMm);
  if (!(modelUnitMm > 0)) throw new Error('Glue tabs require a positive physical model scale.');
  const depthMm = Math.max(2, Number(options.tabDepthMm ?? 8));
  const depthModelUnits = depthMm / modelUnitMm;
  const byKey = new Map();
  net.cutEdges.forEach((segment) => {
    if (!byKey.has(segment.key)) byKey.set(segment.key, []);
    byKey.get(segment.key).push(segment);
  });

  const tabs = [];
  const omitted = [];
  const collisions = [];
  const sortedGroups = [...byKey.entries()].sort(([left], [right]) => left.localeCompare(right));
  for (const [edgeKey, segments] of sortedGroups) {
    const candidates = segments
      .map((segment) => tabForSegment(segment, net.polygons[segment.faceIndex], depthModelUnits, options.shoulderRatio))
      .filter(Boolean)
      .map((tab) => ({ tab, collisionArea: collisionArea(tab, net, tabs) }))
      .sort((left, right) => left.collisionArea - right.collisionArea || left.tab.faceIndex - right.tab.faceIndex);
    if (!candidates.length) {
      omitted.push({ edgeKey, reason: 'No non-degenerate tab geometry could be generated.' });
      continue;
    }
    const selected = candidates[0];
    if (selected.collisionArea > (options.maximumCollisionArea ?? 1e-6) && options.omitCollidingTabs) {
      omitted.push({ edgeKey, reason: 'Every possible tab overlaps a face or an earlier tab.', collisionArea: selected.collisionArea });
      continue;
    }
    selected.tab.collisionArea = selected.collisionArea;
    selected.tab.warning = selected.collisionArea > (options.maximumCollisionArea ?? 1e-6);
    if (selected.tab.warning) collisions.push({ edgeKey, faceIndex: selected.tab.faceIndex, collisionArea: selected.collisionArea });
    tabs.push(selected.tab);
  }
  return { tabs, omitted, collisions, depthMm };
}

function combinedGeometryBounds(net, tabs) {
  const points = [...net.polygons.flat(), ...tabs.flatMap((tab) => tab.polygon)];
  return bounds2(points);
}

function chooseOrientation(presetId, requested, geometryWidthMm, geometryHeightMm, marginMm, overlapMm, mode) {
  if (requested !== 'auto') return requested;
  const evaluate = (orientation) => {
    const page = pageDimensions(presetId, orientation);
    const usableWidth = page.widthMm - marginMm * 2;
    const usableHeight = page.heightMm - marginMm * 2;
    if (mode === 'fit') {
      const scale = Math.min(usableWidth / geometryWidthMm, usableHeight / geometryHeightMm, 1);
      return { orientation, pages: 1, scale };
    }
    const stepX = Math.max(1, usableWidth - overlapMm);
    const stepY = Math.max(1, usableHeight - overlapMm);
    const columns = geometryWidthMm <= usableWidth ? 1 : Math.ceil((geometryWidthMm - overlapMm) / stepX);
    const rows = geometryHeightMm <= usableHeight ? 1 : Math.ceil((geometryHeightMm - overlapMm) / stepY);
    return { orientation, pages: columns * rows, scale: 1 };
  };
  const portrait = evaluate('portrait');
  const landscape = evaluate('landscape');
  if (portrait.pages !== landscape.pages) return portrait.pages < landscape.pages ? 'portrait' : 'landscape';
  return portrait.scale >= landscape.scale ? 'portrait' : 'landscape';
}

/** Calculates exact-size, fit-to-page, or tiled poster pagination. */
export function layoutNetForPrint(net, options = {}) {
  const modelUnitMm = Number(options.modelUnitMm);
  if (!(modelUnitMm > 0)) throw new Error('Print layout requires a positive modelUnitMm value.');
  const tabs = options.tabs ?? [];
  const geometryBounds = combinedGeometryBounds(net, tabs);
  const geometryWidthMm = geometryBounds.width * modelUnitMm;
  const geometryHeightMm = geometryBounds.height * modelUnitMm;
  const presetId = options.pagePreset ?? 'letter';
  const marginMm = Math.max(0, Number(options.marginMm ?? 10));
  const overlapMm = Math.max(0, Number(options.posterOverlapMm ?? 8));
  const mode = ['actual', 'fit', 'poster'].includes(options.mode) ? options.mode : 'actual';
  const orientation = chooseOrientation(presetId, options.orientation ?? 'auto', geometryWidthMm, geometryHeightMm, marginMm, overlapMm, mode);
  const page = pageDimensions(presetId, orientation);
  const usableWidthMm = Math.max(1, page.widthMm - marginMm * 2);
  const usableHeightMm = Math.max(1, page.heightMm - marginMm * 2);

  let printScale = 1;
  let effectiveMode = mode;
  if (mode === 'fit') {
    printScale = Math.min(usableWidthMm / geometryWidthMm, usableHeightMm / geometryHeightMm);
    if (!options.allowEnlarge) printScale = Math.min(1, printScale);
  } else if (mode === 'actual' && geometryWidthMm <= usableWidthMm && geometryHeightMm <= usableHeightMm) {
    printScale = 1;
  } else if (mode === 'actual') {
    effectiveMode = 'poster';
  }
  if (Number.isFinite(options.customPrintScale) && options.customPrintScale > 0) printScale = options.customPrintScale;

  const scaledWidthMm = geometryWidthMm * printScale;
  const scaledHeightMm = geometryHeightMm * printScale;
  const stepX = Math.max(1, usableWidthMm - overlapMm);
  const stepY = Math.max(1, usableHeightMm - overlapMm);
  const columns = effectiveMode === 'poster' && scaledWidthMm > usableWidthMm
    ? Math.ceil((scaledWidthMm - overlapMm) / stepX)
    : 1;
  const rows = effectiveMode === 'poster' && scaledHeightMm > usableHeightMm
    ? Math.ceil((scaledHeightMm - overlapMm) / stepY)
    : 1;
  const pages = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      pages.push({
        index: pages.length,
        row,
        column,
        cropXmm: column * stepX,
        cropYmm: row * stepY,
        cropWidthMm: usableWidthMm,
        cropHeightMm: usableHeightMm,
      });
    }
  }

  return {
    page,
    orientation,
    mode: effectiveMode,
    requestedMode: mode,
    modelUnitMm,
    printScale,
    effectiveModelUnitMm: modelUnitMm * printScale,
    trueScale: Math.abs(printScale - 1) <= 1e-9,
    marginMm,
    overlapMm,
    usableWidthMm,
    usableHeightMm,
    geometryBounds,
    geometryWidthMm,
    geometryHeightMm,
    scaledWidthMm,
    scaledHeightMm,
    columns,
    rows,
    pages,
  };
}

function edgeCodeMap(net) {
  const keys = [...new Set(net.cutEdges.map((edge) => edge.key))].sort();
  return new Map(keys.map((key, index) => [key, `C${index + 1}`]));
}

function transformPoint(point, layout) {
  const bounds = layout.geometryBounds;
  return [
    (point[0] - bounds.minX) * layout.effectiveModelUnitMm,
    (bounds.maxY - point[1]) * layout.effectiveModelUnitMm,
  ];
}

function lineSvg(from, to, className, attributes = '') {
  return `<line x1="${format(from[0])}" y1="${format(from[1])}" x2="${format(to[0])}" y2="${format(to[1])}" class="${className}" ${attributes}/>`;
}

function calibrationRulerSvg(layout, options = {}) {
  if (options.calibrationRuler === false) return '';
  const lengthMm = Math.max(10, Number(options.calibrationRulerMm ?? 50));
  const x = Math.max(4, layout.marginMm);
  const y = Math.max(4.2, Math.min(layout.marginMm * 0.48, 7));
  const majorStep = 10;
  const tickCount = Math.floor(lengthMm / majorStep);
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => {
    const tickX = x + index * majorStep;
    return `<path d="M${format(tickX)},${format(y - 1.25)}v2.5"/><text x="${format(tickX)}" y="${format(y - 1.8)}" class="ruler-number">${index * majorStep}</text>`;
  }).join('');
  return `<g class="calibration-ruler" aria-label="${format(lengthMm)} millimetre print verification ruler"><path d="M${format(x)},${format(y)}h${format(lengthMm)}"/>${ticks}<text x="${format(x + lengthMm / 2)}" y="${format(y + 3.3)}" class="ruler-label">${format(lengthMm)} mm print check</text></g>`;
}

function pageSvg(polyhedron, analysis, net, tabsResult, layout, page, options) {
  const pageId = `page-${page.index + 1}`;
  const tabHostKeys = new Set(tabsResult.tabs.map((tab) => `${tab.edgeKey}@${tab.faceIndex}:${tab.localEdgeIndex}`));
  const cutCodes = edgeCodeMap(net);
  const faceMarkup = net.polygons.map((polygon, faceIndex) => {
    const points = polygon.map((point) => transformPoint(point, layout)).map(([x, y]) => `${format(x)},${format(y)}`).join(' ');
    const centroid = transformPoint(polygonCentroid(polygon), layout);
    return `<polygon points="${points}" class="face face-${analysis.faces[faceIndex].kind}"/>${options.labelFaces === false ? '' : `<text x="${format(centroid[0])}" y="${format(centroid[1])}" class="face-label">${faceIndex + 1}</text>`}`;
  }).join('\n');

  const compoundByFace = options.compoundByFace ?? {};
  const compoundMarkup = analysis.faces.map((_, faceIndex) => {
    const compound = compoundByFace instanceof Map ? compoundByFace.get(faceIndex) : compoundByFace[faceIndex];
    if (!compound) return '';
    return compoundInternalSegments(compound).map((seam) => {
      const from = transformPoint(apply2(net.transforms[faceIndex], seam.from), layout);
      const to = transformPoint(apply2(net.transforms[faceIndex], seam.to), layout);
      return lineSvg(from, to, 'compound-seam', `data-compound-face="${faceIndex}" data-compound-seam="${seam.seamIndex}"`);
    }).join('');
  }).join('\n');

  const tabMarkup = tabsResult.tabs.map((tab) => {
    const polygon = tab.polygon.map((point) => transformPoint(point, layout)).map(([x, y]) => `${format(x)},${format(y)}`).join(' ');
    const outer = tab.outerSegments.map(([from, to]) => lineSvg(transformPoint(from, layout), transformPoint(to, layout), tab.warning ? 'tab-cut tab-warning' : 'tab-cut')).join('');
    const base = lineSvg(transformPoint(tab.baseFrom, layout), transformPoint(tab.baseTo, layout), 'tab-fold');
    return `<polygon points="${polygon}" class="tab-fill${tab.warning ? ' tab-warning-fill' : ''}"/>${outer}${base}`;
  }).join('\n');

  const cuts = net.cutEdges.map((edge) => {
    const hostKey = `${edge.key}@${edge.faceIndex}:${edge.localEdgeIndex}`;
    if (tabHostKeys.has(hostKey)) return '';
    const from = transformPoint(edge.from, layout);
    const to = transformPoint(edge.to, layout);
    const line = lineSvg(from, to, 'cut', `data-edge-key="${escapeXml(edge.key)}"`);
    if (options.labelCutPairs === false) return line;
    const midpoint = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    return `${line}<text x="${format(midpoint[0])}" y="${format(midpoint[1] - 1.4)}" class="edge-label">${cutCodes.get(edge.key)}</text>`;
  }).join('\n');
  const folds = net.foldEdges.map((edge) => lineSvg(transformPoint(edge.from, layout), transformPoint(edge.to, layout), 'fold', `data-edge-key="${escapeXml(edge.key)}"`)).join('\n');

  const cropMarks = options.cropMarks === false ? '' : `
    <path class="crop-mark" d="M${layout.marginMm - 4},${layout.marginMm}h3 M${layout.marginMm},${layout.marginMm - 4}v3
      M${layout.page.widthMm - layout.marginMm + 4},${layout.marginMm}h-3 M${layout.page.widthMm - layout.marginMm},${layout.marginMm - 4}v3
      M${layout.marginMm - 4},${layout.page.heightMm - layout.marginMm}h3 M${layout.marginMm},${layout.page.heightMm - layout.marginMm + 4}v-3
      M${layout.page.widthMm - layout.marginMm + 4},${layout.page.heightMm - layout.marginMm}h-3 M${layout.page.widthMm - layout.marginMm},${layout.page.heightMm - layout.marginMm + 4}v-3"/>`;
  const registration = options.registrationMarks === false || layout.pages.length === 1 ? '' : `
    <g class="registration"><circle cx="${layout.marginMm + 4}" cy="${layout.page.heightMm - layout.marginMm - 4}" r="2"/><path d="M${layout.marginMm + 1},${layout.page.heightMm - layout.marginMm - 4}h6M${layout.marginMm + 4},${layout.page.heightMm - layout.marginMm - 7}v6"/></g>`;
  const calibrationRuler = calibrationRulerSvg(layout, options);
  const metadata = escapeXml(JSON.stringify({
    generator: 'MagnaMath Rebuilt',
    appVersion: APP_VERSION,
    coreVersion: CORE_VERSION,
    polyhedronId: polyhedron.id,
    page: page.index + 1,
    pageCount: layout.pages.length,
    printScale: layout.printScale,
    trueScale: layout.trueScale,
    modelUnitMm: layout.modelUnitMm,
    tabWarnings: tabsResult.collisions.length,
  }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${format(layout.page.widthMm)}mm" height="${format(layout.page.heightMm)}mm" viewBox="0 0 ${format(layout.page.widthMm)} ${format(layout.page.heightMm)}" role="img" aria-labelledby="${pageId}-title">
  <title id="${pageId}-title">${escapeXml(polyhedron.name)} net · page ${page.index + 1} of ${layout.pages.length}</title>
  <metadata>${metadata}</metadata>
  <defs><clipPath id="${pageId}-clip"><rect x="${layout.marginMm}" y="${layout.marginMm}" width="${layout.usableWidthMm}" height="${layout.usableHeightMm}"/></clipPath></defs>
  <style>
    .page-bg{fill:#fff}.face{fill:#eef4fb;stroke:none}.face-label{font:600 3.2px ui-sans-serif,system-ui,sans-serif;text-anchor:middle;dominant-baseline:central;fill:#1f2937}
    .cut,.tab-cut{stroke:#111827;stroke-width:.28;fill:none;stroke-linecap:round}.fold,.tab-fold{stroke:#64748b;stroke-width:.22;stroke-dasharray:1.7 1.25;fill:none}.compound-seam{stroke:#64748b;stroke-width:.18;stroke-dasharray:.8 .6;fill:none}
    .tab-fill{fill:#f8fafc;stroke:none}.tab-warning-fill{fill:#fff1f2}.tab-warning{stroke:#be123c}.edge-label{font:500 2.3px ui-monospace,SFMono-Regular,monospace;text-anchor:middle;fill:#334155;paint-order:stroke;stroke:#fff;stroke-width:1.2}
    .crop-mark,.registration{stroke:#475569;stroke-width:.18;fill:none}.page-label{font:500 2.5px ui-sans-serif,system-ui,sans-serif;fill:#64748b;text-anchor:middle}
    .calibration-ruler{stroke:#111827;stroke-width:.2;fill:none}.ruler-number{font:500 1.65px ui-monospace,SFMono-Regular,monospace;text-anchor:middle;fill:#334155;stroke:none}.ruler-label{font:500 1.85px ui-sans-serif,system-ui,sans-serif;text-anchor:middle;fill:#334155;stroke:none}
  </style>
  <rect class="page-bg" width="100%" height="100%"/>
  <g clip-path="url(#${pageId}-clip)" transform="translate(${format(layout.marginMm - page.cropXmm)} ${format(layout.marginMm - page.cropYmm)})">
    ${faceMarkup}${compoundMarkup}${tabMarkup}${cuts}${folds}
  </g>
${cropMarks}${registration}${calibrationRuler}
  <text x="${format(layout.page.widthMm / 2)}" y="${format(layout.page.heightMm - 3.5)}" class="page-label">${escapeXml(polyhedron.name)} · ${page.index + 1}/${layout.pages.length} · ${layout.trueScale ? '100% actual size' : `${format(layout.printScale * 100)}% scale`}</text>
</svg>`;
}

/** Produces all SVG pages plus layout and tab diagnostics. */
export function createPrintPackage(polyhedron, analysis, net, options = {}) {
  const tabsResult = options.glueTabs === false
    ? { tabs: [], omitted: [], collisions: [], depthMm: 0 }
    : createGlueTabs(net, options);
  const layout = layoutNetForPrint(net, { ...options, tabs: tabsResult.tabs });
  const pages = layout.pages.map((page) => ({
    ...page,
    filename: `${polyhedron.id}-net-page-${String(page.index + 1).padStart(2, '0')}.svg`,
    svg: pageSvg(polyhedron, analysis, net, tabsResult, layout, page, options),
  }));
  const warnings = [];
  if (!layout.trueScale) warnings.push(`Output is scaled to ${format(layout.printScale * 100)}%; physical dimensions are not actual size.`);
  if (tabsResult.collisions.length) warnings.push(`${tabsResult.collisions.length} glue tab${tabsResult.collisions.length === 1 ? '' : 's'} overlap existing geometry and are highlighted.`);
  if (tabsResult.omitted.length) warnings.push(`${tabsResult.omitted.length} glue tab${tabsResult.omitted.length === 1 ? '' : 's'} could not be placed.`);
  if (!net.valid) warnings.push('The source net contains overlapping faces.');
  return { layout, tabs: tabsResult, pages, warnings };
}

export function printPackageToHtml(polyhedron, printPackage, options = {}) {
  const title = `${polyhedron.name} · MagnaMath print package`;
  const pageCss = `@page{size:${format(printPackage.layout.page.widthMm)}mm ${format(printPackage.layout.page.heightMm)}mm;margin:0}`;
  const pages = printPackage.pages.map((page) => `<section class="sheet">${page.svg}</section>`).join('\n');
  const warnings = printPackage.warnings.length
    ? `<aside class="screen-only warnings"><strong>Review before printing</strong><ul>${printPackage.warnings.map((warning) => `<li>${escapeXml(warning)}</li>`).join('')}</ul></aside>`
    : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeXml(title)}</title><style>
${pageCss}
*{box-sizing:border-box}html,body{margin:0;background:#dbe4ef;font-family:ui-sans-serif,system-ui,sans-serif}.sheet{width:${format(printPackage.layout.page.widthMm)}mm;height:${format(printPackage.layout.page.heightMm)}mm;margin:8mm auto;background:white;box-shadow:0 2mm 8mm #0f172a33;break-after:page;page-break-after:always}.sheet svg{display:block;width:100%;height:100%}.warnings{max-width:760px;margin:20px auto;padding:16px 20px;background:#fff;border-radius:12px;color:#172033}.warnings strong{display:block;margin-bottom:6px}.warnings li{margin:4px 0}@media print{html,body{background:white}.sheet{margin:0;box-shadow:none}.screen-only{display:none}}
</style></head><body>${warnings}${pages}</body></html>`;
}

export function printPackageManifest(polyhedron, printPackage, options = {}) {
  return JSON.stringify({
    schema: 'https://magnamath.app/schema/print-package/v1',
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    appVersion: APP_VERSION,
    coreVersion: CORE_VERSION,
    polyhedron: { id: polyhedron.id, name: polyhedron.name },
    layout: printPackage.layout,
    tabs: {
      count: printPackage.tabs.tabs.length,
      collisions: printPackage.tabs.collisions,
      omitted: printPackage.tabs.omitted,
    },
    warnings: printPackage.warnings,
    files: printPackage.pages.map((page) => page.filename),
  }, null, 2);
}
