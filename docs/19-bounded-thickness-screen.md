# 19 — Bounded Local Thickness-Clearance Screen

## Question answered

For one hinge and one target interior dihedral, do two finite rectangular panel cross sections intersect under a declared hinge-axis model?

That is the only question answered by the current analyzer.

## Inputs

- physical assignment on both incident faces;
- target interior dihedral from exact polyhedron analysis;
- measured profile thickness for both assignments;
- measured hinge-axis offsets, or an explicitly selected named scenario;
- a small intersection-area tolerance.

Compound faces use the physical tile profile mapped to the boundary edge.

## Evidence modes

### `measured-only`

No geometry is modeled unless both profiles include finite hinge-axis offsets. Missing data produces `unmodeled`, not a guessed answer.

### `surface-axis`

An exploratory scenario assumes the hinge axis lies on the mating panel surface, represented by an offset equal to half the panel thickness. Results are suffixed `under-model` and carry `surface-axis-scenario` provenance.

## Status values

| Status | Meaning |
|---|---|
| `clear-under-model` | Intersection area is at or below tolerance under the selected local model |
| `collision-under-model` | Positive intersection exceeds tolerance under the selected local model |
| `unmodeled` | Physical pieces exist but required thickness/axis evidence is missing |
| `unsupported` | One or both faces have no physical boundary assignment |

## Geometry

Each panel becomes a finite 2D rectangle in a plane perpendicular to the hinge. One rectangle is rotated by the target dihedral. Convex polygon intersection produces the local overlap area.

The modeled panel length is bounded from the mapped edge dimension to avoid treating an infinite half-plane as the physical part.

## What it does not establish

- connector deformation or bevel geometry unless encoded by axis offset;
- interference elsewhere on either face;
- global self-collision among nonadjacent faces;
- a continuous collision-free folding path;
- closure accessibility;
- magnet force, torque, friction, gravity, or stability;
- whether a compound panel remains rigid.

The analyzer is therefore a useful early rejection/inspection layer, not a physics simulator.
