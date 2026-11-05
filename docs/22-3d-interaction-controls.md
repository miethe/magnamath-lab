# Three-Dimensional Interaction and Control Specification

**Release:** 0.4.0  
**Scope:** Desktop, touch, keyboard, future gamepad, and XR control architecture.

## 1. Interaction model

MagnaMath uses explicit tools rather than overloading every drag gesture:

| Tool | Primary target | Primary action |
|---|---|---|
| Inspect | Camera and selectable geometry | Orbit, pan, zoom, focus, select |
| Hinge | One fold edge | Select and rotate a hinge |
| Move | Whole mechanism | Translate the root pose |
| Rotate | Whole mechanism | Rotate the root pose |
| Pivot | Camera/object pivot | Reposition focus without changing geometry |
| Measure | Faces, edges, points | Create temporary geometric measurements |

The active tool must always be visible. Tool changes are commands and belong in undoable application state where they affect geometry or authored motion.

## 2. Camera versus object control

Camera navigation and model manipulation must not compete for the same unmodified gesture.

Recommended desktop mapping:

| Input | Inspect | Hinge | Move/Rotate |
|---|---|---|---|
| Primary drag | Orbit camera | Drag selected hinge | Manipulate active gizmo axis/plane |
| Shift + primary drag | Pan camera | Fine hinge adjustment | Fine transform |
| Secondary drag | Pan camera | Orbit camera | Orbit camera outside gizmo |
| Wheel/trackpad pinch | Dolly/zoom | Dolly/zoom | Dolly/zoom |
| Double click/tap | Focus selection | Select and focus hinge | Move pivot to selection |
| Escape | Clear selection | Release hinge | Cancel active transform |

Recommended touch mapping:

- one-finger drag on empty space: orbit;
- one-finger drag on a selected hinge handle: rotate that hinge;
- two-finger drag: pan;
- pinch: zoom;
- two-finger twist: camera roll only in Motion Lab;
- long press: open contextual actions;
- explicit transform gizmos for object translation and rotation.

## 3. Transform spaces

Every transform operation declares its reference space:

- **World:** fixed global axes;
- **Model:** axes of the complete mechanism root;
- **Face:** selected face-local frame;
- **Hinge:** axis and orthogonal frame of a selected edge;
- **Camera:** screen-aligned translation plane.

Scaling is excluded from geometry motion because it would invalidate exact metric relationships. View-only magnification belongs to the camera.

## 4. Six-degree-of-freedom root pose

The complete mechanism has three translation and three rotation degrees of freedom. The stored pose is one rigid 4×4 matrix or its decomposed translation/quaternion representation.

Production controls require:

- axis and planar translation handles;
- rotation rings;
- local/world-space toggle;
- snapping increments;
- numeric entry;
- reset and frame-selection actions;
- keyframe recording;
- command-history integration;
- bounds-aware camera framing.

The release Three.js renderer already exposes root translation and rotation through `TransformControls`; the pure core provides matrix/quaternion serialization and interpolation.

## 5. Hinge manipulation

A hinge handle is not a generic object rotation. It must:

1. resolve to a stable topology edge key;
2. identify parent and child subtrees;
3. rotate only the child subtree;
4. clamp or warn against configured limits;
5. update the exact forward-kinematic pose;
6. expose current, target, and optionally physically stable angle ranges;
7. show collision and closure consequences;
8. support numeric angle entry and keyboard increments.

Recommended keyboard behavior:

```text
[ / ]            previous / next hinge
ArrowLeft/Right  −/+ 1°
Shift + arrows   −/+ 0.1°
Alt + arrows     −/+ 5°
T                set target angle
F                return hinge to timeline
H                toggle hinge tool
```

## 6. Picking architecture

Picking should be layered and deterministic:

1. transform gizmo handles;
2. visible hinge handles;
3. face geometry;
4. edges/vertices in measurement mode;
5. empty scene.

Each result is a semantic reference such as `{kind:'hinge', edgeKey:'1:5'}` rather than a raw mesh pointer. Render objects may be recreated without invalidating application state.

For larger models, use a bounding-volume hierarchy or equivalent acceleration structure for ray tests. Worker-based preprocessing should remain optional because pointer feedback must be immediate.

## 7. Camera rigs

Recommended camera modes:

- **Orbit inspection:** default educational navigation;
- **Orthographic net/diagram:** distortion-free planar work;
- **Perspective spatial:** folding and build-along;
- **Presentation camera:** follows authored camera tracks;
- **Tabletop camera:** low-angle physical assembly view;
- **XR camera:** supplied by the immersive device.

Camera state should include position, target, up vector, projection type, field of view or orthographic scale, near/far planes, and optional saved framing bounds.

## 8. Motion authoring

The Motion Lab builds on `motion-clip/v1`:

- root-pose track;
- folding-progress track;
- per-hinge tracks;
- camera track;
- markers and narration cues.

Authoring requirements:

- dope-sheet timeline;
- keyframe add/delete/duplicate;
- easing editor;
- clip trimming and looping;
- multi-selection and time scaling;
- recording of direct manipulation;
- motion-path visualization;
- export/import independent of a whole project;
- deterministic preview at a requested time.

## 9. Accessibility

Every spatial operation needs a non-pointer equivalent:

- hierarchical scene outline;
- searchable face/edge/hinge list;
- numeric transform fields;
- keyboard step controls;
- verbal pose summaries;
- text equivalents for visual diagnostics;
- optional sonification or haptic cues;
- high-contrast and color-independent states;
- reduced-motion mode that replaces continuous animation with stepped poses;
- focus retention when panels or modes change.

A screen reader should be able to hear, for example:

> “Hinge edge 1:5, connecting face 1 to face 4. Current rotation 48.6 degrees. Target rotation 90 degrees. No collision detected at this sampled pose.”

## 10. Future gamepad and XR mapping

A gamepad can map sticks to camera orbit/pan and triggers to selected-hinge motion, but must retain on-screen state and remapping.

XR support should use device-provided head pose, controllers, or hand tracking through an adapter. Direct grabbing must still resolve to semantic faces and hinges, and all movement must flow through the same command/kinematic layer used by desktop controls.

## 11. Acceptance criteria

- No gesture ambiguity between active model manipulation and camera navigation.
- Every geometry-changing action is reproducible from serialized commands/state.
- Hinge dragging preserves face rigidity and hinge continuity at every sampled frame.
- Root transforms never alter model-space measurements.
- Keyboard-only users can select and pose every hinge.
- Reduced-motion users can understand the same sequence through discrete states.
- Touch targets are at least 44 CSS pixels where practical.
- Renderer objects are never treated as authoritative project identifiers.
