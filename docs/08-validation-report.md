# MagnaMath 0.4.0 Validation Report

## Summary

Release 0.4.0 passed its executable core, catalog, net, workshop, physical, advanced-workflow, folding, JSON, schema, reproducibility, syntax, and Canvas browser-smoke gates.

The Three.js/Vite production build remains an external registry-enabled gate because the sandbox package mirror did not expose the pinned Three.js dependency.

## Results

| Gate | Result |
|---|---:|
| Node behavioral tests | **39/39 passed** |
| Exact starter catalog | **16/16 passed** |
| Automatic net seed sweep | **320/320 overlap-free** |
| Manual edge exchanges preserving tree | **502/502** |
| Immediately overlap-free manual exchanges | **492/502** |
| Portfolio catalog coverage | **16/16 returned overlap-free candidates** |
| Built-in physical profiles | **9 validated** |
| Published inventory presets | **5 validated** |
| Exact compound truncated-octahedron panels | **8 hexagons / 48 triangles** |
| Folding pose sweep | **448 poses** |
| Maximum hinge gap | **5.043883840194739e−15** |
| Maximum face rigidity error | **8.548717289613705e−15** |
| Maximum target closure gap | **2.608905996363235e−14** |
| Maximum target matrix error | **2.042810365310288e−14** |
| Sampled collision poses | **192; 128 collision-free** |
| JSON documents | **22 parsed** |
| Unique JSON schemas | **15** |
| Resolved internal schema references | **90** |
| Full JSON Schema validation | **15 schemas / 7 example artifacts** |
| Generated example reproducibility | **15/15 byte-identical across two runs** |
| Canvas desktop smoke | **Passed** |
| Canvas 390 px mobile smoke | **Passed, no horizontal overflow** |
| Browser console/page errors | **0 / 0** |
| JavaScript syntax sweep | **40/40 passed** |
| Mockup reference renders | **7/7 generated at expected dimensions** |

## Folding interpretation

The sampled pose sweep covers 16 catalog entries, four built-in sequence modes, and seven progress samples. Hinge continuity, face rigidity, exact closure, and target transform errors are all within floating-point roundoff and far inside release tolerances.

The sampled collision result must not be read as a pass/fail gate for foldability. The current detector reports intersections at tested zero-thickness poses. It neither performs continuous collision detection nor searches for a path.

## Manual workshop interpretation

Ten legal edge exchanges created overlapping planar layouts, all in the demanding truncated-dodecahedron cases. These are valid spanning trees but invalid non-overlapping nets. The workshop correctly retains and diagnoses them instead of corrupting the tree invariant or silently discarding user intent.

## Browser smoke

Canvas smoke verified:

- Cube load;
- Fold panel activation;
- 50% folding;
- hinge selection;
- 40% manual hinge override;
- assembly sequence selection;
- mobile 68% folding;
- 390 px scroll/client width equality;
- no console or page errors.

## Artifact locations

- `docs/assets/validation-log-0.4.0.txt`
- `docs/assets/folding-validation-0.4.0.json`
- `docs/assets/browser-smoke-0.4.0.json`
- `docs/assets/syntax-validation-0.4.0.txt`
- `docs/assets/npm-install-0.4.0.txt`
- `docs/assets/mockup-render-validation-0.4.0.json`
- `MANIFEST.sha256`

## External release gate

Run in a normal registry-enabled environment:

```bash
npm install
npm run build
npm run preview
```

Then run the browser matrix specified in docs 23 and the handoff checklist. Commit only the actual resolved lockfile.
