# 01 — Original MagnaMath Audit

**Audit date:** 2026-08-08
**Repository:** <https://github.com/miethe/MagnaMath>
**Disposition:** preserve the product idea and selected UX patterns; replace the mathematical and application foundations.

## Executive assessment

The original project proved a genuinely strong product concept: a learner can move continuously between a solid, its two-dimensional net, its mathematical properties, and a physical Magna-Tiles-style build. It also assembled many of the right interaction ingredients—shape families, transformations, inventory, live V/E/F statistics, educational explanations, and an animated viewer.

The prototype is not a reliable simulator, however. Its central data structure is a render-oriented `THREE.BufferGeometry`, so mathematical faces must be reconstructed after the fact from triangles. Several named solids are approximations that do not have the stated topology. Tile compatibility is inferred mainly from face side count. Net generation chooses one spanning tree but does not prove that the resulting polygons do not overlap. Those choices are acceptable for a visual experiment, but not for a geometry teaching tool or physical build planner.

## What the original got right

1. **The core learning loop is excellent.** Select a solid, inspect it, unfold it, connect the abstract net to physical pieces, and learn from the transition.
2. **The scope is ambitious in the right direction.** Platonic, Archimedean, Johnson, generated families, geodesic forms, and toroidal forms give the product room to serve children and technical adults.
3. **Continuous 3D-to-2D animation is more instructive than a static net gallery.** It exposes adjacency and hinge relationships directly.
4. **Inventory-aware play is a differentiator.** Most geometry apps stop at visualization; MagnaMath tries to answer “can I build this with what I own?”
5. **The original education guide recognizes the relevant concepts.** Euler characteristic, spanning trees, face/edge/vertex counts, and polyhedral families are the correct conceptual spine.

## Findings

| Severity | Finding | Evidence in original | Why it matters | Rebuild action |
|---|---|---|---|---|
| Critical | Render geometry is treated as mathematical source of truth | `ShapeGenerator.ts` returns `THREE.BufferGeometry`; `geometry.ts` reconstructs faces from triangles | Rendering subdivisions can change apparent topology and face counts | Introduce a renderer-independent `Polyhedron` model with explicit polygon faces |
| Critical | Several named Archimedean solids are visual substitutes | Truncated tetrahedron uses detailed tetrahedron geometry; cuboctahedron uses a detailed octahedron; truncated cube uses subdivided box; truncated icosahedron uses a detailed icosahedron | A learner can be shown the wrong solid while the UI labels it as exact | Generate canonical solids through exact topology-preserving operations or trusted coordinates |
| Critical | Several Johnson solids are approximations | Cupolas use cylinder geometry; pentagonal rotunda uses an icosahedron | Face types, counts, angles, and nets are not those of the named solids | Add explicit Johnson-solid definitions with validation fixtures |
| High | Face extraction is tolerance-fragile | Triangles are merged by approximate coplanarity and quantized coordinates | Minor numerical or tessellation changes can split or merge mathematical faces incorrectly | Keep polygon faces first-class; triangulate only inside renderer adapters |
| High | Tile classification over-relies on side count | Four-sided faces become squares; other n-gons map to named tile types without complete dimension/angle checks | A rhombus, rectangle, or arbitrary quadrilateral can be called a square | Match normalized side lengths and interior angles against versioned physical profiles |
| High | Net generation does not reject overlap | A first breadth-first spanning tree is unfolded without polygon intersection search | The “net” may be impossible to cut or print | Search multiple cut trees; rigidly place faces; test pairwise polygon intersection; score valid layouts |
| High | “Inventory constraints” do not establish physical feasibility | Availability is associated with generalized face types rather than exact piece geometry and counts | A build can be described as possible when pieces do not match or are insufficient | Produce a bill of materials, shortages, unsupported faces, and confidence level |
| High | Client-side secret injection | Vite config maps a Gemini API key into the client bundle | Browser-delivered secrets are recoverable and unnecessary for the geometry core | Keep the initial product fully local; place any future AI service behind a server boundary |
| Medium | Application state and UI are concentrated in one large component | `App.tsx` is roughly one thousand lines | Geometry, UI, pedagogy, persistence, and rendering are difficult to test independently | Split pure domain modules from thin UI and renderer adapters |
| Medium | Transformations can destroy semantics | Tessellation, curvature, and mirrored duplicates operate on render vertices | The transformed object may no longer be the named polyhedron or a single connected solid | Model each operation with explicit preconditions, output identity, and topology validation |
| Medium | Euler teaching statement needs qualifications | Educational content broadly presents `V − E + F = 2` | The equality is not universal for disconnected, open, or non-sphere-like surfaces | State closed + connected + orientable + genus-zero assumptions; expose `χ = 2 − 2g` later |
| Medium | Dependency surface is prototype-oriented | Generic package identity, no automated tests, and unrelated browser dependencies | Reproducibility, security, and maintenance suffer | Minimize dependencies; add Node tests, catalog validation, and browser smoke checks |

## Module disposition

| Original element | Decision | Reason |
|---|---|---|
| Product concept and name | Retain | Strong and differentiated |
| Explore/build/learn interaction loop | Retain and deepen | Correct educational structure |
| Fold/unfold animation idea | Retain | Central explanatory interaction |
| Existing UI copy and content | Use as inspiration only | Valuable intent, but needs exact assumptions and content architecture |
| `ShapeGenerator.ts` | Replace | Mixes labels, procedural approximations, transformations, and Three.js buffers |
| `geometry.ts` | Replace | Reverse-engineers mathematical polygons from render triangles |
| `PolyhedronViewer.tsx` | Replace as implementation; retain interaction patterns | Rendering should consume, not define, topology |
| Monolithic `App.tsx` | Replace | Thin state coordination is sufficient for the vertical slice; larger release should use feature modules |
| Tailwind/React choice | Re-evaluate, not inherently rejected | The issue is architecture, not React; the initial rebuild uses plain modules to minimize surface area |
| AI dependency and client key | Remove | Not needed for core value and unsafe as a client secret |

## Rebuild principles derived from the audit

1. **Geometry is authoritative; graphics are projections.**
2. **Every named solid must pass canonical topology fixtures.**
3. **Every generated net must carry an overlap result, not merely a spanning tree.**
4. **Physical compatibility is dimensional and inventory-aware.**
5. **Educational claims declare their assumptions.**
6. **Transformations produce a new named/typed model and are revalidated.**
7. **The pure core runs in Node, a browser, a worker, or a future native shell.**
8. **No client-side secret is needed to explore, simulate, or learn.**

## Source pointers

- Repository and architecture overview: <https://github.com/miethe/MagnaMath>
- Original package manifest: <https://github.com/miethe/MagnaMath/blob/main/package.json>
- Original generator: <https://github.com/miethe/MagnaMath/blob/main/src/ShapeGenerator.ts>
- Original analysis/unfolding module: <https://github.com/miethe/MagnaMath/blob/main/src/geometry.ts>
- Original application shell: <https://github.com/miethe/MagnaMath/blob/main/src/App.tsx>
- Original viewer: <https://github.com/miethe/MagnaMath/blob/main/src/PolyhedronViewer.tsx>
- Original education guide: <https://github.com/miethe/MagnaMath/blob/main/EDUCATION.md>
- Original Vite config: <https://github.com/miethe/MagnaMath/blob/main/vite.config.ts>
