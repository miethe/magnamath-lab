# 03 — MagnaMath Product Specification

## 1. Product definition

**MagnaMath is an interactive geometry laboratory that lets a learner generate, inspect, unfold, simulate, and physically build polyhedra while understanding why each construction works.**

It should feel equally credible as:

- a child’s exploratory building companion;
- an educator’s visual geometry toolkit;
- a maker’s net and bill-of-materials generator;
- and a technical polyhedron inspector.

The product’s defining loop is:

> **See it in 3D → reveal its structure → flatten it into 2D → build it physically → explain the mathematics → modify and repeat.**

## 2. Product goals

1. Make the relationship among vertices, edges, faces, adjacency, nets, and physical pieces directly manipulable.
2. Represent every named solid accurately enough for educational use.
3. Generate useful nets with explicit overlap validation and editable cut choices.
4. Translate mathematical faces into exact or qualified physical tile matches.
5. Support guided play without turning the experience into a passive tutorial.
6. Scale from elementary geometry to topology, symmetry groups, transformations, optimization, and computational geometry.
7. Remain local-first and usable without an account for core exploration.

## 3. Non-goals for the first production milestone

- A general-purpose CAD replacement.
- A finite-element structural solver.
- A guaranteed net for every arbitrary polyhedron.
- Full physical magnet simulation before piece geometry is calibrated.
- A social network or public marketplace.
- Generative-AI features that substitute prose for verified mathematics.

## 4. Primary users

| Persona | Need | Product response |
|---|---|---|
| Young explorer, roughly 6–10 | Immediate visual cause and effect; buildable challenges | Large touch targets, guided steps, narrated concepts, simple inventory presets |
| Older learner, roughly 11–17 | Formal vocabulary and measurable relationships | Formula layers, coordinates, angles, nets, proofs, challenges, export |
| Parent / caregiver | Shared physical play with low setup cost | “What can we build?” recommendations, inventory, step mode, printable backup |
| Educator | Standards-aligned demonstrations and assignments | Lesson sequences, projector mode, class links, worksheet/net export, assessment |
| Maker / geometry enthusiast | Accurate models and flexible generation | Exact catalog, transforms, custom parameters, JSON/SVG/STL/glTF pipeline |
| Curriculum or content author | Reusable interactive scenes | Versioned lesson schema, annotations, checkpoints, shareable states |

## 5. Experience modes

### 5.1 Explore

The user selects a known solid or generated family and can:

- orbit, zoom, and select faces/edges/vertices;
- toggle labels, face classes, normals, axes, bounding forms, and symmetry elements;
- inspect V/E/F, Euler characteristic, genus, area, volume, edge lengths, angles, and dihedrals;
- scrub continuously from folded solid to two-dimensional net;
- compare duals and related solids;
- view assumptions and model provenance.

### 5.2 Create

The user constructs or transforms geometry through:

- parameterized prisms, antiprisms, pyramids, bipyramids, cupolas, rotundas, and geodesic families;
- dual, truncate, rectify, cantellate, expand, snub, stellate, augment, diminish, elongate, gyroelongate, and compound operations where mathematically defined;
- direct face/edge operations with precondition feedback;
- import of a supported structured model;
- constraint-based generation such as “all equilateral faces” or “buildable from my inventory.”

Every operation produces a new immutable model, provenance record, and validation report.

### 5.3 Build

The user chooses a physical piece system and inventory, then receives:

- exact, approximate, compound, or unsupported match per face;
- bill of materials and shortages;
- multiple candidate nets ranked for physical assembly;
- numbered placement and hinge steps;
- active face/edge highlighting synchronized across 3D and 2D;
- optional “tabletop footprint,” stability, and recommended build order;
- later, camera verification and AR overlays.

### 5.4 Learn

The user enters a concept sequence attached to the current model:

- observe;
- predict;
- manipulate;
- measure;
- explain;
- apply to a new solid.

Initial concept tracks:

1. Faces, edges, and vertices.
2. Polygon families and regularity.
3. Nets and adjacency.
4. Euler characteristic under stated surface assumptions.
5. Surface area and volume.
6. Dihedral angles and folding.
7. Duality.
8. Symmetry.
9. Truncation and rectification.
10. Genus and why toroidal surfaces differ.

### 5.5 Share / teach

Later releases support:

- stateful links;
- assignment and lesson codes;
- project files;
- printable true-scale nets and worksheets;
- embedded scenes;
- teacher-controlled reveal sequence;
- anonymized local learner progress or account-based synchronization.

## 6. Core functional requirements

### Geometry and analysis

| ID | Requirement | Acceptance rule |
|---|---|---|
| GEO-001 | Store explicit vertices and ordered polygon faces | No mathematical face is inferred from renderer triangles |
| GEO-002 | Normalize orientation and scale deterministically | Same input and version yield equivalent output |
| GEO-003 | Validate indices, repeated vertices, planarity, area, edge incidence, winding, connectivity, and components | Invalid models return structured issues and are not silently labeled exact |
| GEO-004 | Calculate topology and measurements | Counts, χ, genus when defined, area, volume, edge stats, face angles, dihedrals |
| GEO-005 | Preserve operation provenance | Each derived model records source, operation, parameters, and algorithm version |
| GEO-006 | Verify catalog fixtures | Canonical V/E/F and face signatures pass automated tests |
| GEO-007 | Support exact and approximate status | UI visibly distinguishes exact topology, calibrated physical profile, and approximation |

### Nets

| ID | Requirement | Acceptance rule |
|---|---|---|
| NET-001 | Build a face-adjacency graph | Every shared model edge links its incident faces |
| NET-002 | Generate cut-tree candidates | Fold hinges form a spanning tree for one connected component |
| NET-003 | Place faces with rigid transforms | Shared hinge endpoints coincide within tolerance |
| NET-004 | Detect polygon overlap | Candidate includes overlap pairs and area; “valid” requires none above tolerance |
| NET-005 | Rank candidates | Score includes overlap, bounding area, compactness, cut burden, and later assembly factors |
| NET-006 | Generate alternate nets | Seed or manual cut changes produce a reproducible alternative |
| NET-007 | Manual net editor | User can toggle candidate hinges/cuts and see validity immediately |
| NET-008 | Export | SVG/PDF retains cut/fold semantics, labels, units, and metadata |

### Physical tile system

| ID | Requirement | Acceptance rule |
|---|---|---|
| PHY-001 | Versioned piece profiles | Profile stores ordered side ratios, angles, dimensions, thickness, confidence, and source |
| PHY-002 | Geometric face matching | Match considers side lengths and angles under declared tolerances |
| PHY-003 | Inventory accounting | Required, available, and missing counts are reported by piece ID |
| PHY-004 | Match qualification | Exact, calibrated, approximate, compound, custom, or unsupported status is visible |
| PHY-005 | Assembly sequence | Steps specify piece, parent face, hinge edge, and target fold angle |
| PHY-006 | Physical feasibility layer | Later solver includes collision, thickness, hinge limits, stability, and gravity |
| PHY-007 | Calibration | User can measure or photograph pieces to refine a local profile without altering canonical math |

### Learning and content

| ID | Requirement | Acceptance rule |
|---|---|---|
| EDU-001 | Every displayed claim can name its assumptions | Example: χ = 2 track states closed, connected, orientable, genus-zero surface |
| EDU-002 | Concepts are interactive, not text-only | Each lesson includes at least one prediction and one manipulation |
| EDU-003 | Layered depth | Child-friendly explanation and formal detail derive from the same verified fact model |
| EDU-004 | Misconception feedback | Wrong choices explain the violated assumption or relationship |
| EDU-005 | Content versioning | Lesson identifies model/catalog and content versions |
| EDU-006 | Accessibility alternatives | Non-visual descriptions and keyboard paths expose equivalent structure |

### Projects and persistence

| ID | Requirement | Acceptance rule |
|---|---|---|
| PRJ-001 | Save local project | Shape, operation history, net, inventory profile, UI state, and lesson state persist |
| PRJ-002 | Import/export project JSON | Versioned schema validates before use |
| PRJ-003 | Shareable state | Later hosted release can encode or store a read-only scene |
| PRJ-004 | Migration | Schema versions have explicit migration functions |

## 7. Simulation fidelity levels

MagnaMath should avoid one misleading “simulator” label. It exposes fidelity levels:

| Level | Meaning | Initial status |
|---|---|---|
| L0 — Topological | Correct vertices, polygon faces, edges, adjacency, and invariants | Implemented |
| L1 — Geometric | Correct coordinates, lengths, angles, area, volume, and rigid face transforms | Implemented for starter catalog |
| L2 — Net | Overlap-tested two-dimensional layout with cut/fold semantics | Implemented heuristically |
| L3 — Piece-compatible | Faces match calibrated physical profiles and available counts | Partially implemented |
| L4 — Kinematic assembly | Hinge motion, thickness, and collision are simulated | Planned |
| L5 — Physical behavior | Gravity, friction, magnetic attraction, and stability are approximated | Planned/experimental |
| L6 — Observed build | Camera/AR checks a real construction | Planned native-enhanced capability |

The UI must display the current confidence/fidelity rather than imply L5 from an L1 model.

## 8. Information architecture

```text
Home / Today
├── Explore catalog
│   ├── Solid detail
│   ├── Compare / dual
│   └── Concept lesson
├── Create
│   ├── Generated family
│   ├── Transform operation
│   ├── Constraint generator
│   └── Import
├── Build
│   ├── Inventory
│   ├── Recommended builds
│   ├── Net editor
│   └── Step mode / AR
├── Learn
│   ├── Concepts
│   ├── Challenges
│   └── Progress
└── Projects
    ├── Saved models
    ├── Exports
    └── Shared lessons
```

## 9. Catalog strategy

### Starter catalog — implemented

- 5 Platonic solids.
- Cuboctahedron and icosidodecahedron.
- Five uniformly truncated Platonic solids.
- Parameterized prism, antiprism, pyramid, and bipyramid families.

### Catalog expansion order

1. Complete 13 Archimedean solids.
2. Complete 13 Catalan duals.
3. Exact cupolas, rotundas, and selected high-value Johnson solids.
4. All 92 Johnson solids with fixtures and provenance.
5. Uniform star polyhedra and compounds.
6. Geodesic subdivisions with explicit triangular topology.
7. Toroidal and higher-genus teaching models.
8. User-defined and imported models.

## 10. Accessibility requirements

- Full keyboard operation for modes, shape selection, fold scrubber, face traversal, net editor, and step navigation.
- Semantic summaries such as “face 3, square, adjacent to faces 1, 4, 6.”
- High-contrast and color-independent face-class indicators.
- Reduced-motion behavior that jumps or steps instead of animating.
- Screen-reader table/list alternative for the 3D scene and net.
- Touch targets suitable for young users and tablets.
- Captions/transcripts for narrated lessons.
- No essential information encoded only by depth, hue, or animation.

## 11. Privacy and security

- Core exploration, building, and lessons require no account and no network call.
- No API key or secret is embedded in client code.
- Imported files are parsed locally by default and validated before rendering.
- Future cloud sync uses least-privilege, versioned APIs and explicit data export/deletion.
- Child-oriented hosted modes collect the minimum possible data and default to teacher/parent-controlled identity.
- Analytics, if added, are optional and aggregate interaction events rather than geometry content or camera data.

## 12. Product quality metrics

### Correctness

- 100% catalog fixture pass rate.
- 0 known mislabeled approximate solids in the “exact” catalog.
- Net validity and overlap metrics visible for every generated candidate.
- Physical match confidence visible for every build recommendation.

### Experience

- A new user reaches first successful fold interaction without instruction.
- A user with a preset tile set can determine buildability in one flow.
- Child and adult usability tests both complete a cube-to-net-to-build task.
- Mobile layout has no horizontal overflow at supported widths.

### Learning

- Learners improve prediction accuracy across concept checks.
- Explanations refer back to actions the learner performed.
- Educators can present a complete concept sequence without leaving the app.

### Technical

- Deterministic core outputs for a fixed algorithm version and seed.
- Geometry and net computation run off the main thread beyond agreed face-count thresholds.
- Automated topology, transform, export, and browser smoke tests run in CI.
- Offline PWA opens the last-used project and core catalog.

## 13. Initial-release acceptance criteria

The vertical slice is accepted when:

1. All starter models validate as closed, connected, manifold, orientable, genus-zero surfaces.
2. Canonical counts and edge uniformity pass tests.
3. The solver returns an overlap-free net for the starter catalog’s acceptance seeds.
4. Cube and tetrahedron map correctly to physical square/equilateral profiles and inventory counts.
5. Unsupported pentagonal or higher faces are not mislabeled as available pieces.
6. Explore, Build, and Learn paths work at desktop and mobile widths.
7. SVG and JSON exports are valid and include scale/metadata.
8. The app remains usable through the Canvas fallback if WebGL or Three.js is unavailable.
