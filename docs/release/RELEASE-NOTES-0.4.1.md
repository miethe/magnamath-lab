# MagnaMath 0.4.1

A patch release on 0.4.0 (released 2026-11-05). No geometry, folding or schema changes.

## Changes

- Phone layout: the bottom mode dock now spans the full width, so the Explore, Fold, Workshop, Build and Learn tabs are all reachable at phone widths.
- Documentation: the licence is stated as MIT throughout; the release notes, README and release metadata now agree on the version; `MANIFEST.sha256` is regenerated.

## Known limitations

- The 3D view frames the flat net and the folded solid together. A folded solid with a large net (for example the truncated icosahedron at 1440 px) sits right of and below the viewport centre. The cube and other small nets are centred.
- In Kids mode on a phone, the "It's a …!" banner overlaps part of the folded solid.
- Continuous collision-free folding paths are unproven; sampled collision checks do not prove them.
- Finite-thickness panel closure and magnetic stability remain unproven.
- `npm audit` reports no advisories in production dependencies; development dependencies carry low and moderate advisories only.

## Verification

On 2026-11-10: 39/39 behavioural tests, `validate:all`, 15 schemas and 7 examples, and `vite build` passed on Node 22. Headless Chromium at 1440, 1024 and 390 px showed no page errors and no horizontal overflow.
