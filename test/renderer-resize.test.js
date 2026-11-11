import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasRenderer } from '../src/render/canvas-renderer.js';

test('fallback resizes its buffer without pinning CSS size across load, tab and viewport changes', (t) => {
  let notify;
  let disconnected = false;
  let removed = false;
  let rect = { width: 720, height: 643 };
  const style = {};
  const canvas = {
    style,
    setAttribute() {},
    addEventListener() {},
    getContext: () => ({}),
    remove() { removed = true; },
  };
  const container = {
    querySelector: () => null,
    prepend(element) { assert.equal(element, canvas); },
    getBoundingClientRect: () => rect,
  };
  const replacements = {
    document: { createElement: () => canvas },
    window: { devicePixelRatio: 2 },
    requestAnimationFrame: () => 1,
    ResizeObserver: class {
      constructor(callback) { notify = callback; }
      observe(element) { assert.equal(element, container); }
      disconnect() { disconnected = true; }
    },
  };
  for (const [key, value] of Object.entries(replacements)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => descriptor
      ? Object.defineProperty(globalThis, key, descriptor)
      : delete globalThis[key]);
  }
  const renderer = createCanvasRenderer(container);
  t.after(() => renderer.dispose());
  assert.deepEqual([canvas.width, canvas.height], [1440, 1286]);
  // A temporary zero-size layout, phone resize and return to desktop must recover.
  // Repeat observer deliveries to cover resize feedback, with capped high-DPI buffers.
  for (const [width, height, dpr] of [[0, 0, 2], [372, 523, 3], [720, 643, 1], [720, 643, 2]]) {
    rect = { width, height };
    window.devicePixelRatio = dpr;
    for (let i = 0; i < 10; i += 1) {
      notify();
      assert.deepEqual([canvas.width, canvas.height], [
        Math.round(Math.max(1, width) * Math.min(dpr, 2)),
        Math.round(Math.max(1, height) * Math.min(dpr, 2)),
      ]);
      assert.deepEqual(style, {}, 'buffer resize must leave responsive CSS sizing in control');
    }
  }
  renderer.dispose();
  assert.ok(disconnected && removed);
});
