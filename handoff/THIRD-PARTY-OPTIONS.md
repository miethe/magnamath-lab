# Third-Party Technology Options

These are evaluation candidates, not mandatory dependencies.

## Rendering and controls

- Three.js WebGLRenderer for the immediate production path.
- Three.js WebGPURenderer for measured future rendering/compute opportunities with WebGL2 fallback.
- TransformControls for DCC-style root translation and rotation.
- OrbitControls for familiar inspection or ArcballControls for advanced full-touch navigation, focus, roll, and saved camera state.

## Physics and collision

- Rapier as a candidate WASM physics adapter for rigid bodies, colliders, joints, and CCD.
- Custom computational-geometry code for exact or conservative folding-path checks where a general dynamics engine is insufficient.

## Native spatial companion

- SwiftUI + RealityKit + ARKit after camera/tabletop use cases are validated.

## Evaluation rule

No dependency should enter the geometry core. Select libraries only after benchmark, browser/device, license, bundle-size, determinism, and failure-mode evaluation.
