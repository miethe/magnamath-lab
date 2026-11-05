# Deep Research Prompt — Spatial Interaction, 6DOF Controls, Touch, Accessibility, and XR

You are a 3D interaction researcher, HCI specialist, CAD/DCC UX architect, accessibility researcher, touch-interface designer, WebXR engineer, game-controls designer, and educational technology evaluator.

Current date: 2026-08-10.

## Context

MagnaMath needs to serve children, families, educators, and technical adults. Release 0.4.0 distinguishes camera inspection, hinge manipulation, whole-model translation, and whole-model rotation. It has a Three.js TransformControls foundation, a semantic geometry model, and responsive UI mockups. The production design must prevent gesture conflict, support precise direct manipulation, work on touch screens, and provide equivalent nonvisual and keyboard workflows.

## Research objective

Produce a source-grounded interaction specification and validation protocol for desktop, tablet, phone, gamepad, and future XR controls.

## Required research questions

1. What interaction techniques best support orbiting, focusing, selecting, translating, rotating, and manipulating one-degree-of-freedom hinges?
2. Compare orbit, arcball, trackball, first-person, and object-centric camera models.
3. How do professional CAD/DCC tools separate camera and object manipulation?
4. What touch mappings minimize conflict among orbit, pan, pinch, object drag, and hinge drag?
5. How should snapping, precision modifiers, numeric entry, and axis constraints work?
6. What target sizes and visual affordances work for children and users with motor impairments?
7. How can a full 3D scene be represented through a keyboard-accessible scene tree and semantic inspector?
8. What spoken descriptions are useful without overwhelming screen-reader users?
9. How should reduced-motion mode represent folding and spatial movement?
10. What color-independent collision, cut, fold, and evidence states are best?
11. What gamepad mappings are effective for camera plus selected-hinge control?
12. What WebXR controller/hand-tracking patterns apply to semantic hinges and faces?
13. How should comfort, scale, reach, and locomotion be handled in XR?
14. What telemetry can reveal interaction failure without collecting sensitive child data?
15. What usability-study protocols and participant groups are required?

## Required deliverables

1. Recommended control matrix for mouse, trackpad, keyboard, touch, stylus, gamepad, and XR.
2. State machine for tool activation, selection, drag capture, cancellation, and camera override.
3. Semantic picking and focus architecture.
4. Accessibility specification aligned to WCAG and relevant spatial-accessibility research.
5. Reduced-motion and nonvisual alternatives.
6. Child-oriented target-size and precision recommendations.
7. Error-prevention and undo model.
8. Usability-test plan with concrete tasks and success metrics.
9. Comparative review of Three.js OrbitControls, ArcballControls, TransformControls, and credible alternatives.
10. XR readiness architecture using WebXR and potential native RealityKit equivalents.
11. Implementation backlog and acceptance criteria.
12. Primary-source table with dates and links.

## Constraints

- Do not assume pointer-only interaction is acceptable.
- Do not make XR a requirement for the core product.
- Separate camera motion from model motion in all recommendations.
- Preserve semantic object identifiers across renderers.
