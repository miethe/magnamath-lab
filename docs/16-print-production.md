# 16 — Print Production and Fabrication Packages

## Scope

Release 0.3.0 converts a physical-scale net into paginated SVG pages and a portable print package. It is intended for home/classroom printing and fabrication experiments, not yet as a certified commercial prepress pipeline.

## Layout modes

| Mode | Behavior |
|---|---|
| Actual | Keeps one model unit at the chosen millimeter scale; automatically becomes poster mode if the net exceeds one page |
| Fit | Fits the complete net to one usable page; never enlarges unless explicitly allowed |
| Poster | Tiles the net across overlapping pages at the selected scale |

Supported page presets are US Letter, Legal, Tabloid, A4, and A3. Automatic orientation chooses the lower page count, then the larger retained scale when tied.

## Glue tabs

Each cut polyhedron edge appears twice in the planar boundary. The tab planner evaluates both possible host faces, generates a trapezoidal tab, measures its convex intersection with other faces and already-selected tabs, and chooses the lower-collision side.

The planner does not hide uncertainty:

- a colliding tab is highlighted and reported;
- a tab can be omitted when every placement is unacceptable;
- the manifest records collision and omission details;
- one tab or omission accounts for every cut edge.

## Registration and scale controls

Every page can include:

- crop marks;
- poster registration targets;
- paired cut labels (`C1`, `C2`, …);
- face numbers;
- a fixed 50 mm print-verification ruler.

The physical ruler is drawn in page millimeters outside the scaled net transform. A user must verify it after printing; browser, driver, and printer settings can still introduce scaling.

## Package contents

```text
pages/<shape>-net-page-01.svg
pages/<shape>-net-page-02.svg
...
print.html
manifest.json
README.txt
```

The ZIP writer uses standard uncompressed STORE entries with CRC-32 and no runtime dependency. Validation includes an independent `unzip -t` integrity check.

## Compound panels

Interior seams for exact compound panels are transformed with their host face and printed as a distinct dashed line class. They are assembly guides, not cut/fold edges of the polyhedron net.

## Deferred until research output

- deterministic PDF generation and font embedding;
- global tab optimization;
- cutter registration formats and kerf compensation;
- bleed/safe-area standards;
- accessibility conventions for tactile/low-vision output;
- formal printer calibration and measurement protocol.
