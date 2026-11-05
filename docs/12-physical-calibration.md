# 12 — Physically Calibrated Tile System

> **Historical foundation:** This document describes the 0.2.0 calibration baseline. The 0.3.0 raw-session uncertainty, compound-panel, and bounded-clearance additions are documented in `17-compound-face-panels.md`, `18-calibration-sessions-and-uncertainty.md`, and `19-bounded-thickness-screen.md`.


**Release:** 0.2.0
**Status:** implemented metrology-aware foundation; full mechanics remain future work

The physical system distinguishes geometric compatibility, inventory availability, and empirically verified mechanics. It never treats “same number of sides” as sufficient evidence that a face maps to a real magnetic tile.

## 1. Evidence model

Every profile carries separate claims for polygon shape and physical scale.

| Label | Meaning |
|---|---|
| Manufacturer | Dimension or inventory published by the maker |
| Canonical | Exact mathematical polygon form, such as a square or equilateral triangle |
| Derived | Computed from a declared nominal geometry, not physically measured |
| Nominal | Useful working assumption that requires calibration |
| Measured | Based on one or more user samples |
| Calibrated | At least three repeat samples with relative edge-length repeatability at or below 1% |

The UI now reports `published/high` for manufacturer-scale canonical pieces and reserves `user-calibrated` for profiles that actually satisfy the repeat-measurement rule.

## 2. Built-in size systems

The baseline model uses:

```text
standard edge = 74.93 mm
micro edge    = 37.465 mm
```

The micro system is therefore modeled at exactly one half of the published standard square edge. Standard and micro pieces remain distinct profile families even when both are declared connector-compatible.

Built-in inventories cover:

- Classic 37-piece;
- Classic 74-piece;
- Classic 100-piece;
- microMAGS 70-piece;
- Combo 46-piece;
- custom inventory.

The microMAGS 70-piece preset retains two manufacturer-listed large rectangles as explicit excluded metadata because this release does not assert unpublished edge dimensions for them.

### Published evidence baseline

| Claim encoded in 0.2.0 | Primary manufacturer evidence | Treatment in MagnaMath |
|---|---|---|
| Standard square edge `74.93 mm`; micro square edge `37.465 mm` | [microMAGS size diagram](https://magnatiles.com/products/micromags-70-piece-set) | Used as manufacturer-published scale |
| Classic 37 inventory: 18 squares, 2 large squares, 7 equilateral, 6 right, 4 isosceles triangles | [Classic 37 product page](https://magnatiles.com/products/magna-tiles-classic-37-piece-set) | Exact preset counts |
| Classic 74 inventory: 40 squares, 6 large squares, 14 equilateral, 6 right, 8 isosceles triangles | [Classic 74 product page](https://magnatiles.com/products/magna-tiles-classic-74-piece-set) | Exact preset counts |
| Classic 100 inventory: 50 squares, 4 large squares, 20 equilateral, 11 right, 15 isosceles triangles | [Classic 100 product page](https://magnatiles.com/products/magna-tiles-classic-100-piece-set) | Exact preset counts |
| microMAGS 70 inventory: 40 squares, 14 equilateral, 6 right, 8 isosceles triangles, plus 2 large rectangles | [microMAGS 70 product page](https://magnatiles.com/products/micromags-70-piece-set) | 68 dimensioned-family pieces modeled; 2 rectangles retained as unmodeled inventory metadata |
| Combo 46 includes both Classic and micro families with the package-listed counts | [Combo 46 product page/package image](https://magnatiles.com/products/combo-46-piece-set) | Exact preset counts; no unsupported dimensional inference |

Manufacturer pages establish labels, set inventories, compatibility claims, and the square-size diagram. They do **not** establish precise edge lengths for every specialty triangle, rectangle, product generation, or mold. Those remain nominal/derived or user-calibrated.

## 3. Polygon registration

A face and tile can begin at different vertices or be wound in opposite directions. For each candidate, MagnaMath evaluates:

- every cyclic rotation;
- both winding orientations;
- normalized side-length ratios;
- aligned interior angles;
- aligned physical dimensions when present.

This prevents vertex ordering from changing compatibility results.

## 4. One global physical scale

A single physical build cannot silently use one millimeter-per-model-unit ratio on one face and a different ratio on another. MagnaMath therefore:

1. derives possible scale estimates from compatible face/profile pairs;
2. clusters near-equal scale candidates;
3. evaluates the whole solid at each candidate scale;
4. chooses one global `modelUnitMm` value;
5. rejects face assignments outside dimensional tolerance.

The user may instead lock the scale to standard, micro, or a custom calibrated value.

This eliminates the earlier failure mode where a solver could choose a standard square for one face and a micro square for an equivalent face merely because both shapes fit.

## 5. Inventory-aware assignment

At a fixed scale, multiple physical profiles may fit a face. MagnaMath solves a minimum-cost flow problem:

- one unit of demand per face;
- compatible face-to-profile arcs weighted by geometric error and evidence confidence;
- owned inventory capacity at zero shortage penalty;
- additional virtual capacity with a large missing-piece penalty.

The result gives a globally consistent bill of materials rather than greedily assigning each face in isolation.

## 6. Calibration workflow

### Measurement protocol

1. Print `examples/calibration-sheet.svg` at **Actual Size / 100%**.
2. Verify the printed 100 mm reference line with a reliable ruler.
3. Select a base profile in the calibration dialog.
4. Measure every edge of at least three representative pieces with calipers where practical.
5. Optionally record thickness and corner radius.
6. Optionally measure the stable interior-angle range of a connected pair.
7. Record tool, date, batch/set notes, and anomalies.
8. Save the profile override and export it as JSON.

### Statistics

For each edge position, the profile records:

- arithmetic mean;
- sample standard deviation;
- minimum and maximum;
- normalized side ratios.

It also records:

```text
relative repeatability = max(edge standard deviation / edge mean)
```

The current confidence rule is deliberately simple:

```text
sample count >= 3 and relative repeatability <= 1%  → calibrated
otherwise                                            → measured
```

This is a product confidence tier, not a laboratory accreditation claim.

## 7. Hinge verification

For each shared polyhedron edge, MagnaMath checks:

1. both incident faces have physical assignments;
2. connector compatibility groups agree;
3. aligned physical edge lengths differ by no more than the configured tolerance;
4. both profiles have measured stable hinge ranges;
5. the target interior dihedral angle lies inside the intersection of those ranges.

The result is one of:

- `verified`;
- `outside-range`;
- `unverified`;
- `unsupported`;
- `connector-mismatch`;
- `edge-length-mismatch`.

Build instructions surface this state at each assembly step. “Hinge verified” means only that the target angle falls inside the measured stable range; it does not yet prove collision-free closure or structural stability.

## 8. Profile data contract

Tile-profile v2 records include:

```text
identity
system and family
side ratios and interior angles
physical edge dimensions
thickness and corner radius
connector compatibility group
stable hinge range
evidence source and confidence
raw repeat samples and summary statistics
measurement device, time, and notes
```

User profiles override built-ins by profile ID. Snapshot v2 can embed those overrides, allowing a project to reproduce the same physical assumptions on another device.

## 9. Validation evidence

0.2.0 validates:

- nine built-in profile records;
- five published inventory presets;
- standard cube at `74.93 mm/u`;
- micro cube at `37.465 mm/u`;
- prevention of mixed-scale assignment;
- three-sample calibration statistics and round-trip JSON;
- calibrated hinge verification;
- explicit rejection of unsupported pentagonal faces;
- published inventory totals, including excluded unmodeled pieces.

## 10. What the system does not yet claim

- Exact dimensions for every product generation, SKU, mold, or region.
- Magnet center positions, magnetic moment, polarity sequence, or retention torque.
- Full 3D shell geometry around rounded corners and magnet housings.
- Collision-free folding with tile thickness.
- Gravity, friction, tabletop support, snap-through, or closure force.
- Compound tiling of one mathematical face with several physical pieces.
- Statistical population estimates across manufacturing lots.
- Camera-derived calibration accuracy.

## 11. Recommended physical fixture program

Create a versioned reference dataset with:

- at least three sets from different purchase dates where available;
- five pieces per tile type per set;
- caliper edge, diagonal, thickness, and corner-radius measurements;
- connector/magnet center estimates from non-destructive imaging or external geometry;
- hinge-angle sweeps under a repeatable loading protocol;
- photos, set/SKU identifiers, tool calibration, and ambient conditions;
- successful and failed reference builds linked to exact project snapshots.

This is the highest-value empirical input before implementing collision, stability, or AR verification.
