#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { SHAPE_CATALOG, createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { editNetEdge, netFromEdgeKeys, planNet, rerootNet, treeFromEdgeKeys } from '../src/core/net.js';

const started = performance.now();
const rows = [];
let operations = 0;
let overlapFree = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertTree(analysis, net, label) {
  assert(net.treeEdgeKeys.size === analysis.faces.length - 1, `${label}: expected F-1 fold edges.`);
  const tree = treeFromEdgeKeys(analysis, net.treeEdgeKeys, net.rootFace);
  assert(tree.order.length === analysis.faces.length, `${label}: fold tree does not reach every face.`);
}

for (const entry of SHAPE_CATALOG) {
  const shape = createShape(entry.id, entry.parameter?.default);
  const analysis = analyzePolyhedron(shape);
  const base = planNet(shape, analysis, { seed: 19, objective: 'compact' });
  assertTree(analysis, base, `${shape.name} base`);
  let shapeOperations = 0;
  let shapeOverlapFree = 0;

  for (const edgeKey of base.cutEdgeKeys) {
    const result = editNetEdge(shape, analysis, base, edgeKey, 'fold');
    assert(result.net.treeEdgeKeys.has(edgeKey), `${shape.name}: requested cut→fold was not applied for ${edgeKey}.`);
    assertTree(analysis, result.net, `${shape.name} cut→fold ${edgeKey}`);
    shapeOperations += 1;
    if (result.net.valid) shapeOverlapFree += 1;
  }
  for (const edgeKey of base.treeEdgeKeys) {
    const result = editNetEdge(shape, analysis, base, edgeKey, 'cut');
    assert(!result.net.treeEdgeKeys.has(edgeKey), `${shape.name}: requested fold→cut was not applied for ${edgeKey}.`);
    assertTree(analysis, result.net, `${shape.name} fold→cut ${edgeKey}`);
    shapeOperations += 1;
    if (result.net.valid) shapeOverlapFree += 1;
  }

  const lockedFold = [...base.treeEdgeKeys][0];
  const lockedCut = [...base.cutEdgeKeys][0];
  const constrained = planNet(shape, analysis, {
    seed: 127,
    objective: 'buildable',
    requiredFoldEdgeKeys: [lockedFold],
    requiredCutEdgeKeys: [lockedCut],
  });
  assert(constrained.treeEdgeKeys.has(lockedFold), `${shape.name}: optimizer lost locked fold.`);
  assert(!constrained.treeEdgeKeys.has(lockedCut), `${shape.name}: optimizer violated locked cut.`);
  assertTree(analysis, constrained, `${shape.name} constrained`);

  const rerooted = rerootNet(shape, analysis, constrained, analysis.faces.length - 1);
  assertTree(analysis, rerooted, `${shape.name} rerooted`);
  assert([...rerooted.treeEdgeKeys].every((key) => constrained.treeEdgeKeys.has(key)), `${shape.name}: reroot changed cuts.`);

  const reconstructed = netFromEdgeKeys(shape, analysis, [...constrained.treeEdgeKeys], {
    rootFace: constrained.rootFace,
    objective: constrained.objective,
  });
  assertTree(analysis, reconstructed, `${shape.name} reconstructed`);

  operations += shapeOperations;
  overlapFree += shapeOverlapFree;
  rows.push({
    shape: shape.name,
    faces: analysis.faces.length,
    editableEdges: shapeOperations,
    overlapFreeEdits: `${shapeOverlapFree}/${shapeOperations}`,
    constrainedNet: constrained.valid ? 'overlap-free' : `${constrained.overlapPairs.length} overlap(s)`,
  });
}

console.table(rows);
console.log(`${operations} manual edge exchanges preserved the spanning-tree invariant; ${overlapFree}/${operations} were also overlap-free.`);
console.log(`Workshop validation completed in ${(performance.now() - started).toFixed(1)} ms.`);
