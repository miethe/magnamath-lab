# Fold canvas layout regression

Target: `node_01M73B510ZPXSHABT8GEMBQBWJ`.
Release base: `faf9a2523824cc0a5fdefb1e892f1e6fc2f5b8f5` (`v0.4.1`).
Parent: `ffc97d0a16ac1b0b044b8a08da8087e197b59f05`; its framing fix is retained.

## Cause and change

The expert workspace shares one grid row between controls, stage and inspector.
The stage's height was automatic, with a `minmax(420px, 1fr)` viewport row.
The taller Fold inspector therefore stretched the stage and its canvas. The hub
measured a 1116px canvas (top 163, bottom 1279) at 1440×900, versus 643px in
Explore, on both release and parent. This is separate from model-space framing.

`src/style.css` now gives the desktop stage its own viewport-relative height,
independent of the inspector, with a shrinkable middle row. Mobile retains its
explicit viewport track heights and scrolling controls. Both canvases are
absolutely positioned inside `.viewport`: changes to their intrinsic drawing
buffer dimensions cannot increase the observed container's layout size.

Three.js already calls `setSize(width, height, false)`; it was not writing inline
sizes here. The fallback now also leaves display size to CSS instead of pinning
it to the last measured pixel size. The exact trigger of the hub's transient
264600px runaway is not reproduced in this sandbox; the intrinsic-size feedback
path is removed rather than claiming a browser reproduction.

Confidence Check: one implementation per renderer, no new dependencies or core
geometry changes. Reviewed installed Three.js `WebGLRenderer.js` setSize API docs
and implementation, and `examples/jsm/offscreen/scene.js` for its `false` usage.
Absolute positioning removes normal-flow size contributions per the
[CSS positioning reference](https://developer.mozilla.org/en-US/docs/Web/CSS/position).

## Automated evidence

Use Node 24.14.0 (package requires Node >=22.12):

```sh
node --test test/renderer-resize.test.js
npm run validate:all
npm run build
```

The resize test invokes the real fallback renderer with a stubbed DOM and
ResizeObserver. It exercises initial load, zero-size layout, phone/desktop changes,
DPR 1/2/3 and repeated observer callbacks, checks buffer dimensions and verifies
no inline display size is written. It fails against the parent fallback with
`buffer resize must leave responsive CSS sizing in control` (inline 1px sizes),
and passes with the fix. It does not simulate CSS layout or establish visual ACs.
Validation completed with Node 24.14.0: `npm run validate:all` exited 0
(46/46 tests, 320/320 nets, all catalog/workshop/tile/advanced/folding/JSON/example
validators passed); `npm run build` exited 0 (35 modules, PWA generated).
The build retains the existing >500 kB chunk advisory. Full command logs are in
`.leg/validation/` and copied beside the external `C3-mm2/REPORT.md` for the hub.

## Hub capture procedure (browser-capable host required)

No browser was launched in this sandbox: Chromium's Mach-port rendezvous is denied.
Have the hub run the following against **parent and committed head**, using separate
checkouts/ports so the parent remains available for comparison.

1. Run `npm ci`, `npm run build`, then `npm run preview -- --port 4173` in each
   checkout (use port 4174 for the other checkout). Use a fresh browser profile,
   clear site storage and unregister service workers for both origins. Disable
   cache while DevTools is open; record browser version, commit and DPR.
2. Set the browser content viewport to **1440×900**, 100% zoom, DPR 1. Open
   `http://localhost:4173/`. Ensure Kids is off. Select Cube, then Soccer Ball
   (truncated icosahedron). For each shape visit Explore, Fold, Workshop, Build,
   Learn and back to Fold. Capture Fold and Explore at fold slider values
   **0, 50, 100**, with the page scrolled to the top. Use the same state on parent.
3. In DevTools run the measurement below in every tab, both immediately and after
   two seconds. Save JSON with captures. At 1440×900, canvas and viewport should
   match in size/position (within 1px), fit inside the stage, and remain stable;
   switching to Fold must not enlarge the viewport or put the solid below screen.
4. Repeat at **390×844**, DPR 1, using the bottom tab bar; scroll back to the stage
   after each tab switch. The mobile document intentionally scrolls for controls.
   Check the canvas is bounded by its viewport track and panel, with the solid
   centred in the canvas, not by document height. Capture Fold/Explore as above.
5. With cache disabled and network throttling (Slow 3G), reload at 1440×900 and
   change to 390×844 while the loader is visible, then back to 1440×900. Repeat
   five times; measure immediately and after two seconds. Confirm no escalating
   heights or ResizeObserver errors. Test DPR 2 as well.
6. Repeat steps 2–5 with `?renderer=canvas` to force the fallback. Also smoke-test
   Kids on/off, folding/reverse scrubbing, orbit/zoom and shape switches at both
   sizes. Kids has a separate layout; scrolling on small phones is intentional.
7. Attach before/after PNGs and measurements to the PR, naming files
   `<sha>-<width>x<height>-<renderer>-<tab>-<shape>-<progress>.png`.
   Browser acceptance remains pending until the hub inspects these artifacts.

```js
const rect = selector => {
  const { x, y, width, height, bottom } = document.querySelector(selector).getBoundingClientRect();
  return { x, y, width, height, bottom };
};
JSON.stringify({
  viewportSize: [innerWidth, innerHeight], dpr: devicePixelRatio,
  tab: document.querySelector('.mode-button.is-active')?.dataset.mode,
  stage: rect('.stage-panel'), viewport: rect('#viewport'),
  canvas: rect('#viewport canvas'),
  canvasInlineStyle: document.querySelector('#viewport canvas').getAttribute('style'),
}, null, 2);
```
