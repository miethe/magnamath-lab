import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true,
    port: 4173,
    strictPort: true,
    forwardConsole: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'MagnaMath — Shape Lab',
        short_name: 'MagnaMath',
        description: 'Explore exact polyhedra, compare Pareto net portfolios, produce calibrated print packages, and plan magnetic-tile builds.',
        theme_color: '#07111f',
        background_color: '#07111f',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json}']
      }
    })
  ]
});
