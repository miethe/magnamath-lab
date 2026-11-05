#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';

function resolvePointer(document, pointer) {
  if (pointer === '#') return document;
  if (!pointer.startsWith('#/')) return null;
  return pointer.slice(2).split('/').reduce((value, segment) => {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    return value?.[key];
  }, document);
}

function visit(value, callback) {
  if (!value || typeof value !== 'object') return;
  callback(value);
  if (Array.isArray(value)) value.forEach((item) => visit(item, callback));
  else Object.values(value).forEach((item) => visit(item, callback));
}

const roots = [new URL('../schemas/', import.meta.url), new URL('../examples/', import.meta.url)];
let documents = 0;
let internalRefs = 0;
const schemaIds = new Set();
for (const root of roots) {
  const files = (await readdir(root, { recursive: true })).filter((filename) => filename.endsWith('.json'));
  for (const filename of files) {
    const document = JSON.parse(await readFile(new URL(filename, root), 'utf8'));
    documents += 1;
    if (root.pathname.endsWith('/schemas/')) {
      if (!document.$id || !document.$schema) throw new Error(`${filename}: schema lacks $id or $schema.`);
      if (schemaIds.has(document.$id)) throw new Error(`${filename}: duplicate schema $id ${document.$id}.`);
      schemaIds.add(document.$id);
      visit(document, (node) => {
        if (typeof node.$ref === 'string' && node.$ref.startsWith('#')) {
          internalRefs += 1;
          if (resolvePointer(document, node.$ref) == null) throw new Error(`${filename}: unresolved internal reference ${node.$ref}.`);
        }
      });
    }
  }
}
console.log(`Parsed ${documents} JSON documents, ${schemaIds.size} unique schema IDs, and ${internalRefs} resolvable internal references.`);
