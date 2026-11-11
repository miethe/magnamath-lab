import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { clamp } from '../core/math.js';
import { createFoldingModel, sampleFoldingPose } from '../core/folding.js';
import { centreFoldingPose } from './fold-framing.js';

const FACE_COLORS = {
  square: 0x43dfc1,
  'equilateral-triangle': 0x718fff,
  'right-isosceles-triangle': 0xffb761,
  'right-triangle': 0xffb761,
  'isosceles-triangle': 0xed78b4,
  'regular-5-gon': 0xbd82ff,
  'regular-6-gon': 0x68ccf5,
  'regular-8-gon': 0x80dc88,
  default: 0x91a5c2,
};

// Kids palette: one distinct colour PER FACE, not per face-kind. A cube's six squares
// are all one hue under FACE_COLORS, which makes the single most important concept for
// a 4-9 year old — counting the faces — literally uncountable on screen. Ordered to
// avoid red/green adjacency for the common colour-vision confusions.
const KID_FACE_COLORS = [
  0xff8a5c, // orange
  0x5cc8ff, // blue
  0xffd75c, // yellow
  0xb98cff, // violet
  0x5ce6a8, // mint
  0xff7fb0, // pink
  0x9ae65c, // lime
  0x7f9dff, // periwinkle
];

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

function makeFaceGeometry(localPolygon) {
  const positions = [];
  const indices = [];
  for (const [x, y] of localPolygon) positions.push(x, y, 0);
  for (let index = 1; index < localPolygon.length - 1; index += 1) indices.push(0, index, index + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeEdgeGeometry(localPolygon) {
  const positions = [];
  for (const [x, y] of [...localPolygon, localPolygon[0]]) positions.push(x, y, 0.002);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function setMatrixFromRowMajor(object, values) {
  object.matrix.set(...values);
  object.matrixWorldNeedsUpdate = true;
}

function rowMajorFromThreeMatrix(matrix) {
  const e = matrix.elements;
  return [
    e[0], e[4], e[8], e[12],
    e[1], e[5], e[9], e[13],
    e[2], e[6], e[10], e[14],
    e[3], e[7], e[11], e[15],
  ];
}

function applyRootPose(object, values) {
  const matrix = new THREE.Matrix4();
  matrix.set(...values);
  matrix.decompose(object.position, object.quaternion, object.scale);
  object.scale.set(1, 1, 1);
  object.updateMatrix();
  object.updateMatrixWorld(true);
}

function updateCylinder(object, from, to) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 1e-8);
  object.position.copy(start).add(end).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  object.scale.set(1, length, 1);
  object.updateMatrix();
}

/** Production renderer. Geometry, topology, and kinematics remain owned by the pure core. */
export function createThreeRenderer(container, {
  onFaceSelect,
  onHingeSelect,
  onRootPoseChange,
  autoFrame: initialAutoFrame = false,
  kidsPalette: initialKidsPalette = false,
} = {}) {
  let autoFrame = initialAutoFrame;
  let kidsPalette = initialKidsPalette;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = 'shape-canvas shape-canvas--three';
  renderer.domElement.setAttribute('aria-label', 'Interactive hinge-constrained Three.js polyhedron view');
  container.querySelector('.shape-canvas')?.remove();
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000);
  camera.position.set(4.6, 3.6, 5.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 1.2;
  controls.maxDistance = 30;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xb9dcff, 0x08101e, 2.25));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x7a91ff, 2.1);
  rimLight.position.set(-6, 1, -5);
  scene.add(rimLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 96),
    new THREE.MeshBasicMaterial({ color: 0x0e1b2e, transparent: true, opacity: 0.24, depthWrite: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.25;
  scene.add(floor);

  // viewPivot -> rootControlGroup -> faceRoot/hingeRoot. The pivot carries the
  // per-pose recentring offset. User-authored transforms and the Move gizmo remain
  // attached to rootControlGroup, independent of this display-only translation.
  const viewPivot = new THREE.Group();
  scene.add(viewPivot);
  let rootControlGroup = new THREE.Group();
  let faceRoot = new THREE.Group();
  let hingeRoot = new THREE.Group();
  rootControlGroup.add(faceRoot, hingeRoot);
  viewPivot.add(rootControlGroup);

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setMode('translate');
  transformControls.setSize(0.86);
  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
  });
  transformControls.addEventListener('objectChange', () => {
    rootControlGroup.updateMatrix();
    onRootPoseChange?.(rowMajorFromThreeMatrix(rootControlGroup.matrix));
  });
  scene.add(transformControls.getHelper());

  let polyhedron = null;
  let analysis = null;
  let net = null;
  let foldingModel = null;
  let foldingPose = null;
  let foldingOptions = {
    progress: 1,
    sequenceMode: 'simultaneous',
    hingeDuration: 0.58,
    hingeOverrides: {},
  };
  let faceObjects = [];
  let hingeObjects = [];
  let selectedFace = -1;
  let activeFace = -1;
  let selectedHinge = null;
  let collisionFaces = new Set();
  let showHinges = true;
  let interactionMode = 'inspect';
  let disposed = false;
  let pointerStart = null;
  let pointerMoved = false;
  const homePosition = new THREE.Vector3(4.6, 3.6, 5.5);
  const homeTarget = new THREE.Vector3();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // The fit distance depends on aspect; without this a panel narrowed after load
    // (or a first layout at a different width) leaves the solid wider than the view.
    if (fitRadius > 0 && Math.abs(width - lastFitWidth) > 1) refit();
  }

  // Half-angle of the SMALLER view axis: vertical fov alone ignores portrait/narrow
  // panels, where the horizontal extent is what clips the solid.
  function fitHalfAngle() {
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
    return Math.atan(Math.tan(halfV) * Math.min(1, camera.aspect));
  }

  let fitRadius = 0;
  let fitKind = 'model';
  let lastFitWidth = 0;
  function refit() {
    lastFitWidth = renderer.domElement.clientWidth || container.getBoundingClientRect().width;
    if (fitKind === 'frame') frameRadius(fitRadius); else fitCamera(polyhedron, net);
  }

  function fitCamera(model, currentNet) {
    const foldedRadius = Math.max(...model.vertices.map(([x, y, z]) => Math.hypot(x, y, z)), 1);
    const flatRadius = Math.max(...currentNet.polygons.flat().map(([x, y]) => Math.hypot(x, y)), 1);
    const radius = Math.max(foldedRadius, flatRadius) * 1.12;
    fitRadius = radius; fitKind = 'model';
    const distance = radius / Math.tan(fitHalfAngle()) * 1.25;
    const direction = new THREE.Vector3(0.63, 0.48, 0.71).normalize();
    camera.position.copy(direction.multiplyScalar(distance));
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 30;
    camera.updateProjectionMatrix();
    controls.minDistance = radius * 0.65;
    controls.maxDistance = distance * 4;
    controls.target.set(0, 0, 0);
    controls.update();
    homePosition.copy(camera.position);
    homeTarget.copy(controls.target);
  }

  function updateHighlights() {
    for (const object of faceObjects) {
      const selected = object.faceIndex === selectedFace;
      const active = object.faceIndex === activeFace;
      const colliding = collisionFaces.has(object.faceIndex);
      object.mesh.material.color.setHex(colliding ? 0xff5578 : object.baseColor);
      object.mesh.material.emissive.setHex(colliding ? 0xff4268 : active ? 0xffffff : selected ? 0x5c79c9 : 0x07111f);
      object.mesh.material.emissiveIntensity = colliding ? 0.42 : active ? 0.34 : selected ? 0.22 : 0.055;
      object.mesh.material.opacity = colliding ? 0.92 : active ? 0.96 : selected ? 0.9 : 0.72;
      object.edge.material.color.setHex(colliding ? 0xffd5de : active ? 0xffffff : selected ? 0xdce9ff : 0xb9c9df);
      object.edge.material.opacity = colliding ? 1 : active ? 1 : selected ? 0.95 : 0.72;
    }
    for (const object of hingeObjects) {
      const selected = object.edgeKey === selectedHinge;
      const color = selected ? 0xffffff : object.direction === 'positive' ? 0x59e1c2 : 0x859dff;
      object.visible.material.color.setHex(color);
      object.visible.material.emissive.setHex(color);
      object.visible.material.emissiveIntensity = selected ? 0.8 : 0.28;
      object.visible.scale.x = selected ? 1.8 : 1;
      object.visible.scale.z = selected ? 1.8 : 1;
      object.hit.visible = showHinges && interactionMode === 'hinge';
      object.visible.visible = showHinges;
    }
  }

  // Stable camera distance. The flat net and folded solid do not share a centre.
  // Compute the UNION bounds of every pose along the fold trajectory, once per model.
  // Use the union radius to keep a constant scale instead of re-dollying every frame — a per-pose radius
  // fit shrinks the cube 3.1x during a 1.85s animation and steals the user's zoom on
  // every rAF tick. The union CENTRE is not a pose centre; refreshPose independently
  // recentres each visible pose. Its bounding radius cannot exceed the union radius.
  const TRAJECTORY_SAMPLES = 17;
  function unionBounds() {
    if (!foldingModel) return null;
    let minX = Infinity; let minY = Infinity; let minZ = Infinity;
    let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
    for (let s = 0; s < TRAJECTORY_SAMPLES; s++) {
      const t = s / (TRAJECTORY_SAMPLES - 1);
      const pose = sampleFoldingPose(foldingModel, t, { ...foldingOptions, rootPose: null, progress: t });
      pose.faceTransforms.forEach((m, faceIndex) => {
        for (const [lx, ly] of analysis.faceFrames[faceIndex].local) {
          const x = m[0] * lx + m[1] * ly + m[3];
          const y = m[4] * lx + m[5] * ly + m[7];
          const z = m[8] * lx + m[9] * ly + m[11];
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
        }
      });
    }
    if (!Number.isFinite(minX)) return null;
    const centre = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    // Radius = max corner distance from centre. Cheap conservative upper bound and
    // exactly what the camera fit needs.
    const halfX = (maxX - minX) / 2; const halfY = (maxY - minY) / 2; const halfZ = (maxZ - minZ) / 2;
    return { centre, radius: Math.max(Math.hypot(halfX, halfY, halfZ), 0.25) };
  }

  // Distance-only camera fit. The orbit direction the user chose is preserved; no
  // geometry is scaled. Kept public so applyAutoFrame can call it once per model.
  function frameRadius(radius) {
    fitRadius = radius; fitKind = 'frame';
    const distance = (radius / Math.tan(fitHalfAngle())) * 1.35;
    const direction = camera.position.clone().sub(controls.target);
    if (direction.lengthSq() < 1e-9) direction.set(0.63, 0.48, 0.71);
    direction.normalize();
    camera.position.copy(controls.target).add(direction.multiplyScalar(distance));
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 30;
    controls.minDistance = radius * 0.5;
    controls.maxDistance = distance * 4;
    camera.updateProjectionMatrix();
    controls.update();
    homePosition.copy(camera.position);
    homeTarget.copy(controls.target);
  }

  function applyAutoFrame() {
    if (!autoFrame) { viewPivot.position.set(0, 0, 0); return; }
    const bounds = unionBounds();
    if (!bounds) return;
    if (foldingPose) centreFoldingPose(viewPivot, analysis, foldingPose);
    controls.target.set(0, 0, 0);
    frameRadius(bounds.radius);
  }

  function refreshPose() {
    if (!foldingModel) return;
    foldingPose = sampleFoldingPose(foldingModel, foldingOptions.progress, {
      ...foldingOptions,
      rootPose: null,
    });
    foldingPose.faceTransforms.forEach((matrix, faceIndex) => setMatrixFromRowMajor(faceObjects[faceIndex].group, matrix));
    foldingPose.hingeStates.forEach((hinge, index) => {
      updateCylinder(hingeObjects[index].visible, hinge.pivotWorld, hinge.endWorld);
      updateCylinder(hingeObjects[index].hit, hinge.pivotWorld, hinge.endWorld);
    });
    if (autoFrame) centreFoldingPose(viewPivot, analysis, foldingPose);
    floor.material.opacity = 0.24 * clamp(foldingOptions.progress, 0, 1);
  }

  function rebuildModel(nextPolyhedron, nextAnalysis, nextNet, suppliedFoldingModel = null) {
    transformControls.detach();
    disposeObject(rootControlGroup);
    // Detach from the ACTUAL parent, not an assumed one. rootControlGroup hangs off
    // viewPivot, so the old `scene.remove(rootControlGroup)` was a silent no-op
    // (Object3D.remove only unlinks direct children) and every rebuild left the
    // previous shape parented and still drawing — dispose() frees GPU buffers but
    // the renderer re-uploads them from the surviving CPU-side attributes.
    rootControlGroup.removeFromParent();
    rootControlGroup = new THREE.Group();
    faceRoot = new THREE.Group();
    hingeRoot = new THREE.Group();
    rootControlGroup.add(faceRoot, hingeRoot);
    viewPivot.add(rootControlGroup);
    polyhedron = nextPolyhedron;
    analysis = nextAnalysis;
    net = nextNet;
    foldingModel = suppliedFoldingModel ?? createFoldingModel(polyhedron, analysis, net);
    faceObjects = [];
    hingeObjects = [];

    analysis.faceFrames.forEach((frame, faceIndex) => {
      const group = new THREE.Group();
      group.matrixAutoUpdate = false;
      const color = kidsPalette
        ? KID_FACE_COLORS[faceIndex % KID_FACE_COLORS.length]
        : (FACE_COLORS[analysis.faces[faceIndex].kind] ?? FACE_COLORS.default);
      const mesh = new THREE.Mesh(
        makeFaceGeometry(frame.local),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.26,
          metalness: 0.02,
          transparent: true,
          // Near-opaque under the kids palette so panels read as solid coloured paper
          // (countable) rather than overlapping glass.
          opacity: kidsPalette ? 0.96 : 0.72,
          side: THREE.DoubleSide,
          depthWrite: true,
          emissive: 0x07111f,
          emissiveIntensity: 0.055,
        }),
      );
      mesh.userData.faceIndex = faceIndex;
      const edge = new THREE.Line(
        makeEdgeGeometry(frame.local),
        new THREE.LineBasicMaterial({ color: 0xb9c9df, transparent: true, opacity: 0.72 }),
      );
      group.add(mesh, edge);
      faceRoot.add(group);
      faceObjects.push({ faceIndex, group, mesh, edge, baseColor: color });
    });

    const visibleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1, 12, 1, true);
    const hitGeometry = new THREE.CylinderGeometry(0.11, 0.11, 1, 10, 1, true);
    foldingModel.hinges.forEach((hinge) => {
      const visible = new THREE.Mesh(
        visibleGeometry.clone(),
        new THREE.MeshStandardMaterial({
          color: hinge.direction === 'positive' ? 0x59e1c2 : 0x859dff,
          emissive: hinge.direction === 'positive' ? 0x59e1c2 : 0x859dff,
          emissiveIntensity: 0.28,
          roughness: 0.3,
          metalness: 0.05,
          transparent: true,
          opacity: 0.88,
          depthWrite: false,
        }),
      );
      const hit = new THREE.Mesh(
        hitGeometry.clone(),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hit.userData.edgeKey = hinge.edgeKey;
      hingeRoot.add(visible, hit);
      hingeObjects.push({ edgeKey: hinge.edgeKey, direction: hinge.direction, visible, hit });
    });

    applyRootPose(rootControlGroup, foldingOptions.rootPose ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    if (interactionMode === 'move') transformControls.attach(rootControlGroup);
    fitCamera(polyhedron, net);
    refreshPose();
    // Trajectory fit runs after refreshPose so foldingModel exists. Fits once; no camera
    // moves during the fold. When autoFrame is off (default), viewPivot stays at the
    // origin so the expert view is byte-identical to the pre-change path.
    applyAutoFrame();
    updateHighlights();
  }

  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (interactionMode === 'hinge' && showHinges) {
      const hingeHits = raycaster.intersectObjects(hingeObjects.map((entry) => entry.hit), false);
      if (hingeHits.length) {
        onHingeSelect?.(hingeHits[0].object.userData.edgeKey);
        return;
      }
    }
    const faceHits = raycaster.intersectObjects(faceObjects.map((entry) => entry.mesh), false);
    if (faceHits.length) onFaceSelect?.(faceHits[0].object.userData.faceIndex);
  }

  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
  });
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) pointerMoved = true;
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!pointerMoved && !transformControls.dragging) pick(event);
    pointerStart = null;
  });

  function animate() {
    if (disposed) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  requestAnimationFrame(animate);

  return {
    kind: 'three-webgl-kinematic',
    setModel: rebuildModel,
    setFoldingState(next = {}) {
      const rootPoseChanged = Array.isArray(next.rootPose) && next.rootPose.length === 16;
      foldingOptions = { ...foldingOptions, ...next };
      if (rootPoseChanged) applyRootPose(rootControlGroup, next.rootPose);
      refreshPose();
    },
    setProgress(value) {
      foldingOptions.progress = clamp(value, 0, 1);
      refreshPose();
    },
    setSelectedFace(faceIndex) { selectedFace = faceIndex ?? -1; updateHighlights(); },
    setActiveFace(faceIndex) { activeFace = faceIndex ?? -1; updateHighlights(); },
    setSelectedHinge(edgeKey) { selectedHinge = edgeKey ?? null; updateHighlights(); },
    setShowHinges(value) { showHinges = Boolean(value); updateHighlights(); },
    setInteractionMode(value) {
      interactionMode = value ?? 'inspect';
      if (interactionMode === 'move') transformControls.attach(rootControlGroup);
      else transformControls.detach();
      controls.enabled = true;
      updateHighlights();
    },
    setTransformMode(value) {
      transformControls.setMode(value === 'rotate' ? 'rotate' : 'translate');
    },
    setDiagnostics(diagnostics) {
      collisionFaces = new Set((diagnostics?.collision?.collisions ?? []).flatMap((entry) => [entry.leftFace, entry.rightFace]));
      updateHighlights();
    },
    setAutoFrame(value) {
      autoFrame = Boolean(value);
      applyAutoFrame();
    },
    setKidsPalette(value) {
      const next = Boolean(value);
      if (next === kidsPalette) return;
      kidsPalette = next;
      // Colour and opacity are baked into each face material at build time, so the
      // model has to be rebuilt for the palette to take effect.
      if (polyhedron && analysis && net) rebuildModel(polyhedron, analysis, net, foldingModel);
    },
    resetRootPose() {
      applyRootPose(rootControlGroup, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      onRootPoseChange?.([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
    resetView() {
      camera.position.copy(homePosition);
      controls.target.copy(homeTarget);
      controls.update();
    },
    dispose() {
      disposed = true;
      resizeObserver.disconnect();
      controls.dispose();
      transformControls.dispose();
      disposeObject(rootControlGroup);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
