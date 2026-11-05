# Deep Research Prompt — Magnetic Tile Metrology and Hinge Mechanics

You are a mechanical metrologist, polymer-product engineer, magnetics engineer, uncertainty-analysis specialist, educational-toy researcher, and experimental-design lead.

**Current date:** [insert current date]

Create a deeply cited, implementation-ready research dossier for MagnaMath titled:

**“Physical Geometry and Hinge Mechanics of Magnetic Construction Tiles”**

## Goal

Establish defensible physical profiles and measurement protocols for MAGNA-TILES-compatible construction pieces, prioritizing official MAGNA-TILES Classic and microMAGS systems. Determine what is manufacturer-published, what can be derived geometrically, what must be measured, how much pieces vary, and what simplified mechanics MagnaMath can safely simulate.

Do not infer precise dimensions from marketing images unless they contain an explicit scale or dimension annotation. Clearly separate official, patent, derived, measured, and hypothesized claims.

## Research questions

1. What edge lengths, diagonals, thicknesses, corner radii, hinge clearances, and connector locations are officially published for each current and historically relevant piece family?
2. Which product generations, molds, sets, regions, or licensing periods may differ?
3. What do patents disclose about shell construction, magnet motion, retention, spacing, and compatible edge geometry—and what do they not prove about current retail products?
4. What repeatable non-destructive measurement protocol should be used for squares, large squares, rectangles, equilateral triangles, right triangles, tall isosceles triangles, and micro equivalents?
5. What sample size and lot selection are sufficient for product-level versus household-level calibration?
6. How should uncertainty from calipers, rounded corners, flexible shells, measurement registration, and piece-to-piece variation be propagated?
7. How should stable hinge-angle range, holding torque, detachment force, angular stiffness, and snap-through behavior be measured safely?
8. Which parameters materially affect collision, closure, and stability simulation?
9. Which simplified mechanics model is appropriate for a browser application, and where would it become misleading?
10. What reference physical builds should be used as fixtures?

## Required experimental design

Provide:

- equipment list with budget, prosumer, and laboratory tiers;
- tool calibration and print-calibration procedures;
- sampling plan across pieces, sets, and purchase lots;
- diagrams showing measurement landmarks;
- at least three repeated readings per dimension and five pieces per type where feasible;
- hinge-angle sweep protocol with load/force control;
- retention-force and torque protocol with safety limits;
- environmental controls and metadata;
- outlier and damaged-piece handling;
- uncertainty budget and confidence-tier rules.

## Machine-readable deliverables

Design schemas and example records for:

- `physical-piece-profile.json`;
- `measurement-session.json`;
- `hinge-pair-test.json`;
- `connector-compatibility.json`;
- `reference-build-observation.json`.

Include units, uncertainty, provenance, SKU/set identifiers, sample IDs, tool IDs, photos, and versioning.

## Required outputs

1. Executive decision summary.
2. Source/evidence table with dates and URLs/DOIs.
3. Piece taxonomy and known dimensions.
4. Patent-to-product claim matrix.
5. Experimental protocol.
6. Uncertainty and statistical model.
7. Browser-simulation parameter recommendation.
8. Reference-build fixture plan.
9. Machine-readable schemas and examples.
10. Claims safe to ship now, claims requiring measurement, and claims that should not be made.
11. Prioritized procurement list.
12. Open questions and final verification checklist.

Prioritize primary manufacturer materials, patents, standards, and peer-reviewed engineering sources. Treat reseller dimensions and community measurements as leads requiring independent verification.

## Seed primary sources

Begin with, but do not limit the search to:

- MAGNA-TILES FAQ: <https://magnatiles.com/pages/faq>
- microMAGS 70-piece product/size diagram: <https://magnatiles.com/products/micromags-70-piece-set>
- Classic 37 inventory: <https://magnatiles.com/products/magna-tiles-classic-37-piece-set>
- Classic 74 inventory: <https://magnatiles.com/products/magna-tiles-classic-74-piece-set>
- Classic 100 inventory: <https://magnatiles.com/products/magna-tiles-classic-100-piece-set>
- Combo 46 inventory: <https://magnatiles.com/products/combo-46-piece-set>
- US9636600B2, “Tile construction set using plastic magnets”: <https://patents.google.com/patent/US9636600B2/en>

Treat patent embodiments as evidence of disclosed mechanisms, not proof that every current retail piece uses every disclosed dimension or construction detail.
