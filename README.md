# MagnaMath Rebuilt

**Release:** `0.4.0` — *Fold Through Space*  
**Status:** 0.4.0 release candidate; known visual and physical-evidence limitations remain.

**Demo:** https://miethe.github.io/magnamath-lab/ (available after Pages is enabled).

Requires Node.js 22.12 or newer. To install, run, build, and test:

```sh
npm ci
npm run dev
npm run build
npm test
```

MagnaMath is a web-first interactive geometry laboratory that connects exact mathematics to visual exploration, printable nets, and physical magnetic-tile play.

The renderer is never the mathematical authority. Ordered polygon faces, topology, nets, rigid folding, physical matching, print production, motion state, and snapshots live in a dependency-light core that can run in the browser, workers, Node validation, and future native clients.

## Release 0.4.0 highlights

### Exact 2D-to-3D folding

- Builds one rigid-body face mechanism from the selected net’s rooted spanning tree.
- Uses exact hinge axes and signed target rotations—not vertex morphing.
- Defines `0 = flat net` and `1 = exact source solid`.
- Supports Together, Root outward, Leaves inward, Build order, and custom timelines.
- Allows individual hinge selection, manual posing, target snapping, and return to timeline control.
- Keeps every face rigid and every tree hinge coincident throughout motion.

### Spatial interaction foundation

- Separate Inspect, Hinge, Move, and Rotate tools.
- Three.js root translation and rotation through `TransformControls`.
- Semantic face and hinge selection using stable topology identifiers.
- Renderer-independent root poses using rigid 4×4 matrices.
- Normalized quaternion decomposition, composition, and shortest-path interpolation.

### Spatial motion clips

A versioned motion clip can combine:

- global folding progress;
- six-degree-of-freedom root movement;
- per-hinge progress or absolute-angle tracks;
- camera position, target, up, and FOV tracks;
- semantic markers for lessons, narration, and build steps.

The clip core and schema are implemented. Full timeline authoring/playback integration is a receiving-team increment.

### Folding diagnostics

- hinge endpoint continuity;
- rigid-face edge preservation;
- cut-edge closure gap;
- exact target matrix error;
- sampled zero-thickness face collisions.

Sampled collision is not presented as continuous collision detection or physical feasibility.

### Final application design package

The repository includes editable HTML/CSS mockups and PNG references for:

1. Fold Studio;
2. Geometry Explorer;
3. Manual Net Workshop;
4. Physical Build-Along;
5. Learning Lab;
6. Spatial Motion Lab;
7. Mobile Build Mode.

Open `design/mockups/index.html` for the atlas.

### Complete implementation handoff

- architecture and folding-engine specifications;
- interaction-control specification;
- final visual/product design specification;
- implementation backlog and acceptance gates;
- twelve Deep Research briefs;
- schemas, examples, tests, validation logs, and checksums.

## Existing foundation from 0.1–0.3

- 16 validated exact catalog entries and generated families;
- topology, Euler characteristic, genus, area, volume, dihedral angles, and face classification;
- deterministic net generation and manual cut/fold edge surgery;
- required-cut/fold locks, re-rooting, undo/redo, and overlap diagnostics;
- cancellable worker-based Pareto net portfolio search;
- calibrated standard/micro physical profiles and one global scale;
- inventory-aware assignment through minimum-cost flow;
- exact six-triangle compound hexagon panels;
- raw calibration sessions and bounded uncertainty;
- local finite-thickness clearance screening;
- multipage SVG print packages with tabs and calibration rulers;
- IndexedDB projects and snapshot v4;
- dependency-free Canvas fallback plus Three.js renderer adapter.

## Run

### Full Three.js/PWA path

Requires Node.js `22.12+`:

```bash
git clone https://github.com/miethe/magnamath-lab.git
cd magnamath-lab
npm ci
npm run dev
```

Open the address printed by Vite (normally `http://localhost:4173/`). The repository is private; cloning requires access.

### Dependency-free Canvas path

```bash
npm run serve:fallback
```

Open:

```text
http://localhost:4173/?renderer=canvas
```

Useful direct views:

```text
/?renderer=canvas&mode=explore
/?renderer=canvas&mode=fold
/?renderer=canvas&mode=workshop
/?renderer=canvas&mode=build
/?renderer=canvas&mode=learn
```

## Validate

```bash
npm run generate:examples
npm run render:mockups  # optional: requires Python Playwright + Chromium
npm run validate:all
npm run validate:schemas:python
```

Registry-enabled production gate:

```bash
npm ci
npm run build
npm run preview
```

A clean local clone built successfully with Node 22.20.0 and the committed lockfile on 2026-11-05. A successful build alone does not verify browser rendering.

## Primary workflows

### Fold an exact net

1. Open **Fold**.
2. Scrub from the flat net to the exact solid.
3. Choose a sequence or play the timeline.
4. Select **Hinges**, then choose an edge axis.
5. Pose it manually or return it to timeline control.
6. Inspect hinge, closure, target, and sampled collision diagnostics.
7. Use **Move** or **Rotate** to position the whole mechanism in space.

### Design and print a net

1. Open **Workshop**.
2. Change shared edges between cut and fold.
3. Lock required decisions and choose the root face.
4. compare Pareto candidates.
5. Open Print Studio for actual-size, fit, or poster output.
6. Verify the printed ruler before fabrication.

### Build with magnetic tiles

1. Select an inventory preset or custom counts.
2. Calibrate owned pieces where exact dimensions matter.
3. Review the global scale, assignments, shortages, hinge evidence, and bounded clearance.
4. Follow the face-by-face build sequence.
5. Keep “geometrically exact,” “dimensionally matched,” and “physically verified” as separate evidence levels.

### Author future spatial motion

Use `src/core/motion.js` and `schemas/motion-clip-v1.schema.json` to create clips containing root, fold, hinge, and camera tracks. `examples/cube-spatial-motion-clip.json` is a portable reference.

## Project structure

```text
src/core/
  catalog.js                 exact solids and generated families
  polyhedron.js              topology, validation, and measurements
  net.js                     unfolding, editing, local search, Pareto portfolios
  folding.js                 exact tree-hinge forward kinematics
  rigid.js                   rigid matrices and quaternion utilities
  motion.js                  renderer-independent spatial motion clips
  folding-collision.js       bounded sampled collision screen
  folding-diagnostics.js     kinematic and target evidence
  compound.js                exact compound-panel certificates
  tiles.js                   physical profiles, scale, inventory, hinges
  calibration.js             raw sessions and bounded uncertainty
  feasibility.js             local finite-thickness clearance screen
  print.js                   tabs, pagination, SVG/HTML/manifest output
  project-store.js           IndexedDB project library
  export.js                  net SVG and snapshot v4
src/render/
  canvas-renderer.js         dependency-free exact folding fallback
  three-renderer.js          spatial renderer, picking, hinges, transform gizmos
src/workers/
  net-optimizer.worker.js
schemas/
examples/
design/mockups/
research-prompts/
docs/
handoff/
test/
scripts/
```

## Handoff entry point

Begin with [`FULL-HANDOFF-INDEX.md`](FULL-HANDOFF-INDEX.md), then follow the receiving-team checklist in `handoff/`.

## Essential documentation

- [Folding Engine Foundation](docs/21-folding-engine-foundation.md)
- [3D Interaction and Controls](docs/22-3d-interaction-controls.md)
- [Folding Validation](docs/23-folding-validation.md)
- [Final Application Design Specification](docs/24-final-app-design-spec.md)
- [UI Mockup Atlas](docs/25-ui-mockup-atlas.md)
- [Full Implementation Handoff](docs/26-full-implementation-handoff.md)
- [0.4.0 Release Notes](docs/27-release-notes-0.4.0.md)
- [Future Motion and Physics Roadmap](docs/28-future-motion-physics-roadmap.md)
- [Manual Net Workshop](docs/11-manual-net-workshop.md)
- [Physical Calibration](docs/12-physical-calibration.md)
- [Print Production](docs/16-print-production.md)
- [Deep Research Program](docs/13-deep-research-program.md)

## Current limits

- The folding mechanism is an open tree; arbitrary closed-loop constraint projection is future work.
- Collision checks are discrete and zero-thickness.
- Finite-thickness closure, hinge offsets, force, gravity, magnets, and structural stability are not solved.
- Motion clips have a stable core/schema but not the complete production authoring UI.
- Imported concave/nonmanifold models are not a supported production path.
- Net search is bounded heuristic optimization, not a universal optimality proof.
- Camera/AR build verification is not implemented.
- Source code is licensed under MIT; see `LICENSE` and `LICENSE-NOTICE.md` for third-party considerations.
