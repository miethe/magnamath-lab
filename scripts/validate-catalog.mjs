#!/usr/bin/env node
import { SHAPE_CATALOG, createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';

const rows = [];
let failures = 0;
for (const entry of SHAPE_CATALOG) {
  const parameter = entry.parameter?.default;
  const shape = createShape(entry.id, parameter);
  const analysis = analyzePolyhedron(shape);
  const net = planNet(shape, analysis, { seed: 17 });
  const valid = analysis.validation.valid
    && analysis.topology.closed
    && analysis.topology.manifold
    && analysis.topology.orientable
    && analysis.eulerCharacteristic === 2
    && net.valid;
  if (!valid) failures += 1;
  rows.push({
    shape: shape.name,
    V: analysis.counts.vertices,
    E: analysis.counts.edges,
    F: analysis.counts.faces,
    chi: analysis.eulerCharacteristic,
    edgeSpread: analysis.edgeStats.relativeSpread.toExponential(2),
    net: net.valid ? 'overlap-free' : `${net.overlapPairs.length} overlap(s)`,
    status: valid ? 'PASS' : 'FAIL',
  });
}
console.table(rows);
if (failures) {
  console.error(`${failures} catalog model(s) failed validation.`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${rows.length} exact catalog entries.`);
}
