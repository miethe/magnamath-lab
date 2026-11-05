# Requirement Traceability — 0.4.0

| Requirement | Implementation | Validation / artifact |
|---|---|---|
| Exact 2D net to 3D solid folding | `src/core/folding.js` | `test/folding.test.js`, `validate-folding.mjs` |
| Rigid faces throughout motion | Face-level matrix transforms | Max error `8.55e−15` |
| Exact target reconstruction | Root-aligned source transforms | Max matrix error `2.04e−14` |
| Multiple fold sequences | `createFoldingSchedule` | Four modes in 448-pose sweep |
| Manual hinge control | Main UI + render adapters | Canvas smoke, folding override test |
| Hinge/closure diagnostics | `folding-diagnostics.js` | Unit and sweep validation |
| Sampled collision warning | `folding-collision.js` | Explicit bounded result contract |
| Whole-model spatial controls | Root pose + Three TransformControls | Source syntax, design and browser handoff gate |
| Quaternion motion interpolation | `rigid.js`, `motion.js` | Motion tests |
| Root/fold/hinge/camera tracks | `motion-clip/v1` | Example and schema validation |
| Portable folding state | `folding-plan/v1`, snapshot v4 | Export/import tests and examples |
| Full final UI direction | `design/mockups/` | Seven PNG renders and HTML/CSS sources |
| Product design spec | `docs/24-final-app-design-spec.md` | Handoff review |
| Advanced control spec | `docs/22-3d-interaction-controls.md` | Acceptance criteria |
| Implementation handoff | `docs/26-*`, `handoff/` | Package contents and checklist |
| Research guidance | `research-prompts/01–12` | Deep Research program |
| Existing manual net system | `net.js`, worker client | Workshop validation |
| Existing physical calibration | `tiles.js`, `calibration.js` | Physical tests and examples |
| Existing print packages | `print.js`, `zip.js` | ZIP integrity and print tests |

## Deferred requirements with explicit integration points

| Deferred capability | Integration point | Research brief |
|---|---|---|
| Continuous collision/path planning | Future `FoldingSolverAdapter` | DR-07 |
| Closed-loop IK | Constraint solver adapter | DR-08 |
| Thick-panel offsets | Physical profile and feasibility layer | DR-09 |
| Advanced spatial accessibility | Semantic interaction layer | DR-10 |
| Full lesson curriculum | Motion markers and lesson schema | DR-11 |
| WebGPU/WASM/physics scaling | Worker/renderer adapters | DR-12 |
| Camera/AR verification | Snapshot + semantic selection boundary | DR-05 |
