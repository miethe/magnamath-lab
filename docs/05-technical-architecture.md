# MagnaMath Technical Architecture

**Current release:** 0.4.1

## Architectural objective

MagnaMath must remain mathematically exact while supporting replaceable renderers, interactive folding, physical evidence, workers, future physics, and a possible native spatial client.

## Layer model

```text
┌───────────────────────────────────────────────────────────────┐
│ Product surfaces                                              │
│ Explore · Fold · Workshop · Build · Learn · Motion Lab        │
├───────────────────────────────────────────────────────────────┤
│ Interaction and application state                             │
│ semantic selection · commands · undo · projects · lessons     │
├───────────────────────────────────────────────────────────────┤
│ Renderer adapters                                             │
│ Three.js/WebGL(WebGPU later) · Canvas · future RealityKit     │
├───────────────────────────────────────────────────────────────┤
│ Exact kinematic and geometric core                            │
│ polyhedra · topology · nets · rigid folding · motion clips    │
├───────────────────────────────────────────────────────────────┤
│ Physical and fabrication evidence                             │
│ profiles · calibration · assignment · thickness · print       │
├───────────────────────────────────────────────────────────────┤
│ Solver adapters                                               │
│ net search · future CCD · IK · thick panels · physics         │
├───────────────────────────────────────────────────────────────┤
│ Versioned contracts                                           │
│ snapshot v4 · folding plan · motion clip · profile schemas    │
└───────────────────────────────────────────────────────────────┘
```

## Exact geometry boundary

`src/core/catalog.js` and generated families provide vertices and ordered polygon faces. `polyhedron.js` derives topology and measurements. No renderer mesh is allowed to redefine faces, edges, or topology.

Stable identifiers:

- face: zero-based face index within a snapshot;
- edge: sorted source vertex pair such as `1:5`;
- hinge: fold-tree edge key;
- physical profile: versioned profile ID;
- motion clip: stable clip ID.

## Net and folding pipeline

```text
polyhedron + analysis
        │
        ▼
selected fold-edge spanning tree
        │
        ├── net transforms and polygons
        │
        ▼
createFoldingModel
        │
        ├── flat face matrices
        ├── exact target face matrices
        ├── hinge axes and signed angles
        └── rooted child relationships
        │
        ▼
sampleFoldingPose(progress, schedule, overrides, rootPose)
        │
        ├── Canvas renderer
        ├── Three.js renderer
        ├── diagnostics
        └── snapshot/motion authoring
```

## Spatial state

Internal hinge configuration and global model placement are separate:

```text
world face transform
  = root pose
  × mechanism face transform
```

This prevents model movement from altering mathematical measurements and allows the same fold sequence to be placed anywhere in a scene or XR space.

## Motion clips

`motion-clip/v1` stores authored time-dependent state:

- root pose as translation/quaternion keyframes;
- global folding progress;
- optional per-hinge overrides;
- camera track;
- semantic markers.

Motion clips do not store derived face matrices. They are sampled against a current exact folding model.

## Renderers

### Canvas

- zero external dependencies;
- useful for smoke tests, constrained environments, and graceful fallback;
- consumes exact pose polygons;
- supports face, hinge, and collision emphasis.

### Three.js

- one scene node per mathematical face;
- exact matrix application;
- OrbitControls in current source;
- TransformControls for root translation/rotation;
- ray-based semantic face and hinge picking;
- separate visual groups for axes, handles, selection, and diagnostics.

Future renderer work may evaluate ArcballControls and WebGPURenderer, but must preserve the same semantic and state boundaries.

## Solver architecture

Current worker solver: constrained net portfolio search.

Future solvers should follow a common pattern:

```text
main thread submits immutable job
worker/WASM initializes stable core data
solver emits progress and candidate evidence
main thread rejects stale generation IDs
user can cancel
result is serialized and replayable
```

Potential adapters:

- continuous collision and path planning;
- closed-loop constraint projection;
- thick-panel closure;
- physical rigid-body dynamics;
- camera/AR recognition.

## Persistence

Snapshot v4 stores:

- exact model;
- derived summary evidence;
- manual net and locks;
- physical build state;
- calibration records;
- print settings;
- folding plan and root pose;
- motion clips and active clip ID.

IndexedDB stores whole snapshots plus safe regenerated thumbnails. External imports are detached from local project identity.

## Performance strategy

Immediate:

- main-thread direct manipulation;
- worker net optimization;
- cached face geometry;
- renderer matrix updates rather than geometry reconstruction.

Later, based on measured workloads:

- workers/WASM for CCD and constraints;
- BVH acceleration for large picking/collision workloads;
- WebGPU renderer/compute where browser support and transfer costs justify it;
- adaptive visual fidelity on low-power devices.

## Security and integrity

- imported geometry and edge references are structurally validated;
- display metadata is escaped in HTML/SVG;
- snapshots use strict version/schema checks;
- renderer thumbnails are regenerated instead of trusting embedded markup;
- solver outputs must be bounded and validated before application;
- future user content requires file-size, complexity, and execution limits.
