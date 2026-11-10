# MagnaMath Project Plan

## Current baseline — 0.4.1

Completed foundations:

- exact geometry and topology;
- net planning and manual workshop;
- Pareto candidate worker;
- physical profile/calibration system;
- print production;
- exact tree-hinge folding;
- root 6DOF transform foundation;
- motion clip core/schema;
- responsive final UI direction;
- full handoff and research program.

## Milestone 1 — Production folding release

### Scope

- registry-backed install/build/CI;
- Three.js browser/device validation;
- semantic hinge drag;
- root translate/rotate polish;
- camera control decision;
- snapshot round-trip tests;
- keyboard and accessible scene outline;
- production responsive Fold UI.

### Exit gates

- exact pose parity with core;
- 60 fps target on agreed catalog/reference hardware or documented adaptive fallback;
- zero uncaught browser errors;
- all core actions keyboard accessible;
- screen reader exposes selection and pose;
- real lockfile and repeatable build.

## Milestone 2 — Spatial Motion Lab

### Scope

- motion clip playback;
- camera track playback;
- dope-sheet editor;
- keyframe recording from direct manipulation;
- clip import/export;
- narration/lesson markers;
- saved views and presentation mode.

### Exit gates

- deterministic sampling at requested times;
- root/fold/hinge/camera tracks round-trip;
- undo/redo for authoring;
- reduced-motion preview;
- no geometry invariant regressions.

## Milestone 3 — Continuous geometric feasibility

Dependent on DR-07.

### Scope

- continuous path validator;
- adaptive broad/narrow collision;
- collision event evidence;
- schedule repair or path search;
- benchmark corpus;
- worker/WASM integration.

### Exit gates

- distinguishes sampled and continuous results;
- replayable first-contact evidence;
- deterministic seeded runs;
- cancellation;
- benchmark performance and known failure cases documented.

## Milestone 4 — Closed loops and inverse kinematics

Dependent on DR-08.

### Scope

- general constraint graph;
- cut-edge/loop closure residuals;
- direct-manipulation projection;
- branch continuity;
- locks and driven hinges;
- singularity diagnostics.

### Exit gates

- known mechanisms reproduce expected DOF;
- residuals and condition reported;
- no silent branch jumps;
- infeasible requests fail honestly.

## Milestone 5 — Thick physical panels

Dependent on DR-01 and DR-09.

### Scope

- measured hinge axes;
- finite-thickness panel solids;
- offset closure;
- uncertainty propagation;
- compound-panel physical model;
- fixture evidence.

### Exit gates

- ideal and physical models separate;
- measured inputs carry provenance;
- closure/collision intervals reported;
- fixture validation available for any “physically verified” claim.

## Milestone 6 — Learning product

Dependent on DR-11, parallelizable.

### Scope

- lesson schema and authoring;
- concept progression;
- misconception feedback;
- teacher/family sharing;
- privacy-preserving progress;
- accessibility studies.

## Milestone 7 — Spatial companion

Dependent on DR-05 and DR-10.

### Scope

- camera recognition;
- tabletop anchoring;
- ghost placement;
- build-state verification;
- WebXR and/or native SwiftUI/RealityKit decision.

## Cross-cutting work

- license selection;
- dependency and security governance;
- schema migrations;
- telemetry/privacy policy;
- performance budgets;
- localization;
- content provenance;
- classroom deployment/offline requirements.

## Prioritization rule

Do not expand the shape catalog at the expense of the defining loop:

```text
understand → unfold → fold → build → explain
```

New solids should enter only when exact geometry, net behavior, physical status, and lesson value can be represented honestly.
