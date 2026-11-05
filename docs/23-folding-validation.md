# Folding and Spatial Motion Validation Plan

## 1. Validation layers

MagnaMath validates folding at five increasingly demanding layers.

| Layer | Question | 0.4.0 status |
|---|---|---|
| Structural | Is the selected fold graph a rooted spanning tree? | Implemented |
| Kinematic | Are faces rigid and hinge endpoints coincident? | Implemented |
| Exact target | Does progress 1 reconstruct the source solid? | Implemented |
| Sampled geometric | Are non-adjacent zero-thickness faces intersecting at tested poses? | Implemented, bounded |
| Continuous physical | Is a thick-panel path collision-free and mechanically feasible? | Deferred to research/solver work |

## 2. Catalog sweep

`scripts/validate-folding.mjs` exercises:

- all 16 starter catalog entries;
- four built-in sequence modes;
- seven timeline samples per sequence;
- exact target closure;
- target relative transform reconstruction;
- sampled collision diagnostics.

This produces 448 exact kinematic pose evaluations before the separate test suite is considered.

## 3. Unit and behavioral tests

The release test suite includes:

- flat pose equals the selected net;
- exact target equals the source polyhedron aligned to the root face;
- hinge continuity across modes and times;
- rigid face-edge preservation;
- cut-edge closure at the final pose;
- dihedral/rotation consistency;
- custom schedule and override round-tripping;
- collision result contract;
- rigid matrix ↔ quaternion round-trip;
- root-pose interpolation;
- per-hinge motion tracks;
- camera-track interpolation;
- immutable keyframe editing;
- rejection of unknown hinge tracks.

## 4. Numerical tolerances

Recommended release tolerances:

```text
hinge endpoint gap              ≤ 1e−7 model units
face edge-length error          ≤ 1e−7 model units
target rigid-matrix error       ≤ 1e−7
cut-edge closure at target      ≤ 1e−6 model units
quaternion/matrix round-trip    ≤ 1e−12 for normalized test fixtures
```

These tolerances are many orders of magnitude above observed floating-point noise while still being strict enough to detect model or transform errors.

## 5. Browser smoke scenarios

Required desktop and mobile smoke coverage:

1. Open Cube in Fold mode.
2. Verify flat pose at 0%, partial pose, and exact target at 100%.
3. Select a hinge and set a manual angle.
4. Return it to timeline control.
5. Switch sequence modes.
6. Toggle hinge axes and collision sampling.
7. Translate and rotate the whole model in the Three.js path.
8. Export a snapshot and re-import it.
9. Confirm root pose, selected hinge, overrides, and schedule survive.
10. Confirm 390-pixel mobile layout has no horizontal overflow.
11. Confirm keyboard controls and visible focus.
12. Confirm reduced-motion preference suppresses nonessential easing.

The dependency-free Canvas path is browser-smoke-tested in the sandbox. The registry-backed Three.js path remains an external CI/browser-matrix gate.

## 6. Continuous collision benchmark plan

Once a continuous solver exists, establish a benchmark corpus with:

- known collision-free cube and tetrahedron nets;
- nets that collide under simultaneous motion but succeed sequentially;
- nets with unavoidable intersections under the chosen tree;
- high-face-count uniform solids;
- near-contact cases stressing numerical tolerances;
- thick-panel cases with known hinge offsets;
- paths with both translational and rotational root motion.

For each case record:

- solver and version;
- hardware/browser;
- dimensionality;
- path length;
- clearance margin;
- solve time;
- termination reason;
- deterministic seed;
- independently replayable motion clip.

## 7. Physical validation ladder

Do not collapse all real-world evidence into one badge.

| Tier | Meaning |
|---|---|
| Geometrically exact | Exact mathematical rigid-face mechanism |
| Dimensionally matched | Physical profile dimensions fit within stated tolerance |
| Hinge-range compatible | Target angle lies inside measured stable range |
| Kinematically screened | Thick-panel model finds a collision-free path |
| Fixture verified | A representative physical build was completed and documented |
| Repeat verified | Multiple pieces/sets/batches reproduced the build |

## 8. Release evidence

Final 0.4.0 numbers and logs are stored in:

- `docs/assets/validation-log-0.4.0.txt`
- `docs/assets/folding-validation-0.4.0.json`
- `docs/assets/browser-smoke-0.4.0.json`
- `MANIFEST.sha256`
