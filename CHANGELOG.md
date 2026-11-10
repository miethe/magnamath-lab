# Changelog

## 0.4.1 — 2026-11-10

### Fixed

- Phone layout: the bottom mode dock spans the full width so every mode tab is reachable.

### Changed

- Licence stated as MIT throughout the documentation.
- Release notes, README and `RELEASE.json` agree on the version; "release candidate" wording removed.
- `MANIFEST.sha256` regenerated.
- Known limitation restored: a folded solid with a large net renders off-centre.

## 0.4.0 — 2026-11-05 — Fold Through Space

- Added exact tree-hinge 2D-to-3D folding from the selected net.
- Added multiple hinge timeline sequences, manual hinge posing, and exact target snapping.
- Added hinge continuity, cut-edge closure, rigid-face, target-fit, and sampled collision diagnostics.
- Replaced Canvas and Three.js face morphing with exact rigid transforms.
- Added semantic Inspect/Hinge/Move/Rotate control modes.
- Added Three.js root translate/rotate controls and selectable hinge handles.
- Added rigid matrix/quaternion composition, decomposition, and interpolation.
- Added renderer-independent motion clips with root, fold, hinge, camera, and marker tracks.
- Added folding-plan, motion-clip, and snapshot-v4 schemas and examples.
- Added final product UI mockup atlas and design specification.
- Added six Deep Research briefs covering continuous collision, closed-loop kinematics, thick panels, spatial UX, learning science, and scaling.
- Added complete implementation-handoff documentation and release validation.

## 0.3.0 — 2026-08-08

### Added

- Cancellable Web Worker net-portfolio search with a synchronous fallback.
- Deterministic constrained random sampling, bounded edge-exchange improvement, Pareto filtering, and diversity selection.
- Visual candidate gallery with area, cut perimeter, depth, and leaf metrics.
- Multi-page print layout for Letter, Legal, Tabloid, A4, and A3.
- Actual-size, fit, and poster modes with automatic orientation.
- Glue tabs, cut-pair labels, face labels, crop marks, registration marks, and a fixed 50 mm verification ruler.
- Standalone HTML and dependency-free ZIP print packages.
- Exact regular-hexagon panels made from six equilateral triangles.
- Compound-panel seams in previews, SVG, print pages, snapshots, bills of materials, and build steps.
- Raw calibration-session v2 records, collection export/import, and deterministic profile re-derivation.
- Repeatability confidence intervals and bounded expanded-uncertainty estimates.
- Local finite-slab thickness-clearance screening with explicit evidence/assumption labels.
- IndexedDB project library with save, open, and delete flows.
- Snapshot v3, calibration-session v2, compound-recipe, and print-package schemas.
- Expanded example set including print ZIP and compound truncated-octahedron project.
- Advanced workflow and JSON/reference validation scripts.
- Reproducible example-generation validator.

### Changed

- External project imports are detached from local IndexedDB identities.
- Shape/parameter changes branch into a new unsaved project rather than overwriting the prior local project.
- Candidate portfolios and print caches invalidate after material net/constraint changes.
- Snapshot profile provenance includes profiles used inside compound panels.
- Snapshot v3 records thickness-screen output and selected clearance assumption.
- PWA description and documentation now reflect the full Workshop → Print → Build workflow.

### Validation

- 25/25 behavioral tests.
- 16/16 exact catalog entries.
- 320/320 overlap-free automatic seed-sweep nets.
- 502/502 manual exchanges retained a spanning tree; 492/502 were immediately overlap-free.
- All 16 catalog families returned constrained overlap-free portfolio candidates.
- 9 profiles and 5 published inventory presets validated.
- 18 JSON documents parsed, 12 unique schema IDs, and 47 internal references resolved.
- 14 generated example files reproduced byte-for-byte across two runs.

## 0.2.0 — 2026-08-08

### Added

- Manual net cut/fold editing with automatic legal edge exchange.
- Required-fold and required-cut locks.
- Root-face control, undo/redo, and constrained optimization.
- Compact, print-efficient, build-friendly, and classroom objectives.
- Live overlap diagnostics and exact fold/cut state export.
- Snapshot v2 guarded import/export with embedded calibration profiles.
- Standard, microMAGS, and combined tile-family support.
- Global physical scale fitting and inventory-aware minimum-cost assignment.
- Repeat-sample calibration statistics, thickness/corner-radius fields, and hinge ranges.
- Per-edge hinge verification and calibrated build instructions.
- Calibration profile manager and printable calibration sheet.
- Snapshot v2, tile-profile v2, collection, workshop, and session schemas.
- Workshop and tile validators plus expanded behavioral tests.
- Six Deep Research prompts for the remaining empirical/research-heavy work.

### Changed

- Print scoring now uses the actual exposed cut perimeter.
- Confidence wording separates published dimensions from user calibration.
- microMAGS 70 tracks unmodeled large rectangles explicitly instead of guessing dimensions.
- Renderer attachment preserves viewport hints/loaders.
- Persistence moved to state version 2 with legacy migration.

### Validation

- 15/15 tests.
- 16/16 catalog entries.
- 320/320 overlap-free automatic seed-sweep nets.
- 502/502 manual exchanges retained a spanning tree; 492/502 immediately overlap-free.
- Nine profiles and five published inventory presets validated.

## 0.1.0 — 2026-08-08

### Added

- Renderer-independent explicit polyhedron model.
- Exact starter catalog with 16 entries.
- Dual, rectification, and uniform truncation operations.
- Topology validation and geometric measurements.
- Deterministic overlap-aware net search and build steps.
- Physical tile profile matching and inventory analysis.
- Three.js and Canvas renderer adapters.
- Explore, Build, and Learn responsive interface.
- Versioned true-scale SVG/JSON export, checked JSON Schemas, examples, and PWA configuration.
- Node tests, catalog validation, net-seed sweep, and browser smoke validation.
- Product, architecture, API, UX, validation, and project-plan documentation.
