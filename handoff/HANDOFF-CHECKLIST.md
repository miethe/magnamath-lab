# MagnaMath 0.4.0 Handoff Checklist

## Package integrity

- [ ] Verify the release ZIP SHA-256.
- [ ] Run `sha256sum -c MANIFEST.sha256` from the project root.
- [ ] Confirm no `node_modules`, local secrets, caches, or generated browser profiles are present.
- [ ] Confirm all seven mockup PNGs and their editable HTML/CSS sources are present.

## Environment

- [ ] Install Node.js 22.12 or newer.
- [ ] Resolve npm dependencies from a registry-enabled environment.
- [ ] Commit the real lockfile created by that environment.
- [ ] Run `npm test`.
- [ ] Run `npm run validate:all`.
- [ ] Run `npm run validate:schemas:python` where Python/jsonschema is available.
- [ ] Run `npm run build` and `npm run preview`.

## Architecture orientation

- [ ] Read `docs/21-folding-engine-foundation.md`.
- [ ] Read `docs/22-3d-interaction-controls.md`.
- [ ] Read `docs/24-final-app-design-spec.md`.
- [ ] Read `docs/26-full-implementation-handoff.md`.
- [ ] Review `src/core/folding.js`, `rigid.js`, and `motion.js` before modifying renderers.
- [ ] Confirm the rule that renderer triangles are never the source of mathematical topology.

## Runtime verification

- [ ] Open Canvas Explore, Fold, Workshop, Build, and Learn modes.
- [ ] Verify Cube at 0%, 50%, and 100% fold.
- [ ] Select and manually pose a hinge.
- [ ] Export and re-import a snapshot v4.
- [ ] Validate root pose, schedule, hinge overrides, and selected hinge round-trip.
- [ ] Exercise manual net edge edits and undo/redo.
- [ ] Generate a print package.
- [ ] Open and inspect the example spatial motion clip.

## Three.js implementation gate

- [ ] Verify face transforms match exact Canvas/core checkpoints.
- [ ] Verify TransformControls updates root state rather than bypassing it.
- [ ] Verify hinge picking resolves to stable edge keys.
- [ ] Verify camera controls do not conflict with active gizmos.
- [ ] Test Chromium, Firefox, Safari, iPadOS Safari, and at least one Android device.
- [ ] Record frame-time and memory baselines.

## UX and accessibility

- [ ] Import mockup PNGs into the product-design workspace.
- [ ] Rebuild them as components rather than raster backgrounds.
- [ ] Validate keyboard-only hinge and root manipulation.
- [ ] Add a semantic scene outline.
- [ ] Implement reduced-motion behavior.
- [ ] Confirm collision/cut/fold/evidence states do not rely on color alone.
- [ ] Conduct screen-reader and touch-target review.

## Research integration

- [ ] Run or ingest the prioritized Deep Research reports.
- [ ] Create an architecture decision record for each accepted recommendation.
- [ ] Version schema changes.
- [ ] Add a benchmark before adding a new solver claim.
- [ ] Keep research hypotheses separate from verified behavior.

## Governance

- [ ] Select and add a repository license.
- [ ] Review third-party dependency licenses.
- [ ] Establish release versioning and schema-migration ownership.
- [ ] Establish source/provenance rules for physical dimensions.
- [ ] Define child/privacy requirements before telemetry or accounts.
