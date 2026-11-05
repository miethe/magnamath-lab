import { clamp } from './math.js';
import { FOLD_EASINGS } from './folding.js';
import { composeRigid4, decomposeRigid4, identity4, slerpQuaternion } from './rigid.js';

export const MOTION_CLIP_SCHEMA = 'https://magnamath.app/schema/motion-clip/v1';

const finiteVector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite);
const copyVector = (value) => value.map(Number);
const lerp = (from, to, amount) => from + (to - from) * amount;
const lerpVector = (from, to, amount) => from.map((value, index) => lerp(value, to[index], amount));

function easing(name, amount) {
  return (FOLD_EASINGS[name] ?? FOLD_EASINGS['ease-in-out-cubic'])(amount);
}

function normalizedTime(clip, timeSeconds) {
  const duration = Math.max(1e-9, clip.durationSeconds);
  if (clip.loop) return ((timeSeconds % duration) + duration) % duration;
  return clamp(timeSeconds, 0, duration);
}

function sortedTrack(track = []) {
  return [...track].sort((left, right) => left.time - right.time);
}

function keyframeInterval(track, timeSeconds) {
  if (!track.length) return null;
  if (timeSeconds <= track[0].time) return { left: track[0], right: track[0], amount: 0 };
  const last = track[track.length - 1];
  if (timeSeconds >= last.time) return { left: last, right: last, amount: 0 };
  for (let index = 0; index < track.length - 1; index += 1) {
    const left = track[index];
    const right = track[index + 1];
    if (timeSeconds >= left.time && timeSeconds <= right.time) {
      const raw = (timeSeconds - left.time) / Math.max(1e-9, right.time - left.time);
      return { left, right, amount: easing(right.easing ?? left.easing ?? 'ease-in-out-cubic', raw) };
    }
  }
  return { left: last, right: last, amount: 0 };
}

function sampleScalarTrack(track, timeSeconds, fallback) {
  const interval = keyframeInterval(sortedTrack(track), timeSeconds);
  if (!interval) return fallback;
  return lerp(interval.left.value, interval.right.value, interval.amount);
}

function sampleRootTrack(track, timeSeconds) {
  const interval = keyframeInterval(sortedTrack(track), timeSeconds);
  if (!interval) return identity4();
  const translation = lerpVector(interval.left.translation, interval.right.translation, interval.amount);
  const rotation = slerpQuaternion(interval.left.rotation, interval.right.rotation, interval.amount);
  return composeRigid4(translation, rotation);
}

function sampleCameraTrack(track, timeSeconds) {
  const interval = keyframeInterval(sortedTrack(track), timeSeconds);
  if (!interval) return null;
  return {
    position: lerpVector(interval.left.position, interval.right.position, interval.amount),
    target: lerpVector(interval.left.target, interval.right.target, interval.amount),
    up: lerpVector(interval.left.up ?? [0, 1, 0], interval.right.up ?? [0, 1, 0], interval.amount),
    fovDegrees: lerp(interval.left.fovDegrees ?? 45, interval.right.fovDegrees ?? 45, interval.amount),
  };
}

/** Creates a serializable renderer-independent motion clip. */
export function createMotionClip(options = {}) {
  const durationSeconds = Math.max(0.001, Number(options.durationSeconds ?? 4));
  return {
    schema: MOTION_CLIP_SCHEMA,
    id: String(options.id ?? `motion-${Date.now().toString(36)}`),
    name: String(options.name ?? 'Untitled motion'),
    durationSeconds,
    loop: Boolean(options.loop),
    rootPoseTrack: sortedTrack(options.rootPoseTrack ?? []),
    progressTrack: sortedTrack(options.progressTrack ?? [
      { time: 0, value: 0, easing: 'ease-in-out-cubic' },
      { time: durationSeconds, value: 1, easing: 'ease-in-out-cubic' },
    ]),
    hingeTracks: Object.fromEntries(Object.entries(options.hingeTracks ?? {}).map(([edgeKey, track]) => [edgeKey, sortedTrack(track)])),
    cameraTrack: sortedTrack(options.cameraTrack ?? []),
    markers: sortedTrack(options.markers ?? []),
    metadata: { ...(options.metadata ?? {}) },
  };
}

/** Captures the current root matrix as a motion keyframe. */
export function rootPoseKeyframe(time, rootPose, easingName = 'ease-in-out-cubic') {
  const decomposed = decomposeRigid4(rootPose);
  return {
    time: Number(time),
    translation: decomposed.translation,
    rotation: decomposed.quaternion,
    easing: easingName,
  };
}

/** Strict structural validation at the pure-core boundary. */
export function validateMotionClip(value, foldingModel = null) {
  const issues = [];
  if (!value || typeof value !== 'object') return { valid: false, issues: ['Motion clip must be an object.'] };
  if (value.schema !== MOTION_CLIP_SCHEMA) issues.push('Motion clip schema is not supported.');
  if (!value.id || typeof value.id !== 'string') issues.push('Motion clip id is required.');
  if (!Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0) issues.push('Motion duration must be positive.');
  const duration = Number(value.durationSeconds) || 0;

  const validateTimes = (track, label) => {
    if (!Array.isArray(track)) {
      issues.push(`${label} must be an array.`);
      return;
    }
    let previous = -Infinity;
    for (const keyframe of track) {
      if (!Number.isFinite(keyframe?.time) || keyframe.time < 0 || keyframe.time > duration) issues.push(`${label} contains an out-of-range time.`);
      if (keyframe?.time < previous) issues.push(`${label} must be sorted by time.`);
      previous = Number(keyframe?.time);
    }
  };

  validateTimes(value.rootPoseTrack, 'rootPoseTrack');
  for (const keyframe of value.rootPoseTrack ?? []) {
    if (!finiteVector(keyframe.translation, 3)) issues.push('Root-pose translations must contain three finite values.');
    if (!finiteVector(keyframe.rotation, 4)) issues.push('Root-pose rotations must be quaternions with four finite values.');
  }
  validateTimes(value.progressTrack, 'progressTrack');
  for (const keyframe of value.progressTrack ?? []) {
    if (!Number.isFinite(keyframe.value) || keyframe.value < 0 || keyframe.value > 1) issues.push('Progress keyframes must stay between zero and one.');
  }
  if (!value.hingeTracks || typeof value.hingeTracks !== 'object' || Array.isArray(value.hingeTracks)) issues.push('hingeTracks must be an object.');
  for (const [edgeKey, track] of Object.entries(value.hingeTracks ?? {})) {
    if (foldingModel && !foldingModel.hingeByEdgeKey.has(edgeKey)) issues.push(`Unknown hinge track ${edgeKey}.`);
    validateTimes(track, `hingeTracks.${edgeKey}`);
    for (const keyframe of track) {
      if (!Number.isFinite(keyframe.value)) issues.push(`Hinge track ${edgeKey} contains a non-finite value.`);
      if (!['progress', 'angle-radians'].includes(keyframe.mode ?? 'progress')) issues.push(`Hinge track ${edgeKey} uses an unsupported mode.`);
    }
  }
  validateTimes(value.cameraTrack, 'cameraTrack');
  for (const keyframe of value.cameraTrack ?? []) {
    if (!finiteVector(keyframe.position, 3) || !finiteVector(keyframe.target, 3)) issues.push('Camera keyframes require finite position and target vectors.');
    if (keyframe.up != null && !finiteVector(keyframe.up, 3)) issues.push('Camera up vectors require three finite values.');
  }
  validateTimes(value.markers, 'markers');
  return { valid: issues.length === 0, issues };
}

/** Samples a clip into folding, root-pose, and camera state. */
export function sampleMotionClip(clip, timeSeconds, foldingModel = null) {
  const validation = validateMotionClip(clip, foldingModel);
  if (!validation.valid) throw new Error(`Invalid motion clip: ${validation.issues.join(' ')}`);
  const time = normalizedTime(clip, Number(timeSeconds) || 0);
  const progress = sampleScalarTrack(clip.progressTrack, time, 0);
  const rootPose = clip.rootPoseTrack.length ? sampleRootTrack(clip.rootPoseTrack, time) : identity4();
  const hingeOverrides = {};
  for (const [edgeKey, track] of Object.entries(clip.hingeTracks)) {
    if (!track.length) continue;
    const interval = keyframeInterval(track, time);
    const value = lerp(interval.left.value, interval.right.value, interval.amount);
    const mode = interval.right.mode ?? interval.left.mode ?? 'progress';
    if (mode === 'angle-radians') hingeOverrides[edgeKey] = { angleRadians: value };
    else if (foldingModel?.hingeByEdgeKey.has(edgeKey)) {
      hingeOverrides[edgeKey] = { angleRadians: foldingModel.hingeByEdgeKey.get(edgeKey).targetAngleRadians * clamp(value, 0, 1) };
    }
  }
  return {
    clipId: clip.id,
    timeSeconds: time,
    normalizedProgress: time / clip.durationSeconds,
    progress,
    rootPose,
    hingeOverrides,
    camera: sampleCameraTrack(clip.cameraTrack, time),
    activeMarkers: (clip.markers ?? []).filter((marker) => Math.abs(marker.time - time) <= 1e-6),
  };
}

/** Produces a stable deep copy suitable for snapshot embedding. */
export function serializeMotionClip(clip, foldingModel = null) {
  const validation = validateMotionClip(clip, foldingModel);
  if (!validation.valid) throw new Error(`Invalid motion clip: ${validation.issues.join(' ')}`);
  return JSON.parse(JSON.stringify(clip));
}

/** Adds or replaces a root-pose keyframe without mutating the input clip. */
export function upsertRootPoseKeyframe(clip, time, rootPose, easingName = 'ease-in-out-cubic') {
  const keyframe = rootPoseKeyframe(time, rootPose, easingName);
  const next = createMotionClip({ ...clip, rootPoseTrack: clip.rootPoseTrack.filter((entry) => Math.abs(entry.time - time) > 1e-9).concat(keyframe) });
  next.id = clip.id;
  return next;
}

/** Adds or replaces a folding-progress keyframe without mutating the input clip. */
export function upsertProgressKeyframe(clip, time, value, easingName = 'ease-in-out-cubic') {
  const keyframe = { time: Number(time), value: clamp(Number(value), 0, 1), easing: easingName };
  const next = createMotionClip({ ...clip, progressTrack: clip.progressTrack.filter((entry) => Math.abs(entry.time - time) > 1e-9).concat(keyframe) });
  next.id = clip.id;
  return next;
}
