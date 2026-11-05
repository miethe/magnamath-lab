# Full Implementation Handoff

## 1. Handoff objective

This release is intended to be the final architecture-and-foundation package before a dedicated implementation team takes ownership. It includes executable geometry/folding code, schemas, tests, UI mockups, design guidance, research prompts, validation evidence, examples, and an implementation backlog.

## 2. What is production-meaningful now

- authoritative ordered-polygon geometry kernel;
- exact topology and metric analysis;
- deterministic net generation and constrained manual workshop;
- worker-based candidate portfolio search;
- exact tree-hinge 2D-to-3D forward kinematics;
- renderer-independent folding state and spatial motion clips;
- Canvas folding renderer;
- Three.js scene-graph renderer source with face, hinge, camera, and root controls;
- sampled zero-thickness collision diagnostics;
- calibrated physical tile profiles and global assignment;
- exact compound hexagon recipe;
- print-package generation;
- project persistence and snapshot v4;
- responsive integrated application shell;
- full final-product mockup atlas.

## 3. What must not be overstated

The release does not yet prove:

- a continuous collision-free folding path;
- finite-thickness closure;
- arbitrary closed-loop rigid-origami solvability;
- magnetic holding force or structural stability;
- camera recognition accuracy;
- WebXR usability;
- production browser compatibility of the Three.js dependency path in this sandbox.

## 4. Recommended implementation sequence

### Epic A — production renderer and interaction hardening

1. Resolve dependencies and commit a real lockfile.
2. Add continuous integration for tests, schemas, build, and browser smoke.
3. Exercise Three.js on Chromium, Safari, Firefox, iPadOS, and representative mobile hardware.
4. Replace OrbitControls with or evaluate ArcballControls for advanced inspection.
5. Complete semantic picking, keyboard controls, and screen-reader scene outline.
6. Integrate motion-clip playback into renderer and UI.
7. Add camera-track playback and keyframe recording.

### Epic B — continuous geometric feasibility

1. Implement broad-phase swept bounds.
2. Add continuous triangle/polygon collision queries.
3. Establish adaptive temporal subdivision.
4. Add path-search interface over hinge-angle space.
5. Create benchmark corpus and replayable failing cases.
6. Keep static overlap, sampled collision, and continuous path results separate.

### Epic C — thick physical panels

1. Ingest measured hinge-axis offsets and panel thickness.
2. Create offset face/collider geometry.
3. Solve target closure with hinge offsets.
4. Validate against physical fixtures.
5. Introduce evidence tiers and uncertainty propagation.

### Epic D — generalized mechanisms and inverse kinematics

1. Add constraint graph independent of the net tree.
2. Implement loop-closure residuals and Jacobians.
3. Project direct manipulation onto valid configurations.
4. Add branch/solution selection and singularity handling.
5. Support partial closure and locked hinge subsets.

### Epic E — learning and authoring

1. Lesson content schema and authoring environment.
2. Motion/narration markers.
3. concept graph, mastery, and misconception feedback.
4. teacher assignments and shareable states.
5. accessibility validation with representative learners.

### Epic F — physical and spatial companion

1. camera recognition proof of concept;
2. tabletop anchoring;
3. ghost-piece guidance;
4. build-state reconciliation;
5. optional SwiftUI/RealityKit companion after evidence supports the value.

## 5. Definition of done for the next implementation milestone

- Registry-backed clean install and production build pass.
- Three.js folding visually matches Canvas/core poses at deterministic checkpoints.
- Root move/rotate and hinge drag survive snapshot round-trip.
- Motion clips play root, fold, hinge, and camera tracks.
- Keyboard users can perform every core folding action.
- Automated browser tests cover desktop and 390 px mobile.
- No uncaught console errors.
- Performance maintains 60 fps on the agreed reference catalog/hardware or degrades predictably.
- All physical claims use the evidence vocabulary from the design spec.

## 6. Repository map

```text
src/core/
  catalog.js                 exact source models
  polyhedron.js              topology and measurements
  net.js                     unfolding and workshop operations
  folding.js                 exact tree-hinge mechanism
  rigid.js                   rigid matrices and quaternions
  motion.js                  spatial motion clips
  folding-collision.js       bounded sampled collisions
  folding-diagnostics.js     kinematic evidence
  tiles.js                   physical profile assignment
  calibration.js             raw measurements and uncertainty
  print.js                   page and tab production
  export.js                  portable project snapshots

src/render/
  canvas-renderer.js         dependency-free fallback
  three-renderer.js          production spatial renderer path

design/mockups/              final UI direction
research-prompts/            outstanding evidence and algorithm program
schemas/                     versioned interoperability contracts
test/                        behavior and invariant tests
scripts/                     release validation and example generation
handoff/                     team checklist, backlog, and acceptance gates
```

## 7. Architectural rules for the receiving team

1. Renderer triangles never become the mathematical source of truth.
2. Stable face/edge identifiers cross the core/renderer/UI boundary.
3. Physical feasibility is a separate result layer, not a boolean field on geometry.
4. Every solver is cancellable and returns reproducible metadata.
5. Direct manipulation emits semantic commands and then samples the core.
6. Snapshot schemas evolve through explicit migrations.
7. Experimental physics or XR dependencies remain adapters, not geometry-core imports.
8. Evidence labels are part of product correctness.

## 8. First-week handoff checklist

- Read README, docs 21–28, and `handoff/HANDOFF-CHECKLIST.md`.
- Run every validation command.
- Inspect the seven UI mockups.
- Replay the cube folding example and motion clip.
- Confirm the Three.js dependency/build environment.
- Convert backlog P0 items into the implementation team’s tracker.
- Assign ownership for geometry, rendering, physical research, UX/accessibility, and learning content.
- Decide whether the first production target is browser-only PWA or web plus a thin native spatial companion.
