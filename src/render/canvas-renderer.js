import { clamp } from '../core/math.js';
import { createFoldingModel, foldingPosePolygons, sampleFoldingPose } from '../core/folding.js';

const FACE_COLORS = {
  square: '#43dfc1',
  'equilateral-triangle': '#718fff',
  'right-isosceles-triangle': '#ffb761',
  'right-triangle': '#ffb761',
  'isosceles-triangle': '#ed78b4',
  'regular-5-gon': '#bd82ff',
  'regular-6-gon': '#68ccf5',
  'regular-8-gon': '#80dc88',
  default: '#91a5c2',
};

/** @param {CanvasRenderingContext2D} context @param {{x:number,y:number}[]} points */
function pathPolygon(context, points) {
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.closePath();
}

/** @param {{x:number,y:number}[]} polygon @param {number} x @param {number} y */
function pointInPolygon(polygon, x, y) {
  let inside = false;
  for (let left = 0, right = polygon.length - 1; left < polygon.length; right = left++) {
    const a = polygon[left];
    const b = polygon[right];
    const crosses = ((a.y > y) !== (b.y > y))
      && (x < (b.x - a.x) * (y - a.y) / ((b.y - a.y) || 1e-9) + a.x);
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointSegmentDistance2(point, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const denominator = dx * dx + dy * dy;
  if (denominator <= 1e-9) return Math.hypot(point.x - from.x, point.y - from.y);
  const t = clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / denominator, 0, 1);
  return Math.hypot(point.x - (from.x + dx * t), point.y - (from.y + dy * t));
}

/**
 * Dependency-free renderer used for offline preview, reduced-motion mode, and
 * graceful fallback when WebGL/WebGPU is unavailable. It samples the same
 * exact tree-hinge kinematics as the Three.js renderer.
 */
export function createCanvasRenderer(container, { onFaceSelect, onHingeSelect } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'shape-canvas shape-canvas--fallback';
  canvas.setAttribute('aria-label', 'Interactive hinge-constrained polyhedron view');
  container.querySelector('.shape-canvas')?.remove();
  container.prepend(canvas);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  let model = null;
  let analysis = null;
  let net = null;
  let foldingModel = null;
  let pose = null;
  let foldingOptions = {
    progress: 1,
    sequenceMode: 'simultaneous',
    hingeDuration: 0.58,
    hingeOverrides: {},
    rootPose: null,
  };
  let selectedFace = -1;
  let activeFace = -1;
  let selectedHinge = null;
  let showHinges = true;
  let interactionMode = 'inspect';
  let collisionFaces = new Set();
  let yaw = -0.65;
  let pitch = 0.48;
  let zoom = 1;
  let dragging = false;
  let previousPointer = null;
  let pointerMoved = false;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let projectedFaces = [];
  let projectedHinges = [];
  let disposed = false;

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function rotate([x, y, z]) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const yawX = cy * x + sy * z;
    const yawZ = -sy * x + cy * z;
    return [yawX, cp * y - sp * yawZ, sp * y + cp * yawZ];
  }

  function refreshPose() {
    if (!foldingModel) return;
    pose = sampleFoldingPose(foldingModel, foldingOptions.progress, foldingOptions);
  }

  function draw() {
    if (disposed) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const vignette = context.createRadialGradient(width * 0.52, height * 0.42, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
    vignette.addColorStop(0, 'rgba(50, 80, 122, 0.16)');
    vignette.addColorStop(1, 'rgba(2, 8, 18, 0)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);

    if (!model || !analysis || !net || !pose) {
      requestAnimationFrame(draw);
      return;
    }

    const polygons = foldingPosePolygons(analysis, pose);
    const allVertices = [];
    const faces = polygons.map((polygon, faceIndex) => {
      const points3 = polygon.map((point) => {
        const rotated = rotate(point);
        allVertices.push(rotated);
        return rotated;
      });
      return { faceIndex, points3, depth: points3.reduce((sum, point) => sum + point[2], 0) / points3.length };
    });

    const hingePoints = pose.hingeStates.flatMap((hinge) => [rotate(hinge.pivotWorld), rotate(hinge.endWorld)]);
    allVertices.push(...hingePoints);
    const maxExtent = Math.max(1, ...allVertices.flatMap((point) => [Math.abs(point[0]), Math.abs(point[1])])) * 1.2;
    const scale = Math.min(width, height) * 0.42 / maxExtent * zoom;
    const project = ([x, y, z]) => {
      const perspective = 1 / Math.max(0.55, 1 + z * 0.045);
      return { x: width / 2 + x * scale * perspective, y: height / 2 - y * scale * perspective, z };
    };

    projectedFaces = faces
      .map((face) => ({ ...face, points: face.points3.map(project) }))
      .sort((left, right) => left.depth - right.depth);
    projectedHinges = pose.hingeStates.map((hinge) => {
      const from3 = rotate(hinge.pivotWorld);
      const to3 = rotate(hinge.endWorld);
      return { ...hinge, from: project(from3), to: project(to3), depth: (from3[2] + to3[2]) / 2 };
    });

    context.lineJoin = 'round';
    context.lineCap = 'round';
    for (const face of projectedFaces) {
      const faceAnalysis = analysis.faces[face.faceIndex];
      const colliding = collisionFaces.has(face.faceIndex);
      pathPolygon(context, face.points);
      context.globalAlpha = face.faceIndex === activeFace ? 0.96 : face.faceIndex === selectedFace ? 0.9 : 0.7;
      context.fillStyle = colliding ? '#ff5578' : FACE_COLORS[faceAnalysis.kind] ?? FACE_COLORS.default;
      context.fill();
      context.globalAlpha = 1;
      context.strokeStyle = colliding
        ? '#ffd5de'
        : face.faceIndex === activeFace ? '#ffffff' : face.faceIndex === selectedFace ? '#d8e5ff' : 'rgba(225, 237, 255, 0.72)';
      context.lineWidth = colliding ? 3.2 : face.faceIndex === activeFace ? 3.2 : face.faceIndex === selectedFace ? 2.4 : 1.2;
      context.stroke();

      if (foldingOptions.progress < 0.14 || face.faceIndex === activeFace || face.faceIndex === selectedFace) {
        const center = face.points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
        center.x /= face.points.length;
        center.y /= face.points.length;
        context.fillStyle = '#07111f';
        context.font = `700 ${Math.max(11, Math.min(15, scale * 0.12))}px ui-sans-serif, system-ui, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(String(face.faceIndex + 1), center.x, center.y);
      }
    }

    if (showHinges) {
      for (const hinge of projectedHinges.sort((left, right) => left.depth - right.depth)) {
        const selected = hinge.edgeKey === selectedHinge;
        context.beginPath();
        context.moveTo(hinge.from.x, hinge.from.y);
        context.lineTo(hinge.to.x, hinge.to.y);
        context.strokeStyle = selected ? '#ffffff' : hinge.direction === 'positive' ? 'rgba(89, 225, 194, .92)' : 'rgba(133, 157, 255, .92)';
        context.lineWidth = selected ? 6 : interactionMode === 'hinge' ? 3.4 : 2.1;
        context.globalAlpha = selected ? 1 : 0.82;
        context.stroke();
        context.globalAlpha = 1;
      }
    }
    requestAnimationFrame(draw);
  }

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !previousPointer) return;
    const dx = event.clientX - previousPointer.x;
    const dy = event.clientY - previousPointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) {
      pointerMoved = true;
      yaw += dx * 0.008;
      pitch = clamp(pitch + dy * 0.008, -1.4, 1.4);
    }
    previousPointer = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', (event) => {
    const wasDrag = pointerMoved;
    dragging = false;
    previousPointer = null;
    canvas.releasePointerCapture(event.pointerId);
    if (wasDrag) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (interactionMode === 'hinge' && showHinges) {
      const hit = projectedHinges
        .map((hinge) => ({ hinge, distance: pointSegmentDistance2(point, hinge.from, hinge.to) }))
        .filter((entry) => entry.distance <= 14)
        .sort((left, right) => left.distance - right.distance)[0];
      if (hit) {
        onHingeSelect?.(hit.hinge.edgeKey);
        return;
      }
    }
    const hit = [...projectedFaces].reverse().find((face) => pointInPolygon(face.points, point.x, point.y));
    if (hit) onFaceSelect?.(hit.faceIndex);
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom = clamp(zoom * Math.exp(-event.deltaY * 0.001), 0.55, 2.5);
  }, { passive: false });

  resize();
  requestAnimationFrame(draw);

  return {
    kind: 'canvas-2d-fallback',
    setModel(nextModel, nextAnalysis, nextNet, suppliedFoldingModel = null) {
      model = nextModel;
      analysis = nextAnalysis;
      net = nextNet;
      foldingModel = suppliedFoldingModel ?? createFoldingModel(model, analysis, net);
      refreshPose();
    },
    setFoldingState(next = {}) {
      foldingOptions = { ...foldingOptions, ...next };
      refreshPose();
    },
    setProgress(value) {
      foldingOptions.progress = clamp(value, 0, 1);
      refreshPose();
    },
    setSelectedFace(faceIndex) { selectedFace = faceIndex ?? -1; },
    setActiveFace(faceIndex) { activeFace = faceIndex ?? -1; },
    setSelectedHinge(edgeKey) { selectedHinge = edgeKey ?? null; },
    setShowHinges(value) { showHinges = Boolean(value); },
    setInteractionMode(value) { interactionMode = value ?? 'inspect'; },
    setDiagnostics(diagnostics) {
      collisionFaces = new Set((diagnostics?.collision?.collisions ?? []).flatMap((entry) => [entry.leftFace, entry.rightFace]));
    },
    resetView() { yaw = -0.65; pitch = 0.48; zoom = 1; },
    dispose() {
      disposed = true;
      resizeObserver.disconnect();
      canvas.remove();
    },
  };
}
