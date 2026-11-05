# MagnaMath final-product mockup atlas

These are implementation-oriented HTML/CSS mockups for the intended MagnaMath product, not screenshots of completed functionality. The source pages are deliberately dependency-free so designers and engineers can inspect exact layout, typography, spacing, control states, and responsive intent.

## Views

| File | Product surface |
|---|---|
| `01-fold-studio.html` | Primary 2D-to-3D folding experience |
| `02-explorer.html` | Shape catalog and mathematical inspection |
| `03-net-workshop.html` | Manual cut/fold editing and candidate optimization |
| `04-build-along.html` | Magnetic-tile assembly guidance |
| `05-learning-lab.html` | Lessons, prediction, and concept explanation |
| `06-spatial-motion-lab.html` | Future 3D choreography and six-degree-of-freedom controls |
| `07-mobile-build.html` | Mobile/tablet physical-play companion |
| `index.html` | Atlas launcher |

Rendered PNG references are in `png/`; `00-ui-atlas-overview.png` is a compact review sheet. Regenerate them with:

```bash
python3 -m pip install playwright
playwright install chromium
python3 scripts/render-mockups.py
```

A system Chromium can be selected with:

```bash
MAGNAMATH_CHROMIUM=/path/to/chromium python3 scripts/render-mockups.py
```

The product design rationale, tokens, interaction states, accessibility requirements, and responsive behavior are specified in `docs/24-final-app-design-spec.md` and `docs/25-ui-mockup-atlas.md`.
