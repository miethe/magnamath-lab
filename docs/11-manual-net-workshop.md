# 11 — Manual Net Workshop

> **Historical foundation:** This document describes the 0.2.0 workshop baseline. The 0.3.0 worker portfolio, print production, and candidate-selection additions are documented in `15-net-portfolio-worker.md` and `16-print-production.md`.


**Release:** 0.2.0
**Status:** implemented vertical slice

The Manual Net Workshop turns automatic unfolding into an editable, mathematically constrained design surface. A user may change any shared edge between **cut** and **fold**, lock decisions, change the anchor face, compare objectives, undo or redo edits, and export the exact state. The editor does not permit an arbitrary collection of hinges: every accepted net remains one connected, acyclic face tree.

## 1. Mathematical contract

For a closed polyhedron, construct its dual graph:

- each polygonal face becomes a dual vertex;
- each shared polyhedron edge becomes a dual edge between its two incident faces;
- a one-piece edge unfolding chooses a spanning tree of the dual graph;
- the chosen `F − 1` dual edges are folds;
- every remaining shared edge is cut.

This gives the workshop a hard invariant:

```text
fold edges = faces − 1
connected faces = all faces
cycles in fold graph = 0
```

An edit that would violate the invariant is never committed.

## 2. Edge surgery

### Change a cut to a fold

Adding a fold to a tree creates exactly one cycle. MagnaMath:

1. identifies the unique tree path between the two incident faces;
2. considers removing each unlocked fold on that path;
3. constructs each resulting legal tree;
4. unfolds and scores each candidate;
5. selects the best candidate under the active objective.

The selected edge becomes a fold and one other edge becomes a cut.

### Change a fold to a cut

Removing a fold separates the tree into two face components. MagnaMath:

1. computes the two components;
2. enumerates unlocked cut edges that reconnect them;
3. unfolds and scores each legal replacement;
4. selects the best candidate.

The selected edge becomes a cut and one other edge becomes a fold.

This is a basis exchange on the graphic matroid of the face-adjacency graph, implemented without exposing that terminology in the learner-facing interface.

## 3. Locks and constrained optimization

A user can lock an edge as:

- **required fold** — it must remain in the face spanning tree;
- **required cut** — it may not enter the tree.

The automatic optimizer first inserts required folds with cycle checks, excludes required cuts, and then completes a spanning tree. It reports an error when locks are contradictory or make connectivity impossible.

Locks are persisted in project snapshots and represented visually in exported SVGs.

## 4. Re-rooting

Changing the anchor/root face does **not** change the cut pattern. It only changes:

- the parent-child orientation of the rooted tree;
- the placement traversal;
- the build sequence;
- the face described as the physical starting piece.

This allows one net to support different classroom explanations or physical assembly orders.

## 5. Objectives

Every candidate is first dominated by overlap penalties, then ranked by softer objectives.

| Objective | Favors | Primary signals |
|---|---|---|
| Compact | Small occupied region | bounding area, area utilization |
| Print-efficient | Balanced page shape and shorter outline | aspect penalty, true cut perimeter |
| Build-friendly | Shallower physical assembly | tree depth, leaf/branch structure |
| Classroom wide | Projection and label readability | target wide aspect, moderate depth |

The print perimeter is not the constant sum of all face perimeters. For a closed polyhedron, the exposed outline of an edge net is:

```text
boundary perimeter = 2 × Σ(length of each cut polyhedron edge)
```

That value can genuinely distinguish different cut trees, especially for non-edge-uniform solids.

## 6. Placement and diagnostics

Faces are placed by exact rigid 2D transforms around shared edges. The current overlap detector:

- operates on convex face polygons;
- computes pairwise polygon-intersection area;
- ignores zero-area boundary contact;
- records the face pair and positive overlap area;
- paints overlapping faces in the net preview and export;
- marks the net invalid while preserving it for manual repair.

A manual edit can intentionally create overlap. This is not blocked because repair is a core workshop use case; it is diagnosed immediately and cannot be misrepresented as a valid net.

## 7. Project and export behavior

Snapshot v2 preserves:

- exact polyhedron vertices and polygon faces;
- root face;
- objective and seed;
- fold and cut edge keys;
- required-fold and required-cut locks;
- transforms and overlap diagnostics;
- inventory, tile-family, scale, and calibration state.

Import performs structural checks, reconstructs the exact face tree, and rejects unknown edges, invalid topology, contradictory locks, or unsupported catalog identity.

True-scale SVG export includes:

- physical millimeter dimensions;
- solid cut and dashed fold lines;
- edge identifiers and enlarged invisible hit targets;
- lock styling;
- overlap styling;
- embedded machine-readable metadata.

## 8. User workflow

1. Open **Workshop**.
2. Select a solid and generate a starting net.
3. Select an edge in the 2D net.
4. Choose **Make fold** or **Make cut**.
5. Lock important choices.
6. Change the objective and run **Optimize with locks**.
7. Choose an anchor face for a better build sequence.
8. Resolve every overlap warning.
9. Export SVG for printing or JSON for exact round-trip editing.

## 9. Validation evidence

The 0.2.0 workshop validator exercised every shared edge of the 16-entry starter catalog:

- **502/502** manual edge exchanges retained a connected, acyclic `F − 1` tree;
- **492/502** edits were immediately overlap-free;
- the ten overlapping edits occurred on the truncated dodecahedron and were correctly diagnosed;
- constrained optimization found an overlap-free result for every catalog entry while retaining locks;
- serialized fold sets reconstructed deterministically;
- re-rooting preserved the physical cut set.

The fact that some legal trees overlap is expected: graph validity and geometric non-overlap are separate properties.

## 10. Current limits

- Convex polygon faces only for overlap measurement.
- Pairwise all-face overlap testing rather than spatial indexing.
- Heuristic search rather than exhaustive proof of optimum.
- No tabs, page tiling, grain direction, kerf, or material thickness yet.
- No symmetry-reduced candidate gallery yet.
- Project import currently binds workshop state to a known catalog identity even though exact vertices/faces are included.
- Search still runs on the main thread; larger catalogs need cancellable workers.

## 11. Next implementation slice

1. Candidate gallery with Pareto comparison across compactness, page use, depth, and cut length.
2. Worker-based tabu/local search seeded from the current tree.
3. Page templates, margins, registration marks, glue tabs, and multi-sheet packing.
4. Robust predicates and concave-face decomposition.
5. Saved named variants and side-by-side diff.
6. Direct manipulation that previews the exchange candidate before commit.
