# MagnaMath Final Application Design Specification

## 1. Product promise

**MagnaMath makes exact geometry visible, movable, printable, and physically buildable.**

The app should feel like a scientific instrument that a child can confidently explore—not a toy interface that hides the mathematics, and not an engineering CAD package that hides the joy.

## 2. Experience principles

1. **One geometry, many lenses.** Explore, Fold, Workshop, Build, and Learn share one authoritative model.
2. **Show causality.** Selecting a face or hinge updates 2D, 3D, measurements, physical pieces, and explanation together.
3. **Progressive depth.** A young learner can drag and discover; an expert can inspect matrices, constraints, tolerances, and provenance.
4. **Physical truth is evidence-labeled.** Exact geometry, measured dimensions, bounded simulations, and verified fixtures must remain visibly distinct.
5. **Motion explains.** Animation is used to reveal relationships, not as decoration.
6. **Reversible exploration.** Every meaningful edit can be undone, replayed, exported, or compared.

## 3. Information architecture

### Primary modes

| Mode | User question | Core surface |
|---|---|---|
| Explore | “What is this shape?” | 3D model + exact measurements |
| Fold | “How does this net become the solid?” | 2D↔3D rigid folding studio |
| Workshop | “Can I design a better net?” | synchronized net and target views |
| Build | “How do I make this with my tiles?” | physical inventory and step guide |
| Learn | “Why does the geometry work?” | guided interactive lessons |

### Advanced workspace

**Motion Lab** is accessed from Fold rather than occupying the beginner navigation. It adds 6DOF root, hinge, and camera tracks for lesson and presentation authoring.

### Global actions

- shape/catalog switcher;
- projects;
- import/export/share;
- settings/accessibility;
- help and evidence glossary.

## 4. Desktop shell

Target canvas: 1440×900 reference layout.

```text
┌──────────────────────── global top bar ────────────────────────┐
│ left context │            main spatial canvas          │ lens  │
│ 278 px       │              flexible                    │320 px │
│              ├──────── timeline / candidates / metrics ┤       │
└─────────────────────────────────────────────────────────────────┘
```

- Left rail: catalog, topology, inventory, lesson path, or constraints.
- Center: dominant 2D/3D interaction surface.
- Right rail: selected semantic object and current evidence.
- Bottom: timeline, Pareto candidates, build sequence, or metric ribbon.
- Panels may collapse on medium screens.

## 5. Responsive behavior

### Tablet landscape

- left rail becomes a 240 px drawer;
- right inspector becomes a 300 px overlay sheet;
- canvas retains center priority;
- timeline remains persistent in Fold and Motion Lab.

### Tablet portrait and phone

- primary 3D view occupies the top 38–45%;
- a draggable bottom sheet contains the current step or inspector;
- mode navigation becomes a five-item bottom bar;
- advanced settings move into contextual sheets;
- Build defaults to large step controls and hands-free progression;
- Workshop uses an explicit 2D/3D tab rather than a cramped split view.

## 6. Visual language

### Color tokens

| Token | Role |
|---|---|
| Deep ink | Background and depth |
| Cyan | exact geometry, active hinge, primary action |
| Blue | secondary faces and neutral selection |
| Violet | alternate face families, spatial rotation |
| Pink | cuts, warnings requiring attention, X axis |
| Amber | bounded assumption or caveat |
| Green | validated/available/complete |
| Red | collision, invalid topology, blocking shortage |

Color is never the only indicator. Every state also uses labels, symbols, line style, or shape.

### Surfaces

- translucent dark panels over a spatial canvas;
- 1 px low-contrast borders;
- 12–20 px corner radii;
- restrained glow only for selected exact geometry;
- no ornamental glass effects that reduce legibility.

### Typography

- system sans or licensed variable sans with strong numeral clarity;
- compact uppercase eyebrow labels;
- large, friendly mode titles;
- tabular numerals for angles, measurements, and timecode;
- minimum 12 px supporting text on desktop and 14 px for core mobile instructions.

## 7. Geometry rendering

- semi-transparent face fills with distinct edge strokes;
- selected faces receive a brighter outline and subtle internal fill change;
- cut edges are solid and visually distinct from dashed fold edges;
- hinge axes use cylindrical or line handles with direction affordances;
- collision regions use crosshatching or pulsing outlines in addition to color;
- physical pieces may use more material depth but must preserve the mathematical overlay.

## 8. Core components

### Shape selector

Shows thumbnail, family, exact/derived status, parameter controls, and recently used shapes.

### Semantic selection card

Adapts to face, edge, hinge, vertex, compound panel, physical piece, or motion keyframe.

### Evidence badge

Uses controlled vocabulary:

- Exact;
- Derived;
- Published dimension;
- User measured;
- Bounded simulation;
- Fixture verified;
- Unverified.

### Fold transport

Play/pause, timecode, scrubber, speed, sequence mode, loop, step to motion events, and reduced-motion stepping.

### Timeline

Beginner Fold shows compact hinge windows. Motion Lab expands into a dope sheet with root, camera, global fold, and per-hinge tracks.

### Net canvas

Supports semantic edge hit targets, face labels, root marker, constraints, overlaps, tabs, page boundaries, and physical seams.

### Build step

Always answers:

1. Which piece?
2. Which edge?
3. Which direction?
4. What target angle?
5. What is known versus unverified physically?

## 9. Motion behavior

- default easing: ease-in/out cubic;
- geometry manipulations remain responsive and can bypass easing during direct drag;
- transitions between mode layouts use 180–260 ms motion;
- exact fold playback uses a user-controlled duration;
- selection changes use subtle 120 ms emphasis;
- reduced-motion mode replaces transitions with instant state changes and stepped folding checkpoints.

## 10. Sound and haptics

Optional, never required:

- quiet click at keyframe or build-step completion;
- increasing pitch as a hinge approaches target;
- distinct warning pulse for collision or unsupported physical fit;
- mobile haptic tick at snapping increments;
- complete mute and intensity controls.

## 11. Accessibility

- WCAG AA contrast for text and interactive controls;
- visible focus rings;
- semantic heading and landmark structure;
- keyboard-equivalent model navigation;
- non-canvas scene outline;
- narrated geometry summaries;
- large-target option;
- reduced transparency and reduced motion;
- dyslexia-friendly spacing option without changing mathematical notation;
- color-independent line patterns and badges;
- live regions for pose and validation changes without excessive announcements.

## 12. Mockup deliverables

Source HTML/CSS and PNG references are stored in `design/mockups/`:

1. Fold Studio;
2. Geometry Explorer;
3. Manual Net Workshop;
4. Physical Build-Along;
5. Learning Lab;
6. Spatial Motion Lab;
7. Mobile Build Mode.

These are product-direction mockups, not pixel contracts. The implementation team should preserve information hierarchy, evidence language, and synchronized interaction behavior while adapting components to the chosen framework.
