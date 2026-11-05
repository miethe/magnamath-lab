import { analyzePolyhedron } from './polyhedron.js';
import { searchNetPortfolio } from './net.js';

export class NetOptimizerClient {
  constructor(options = {}) {
    this.workerUrl = options.workerUrl ?? new URL('../workers/net-optimizer.worker.js', import.meta.url);
    this.worker = null;
    this.requestId = 0;
    this.pending = null;
  }

  get supported() {
    return typeof Worker !== 'undefined';
  }

  cancel(reason = 'Optimization cancelled.') {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.pending) {
      const error = new DOMException(reason, 'AbortError');
      this.pending.reject(error);
      this.pending = null;
    }
  }

  async search(polyhedron, options = {}, callbacks = {}) {
    this.cancel('Replaced by a newer optimization request.');
    const requestId = ++this.requestId;

    if (!this.supported || callbacks.forceSynchronous) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const analysis = analyzePolyhedron(polyhedron);
      return searchNetPortfolio(polyhedron, analysis, {
        ...options,
        onProgress: callbacks.onProgress,
      });
    }

    const worker = new Worker(this.workerUrl, { type: 'module', name: 'magnamath-net-optimizer' });
    this.worker = worker;
    return new Promise((resolve, reject) => {
      this.pending = { requestId, resolve, reject };
      worker.addEventListener('message', (event) => {
        const message = event.data;
        if (message?.requestId !== requestId) return;
        if (message.type === 'progress') {
          callbacks.onProgress?.(message.progress);
          return;
        }
        this.pending = null;
        worker.terminate();
        if (this.worker === worker) this.worker = null;
        if (message.type === 'result') {
          resolve(message.result);
        } else {
          const error = new Error(message.error?.message ?? 'Net optimization failed.');
          error.name = message.error?.name ?? 'Error';
          if (message.error?.stack) error.stack = message.error.stack;
          reject(error);
        }
      });
      worker.addEventListener('error', (event) => {
        this.pending = null;
        worker.terminate();
        if (this.worker === worker) this.worker = null;
        reject(event.error ?? new Error(event.message || 'Net optimizer worker failed.'));
      });
      worker.postMessage({ type: 'search', requestId, polyhedron: structuredClone(polyhedron), options });
    });
  }
}
