# 04 — UX Blueprint

## Experience principle

The interface should feel like a **scientific instrument made inviting for play**. It avoids a child-only toy aesthetic and avoids a dense CAD aesthetic. The same scene progressively reveals more precision as the learner asks for it.

## Current vertical-slice layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Brand                 Explore / Build / Learn             Status │
├───────────────┬─────────────────────────────────┬───────────────┤
│ Shape +       │                                 │ Net preview + │
│ topology +    │       3D / 2D primary stage     │ current-mode  │
│ face classes  │                                 │ inspector     │
│               │       fold scrubber             │               │
└───────────────┴─────────────────────────────────┴───────────────┘
```

At tablet widths, the inspector moves below the stage in two columns. At phone widths, the stage appears first, followed by controls and the inspector; the mode switcher becomes a persistent thumb-reachable control.

## Core interaction loops

### Explore loop

1. Choose a solid.
2. Manipulate it directly.
3. Tap a face, edge, or vertex.
4. See the same element highlighted on the net and in measurements.
5. Scrub toward 2D to understand adjacency.
6. Compare or transform.

### Build loop

1. Choose a physical system and inventory preset.
2. See build-ready, shortage, or unsupported status.
3. Choose a valid candidate net/build strategy.
4. Start with an anchor face.
5. Add one piece along the highlighted hinge.
6. Fold to the target angle.
7. Check the step and continue.
8. Later: verify with camera/AR.

### Learn loop

1. Observe a phenomenon in the active solid.
2. Make a prediction.
3. Manipulate the model.
4. Measure the result.
5. Read a concise explanation tied to the observation.
6. Apply it to another solid.

## Interaction model

| Object | Primary gesture | Secondary actions |
|---|---|---|
| Solid | Drag to orbit; pinch/scroll to zoom | Double-tap reset; select face/edge/vertex |
| Fold control | Scrub 3D ↔ 2D | Play/pause; step through hinges |
| Net | Select face; drag face in editor | Toggle cut/fold; rotate component; pack |
| Face | Inspect | Hide, label, set anchor, find matching tile |
| Edge | Inspect | Mark hinge/cut; show length and dihedral |
| Vertex | Inspect | Show degree, vertex figure, curvature |
| Build step | Next/previous | Mark complete, replay, alternate attachment |
| Lesson prompt | Choose/predict | Reveal hint, formal derivation, transfer challenge |

## Visual encoding

- Face color encodes polygon class, but labels and shape glyphs provide redundant identification.
- Selected elements use a cool high-contrast outline.
- The active build element uses a stronger luminous outline and step number.
- Solid cut edges are continuous; fold edges are dashed.
- Exact/calibrated/approximate/unsupported statuses use text plus icon, never color alone.
- Background depth is subtle so transparent faces remain legible.

## Progressive disclosure

### Level A — Play

- Name and hero model.
- Fold control.
- “Can I build it?” status.
- Simple piece list and steps.

### Level B — Learn

- V/E/F and Euler relation.
- Face names and adjacency.
- Area, volume, and angles.
- Prediction prompts.

### Level C — Analyze

- Coordinates and precision.
- Edge/face tables.
- Dihedral distribution.
- Symmetry group, vertex figures, dual graph.
- Algorithm and provenance.

The user can pin a preferred depth, but each lesson can temporarily reveal a deeper layer.

## Key future screens

### Build recommender

Input: physical profile + inventory + learner difficulty + desired size.
Output: ranked solids, required pieces, estimated assembly complexity, and concept tags.

### Net workshop

A split 3D/2D editor where the user toggles hinge edges, sees overlap and bounding area update immediately, locks an anchor, and compares candidate scores.

### Transformation timeline

A visual operation history:

```text
Cube → truncate(1/3) → dual → scale(2×) → choose net #14
```

Each step is selectable, reversible, and explained geometrically.

### Classroom presenter

Large stage, remote-control-friendly reveal sequence, hidden answers, learner join code, and printable companion.

### AR build mode

The planned solid floats near the table, the next piece is ghosted at the correct hinge, and camera inference reports confidence rather than claiming certainty.

## Content voice

- Start with concrete observation: “Six squares close around empty space.”
- Introduce vocabulary after the learner sees the relationship.
- State assumptions at the moment they matter.
- Prefer one strong sentence over a paragraph next to an active scene.
- Offer a deeper derivation rather than forcing it into the default view.
- Never call an approximation exact or a mathematical net physically buildable without qualification.

## Accessibility interaction alternatives

- Face traversal with bracket keys or a semantic list.
- Net represented as an adjacency tree/table.
- Fold animation described as sequential hinge actions.
- Optional audible step cues and angle announcements.
- Reduced-motion mode uses discrete states: folded, partial-step, and flat.
- Large-control mode for children, motor accessibility, and shared tabletop use.
