import { analyzePolyhedron } from '../core/polyhedron.js';
import { searchNetPortfolio } from '../core/net.js';

self.addEventListener('message', (event) => {
  const message = event.data;
  if (message?.type !== 'search') return;
  const { requestId, polyhedron, options } = message;
  try {
    const analysis = analyzePolyhedron(polyhedron);
    const result = searchNetPortfolio(polyhedron, analysis, {
      ...options,
      onProgress: (progress) => self.postMessage({ type: 'progress', requestId, progress }),
    });
    self.postMessage({ type: 'result', requestId, result });
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId,
      error: {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
    });
  }
});
