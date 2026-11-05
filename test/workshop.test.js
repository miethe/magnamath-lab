import test from 'node:test';
import assert from 'node:assert/strict';
import { createShape, cube } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import {
  editNetEdge,
  netFromEdgeKeys,
  planNet,
  rerootNet,
  treeFromEdgeKeys,
} from '../src/core/net.js';

function assertTreeInvariant(analysis, net) {
  assert.equal(net.treeEdgeKeys.size, analysis.faces.length - 1);
  const tree = treeFromEdgeKeys(analysis, net.treeEdgeKeys, net.rootFace);
  assert.equal(tree.order.length, analysis.faces.length);
  assert.equal(new Set(tree.order).size, analysis.faces.length);
}

test('manual edge surgery preserves one connected acyclic hinge tree', () => {
  const shape = cube();
  const analysis = analyzePolyhedron(shape);
  const original = planNet(shape, analysis, { seed: 7 });
  const selectedCut = [...original.cutEdgeKeys][0];
  const result = editNetEdge(shape, analysis, original, selectedCut, 'fold');

  assert.equal(result.edit.changed, true);
  assert.equal(result.net.treeEdgeKeys.has(selectedCut), true);
  assert.equal(result.net.treeEdgeKeys.has(result.edit.removedEdgeKey), false);
  assert.notEqual(result.edit.removedEdgeKey, selectedCut);
  assertTreeInvariant(analysis, result.net);

  const cutAgain = editNetEdge(shape, analysis, result.net, selectedCut, 'cut');
  assert.equal(cutAgain.net.treeEdgeKeys.has(selectedCut), false);
  assert.equal(cutAgain.net.treeEdgeKeys.has(cutAgain.edit.addedEdgeKey), true);
  assertTreeInvariant(analysis, cutAgain.net);
});

test('locked constraints survive automatic optimization and block illegal edits', () => {
  const shape = createShape('truncated-cube');
  const analysis = analyzePolyhedron(shape);
  const initial = planNet(shape, analysis, { seed: 13 });
  const lockedFold = [...initial.treeEdgeKeys][0];
  const lockedCut = [...initial.cutEdgeKeys][0];

  const optimized = planNet(shape, analysis, {
    seed: 99,
    objective: 'buildable',
    requiredFoldEdgeKeys: [lockedFold],
    requiredCutEdgeKeys: [lockedCut],
  });
  assert.equal(optimized.treeEdgeKeys.has(lockedFold), true);
  assert.equal(optimized.treeEdgeKeys.has(lockedCut), false);
  assertTreeInvariant(analysis, optimized);

  assert.throws(
    () => editNetEdge(shape, analysis, optimized, lockedFold, 'cut', { lockedFoldEdgeKeys: [lockedFold] }),
    /locked as a fold/i,
  );
  assert.throws(
    () => editNetEdge(shape, analysis, optimized, lockedCut, 'fold', { lockedCutEdgeKeys: [lockedCut] }),
    /locked as a cut/i,
  );
});

test('re-rooting changes assembly order without changing physical cuts', () => {
  const shape = createShape('dodecahedron');
  const analysis = analyzePolyhedron(shape);
  const original = planNet(shape, analysis, { seed: 17 });
  const newRoot = (original.rootFace + 3) % analysis.faces.length;
  const rerooted = rerootNet(shape, analysis, original, newRoot, { objective: 'classroom' });

  assert.equal(rerooted.rootFace, newRoot);
  assert.deepEqual([...rerooted.treeEdgeKeys].sort(), [...original.treeEdgeKeys].sort());
  assert.equal(rerooted.order[0], newRoot);
  assertTreeInvariant(analysis, rerooted);
});

test('serialized manual fold-edge sets reconstruct deterministically', () => {
  const shape = createShape('prism', 5);
  const analysis = analyzePolyhedron(shape);
  const planned = planNet(shape, analysis, { seed: 41, objective: 'printable' });
  const reconstructed = netFromEdgeKeys(shape, analysis, [...planned.treeEdgeKeys], {
    rootFace: planned.rootFace,
    objective: 'printable',
    source: 'round-trip-test',
  });

  assert.deepEqual([...reconstructed.treeEdgeKeys].sort(), [...planned.treeEdgeKeys].sort());
  assert.deepEqual(reconstructed.parentByFace, planned.parentByFace);
  assert.equal(reconstructed.source, 'round-trip-test');
  assertTreeInvariant(analysis, reconstructed);
});
