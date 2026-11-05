#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const examples = resolve(root, 'examples');

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat().sort();
}

async function digestExamples() {
  const result = new Map();
  for (const path of await filesUnder(examples)) {
    const data = await readFile(path);
    result.set(relative(examples, path), createHash('sha256').update(data).digest('hex'));
  }
  return result;
}

function generate() {
  execFileSync(process.execPath, ['scripts/generate-examples.mjs'], {
    cwd: root,
    stdio: 'ignore',
  });
}

function differences(left, right) {
  const names = new Set([...left.keys(), ...right.keys()]);
  return [...names].filter((name) => left.get(name) !== right.get(name));
}

generate();
const first = await digestExamples();
generate();
const second = await digestExamples();
const changed = differences(first, second);
if (changed.length) {
  console.error('Example generation is not reproducible:');
  changed.forEach((name) => console.error(`- ${name}`));
  process.exit(1);
}
console.log(`Reproduced ${first.size} example files byte-for-byte across two generation runs.`);
