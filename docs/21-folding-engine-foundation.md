# MagnaMath Folding Engine Foundation

**Release:** 0.4.0  
**Status:** Exact tree-hinge forward kinematics implemented; closed-loop constraints, continuous collision, thick-panel offsets, and dynamics remain future layers.

## 1. Purpose

MagnaMath’s folding engine must let a learner move continuously from a selected two-dimensional net to the exact three-dimensional source polyhedron while preserving the mathematical meaning of every face and hinge.

The implementation deliberately separates four questions that prototypes often collapse:

1. **Can this face graph be represented as a one-piece hinge tree?**
2. **Does the tree produce a geometrically correct rigid folding at a sampled pose?**
3. **Is there a continuous collision-free path through all intermediate poses?**
4. **Can a finite-thickness physical construction follow that path and remain stable?**

Release 0.4.0 answers the first two for exact catalog geometry and creates stable boundaries for the latter two.

## 2. Coordinate and transform conventions

The pure core uses row-major homogeneous 4×4 matrices:

```text
R00 R01 R02 Tx
R10 R11 R12 Ty
R20 R21 R22 Tz
  0   0   0  1
```

- A face-local point is `[x, y, 0]`.
- A net transform places that face in the shared flat plane.
- A target transform places the same face in the exact source solid, rigidly aligned so the chosen root face remains fixed.
- A root pose can then translate and rotate the complete mechanism through world space.
- Quaternions are serialized as `[x, y, z, w]` and normalized before use.

Three.js consumes these matrices at the renderer boundary. The geometry core does not depend on Three.js.

## 3. Model construction

`createFoldingModel(polyhedron, analysis, net)` performs the following:

1. Verifies that the net contains one rooted spanning tree with exactly `F − 1` fold edges.
2. Converts every 2D net transform to a rigid 3D matrix in the `z = 0` plane.
3. Converts every exact source-face frame to a 3D rigid transform.
4. Aligns the source solid to the flat root face.
5. For each parent-child tree edge:
   - identifies the exact shared edge;
   - represents the hinge line in the parent face’s local frame;
   - computes the flat child transform relative to the parent;
   - computes the exact target relative transform;
   - derives the signed rotation that takes the flat child normal to its target normal;
   - verifies that rotation about the hinge reconstructs the exact target transform.
6. Stores depth, order, children, cut edges, and stable edge identifiers.

The result is a renderer-independent kinematic mechanism with one rotational degree of freedom per tree hinge.

## 4. Forward kinematics

At a sampled global progress value `p ∈ [0,1]`:

1. The selected motion sequence maps `p` into an individual normalized progress for every hinge.
2. The easing function converts the local progress to a smooth scalar.
3. Any explicit hinge override replaces the scheduled angle.
4. The root face receives its flat transform.
5. Child transforms are computed recursively:

```text
world(child)
  = world(parent)
  × rotate_about_parent_hinge(current_angle)
  × flat_relative_transform(child)
```

6. An optional world/root pose multiplies all face transforms.

This is rigid forward kinematics, not per-vertex interpolation. Every face is transformed as one rigid body.

## 5. Motion sequences

Implemented scheduling modes:

| Mode | Behavior |
|---|---|
| Together | Every hinge uses the complete timeline |
| Root outward | Motion propagates from the anchor toward deeper branches |
| Leaves inward | Outer branches begin before hinges near the root |
| Build order | Hinges follow rooted net traversal order |
| Custom | Explicit start/end window per hinge |

Each hinge can also be manually posed, returned to timeline control, or set directly to its exact target.

## 6. Spatial motion clips

`src/core/motion.js` adds a second, more general animation layer. A motion clip can combine:

- global folding-progress keyframes;
- six-degree-of-freedom root-pose keyframes;
- per-hinge progress or absolute-angle tracks;
- camera position, target, up-vector, and field-of-view tracks;
- semantic markers for narration, lessons, or build steps.

Root rotations use shortest-path quaternion spherical interpolation. The motion schema is independent of rendering, physics, and UI frameworks.

This division is intentional:

```text
folding model = exact mechanism
folding state = current instructional pose
motion clip   = authored choreography around that mechanism
physics layer = optional dynamic feasibility and force response
```

## 7. Implemented diagnostics

Every sampled pose can report:

- maximum separation between the two copies of each tree hinge endpoint;
- maximum cut-edge closure gap;
- face edge-length preservation error;
- exact target-transform error;
- sampled zero-thickness face collisions;
- per-hinge current and target angle.

The collision screen excludes expected adjacency at shared tree hinges and is explicitly diagnostic. It does not establish continuous collision freedom.

## 8. Renderer integration

### Canvas fallback

The dependency-free Canvas renderer projects exact sampled face polygons and supports:

- continuous flat-to-folded motion;
- face selection;
- visible hinge axes;
- selected-hinge emphasis;
- collision-face emphasis;
- responsive fallback behavior.

### Three.js renderer

The Three.js renderer uses one scene-graph node per face and applies exact sampled face matrices. It includes:

- orbit inspection;
- selectable hinge cylinders;
- root translate and rotate gizmos through `TransformControls`;
- face and hinge picking;
- root-pose callbacks into application state;
- collision and selection overlays.

The Three.js source is complete and syntax-checked. A registry-backed installation and browser matrix remain release gates because the sandbox could not resolve the pinned package from its npm mirror.

## 9. Validation invariants

The release validator samples every starter-catalog solid across multiple sequence modes and timeline positions. Required invariants are:

```text
maximum hinge endpoint gap < 1e-7
maximum rigid-face edge error < 1e-7
maximum target matrix error < 1e-7
maximum cut-edge closure gap at p=1 < 1e-6
```

Observed errors are near floating-point roundoff and are recorded in `docs/assets/validation-log-0.4.0.txt` after final release validation.

## 10. What is still necessary for a full physical folding engine

### Closed-loop mechanisms

A one-piece net is a tree while open, but the target solid includes cut-edge closure constraints. Interactive manipulation that allows several arbitrary hinge angles at once can create inconsistent states. A full solver must project user input onto a constraint manifold or solve inverse kinematics while preserving all requested closure relationships.

### Continuous collision detection and path planning

The current sampler can detect an intersection at specific poses. It cannot prove that the swept volume between samples is collision-free or find a detour in the high-dimensional hinge-angle space.

### Finite thickness and hinge offsets

Real tiles and fabricated panels have thickness, rounded corners, connector recesses, and hinge axes that may not lie on the mathematical face boundary. Those offsets change both the reachable target and collision geometry.

### Dynamics and physical evidence

A physically credible simulation requires calibrated mass properties, joint limits, damping, friction, magnetic attraction/holding force, separation behavior, gravity, and panel rigidity. These must remain evidence-labeled and cannot be inferred from visual geometry alone.

### Arbitrary topology and imported models

Imported polygon meshes need segmentation into rigid faces, orientation repair, manifold diagnostics, hinge eligibility, and potentially simplification before unfolding or folding.

### Authoring and accessibility

The production system still needs a complete timeline editor, command history, keyboard-equivalent 3D operations, reduced-motion behavior, screen-reader alternatives, touch conflict resolution, and teacher/lesson authoring.

## 11. Stable implementation boundary

Future solvers should consume and return stable structures rather than mutate renderer objects:

```ts
interface FoldingSolverAdapter {
  initialize(model: FoldingModel, physical?: PhysicalModel): Promise<void>;
  project(request: PoseRequest): Promise<SolvedPose>;
  trace(request: PathRequest): Promise<MotionPath>;
  cancel(jobId: string): void;
}
```

This keeps exact geometry, user intent, numerical solvers, physics engines, and visual rendering independently replaceable.
