# 17 — Exact Compound Face Panels

## Design rule

A compound recipe may be marked `exactGeometry: true` only when its component polygons exactly partition the mathematical face and its boundary mapping is explicit. Mechanical feasibility is represented separately.

## Implemented certificate

Release 0.3.0 supports one deliberately conservative recipe:

```text
regular hexagon = six congruent equilateral triangles meeting at the center
```

For a regular hexagon, the circumradius equals the side length. Joining the center to every vertex therefore creates six exact equilateral triangles.

## Why this recipe is safe enough to implement before research

- It is an elementary exact construction.
- Every exterior face edge is exactly one triangle edge.
- Neighboring polyhedron faces retain one-to-one boundary hinges.
- It does not require assuming that two short magnetic edges can emulate one long hinge.
- Scale and inventory can be computed directly.

## Data contract

A recipe records:

- schema and recipe identity;
- face index and face kind;
- component piece polygons in face-local coordinates;
- tile profile used by each component;
- boundary edge mapping;
- exact piece counts;
- scale error;
- geometric and mechanical status;
- explanatory caveat.

## Physical solver integration

The global scale solver considers compound-compatible scales along with direct face matches. After direct minimum-cost assignment, unresolved supported faces can receive exact recipes. Their component counts are added to the same inventory ledger.

The truncated octahedron therefore has:

```text
6 direct square faces
8 compound hexagonal faces
48 equilateral-triangle components
0 unsupported faces
```

when sufficient compatible standard inventory is available.

## Presentation

Compound panels remain visible across:

- face inspection;
- bill of materials;
- physical support ratios;
- build-step preassembly instructions;
- net SVG interior seams;
- paginated print output;
- snapshot profile and recipe provenance.

## Explicit limit

`exactGeometry` means the flat polygon partition is exact. The current `mechanicalStatus` is `unverified-panel`: center-joint behavior, out-of-plane flex, magnet orientation, load transfer, and folded stability are not established.

General pentagon/hexagon tiling, mixed pieces, substitutions, and rigidity-aware panel planning remain dependent on the compound-tiling and mechanics research briefs.
