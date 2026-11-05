# Release Handoff — MagnaMath 0.4.0

## Release identity

- Version: `0.4.0`
- Name: **Fold Through Space**
- Snapshot: v4
- Folding plan: v1
- Motion clip: v1
- Intended use: full implementation handoff

## Headline capability

MagnaMath now has an exact renderer-independent mechanism that moves a selected net continuously from a flat 2D layout to the exact 3D source solid. It also has the state and math foundation for moving that mechanism through 3D space and authoring future root, hinge, and camera motion.

## Receiving-team starting points

1. `README.md`
2. `docs/21-folding-engine-foundation.md`
3. `docs/22-3d-interaction-controls.md`
4. `docs/24-final-app-design-spec.md`
5. `docs/26-full-implementation-handoff.md`
6. `handoff/HANDOFF-CHECKLIST.md`
7. `design/mockups/index.html`

## Code focal points

- exact mechanism: `src/core/folding.js`;
- rigid transforms: `src/core/rigid.js`;
- spatial choreography: `src/core/motion.js`;
- diagnostics: `src/core/folding-diagnostics.js`;
- Canvas reference: `src/render/canvas-renderer.js`;
- Three.js path: `src/render/three-renderer.js`;
- application integration: `src/main.js`.

## Validation summary

- 39/39 behavioral tests;
- 448 catalog folding poses;
- exact errors near floating-point roundoff;
- 15 schemas compiled;
- seven schema-bearing examples validated;
- 15 generated examples reproducible;
- desktop/mobile Canvas smoke passed;
- seven final UI mockups rendered.

## Required first external gate

The receiving environment must resolve dependencies, create a genuine lockfile, run the production Vite build, and validate the Three.js path across browsers/devices.

## Package rule

The full handoff ZIP contains all source, docs, prompts, schemas, examples, mockup sources/renders, validation evidence, and checksums. No external file from previous releases is required to understand or continue the project.
