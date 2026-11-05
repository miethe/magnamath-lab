# Release Notes — 0.4.0 “Fold Through Space”

## Headline

MagnaMath 0.4.0 establishes exact 2D-to-3D rigid folding and the architectural basis for authored motion through three-dimensional space.

## Added

- exact tree-hinge folding model derived from the selected net;
- flat, partial, and exact target face transforms;
- simultaneous, root-out, leaves-in, build-order, and custom schedules;
- per-hinge selection, manual posing, and timeline return;
- hinge, closure, rigidity, target-fit, and sampled collision diagnostics;
- Canvas renderer driven by exact kinematics;
- Three.js renderer driven by exact kinematics;
- root translate/rotate controls and semantic interaction modes;
- normalized quaternion and rigid-transform utilities;
- spatial motion clip core with root, fold, hinge, camera, and marker tracks;
- folding-plan, motion-clip, and snapshot-v4 schemas;
- motion/folding example artifacts;
- final-product UI mockup atlas and design specification;
- six new Deep Research briefs;
- complete implementation-handoff package.

## Changed

- fold progress semantics are now `0 = flat net`, `1 = exact solid`;
- renderers no longer interpolate face vertices between unrelated shapes;
- project persistence uses snapshot v4 and stores exact folding state;
- Fold is a first-class application mode;
- interaction tools distinguish inspection, hinge manipulation, translation, and rotation.

## Compatibility

- snapshot v2 and v3 remain importable through migration;
- snapshot v4 is the current export format;
- renderer-independent core remains plain JavaScript modules;
- Canvas fallback remains dependency-free.

## Known limitations

- sampled collision detection is not continuous collision detection;
- faces have zero thickness in the exact folding mechanism;
- arbitrary loop closure and inverse kinematics are not implemented;
- physics, magnetic forces, and stability are not implemented;
- Three.js runtime/browser validation requires a registry-enabled environment;
- motion clips are implemented in the pure core and schema, while full timeline authoring/playback UI remains a next implementation increment.
