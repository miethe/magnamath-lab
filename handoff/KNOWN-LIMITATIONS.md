# Known Limitations and Non-Claims

## Mathematical and kinematic

- The exact folding engine uses one rooted spanning tree.
- It does not solve arbitrary cyclic hinge constraints.
- It does not automatically project incompatible manual hinge overrides onto a closure manifold.
- It does not prove global rigid foldability for arbitrary crease patterns.

## Collision and physics

- Current collision detection is discrete and zero-thickness.
- Sampled collision-free poses do not prove a collision-free swept path.
- Local thickness screening is not global thick-panel simulation.
- No gravity, contact response, friction, magnet force, compliance, or structural stability is simulated.

## Physical tiles

- Published and measured dimensions remain distinct.
- Specialty profiles without representative measurement are nominal or derived.
- Exact planar compound tiling does not establish mechanical rigidity.
- Inventory fit does not establish buildability.

## Rendering and performance

- The Three.js production dependency path was not installed in the sandbox because its npm mirror did not expose the pinned package.
- The Three.js renderer source is syntax-checked but needs registry-enabled runtime/browser validation.
- Large imported meshes and concave faces are not production-supported.

## UX and content

- Motion clip core/schema exists; complete authoring UI is a mockup/spec, not implemented.
- Lessons are an initial shell, not a full curriculum.
- Camera and AR verification are not implemented.
- User accounts, cloud sync, collaboration, and teacher dashboards are not implemented.

## Legal and governance

- No repository license is selected.
- Product/trademark use and any commercial relationship with magnetic-tile manufacturers are outside this technical package.
