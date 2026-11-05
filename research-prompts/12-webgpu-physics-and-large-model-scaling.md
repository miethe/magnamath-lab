# Deep Research Prompt — WebGPU, WASM, Physics, and Large-Model Scaling for MagnaMath

You are a browser graphics engineer, WebGPU specialist, computational-geometry performance engineer, WASM/Rust architect, physics-engine evaluator, worker-systems designer, GPU profiling specialist, and mobile web performance researcher.

Current date: 2026-08-10.

## Context

MagnaMath uses a pure JavaScript exact geometry core and a Three.js renderer boundary. Release 0.4.0 supports catalog solids, net optimization, exact folding, sampled collisions, print generation, physical assignment, and future motion clips. The production roadmap may add high-face-count imported models, continuous collision, thick-panel geometry, constraint solving, and physics.

## Research objective

Determine a staged performance architecture that preserves correctness and broad browser support while enabling heavier geometry and physics workloads.

## Required research questions

1. What are the current production capabilities and browser support of Three.js WebGPURenderer and its WebGL2 fallback?
2. Which MagnaMath workloads are rendering-bound versus CPU geometry-bound?
3. Which algorithms are suitable for Web Workers, SharedArrayBuffer, WASM, SIMD, threads, or WebGPU compute?
4. What are the data-transfer and serialization costs among main thread, workers, WASM memory, and GPU buffers?
5. How should polygon faces, triangulations, BVHs, transforms, and collision pairs be laid out?
6. Compare JavaScript, Rust/WASM, C++/WASM, and WebGPU compute for broad phase, narrow phase, Jacobians, and path search.
7. Compare Rapier and other credible browser-capable physics/geometry libraries for rigid bodies, joints, CCD, determinism, serialization, and licensing.
8. How can render instancing and shared geometries scale face visualization?
9. When should geometry be recomputed versus incrementally updated?
10. How should adaptive fidelity work on low-power phones?
11. What profiling and regression tooling should CI use?
12. What memory ceilings and frame-time budgets are realistic?
13. How should cancellation and stale-job rejection work across workers and WASM?
14. What offline/PWA caching and package-size constraints matter?
15. What security implications accompany WASM, SharedArrayBuffer, cross-origin isolation, and imported geometry?

## Required deliverables

1. Workload decomposition and bottleneck model.
2. Recommended staged architecture for current catalog, medium imported models, and advanced physics.
3. Technology comparison table.
4. Data layout and worker-message contracts.
5. Performance budgets by device class.
6. Benchmark suite and profiling protocol.
7. Adaptive-quality policy.
8. Determinism and reproducibility policy.
9. Browser compatibility matrix.
10. Security/deployment requirements.
11. Implementation phases and acceptance criteria.
12. Primary-source and official-documentation table with dates and links.
13. Explicit recommendations on when not to use WebGPU or a physics engine.

## Constraints

- Do not recommend GPU compute without demonstrating a workload and transfer-cost advantage.
- Preserve a dependency-light educational fallback.
- Keep exact geometry authoritative on the CPU unless a verified alternative exists.
- Distinguish deterministic kinematics from nondeterministic or approximate dynamics.
