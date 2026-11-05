# Implementation Acceptance Criteria

## P0 — Production folding experience

- Exact flat and target poses match core matrices within `1e-7`.
- Every tree hinge remains coincident within `1e-7` during direct and timeline motion.
- Face dimensions remain invariant within `1e-7`.
- Hinge drag affects exactly the selected child subtree.
- Root translation and rotation do not change model-space measurements.
- Hinge, root, and camera state are serializable and replayable.
- Fold playback supports pause, scrub, speed, and at least four sequence modes.
- Canvas and Three.js paths agree at deterministic checkpoints.
- Desktop and mobile browser smoke tests produce zero uncaught errors.

## P0 — Accessibility

- All core actions are keyboard reachable.
- Selected face/edge/hinge and current angle are exposed semantically.
- Reduced-motion mode offers discrete folding checkpoints.
- Focus is retained during mode and panel changes.
- Cut, fold, collision, and evidence states have non-color indicators.
- Core touch targets meet the agreed minimum size.

## P1 — Motion Lab

- Root, folding-progress, hinge, and camera tracks play from `motion-clip/v1`.
- Keyframes can be inserted, moved, edited, and deleted.
- Quaternion rotation interpolation follows the shortest path.
- A clip can be exported and imported independently.
- Timeline playback is deterministic at a requested time.
- Direct manipulation can record keyframes without breaking exact folding invariants.

## P1 — Continuous collision

- The system distinguishes sampled from continuous results.
- A path validator returns first contact time, participants, and clearance/tolerance metadata.
- Benchmark fixtures replay deterministically.
- Cancellation and stale-result rejection work.
- Failure to find a path is not presented as proof of impossibility.

## P2 — Thick panels and physical mechanics

- All geometry inputs carry source and uncertainty.
- Hinge-axis offsets and panel thickness are explicit.
- Ideal and physical target geometry are independently inspectable.
- Closure residual and collision margin are reported.
- Fixture-verified claims link to measurement/build evidence.
