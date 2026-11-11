import { foldingPosePolygons } from '../core/folding.js';

/** Bounds in the folding model's frame, before the user's root transform. */
export function foldingPoseBounds(analysis, pose) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const polygon of foldingPosePolygons(analysis, pose)) {
    for (const point of polygon) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
  }
  return { min, max, centre: min.map((value, axis) => (value + max[axis]) / 2) };
}

/** Recentre only the display pivot; camera zoom and authored transforms stay put. */
export function centreFoldingPose(viewPivot, analysis, pose) {
  const { centre } = foldingPoseBounds(analysis, pose);
  viewPivot.position.set(...centre.map(value => -value));
}
