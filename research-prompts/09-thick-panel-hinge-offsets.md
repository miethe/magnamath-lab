# Deep Research Prompt — Thick-Panel Folding, Hinge-Axis Offsets, and Physical Closure

You are a thick-origami researcher, deployable-structure engineer, mechanical joint designer, tolerance-analysis specialist, magnetic construction-toy metrologist, CAD kernel engineer, and computational fabrication researcher.

Current date: 2026-08-10.

## Context

MagnaMath currently treats mathematical faces as zero-thickness rigid polygons joined along exact boundary lines. Real Magna-Tiles and fabricated panels have thickness, corner radii, frames, recessed or offset magnet/hinge axes, gaps, and compliance. A zero-thickness path can fail physically, while an offset-hinge mechanism may require a target geometry different from the ideal polyhedron.

## Research objective

Develop a physically defensible thick-panel kinematic model that can consume measured tile profiles, generate collision solids, calculate closure error, and support calibrated build guidance without overstating fidelity.

## Required research questions

1. What thick-origami and panel-hinge models are most relevant?
2. Compare axis-shift, hinge-offset, tapered-panel, vertex-modification, and compliant-joint approaches.
3. How do panel thickness and hinge-axis position change target dihedral relationships?
4. How should gaps, corner radii, chamfers, and connector frames be represented?
5. What are the minimum measurements needed from each physical tile profile?
6. How should measurement uncertainty propagate into clearance and closure intervals?
7. How can Minkowski sums, offset surfaces, convex decomposition, or signed distance fields represent collision volume?
8. How should compound panels made from several tiles be modeled mechanically?
9. What contact is intended at closure versus invalid interpenetration?
10. How should magnet connector axes and polarity be represented, if at all?
11. What validation fixtures can separate hinge geometry from magnetic force and panel rigidity?
12. Which CAD/geometry libraries can robustly create offset/extruded panel solids in browser or WASM?
13. How should the system report when the ideal polyhedron is unreachable with measured physical geometry?
14. What simplified fidelity tiers are useful before a full CAD/physics model?
15. What safety and product-claim considerations apply to measurement-based guidance for children’s construction toys?

## Required deliverables

1. Recommended thick-panel representation and fidelity ladder.
2. Required tile-profile schema extensions.
3. Coordinate diagrams for panel surface, mathematical face plane, boundary, connector axis, and hinge axis.
4. Equations relating ideal dihedral, axis offsets, gap, and panel thickness.
5. Collision geometry strategy.
6. Interval/uncertainty strategy.
7. Closure solver requirements.
8. Compound-panel treatment.
9. Fixture and metrology protocol with repeat counts and device requirements.
10. Validation matrix across standard and micro tile families.
11. Proposed API and data contracts.
12. Implementation phases with acceptance criteria.
13. Source table with primary references and dates.
14. Explicit unknowns requiring original measurement.

## Constraints

- Do not invent unpublished manufacturer dimensions.
- Clearly label measurements, derived quantities, and assumptions.
- Do not treat magnet behavior as a generic revolute hinge without evidence.
- Keep zero-thickness exact geometry available as a separate educational layer.
