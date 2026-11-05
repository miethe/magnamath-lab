#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { SHAPE_CATALOG, createShape } from '../src/core/catalog.js';
import { analyzePolyhedron } from '../src/core/polyhedron.js';
import { planNet } from '../src/core/net.js';

const seeds = Math.max(1, Number(process.argv[2] ?? 20));
const started = performance.now();
let total = 0;
let valid = 0;
const rows = [];
for (const entry of SHAPE_CATALOG) {
  const shape = createShape(entry.id, entry.parameter?.default);
  const analysis = analyzePolyhedron(shape);
  let shapeValid = 0;
  let maximumOverlaps = 0;
  const shapeStarted = performance.now();
  for (let seed = 1; seed <= seeds; seed += 1) {
    const net = planNet(shape, analysis, { seed });
    total += 1;
    if (net.valid) {
      valid += 1;
      shapeValid += 1;
    } else {
      maximumOverlaps = Math.max(maximumOverlaps, net.overlapPairs.length);
    }
  }
  rows.push({
    shape: shape.name,
    variants: `${shapeValid}/${seeds}`,
    maximumOverlaps,
    milliseconds: Number((performance.now() - shapeStarted).toFixed(1)),
  });
}
console.table(rows);
console.log(`${valid}/${total} overlap-free nets in ${(performance.now() - started).toFixed(1)} ms.`);
if (valid !== total) process.exitCode = 1;
