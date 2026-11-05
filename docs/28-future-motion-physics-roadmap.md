# Future Motion, Physics, and Spatial Roadmap

## Stage 1 — exact kinematic productization

- complete Three.js browser validation;
- semantic hinge drag;
- root 6DOF gizmos;
- motion-clip playback and recording;
- camera track playback;
- accessible numeric and keyboard controls;
- adaptive quality and performance instrumentation.

## Stage 2 — continuous geometry

- swept broad phase;
- continuous narrow-phase collision;
- adaptive path sampling;
- clearance metrics;
- local path repair;
- deterministic benchmark corpus;
- worker/WASM solver interface.

## Stage 3 — thick-panel kinematics

- finite-thickness panel solids;
- hinge-axis offset models;
- rounded corners and connector recesses;
- offset closure constraints;
- measured profile uncertainty;
- fixture validation.

## Stage 4 — constrained and closed-loop mechanisms

- general hinge graph;
- loop-closure residuals;
- Jacobian and constraint projection;
- inverse kinematics for direct manipulation;
- singularity and branch management;
- user locks and driven hinges.

## Stage 5 — physical dynamics

- rigid bodies and revolute joints;
- mass and inertia from calibrated piece geometry;
- joint limits and damping;
- collision response and contact forces;
- simplified magnetic holding/separation model;
- gravity and structural stability;
- comparison against observed builds.

## Stage 6 — advanced spatial experiences

- gamepad mapping;
- presentation/cinematic motion authoring;
- WebXR inspection and manipulation;
- hand/controller semantic grabbing;
- tabletop AR anchoring;
- camera-based piece detection;
- build-state reconciliation;
- optional native SwiftUI/RealityKit companion.

## Decision gates

Do not advance a stage merely because a library supports the primitive. Advance when:

1. the preceding layer has benchmark evidence;
2. the user-facing distinction is clear;
3. the data schema can carry inputs, assumptions, and results;
4. the feature can fail honestly;
5. performance is measured on target devices;
6. the physical claim has an explicit validation tier.
