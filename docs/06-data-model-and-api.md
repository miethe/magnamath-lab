# Data Model and API Contracts

## Polyhedron

```ts
type Vec3 = [number, number, number];

interface Polyhedron {
  id: string;
  name: string;
  family: string;
  vertices: Vec3[];
  faces: number[][]; // ordered source vertex indices
  metadata?: Record<string, unknown>;
}
```

## Net

A net carries a rooted tree plus exact 2D placement:

```ts
interface NetPlan {
  rootFace: number;
  parentByFace: number[];
  connectionByFace: Array<null | HingeConnection>;
  order: number[];
  treeEdgeKeys: Set<string>;
  cutEdgeKeys: Set<string>;
  transforms: Affine2[];
  polygons: Vec2[][];
  overlapPairs: [number, number, number][];
  valid: boolean;
  objective: 'compact' | 'printable' | 'buildable' | 'classroom';
}
```

## Folding model

Derived and not serialized wholesale:

```ts
interface FoldingModel {
  schema: 'https://magnamath.app/schema/folding-plan/v1';
  polyhedronId: string;
  faceCount: number;
  rootFace: number;
  rootTransform: Mat4;
  flatFaceTransforms: Mat4[];
  targetFaceTransforms: Mat4[];
  hinges: FoldingHinge[];
  hingeByEdgeKey: Map<string, FoldingHinge>;
  childrenByFace: number[][];
  order: number[];
  netSignature: string;
}

interface FoldingHinge {
  edgeKey: string;
  parentFace: number;
  childFace: number;
  pivot: Vec3;
  axis: Vec3;
  targetAngleRadians: number;
  targetInteriorRadians: number;
}
```

## Folding state

Serialized through `folding-plan/v1`:

```ts
interface FoldingPlanState {
  schema: string;
  netSignature: string;
  rootFace: number;
  progress: number;
  sequenceMode: 'simultaneous' | 'root-out' | 'leaves-in' | 'assembly' | 'custom';
  hingeDuration: number;
  schedule: HingeWindow[];
  hingeOverrides: Array<{edgeKey: string; angleRadians: number}>;
  selectedHingeEdgeKey: string | null;
  showHinges: boolean;
  collisionScreen: boolean;
  rootPose: Mat4;
}
```

## Spatial motion clip

Serialized through `motion-clip/v1`:

```ts
interface MotionClip {
  schema: 'https://magnamath.app/schema/motion-clip/v1';
  id: string;
  name: string;
  durationSeconds: number;
  loop: boolean;
  rootPoseTrack: RootPoseKeyframe[];
  progressTrack: ScalarKeyframe[];
  hingeTracks: Record<string, HingeKeyframe[]>;
  cameraTrack: CameraKeyframe[];
  markers: MotionMarker[];
  metadata: Record<string, unknown>;
}
```

### Motion core API

```js
createMotionClip(options)
rootPoseKeyframe(time, matrix, easing)
validateMotionClip(clip, foldingModel?)
sampleMotionClip(clip, timeSeconds, foldingModel?)
serializeMotionClip(clip, foldingModel?)
upsertRootPoseKeyframe(clip, time, matrix, easing)
upsertProgressKeyframe(clip, time, value, easing)
```

## Folding core API

```js
createFoldingModel(polyhedron, analysis, net, options?)
createFoldingSchedule(foldingModel, options?)
sampleFoldingPose(foldingModel, progress, options?)
foldingPosePolygons(analysis, pose)
foldingPoseVertices(polyhedron, analysis, pose)
foldingTargetFit(foldingModel)
serializeFoldingState(foldingModel, options?)
parseFoldingState(value, foldingModel)
```

## Diagnostics API

```js
analyzeFoldingPose(polyhedron, analysis, foldingModel, pose, options?)
```

Returns hinge continuity, cut-edge closure, face rigidity, target fit, sampled collision, and a summary.

## Renderer adapter expectations

```ts
interface MagnaMathRenderer {
  setModel(polyhedron, analysis, net, foldingModel): void;
  setPose(pose, options?): void;
  setInteractionMode(mode): void;
  setTransformMode(mode): void;
  setSelectedFace(faceIndex): void;
  setSelectedHinge(edgeKey | null): void;
  setDiagnostics(diagnostics): void;
  setRootPose(matrix): void;
  destroy(): void;
}
```

Callbacks should emit semantic values:

```ts
onFaceSelect(faceIndex)
onHingeSelect(edgeKey)
onRootPoseChange(matrix)
onInteractionStart(commandContext)
onInteractionEnd(commandResult)
```

## Future solver contracts

```ts
interface PoseRequest {
  pose: FoldingPlanState;
  drivenHinges?: Record<string, number>;
  targetPoints?: Array<{faceIndex:number; local:Vec3; world:Vec3}>;
  locks?: string[];
}

interface SolvedPose {
  status: 'solved' | 'approximate' | 'infeasible' | 'cancelled';
  faceTransforms: Mat4[];
  hingeAngles: Record<string, number>;
  residuals: Record<string, number>;
  evidence: Record<string, unknown>;
}
```

## Snapshot v4

Current schema:

```text
https://magnamath.app/schema/snapshot/v4
```

Project fields include `folding`, `motionClips`, and `activeMotionClipId`. Derived matrices are recalculated from exact geometry and the saved fold tree.
