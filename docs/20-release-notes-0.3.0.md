# 20 — MagnaMath 0.3.0 Release Notes

## Release theme

**From editable nets to a reproducible Workshop → Print → Physical Plan workflow.**

Release 0.3.0 implements the largest non-research-dependent portion of the next roadmap while keeping uncertain mechanics explicitly bounded.

## Highlights

1. **Net portfolios:** cancellable worker search, local improvement, Pareto filtering, and user-selectable alternatives.
2. **Print production:** page presets, actual/fit/poster modes, tabs, labels, marks, 50 mm scale ruler, HTML, and ZIP.
3. **Exact compound panels:** regular hexagons assembled from six equilateral triangles, including truncated-octahedron support.
4. **Calibration evidence:** portable raw sessions, re-derivation, and bounded uncertainty statistics.
5. **Thickness screening:** local two-panel slab checks with explicit measured/scenario provenance.
6. **Local project library:** IndexedDB persistence and safer import/branch behavior.
7. **Snapshot v3:** full state for print, compound assignments, sessions, and clearance provenance.
8. **Import/UI hardening:** validated project thumbnails are regenerated from geometry and user-derived display strings are escaped.
9. **Reproducible fixtures:** documentation examples pin export timestamps and validate byte-for-byte stability across repeated generation.

## Compatibility

- Snapshot v3 is the current export format.
- Snapshot v2 remains importable and is migrated in memory.
- Tile profile v2 remains current.
- Existing v0.2 workshop trees and profile overrides continue to work.

## Validation headline

```text
25 / 25 behavioral tests
16 / 16 catalog entries
320 / 320 automatic seed-sweep nets overlap-free
502 / 502 manual edits preserved the spanning-tree invariant
16 / 16 catalog families returned constrained overlap-free portfolios
```

## Known external gate

The environment used for this release could not resolve `three@0.185.1` from its configured package mirror, which returned `404`. The Canvas path and all dependency-free core behavior were executed. A clean `npm install`, Vite build, and Three.js browser matrix remain the first registry-enabled CI gate; no lockfile was fabricated.

## Deferred for Deep Research results

- stronger tabu/evolutionary/symmetry-aware net optimization;
- measured magnetic connector geometry, forces, and hinge axes;
- general compound-face tiling and rigidity certificates;
- full folding kinematics, global collision, and stability;
- deterministic prepress/PDF/cutter standards;
- camera/AR recognition and build-state verification.
