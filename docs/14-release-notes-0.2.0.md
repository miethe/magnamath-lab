# 14 — Release Notes 0.2.0

## Headline

MagnaMath 0.2.0 adds a constrained manual net editor and a repeatable physical tile calibration system.

## Added

- Manual cut/fold edge editing with automatic legal edge exchange.
- Locked cuts and folds retained during optimization.
- Root-face changes without altering physical cuts.
- Undo/redo and objective-specific optimization.
- Live overlap pair/area diagnostics.
- Correct exposed-cut-perimeter scoring.
- Snapshot v2 project import/export.
- Standard, micro, and combined tile families.
- Global physical scale fitting.
- Inventory-aware minimum-cost profile assignment.
- Repeat-sample calibration with mean, standard deviation, and repeatability.
- Thickness, corner-radius, and stable hinge-range fields.
- Hinge verification per shared edge and build step.
- Calibration profile manager and embedded project profiles.
- Calibration sheet and calibrated example project.
- JSON Schemas for snapshots, profiles, collections, workshop state, and sessions.
- Six implementation-focused Deep Research prompts.

## Changed

- Physical confidence now distinguishes manufacturer-published data from user calibration.
- Print objective uses actual exposed cut-edge perimeter.
- Renderer adapters preserve viewport hint/loader elements.
- microMAGS 70 inventory explicitly tracks two unmodeled large rectangles rather than assigning guessed dimensions.
- Project persistence migrates to state version 2.

## Validation summary

- 15/15 behavioral tests passed.
- 16/16 catalog entries validated.
- 320/320 automatic seed-sweep nets overlap-free.
- 502/502 manual edge exchanges preserved the tree invariant.
- 492/502 manual edits immediately overlap-free; all overlaps diagnosed.
- Constrained optimizer produced an overlap-free net for every catalog entry.
- Nine profiles and five published inventory presets validated.
- Desktop and 390 px mobile Canvas smoke tests passed with no console/page errors or horizontal overflow.

## Known release gate

The sandbox package mirror did not contain Three.js `0.185.1`, and direct npm registry access timed out. Therefore the Vite/Three.js production bundle remains an external CI gate. No lockfile was fabricated.
