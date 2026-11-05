import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHAPE_CATALOG,
  createShape,
  cube,
  dodecahedron,
  icosahedron,
  octahedron,
  tetrahedron,
} from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';
import { analyzeBuildability, INVENTORY_PRESETS } from '../src/core/tiles.js';
import { netToSvg, parseSnapshotProject, polyhedronToJson } from '../src/core/export.js';
import { APP_VERSION, CORE_VERSION, SNAPSHOT_SCHEMA } from '../src/core/version.js';
import { rectify, truncate } from '../src/core/transforms.js';

const platonicExpectations = [
  [tetrahedron, [4, 6, 4]],
  [cube, [8, 12, 6]],
  [octahedron, [6, 12, 8]],
  [dodecahedron, [20, 30, 12]],
  [icosahedron, [12, 30, 20]],
];

test('Platonic solids have their canonical topology', () => {
  for (const [factory, expected] of platonicExpectations) {
    const shape = factory();
    const analysis = analyzePolyhedron(shape);
    assert.deepEqual(
      [analysis.counts.vertices, analysis.counts.edges, analysis.counts.faces],
      expected,
      shape.name,
    );
    assert.equal(analysis.eulerCharacteristic, 2, shape.name);
    assert.equal(analysis.genus, 0, shape.name);
    assert.equal(analysis.validation.valid, true, shape.name);
    assert.equal(analysis.topology.closed, true, shape.name);
    assert.equal(analysis.topology.manifold, true, shape.name);
    assert.equal(analysis.topology.orientable, true, shape.name);
    assert.ok(analysis.edgeStats.relativeSpread < 1e-10, `${shape.name} is edge-uniform`);
  }
});

test('every starter catalog entry is a valid closed sphere-like manifold', () => {
  for (const entry of SHAPE_CATALOG) {
    const shape = createShape(entry.id, entry.parameter?.default);
    const analysis = analyzePolyhedron(shape);
    assert.equal(analysis.validation.valid, true, shape.name);
    assert.equal(analysis.topology.closed, true, shape.name);
    assert.equal(analysis.topology.connected, true, shape.name);
    assert.equal(analysis.topology.manifold, true, shape.name);
    assert.equal(analysis.topology.orientable, true, shape.name);
    assert.equal(analysis.eulerCharacteristic, 2, shape.name);
  }
});

test('uniform transforms produce canonical Archimedean counts', () => {
  const cuboctahedron = rectify(cube(), { id: 'cuboctahedron', name: 'Cuboctahedron' });
  const truncatedCube = truncate(cube(), { id: 'truncated-cube', name: 'Truncated cube' });
  const truncatedIcosahedron = truncate(icosahedron(), { id: 'truncated-icosahedron', name: 'Truncated icosahedron' });
  assert.deepEqual(
    [cuboctahedron.vertices.length, analyzePolyhedron(cuboctahedron).counts.edges, cuboctahedron.faces.length],
    [12, 24, 14],
  );
  assert.deepEqual(
    [truncatedCube.vertices.length, analyzePolyhedron(truncatedCube).counts.edges, truncatedCube.faces.length],
    [24, 36, 14],
  );
  assert.deepEqual(
    [truncatedIcosahedron.vertices.length, analyzePolyhedron(truncatedIcosahedron).counts.edges, truncatedIcosahedron.faces.length],
    [60, 90, 32],
  );
});

test('net planner finds overlap-free layouts for simple and complex solids', () => {
  for (const shapeId of ['tetrahedron', 'cube', 'dodecahedron', 'icosahedron', 'truncated-icosahedron']) {
    const shape = createShape(shapeId);
    const analysis = analyzePolyhedron(shape);
    const net = planNet(shape, analysis, { seed: 23 });
    assert.equal(net.valid, true, shape.name);
    assert.equal(net.overlapPairs.length, 0, shape.name);
    assert.equal(net.treeEdgeKeys.size, shape.faces.length - 1, shape.name);
    assert.equal(net.foldEdges.length, shape.faces.length - 1, shape.name);
  }
});

test('physical tile matching uses dimensions, angles, and inventory counts', () => {
  const cubeAnalysis = analyzePolyhedron(cube());
  const cubeBuild = analyzeBuildability(cubeAnalysis, INVENTORY_PRESETS.classic37.counts);
  assert.equal(cubeBuild.ready, true);
  assert.equal(cubeBuild.required.square, 6);
  assert.equal(cubeBuild.unsupported.length, 0);

  const tetraAnalysis = analyzePolyhedron(tetrahedron());
  const tetraBuild = analyzeBuildability(tetraAnalysis, INVENTORY_PRESETS.classic37.counts);
  assert.equal(tetraBuild.required['equilateral-triangle'], 4);
  assert.equal(tetraBuild.ready, true);

  const dodecaAnalysis = analyzePolyhedron(dodecahedron());
  const dodecaBuild = analyzeBuildability(dodecaAnalysis, INVENTORY_PRESETS.classic100.counts);
  assert.equal(dodecaBuild.geometricallyBuildable, false);
  assert.equal(dodecaBuild.unsupported.length, 12);
});

test('SVG and JSON exports preserve scale and structure', () => {
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 11 });
  const buildability = analyzeBuildability(analysis, INVENTORY_PRESETS.classic37.counts);
  const svg = netToSvg(shape, analysis, net, { physicalScale: true });
  assert.match(svg, /width="[\d.]+mm"/);
  assert.match(svg, /class="cut"/);
  assert.match(svg, /class="fold"/);
  assert.match(svg, /modelUnitMm&quot;:74\.93/);
  assert.match(svg, /data-edge-key=/);

  const parsed = JSON.parse(polyhedronToJson(shape, analysis, net, buildability));
  assert.equal(parsed.schema, SNAPSHOT_SCHEMA);
  assert.equal(parsed.schemaVersion, 4);
  assert.equal(parsed.appVersion, APP_VERSION);
  assert.equal(parsed.coreVersion, CORE_VERSION);
  assert.equal(parsed.polyhedron.id, 'cube');
  assert.equal(parsed.analysis.validation.valid, true);
  assert.equal(parsed.analysis.validation.closed, true);
  assert.equal(parsed.net.valid, true);
  assert.equal(parsed.physicalBuild.required.square, 6);
  const imported = parseSnapshotProject(parsed);
  assert.equal(imported.polyhedron.id, 'cube');
  assert.deepEqual(imported.net.foldEdgeKeys.slice().sort(), [...net.treeEdgeKeys].sort());
  assert.throws(
    () => parseSnapshotProject({ ...parsed, schemaVersion: 1 }),
    /snapshot v2, v3, or v4/i,
  );
});
