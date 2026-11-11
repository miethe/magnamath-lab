# Fold framing regression evidence

Target: `node_01M73B510ZPXSHABT8GEMBQBWJ`.

Source: `https://github.com/miethe/magnamath-lab.git`, verified with `git remote -v`.
Base, peeled `v0.4.1`, local main and origin/main all resolve to
`faf9a2523824cc0a5fdefb1e892f1e6fc2f5b8f5`.
`git ls-remote origin refs/heads/main refs/tags/v0.4.1` confirmed main at that
SHA and the annotated tag object at `5a7a09491640dee0c632663f60f30e0b1f05bcf1`.
The archive `69a8c0b` mentioned in the assignment is not this release baseline.
Head is the commit containing this document (`git rev-parse HEAD`); its exact SHA
is also recorded in the external delivery report and PR body after commit.

`applyAutoFrame()` previously subtracted the centre of the union of 17 poses.
That encloses the trajectory but does not centre an individual pose. Sampling
seed 1, root face 0, default net planning and simultaneous folding reproduces
an endpoint offset of `[2.386352, -0.972595, 1.552095]` model units for the truncated
icosahedron. The cube also has a smaller offset `[0, -0.250563, 0.457107]`.
This contradicts the earlier assumption that the cube was exactly centred.
The measurements reproduce the old bounds calculation using the live kinematic
model, independently of rendering and CSS.

The fix subtracts the current pose's bounds centre on the display pivot during
pose refresh. It retains the trajectory radius and the once-per-model camera
fit, avoiding zoom changes during animation. The authoring root transform and
all core geometry remain unchanged. Expert mode still skips auto-framing.
User-authored root translations/rotations remain intentional view changes.

Reproduction and checks (Node v24.14.0, npm 11.9.0):

```sh
export PATH=/Users/miethe/.nvm/versions/node/v24.14.0/bin:$PATH
npm ci
node scripts/measure-framing.mjs
node --test test/framing.test.js
npm run validate:all
npm run build
```

- [Exact numerical before/after measurements](fold-framing.json): endpoint offset
  becomes `[0, 0, 0]` for both shapes.
- [Six framing tests](../../test/framing.test.js): 65 poses × four sequence modes ×
  two viewport aspects × two shapes. All sampled points project within the camera
  frustum, bounds centres become zero, core face matrices and flat net coordinates
  remain unchanged, root transforms survive, and reverse scrubbing is repeatable.
- `npm run validate:all`: passed, including all 45 tests, catalog/net/workshop/tile/
  advanced/folding/JSON validation and byte-for-byte example reproduction.
- `npm run build`: passed. Vite reports the existing >500 kB chunk advisory.
- `npm ci`: reports six dependency advisories (two low, four moderate); dependency
  upgrades are outside this framing fix.
- Initial Node v20.19.3 install failed with `EBADENGINE`; Node 22 npm encountered
  `SecItemCopyMatching failed -67674`. Node 24 installation and checks succeeded.

The pre-implementation Confidence Check found one framing implementation,
confirmed the existing renderer/core separation, and verified the bounds and
transform conventions against Three.js documentation and installed source:
[Box3](https://threejs.org/docs/pages/Box3.html),
[Object3D](https://threejs.org/docs/pages/Object3D.html), and
`node_modules/three/src/math/Box3.js` (`getCenter`, `getBoundingSphere`).

Browser verification is **pending**: this dispatch explicitly prohibits browser
capture because Chromium's Mach-port rendezvous is denied in the sandbox.
No browser was launched and no screenshots are claimed. Numerical projection at
1440/900 and 390/844 is not rendered UI verification. A browser-capable host must:

1. Capture base and head at 1440×900 and 390×844 in Kids mode, with clean storage,
   for Cube and Soccer Ball, at progress 0, 0.5 and 1.
2. Compare solid position relative to the actual canvas centre, flat-net visibility,
   clipping, shape switches, resize, orbit, zoom and reverse folding.
3. Attach image paths and browser/host details to the PR; preserve manually chosen
   zoom during playback and confirm Expert mode remains unchanged.

This PR is partial acceptance until that host verification completes. Do not
infer release readiness from the numerical tests. Publication is wrapper-owned;
no merge, tag, release or site deployment is authorized by this change.
