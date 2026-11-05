#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

// Serve-root override. A LAN deployment points this at dist/ so ONLY built output is
// reachable; rooting at the repo would otherwise publish .git/, .claude/, node_modules/,
// and every git worktree's in-flight source. Relative values resolve against the repo
// root (not cwd) so `MAGNAMATH_SERVE_ROOT=dist` behaves the same from any directory.
const serveRoot = process.env.MAGNAMATH_SERVE_ROOT
  ? resolve(projectRoot, process.env.MAGNAMATH_SERVE_ROOT)
  : projectRoot;
const publicRoot = join(serveRoot, 'public');
const port = Number(process.env.PORT ?? process.argv.find((value) => /^\d+$/.test(value)) ?? 4173);
// Bind loopback by default. Exposing the whole repo on every interface must be an
// explicit opt-in (HOST=0.0.0.0), not the default it used to silently be.
const host = process.env.HOST ?? '127.0.0.1';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function safePath(root, pathname) {
  const candidate = resolve(root, `.${normalize(pathname)}`);
  // Path-boundary check, not a bare prefix: `/rootsibling` must not pass for root `/root`.
  return candidate === root || candidate.startsWith(root + '/') ? candidate : null;
}

async function locate(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  // Dotfile guard, applied post-decode so `/%2egit/config` and `/x/../.git/config` are
  // caught too. Defense in depth only — pinning serveRoot at dist/ is what actually
  // bounds the served surface, since the non-dot source tree is otherwise browsable.
  if (clean.split('/').some((segment) => segment.startsWith('.'))) {
    return join(serveRoot, 'index.html');
  }
  const roots = clean.startsWith('/icons/') || clean === '/manifest.webmanifest'
    ? [publicRoot, serveRoot]
    : [serveRoot, publicRoot];
  for (const root of roots) {
    const candidate = safePath(root, clean === '/' ? '/index.html' : clean);
    if (!candidate) continue;
    try {
      const metadata = await stat(candidate);
      if (metadata.isFile()) return candidate;
    } catch {
      // Try the next root or the SPA fallback.
    }
  }
  return join(serveRoot, 'index.html');
}

const server = createServer(async (request, response) => {
  try {
    const filePath = await locate(new URL(request.url ?? '/', 'http://localhost').pathname);
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error instanceof Error ? error.stack : String(error));
  }
});

server.listen(port, host, () => {
  // Report the address actually bound. The previous line always claimed 127.0.0.1 while
  // binding 0.0.0.0, understating the exposure to whoever ran it.
  const shown = host === '0.0.0.0' ? '<all interfaces>' : host;
  console.log(`MagnaMath server: root=${serveRoot}`);
  console.log(`  listening on http://${shown}:${port}/ (host=${host})`);
});
