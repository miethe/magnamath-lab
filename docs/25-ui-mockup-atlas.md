# MagnaMath UI Mockup Atlas

The handoff contains editable HTML/CSS mockups and rendered PNG references. All visuals are original vector/CSS compositions with no external image dependency.

## Atlas

Open:

```text
design/mockups/index.html
```

## Screens

| Screen | Source | Rendered reference | Purpose |
|---|---|---|---|
| Fold Studio | `01-fold-studio.html` | `png/01-fold-studio.png` | Main 2D-to-3D experience, hinge selection, diagnostics, compact timeline |
| Geometry Explorer | `02-explorer.html` | `png/02-explorer.png` | Exact topology, measurements, face lens, physical mapping |
| Net Workshop | `03-net-workshop.html` | `png/03-net-workshop.png` | Cut/fold editing, synchronized target, constraints, Pareto candidates |
| Build-Along | `04-build-along.html` | `png/04-build-along.png` | Inventory-aware physical guidance with evidence boundaries |
| Learning Lab | `05-learning-lab.html` | `png/05-learning-lab.png` | Interactive lesson and misconception feedback |
| Spatial Motion Lab | `06-spatial-motion-lab.html` | `png/06-spatial-motion-lab.png` | 6DOF root, hinge, and camera keyframe authoring |
| Mobile Build | `07-mobile-build.html` | `png/07-mobile-build.png` | Tabletop-first phone experience and future camera guidance |

## Design intent by screen

### Fold Studio

This is the defining MagnaMath screen. The learner sees the net and target in one spatial field instead of treating “2D mode” and “3D mode” as separate applications. A compact timeline reveals that global progress is composed of individual hinge windows.

### Geometry Explorer

The right-side face lens connects exact polygon data to physical tile profiles. It is intentionally more explanatory than a generic object-properties panel.

### Net Workshop

The center splits between editable 2D topology and the exact 3D consequence. The bottom candidate strip communicates multi-objective optimization rather than implying one universally best net.

### Build-Along

The instruction panel identifies the piece, edge, direction, target angle, and evidence status. The physical tray remains visible to keep shortages and remaining pieces concrete.

### Learning Lab

A guided question sits beside the exact mechanism. Live numeric evidence supports explanations without demanding that a young learner begin with equations.

### Spatial Motion Lab

This advanced surface exposes authored root, hinge, and camera tracks while preserving the same exact folding model. It is intentionally secondary to the beginner Fold experience.

### Mobile Build

The phone acts as a tabletop companion. The model remains large enough to orient the learner while the bottom sheet prioritizes one physical action at a time.

## Implementation notes

- The mockups use a 278 px left rail, flexible center, and 320 px right inspector at 1440×900.
- The visual system is encoded in `mockups.css` and can seed design tokens.
- SVG geometry is illustrative; production rendering remains Three.js/Canvas.
- All critical states include text, not color alone.
- The screenshots should be loaded into the product-design file as reference frames, then rebuilt as components rather than raster backgrounds.
