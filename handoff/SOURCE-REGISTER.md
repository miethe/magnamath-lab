# Source and technology register

This register records primary sources that informed the 0.4.0 architecture and the research work still required. It is not a dependency lock or endorsement list.

## Rendering and interaction

| Topic | Primary source | Relevance |
|---|---|---|
| Three.js object transforms | https://threejs.org/docs/#examples/en/controls/TransformControls | Translation and rotation gizmos attached to scene objects |
| Three.js arcball navigation | https://threejs.org/docs/#examples/en/controls/ArcballControls | Camera orbit, pan, zoom, focus, touch, and camera-state behavior |
| Three.js quaternion representation | https://threejs.org/docs/#api/en/math/Quaternion | Normalized quaternion convention and renderer adapter expectations |
| Three.js WebGPU renderer | https://threejs.org/docs/#api/en/renderers/webgpu/WebGPURenderer | Future rendering path and documented WebGL 2 fallback behavior |
| Three.js WebXR manager | https://threejs.org/docs/#api/en/renderers/webxr/WebXRManager | Future XR session, controller, and hand integration |
| Immersive Web WebXR overview | https://immersiveweb.dev/ | Device poses, controllers, and hand-input concepts |

## Collision and dynamics candidates

| Topic | Primary source | Relevance |
|---|---|---|
| Rapier collision detection | https://rapier.rs/docs/user_guides/javascript/advanced_collision_detection | Broad-phase and narrow-phase collision pipeline |
| Rapier rigid bodies and CCD | https://rapier.rs/docs/user_guides/javascript/rigid_bodies | Candidate runtime for physical motion and continuous collision detection |
| Rapier joints | https://rapier.rs/docs/user_guides/javascript/joints | Candidate joint/constraint adapter for experimental physics modes |

## Rigid-folding research

| Topic | Primary source | Relevance |
|---|---|---|
| Tomohiro Tachi, *Simulation of Rigid Origami* | https://www.tsg.ne.jp/TT/software/rigid_origami/SimulationOfRigidOrigami.pdf | Fold-angle coordinates, rigid-panel constraints, and forward/inverse kinematics framing |

## Important boundary

The released exact tree-hinge engine does not depend on Rapier or an origami solver. Those sources guide future continuous collision, closed-loop constraint solving, dynamics, XR, and large-model research. Any adoption should be benchmarked and recorded in a future architecture decision record before becoming normative.
