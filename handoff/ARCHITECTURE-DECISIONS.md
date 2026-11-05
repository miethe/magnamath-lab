# Architecture Decisions

## ADR-001 — Web-first PWA

Use a web-first application for broad classroom, desktop, tablet, print, and sharing access. Keep versioned schemas and a pure core so a native Swift/RealityKit companion can be added when camera/AR value is proven.

## ADR-002 — Exact polygon geometry is authoritative

Ordered mathematical faces and stable topology identifiers define the model. Render triangulation is a disposable visual representation.

## ADR-003 — Tree-hinge kinematics before general constraints

A rooted net tree provides exact, understandable forward kinematics and covers the defining flat-to-solid experience. Closed-loop inverse kinematics is a separate solver layer.

## ADR-004 — Root pose is independent of folding pose

The mechanism’s internal hinge state and its global six-degree-of-freedom placement are stored separately. This supports spatial movement without altering mathematical measurements.

## ADR-005 — Motion clips are renderer-independent

Root, fold, hinge, camera, and semantic marker tracks live in `motion-clip/v1`. Renderers consume sampled state.

## ADR-006 — Physical feasibility is a result layer

Geometry, dimensional matching, hinge-range compatibility, continuous kinematics, stability, and fixture verification are separate evidence tiers.

## ADR-007 — Solvers are adapters

Collision, path planning, inverse kinematics, and physics should be cancellable adapters behind stable data contracts. They must not mutate scene objects as authoritative state.

## ADR-008 — Mockups describe hierarchy, not a raster implementation

The HTML/CSS mockups define information architecture, interaction priority, evidence language, and visual direction. Production UI should be componentized and accessible.
