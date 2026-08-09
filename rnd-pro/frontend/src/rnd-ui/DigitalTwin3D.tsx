import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Scene as PlanScene, SceneObject } from '../rnd-core/data-model';
import './digital-twin-3d.css';

type CameraView = 'iso' | 'top' | 'front' | 'right';

export interface DigitalTwin3DProps {
  scene: PlanScene;
  title?: string;
  selectedId?: string | null;
  className?: string;
  onSelect?: (objectId: string | null) => void;
  onClose?: () => void;
}

interface Explodable {
  object: THREE.Object3D;
  baseY: number;
  lift: number;
}

interface CameraTween {
  startedAt: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

interface TwinRuntime {
  renderer: THREE.WebGLRenderer;
  threeScene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  modelRoot: THREE.Group;
  grid: THREE.GridHelper;
  clipPlane: THREE.Plane;
  selectionBox: THREE.Box3Helper;
  selectionBounds: THREE.Box3;
  selectable: Map<string, THREE.Object3D>;
  explodables: Explodable[];
  maxModelHeight: number;
  planWidth: number;
  planHeight: number;
  labelsVisible: boolean;
  selectedObject: THREE.Object3D | null;
  cameraTween: CameraTween | null;
  animationFrame: number;
  disposed: boolean;
  hasModel: boolean;
  setView: (view: CameraView, animate?: boolean) => void;
  fitView: () => void;
  setSelection: (id: string | null) => void;
  setExplode: (amount: number) => void;
  setClip: (enabled: boolean, level: number) => void;
  setLabels: (visible: boolean) => void;
  disposeModel: () => void;
}

const VIEW_LABELS: Record<CameraView, string> = {
  iso: 'Perspective',
  top: 'Top',
  front: 'Front',
  right: 'Right',
};

const UP = new THREE.Vector3(0, 1, 0);

export function DigitalTwin3D({
  scene,
  title = 'Parametric engineering model',
  selectedId,
  className = '',
  onSelect,
  onClose,
}: DigitalTwin3DProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<TwinRuntime | null>(null);
  const onSelectRef = useRef(onSelect);
  const [activeView, setActiveView] = useState<CameraView>('iso');
  const [explode, setExplode] = useState(0);
  const [clipEnabled, setClipEnabled] = useState(false);
  const [clipLevel, setClipLevel] = useState(100);
  const [gridVisible, setGridVisible] = useState(true);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [localSelection, setLocalSelection] = useState<string | null>(selectedId ?? null);
  const [ready, setReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  onSelectRef.current = onSelect;

  const metrics = useMemo(() => {
    const routes = scene.objects.filter(object => object.kind === 'line' || object.kind === 'freehand').length;
    const equipment = scene.objects.filter(object => ['rect', 'ellipse', 'symbol', 'img'].includes(object.kind)).length;
    return { routes, equipment, objects: scene.objects.length };
  }, [scene.objects]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      setRuntimeError(null);
    } catch {
      // A disabled or unavailable WebGL context must not take down the whole
      // engineering studio. Keep the shell visible with a clear diagnosis.
      setRuntimeError('3D acceleration is unavailable in this browser. Enable WebGL or open this file in a current Chrome, Edge, or Safari browser.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.domElement.className = 'dt3d-canvas';
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D engineering model');
    renderer.domElement.setAttribute('role', 'img');
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      setRuntimeError('The 3D graphics context was interrupted. The engineering data is safe; reopen the 3D Twin view to restore rendering.');
    };
    const handleContextRestored = () => {
      setRuntimeError(null);
      setReady(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
    host.appendChild(renderer.domElement);

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color('#050a10');
    threeScene.fog = new THREE.FogExp2('#050a10', 0.00055);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100_000);
    camera.up.set(0, 1, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;
    controls.minDistance = 8;
    controls.maxDistance = 50_000;
    controls.maxPolarAngle = Math.PI * 0.995;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

    const world = new THREE.Group();
    world.name = 'HydroNexis digital twin';
    threeScene.add(world);

    const modelRoot = new THREE.Group();
    modelRoot.name = 'Synchronized plan model';
    world.add(modelRoot);

    const grid = new THREE.GridHelper(1000, 50, '#22617a', '#102938');
    grid.position.y = -2.7;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach(material => {
      material.transparent = true;
      material.opacity = 0.42;
      material.depthWrite = false;
    });
    world.add(grid);

    threeScene.add(new THREE.HemisphereLight('#9feaff', '#071016', 1.25));
    const keyLight = new THREE.DirectionalLight('#d8f7ff', 2.8);
    keyLight.position.set(900, 1200, 700);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0004;
    threeScene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#2ae0ff', 1.3);
    rimLight.position.set(-900, 500, -500);
    threeScene.add(rimLight);
    const warmLight = new THREE.PointLight('#ffc45e', 0.7, 5000);
    warmLight.position.set(0, 650, 0);
    threeScene.add(warmLight);

    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 500);
    const selectionBounds = new THREE.Box3();
    const selectionBox = new THREE.Box3Helper(selectionBounds, new THREE.Color('#62eaff'));
    selectionBox.visible = false;
    selectionBox.renderOrder = 100;
    threeScene.add(selectionBox);

    const runtime: TwinRuntime = {
      renderer,
      threeScene,
      camera,
      controls,
      modelRoot,
      grid,
      clipPlane,
      selectionBox,
      selectionBounds,
      selectable: new Map(),
      explodables: [],
      maxModelHeight: 150,
      planWidth: 1000,
      planHeight: 700,
      labelsVisible: true,
      selectedObject: null,
      cameraTween: null,
      animationFrame: 0,
      disposed: false,
      hasModel: false,
      setView: () => undefined,
      fitView: () => undefined,
      setSelection: () => undefined,
      setExplode: () => undefined,
      setClip: () => undefined,
      setLabels: () => undefined,
      disposeModel: () => undefined,
    };

    const cameraDestination = (view: CameraView) => {
      const maxDimension = Math.max(runtime.planWidth, runtime.planHeight, 100);
      const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const aspectCompensation = Math.max(1, 1 / Math.max(camera.aspect, 0.25));
      const distance = (maxDimension * 0.62 / Math.tan(halfFov)) * aspectCompensation;
      const target = new THREE.Vector3(0, Math.min(runtime.maxModelHeight * 0.2, maxDimension * 0.08), 0);
      const direction = view === 'top'
        ? new THREE.Vector3(0, 1, 0.0001)
        : view === 'front'
          ? new THREE.Vector3(0, 0.28, 1)
          : view === 'right'
            ? new THREE.Vector3(1, 0.28, 0)
            : new THREE.Vector3(0.92, 0.72, 1);
      direction.normalize();
      return { target, position: target.clone().addScaledVector(direction, distance) };
    };

    runtime.setView = (view, animate = true) => {
      const destination = cameraDestination(view);
      const maxDimension = Math.max(runtime.planWidth, runtime.planHeight);
      camera.near = Math.max(0.1, maxDimension / 10_000);
      camera.far = Math.max(10_000, maxDimension * 30);
      camera.updateProjectionMatrix();
      controls.minDistance = Math.max(1, maxDimension * 0.001);
      controls.maxDistance = Math.max(50_000, maxDimension * 20);
      if (!animate) {
        camera.position.copy(destination.position);
        controls.target.copy(destination.target);
        controls.update();
        return;
      }
      runtime.cameraTween = {
        startedAt: performance.now(),
        duration: 620,
        fromPosition: camera.position.clone(),
        toPosition: destination.position,
        fromTarget: controls.target.clone(),
        toTarget: destination.target,
      };
    };

    runtime.fitView = () => {
      const direction = camera.position.clone().sub(controls.target).normalize();
      const maxDimension = Math.max(runtime.planWidth, runtime.planHeight, 100);
      const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const distance = maxDimension * 0.67 / Math.tan(halfFov) * Math.max(1, 1 / Math.max(camera.aspect, 0.25));
      const target = new THREE.Vector3(0, runtime.maxModelHeight * 0.15, 0);
      runtime.cameraTween = {
        startedAt: performance.now(),
        duration: 540,
        fromPosition: camera.position.clone(),
        toPosition: target.clone().addScaledVector(direction.lengthSq() ? direction : new THREE.Vector3(1, 0.8, 1).normalize(), distance),
        fromTarget: controls.target.clone(),
        toTarget: target,
      };
    };

    runtime.setSelection = id => {
      runtime.selectedObject = id ? runtime.selectable.get(id) ?? null : null;
      runtime.selectable.forEach((root, sourceId) => {
        root.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(material => {
            if (!(material instanceof THREE.MeshStandardMaterial) && !(material instanceof THREE.MeshPhysicalMaterial)) return;
            const base = Number(material.userData.baseEmissiveIntensity ?? material.emissiveIntensity);
            material.userData.baseEmissiveIntensity = base;
            material.emissiveIntensity = sourceId === id ? Math.max(base, 1.15) : base;
          });
        });
      });
      selectionBox.visible = Boolean(runtime.selectedObject);
      if (runtime.selectedObject) selectionBounds.setFromObject(runtime.selectedObject);
    };

    runtime.setExplode = amount => {
      const normalized = THREE.MathUtils.clamp(amount / 100, 0, 1);
      runtime.explodables.forEach(item => {
        item.object.position.y = item.baseY + item.lift * normalized;
      });
      if (runtime.selectedObject) selectionBounds.setFromObject(runtime.selectedObject);
    };

    runtime.setClip = (enabled, level) => {
      clipPlane.constant = runtime.maxModelHeight * THREE.MathUtils.clamp(level / 100, 0.02, 1.3);
      renderer.clippingPlanes = enabled ? [clipPlane] : [];
    };

    runtime.setLabels = visible => {
      runtime.labelsVisible = visible;
      modelRoot.traverse(child => {
        if (child.userData.isPlanLabel) child.visible = visible;
      });
    };

    runtime.disposeModel = () => {
      runtime.selectable.clear();
      runtime.explodables = [];
      runtime.selectedObject = null;
      selectionBox.visible = false;
      while (modelRoot.children.length) {
        const child = modelRoot.children[modelRoot.children.length - 1];
        modelRoot.remove(child);
        disposeObject(child);
      }
    };

    runtimeRef.current = runtime;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host);
    window.addEventListener('resize', resize);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart = { x: 0, y: 0 };
    const pointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const objectAt = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // Excluding the dense GridHelper and base slab makes selection both
      // deterministic and substantially cheaper for large imported plans.
      const hits = raycaster.intersectObjects([...runtime.selectable.values()], true);
      for (const hit of hits) {
        let candidate: THREE.Object3D | null = hit.object;
        while (candidate && candidate !== modelRoot) {
          if (typeof candidate.userData.sourceId === 'string') return candidate.userData.sourceId as string;
          candidate = candidate.parent;
        }
      }
      return null;
    };
    const pointerUp = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const id = objectAt(event);
      setLocalSelection(id);
      runtime.setSelection(id);
      onSelectRef.current?.(id);
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.buttons) return;
      renderer.domElement.style.cursor = objectAt(event) ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointermove', pointerMove);

    const clock = new THREE.Clock();
    const animate = (now: number) => {
      if (runtime.disposed) return;
      runtime.animationFrame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (runtime.cameraTween) {
        const tween = runtime.cameraTween;
        const rawProgress = THREE.MathUtils.clamp((now - tween.startedAt) / tween.duration, 0, 1);
        const progress = 1 - Math.pow(1 - rawProgress, 3);
        camera.position.lerpVectors(tween.fromPosition, tween.toPosition, progress);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, progress);
        if (rawProgress >= 1) runtime.cameraTween = null;
      }
      controls.update();
      if (runtime.selectedObject) {
        selectionBounds.setFromObject(runtime.selectedObject);
        const selectionMaterials = Array.isArray(selectionBox.material) ? selectionBox.material : [selectionBox.material];
        selectionMaterials.forEach(material => {
          material.opacity = 0.72 + Math.sin(elapsed * 3.5) * 0.18;
          material.transparent = true;
        });
      }
      renderer.render(threeScene, camera);
    };
    runtime.animationFrame = requestAnimationFrame(animate);
    setReady(true);

    return () => {
      runtime.disposed = true;
      cancelAnimationFrame(runtime.animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      runtime.disposeModel();
      selectionBox.geometry.dispose();
      const selectionMaterials = Array.isArray(selectionBox.material) ? selectionBox.material : [selectionBox.material];
      selectionMaterials.forEach(material => material.dispose());
      grid.geometry.dispose();
      gridMaterials.forEach(material => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const nextWidth = Math.max(scene.w, 100);
    const nextHeight = Math.max(scene.h, 100);
    const needsFraming = !runtime.hasModel || runtime.planWidth !== nextWidth || runtime.planHeight !== nextHeight;
    rebuildPlanModel(runtime, scene);
    runtime.grid.visible = gridVisible;
    runtime.setLabels(labelsVisible);
    runtime.setExplode(explode);
    runtime.setClip(clipEnabled, clipLevel);
    runtime.setSelection(selectedId ?? localSelection);
    // Preserve an engineer's orbit/pan/zoom during live 2D object updates.
    // Reframe only the first model or when the plan extents actually change.
    if (needsFraming) runtime.setView(activeView, false);
    runtime.hasModel = true;
  }, [scene]);

  useEffect(() => {
    setLocalSelection(selectedId ?? null);
    runtimeRef.current?.setSelection(selectedId ?? null);
  }, [selectedId]);

  useEffect(() => {
    runtimeRef.current?.setExplode(explode);
  }, [explode]);

  useEffect(() => {
    runtimeRef.current?.setClip(clipEnabled, clipLevel);
  }, [clipEnabled, clipLevel]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.grid.visible = gridVisible;
  }, [gridVisible]);

  useEffect(() => {
    runtimeRef.current?.setLabels(labelsVisible);
  }, [labelsVisible]);

  const chooseView = useCallback((view: CameraView) => {
    setActiveView(view);
    runtimeRef.current?.setView(view);
  }, []);

  const resetView = useCallback(() => {
    setActiveView('iso');
    setExplode(0);
    setClipEnabled(false);
    setClipLevel(100);
    runtimeRef.current?.setView('iso');
  }, []);

  return (
    <section className={`dt3d-shell ${className}`} aria-label="HydroNexis 3D digital twin">
      <div className="dt3d-viewport" ref={hostRef} />
      {runtimeError && <div className="dt3d-runtime-error" role="alert"><span>!</span><div><strong>3D renderer unavailable</strong><p>{runtimeError}</p></div></div>}
      <div className="dt3d-vignette" aria-hidden="true" />
      <div className="dt3d-scanline" aria-hidden="true" />

      <header className="dt3d-header">
        <div className="dt3d-brand">
          <span className="dt3d-brand__mark"><i /><i /><i /></span>
          <span><small>R&amp;D DIGITAL TWIN</small><strong>{title}</strong></span>
        </div>
        <div className="dt3d-model-state">
          <span className={ready ? 'is-live' : ''}><i />{ready ? 'LIVE 2D ↔ 3D SYNC' : 'INITIALIZING MODEL'}</span>
          <span>{metrics.objects} objects</span>
          <span>{metrics.routes} routes</span>
          <span>{metrics.equipment} assets</span>
        </div>
        <div className="dt3d-header__actions">
          <button type="button" onClick={() => runtimeRef.current?.fitView()} title="Fit the full model in view">Fit model</button>
          <button type="button" onClick={resetView} title="Reset camera and analysis controls">Reset</button>
          {onClose && <button type="button" className="dt3d-close" onClick={onClose} aria-label="Close 3D model">×</button>}
        </div>
      </header>

      <nav className="dt3d-view-rail" aria-label="Standard camera views">
        <span>VIEWS</span>
        {(Object.keys(VIEW_LABELS) as CameraView[]).map(view => (
          <button
            type="button"
            key={view}
            className={activeView === view ? 'is-active' : ''}
            onClick={() => chooseView(view)}
            title={`${VIEW_LABELS[view]} camera view`}
          >
            <b>{view === 'iso' ? '◇' : view === 'top' ? 'T' : view === 'front' ? 'F' : 'R'}</b>
            <small>{VIEW_LABELS[view]}</small>
          </button>
        ))}
      </nav>

      <div className="dt3d-axis" aria-hidden="true">
        <span className="dt3d-axis__y">Y</span>
        <span className="dt3d-axis__x">X</span>
        <span className="dt3d-axis__z">Z</span>
        <i />
      </div>

      <aside className="dt3d-insight">
        <div className="dt3d-insight__eyebrow"><span /> NEXI MODEL CHECK</div>
        <strong>Spatial model generated</strong>
        <p>Plan geometry is raised by engineering layer. Routes remain dimensionally synchronized with the 2D source.</p>
        <div><span>Geometry</span><b>VALID</b></div>
        <div><span>Selected</span><b>{localSelection ?? 'None'}</b></div>
      </aside>

      <div className="dt3d-control-dock">
        <div className="dt3d-range-control">
          <span><b>Exploded layers</b><small>{explode}%</small></span>
          <input type="range" min="0" max="100" value={explode} onChange={event => setExplode(Number(event.target.value))} aria-label="Explode model layers" />
        </div>
        <div className={`dt3d-range-control dt3d-range-control--clip ${clipEnabled ? 'is-enabled' : ''}`}>
          <span>
            <button type="button" role="switch" aria-checked={clipEnabled} onClick={() => setClipEnabled(value => !value)}><i /></button>
            <b>Section cut</b><small>{clipEnabled ? `${clipLevel}%` : 'OFF'}</small>
          </span>
          <input type="range" min="4" max="120" value={clipLevel} disabled={!clipEnabled} onChange={event => setClipLevel(Number(event.target.value))} aria-label="Section cut height" />
        </div>
        <div className="dt3d-display-toggles">
          <button type="button" className={gridVisible ? 'is-active' : ''} onClick={() => setGridVisible(value => !value)}><i />Grid</button>
          <button type="button" className={labelsVisible ? 'is-active' : ''} onClick={() => setLabelsVisible(value => !value)}><i />Labels</button>
        </div>
      </div>

      <footer className="dt3d-help">
        <span><b>LEFT DRAG</b> Orbit</span>
        <span><b>RIGHT DRAG</b> Pan</span>
        <span><b>WHEEL</b> Zoom to cursor</span>
        <span><b>CLICK</b> Inspect object</span>
      </footer>
    </section>
  );
}

function rebuildPlanModel(runtime: TwinRuntime, plan: PlanScene) {
  runtime.disposeModel();
  runtime.planWidth = Math.max(plan.w, 100);
  runtime.planHeight = Math.max(plan.h, 100);
  // Raised layers use display-height units independent of the source drawing
  // scale, so section cutting must follow actual vertical geometry—not width.
  runtime.maxModelHeight = 190;
  runtime.modelRoot.position.set(-plan.w / 2, 0, -plan.h / 2);

  if (runtime.threeScene.fog instanceof THREE.FogExp2) {
    // A fixed density turns large millimetre-based site plans completely black.
    runtime.threeScene.fog.density = 0.52 / Math.max(runtime.planWidth, runtime.planHeight, 100);
  }

  const gridSize = Math.max(plan.w, plan.h) * 1.45;
  const gridStep = plan.bg.type === 'grid' ? Math.max(plan.bg.grid, 1) : gridSize / 40;
  const desiredDivisions = Math.round(gridSize / gridStep);
  const divisions = THREE.MathUtils.clamp(desiredDivisions, 10, 120);
  const oldGrid = runtime.grid;
  const nextGrid = new THREE.GridHelper(gridSize, divisions, '#267c99', '#0e2a3a');
  nextGrid.position.set(plan.w / 2, -2.7, plan.h / 2);
  nextGrid.visible = oldGrid.visible;
  const materials = Array.isArray(nextGrid.material) ? nextGrid.material : [nextGrid.material];
  materials.forEach(material => {
    material.transparent = true;
    material.opacity = 0.4;
    material.depthWrite = false;
  });
  runtime.modelRoot.add(nextGrid);

  const baseMaterial = new THREE.MeshPhysicalMaterial({
    color: colorOf(plan.bg.type === 'color' ? plan.bg.color : '#071725'),
    roughness: 0.82,
    metalness: 0.18,
    transparent: true,
    opacity: 0.96,
  });
  baseMaterial.userData.baseEmissiveIntensity = 0;
  const base = new THREE.Mesh(new THREE.BoxGeometry(plan.w + 20, 4, plan.h + 20), baseMaterial);
  base.position.set(plan.w / 2, -4.8, plan.h / 2);
  base.receiveShadow = true;
  runtime.modelRoot.add(base);

  const borderGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -2.1, 0), new THREE.Vector3(plan.w, -2.1, 0),
    new THREE.Vector3(plan.w, -2.1, plan.h), new THREE.Vector3(0, -2.1, plan.h),
    new THREE.Vector3(0, -2.1, 0),
  ]);
  const border = new THREE.Line(borderGeometry, new THREE.LineBasicMaterial({ color: '#42c8f2', transparent: true, opacity: 0.62 }));
  runtime.modelRoot.add(border);

  const ordered = [...plan.objects].sort((a, b) => layerOrder(a.layer) - layerOrder(b.layer));
  ordered.forEach((object, index) => {
    const root = createPlanObject(object, index, runtime);
    if (!root) return;
    root.userData.sourceId = object.id;
    root.userData.sourceKind = object.kind;
    runtime.modelRoot.add(root);
    runtime.selectable.set(object.id, root);
  });

  runtime.grid = nextGrid;
  oldGrid.parent?.remove(oldGrid);
  oldGrid.geometry.dispose();
  const oldMaterials = Array.isArray(oldGrid.material) ? oldGrid.material : [oldGrid.material];
  oldMaterials.forEach(material => material.dispose());
  runtime.modelRoot.updateMatrixWorld(true);
}

function createPlanObject(object: SceneObject, index: number, runtime: TwinRuntime): THREE.Object3D | null {
  const baseY = object.layer === 'background' ? 4 : object.layer === 'symbols' ? 15 : 30;
  const lift = object.layer === 'background' ? 8 : object.layer === 'symbols' ? 64 : 118;
  let root: THREE.Object3D | null = null;

  if (object.kind === 'rect') {
    const height = object.layer === 'background' ? 9 : 19;
    root = raisedBox(object.x, object.y, object.w, object.h, height, object.fill, object.stroke);
    root.position.y = baseY + height / 2;
  } else if (object.kind === 'ellipse') {
    const height = object.layer === 'background' ? 11 : 24;
    root = raisedEllipse(object.x, object.y, object.w, object.h, height, object.fill, object.stroke);
    root.position.y = baseY + height / 2;
  } else if (object.kind === 'line') {
    root = pipeBetween(object.x1, object.y1, object.x2, object.y2, object.width, object.stroke);
    root.position.y = baseY + (object.layer === 'symbols' ? 22 : 5);
  } else if (object.kind === 'freehand') {
    const points = object.points.map(([x, y]) => new THREE.Vector3(object.x + x, 0, object.y + y));
    root = tubeRoute(points, object.width, object.stroke);
    root.position.y = baseY + 17;
  } else if (object.kind === 'dimension') {
    root = dimensionObject(object);
    root.position.y = baseY + 9;
  } else if (object.kind === 'text') {
    root = new THREE.Group();
    const label = textSprite(object.text, object.color, object.bold, Math.max(12, object.size));
    label.position.set(object.x, 0, object.y);
    label.userData.isPlanLabel = true;
    root.add(label);
    root.position.y = baseY + 13;
  } else if (object.kind === 'img' || object.kind === 'symbol') {
    const source = object.kind === 'img' ? object.src : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(object.svg)}`;
    const rotation = THREE.MathUtils.degToRad(-(object.rot ?? 0));
    root = imageSlab(object.x, object.y, object.w, object.h, source, object.kind === 'img' ? object.opacity ?? 1 : 1, rotation);
    root.position.y = baseY + 7;
  }

  if (!root) return null;
  root.name = `${object.kind}:${object.id}`;
  root.userData.sourceId = object.id;
  root.userData.layer = object.layer;
  root.traverse(child => {
    child.userData.sourceId = object.id;
    if (child instanceof THREE.Mesh) {
      child.castShadow = object.layer !== 'annotations';
      child.receiveShadow = true;
    }
  });
  const indexedLift = lift + Math.min(index * 0.45, 15);
  runtime.explodables.push({ object: root, baseY: root.position.y, lift: indexedLift });
  return root;
}

function raisedBox(x: number, z: number, width: number, depth: number, height: number, fill?: string, stroke?: string) {
  const root = new THREE.Group();
  root.position.set(x + width / 2, 0, z + depth / 2);
  const fillStyle = parsedStyle(fill, '#16364a');
  const material = engineeringMaterial(fillStyle.color, Math.max(0.42, fillStyle.opacity));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(Math.abs(width), 0.5), height, Math.max(Math.abs(depth), 0.5)), material);
  root.add(mesh);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 18),
    new THREE.LineBasicMaterial({ color: colorOf(stroke, '#53d9f2'), transparent: true, opacity: 0.82 }),
  );
  edges.renderOrder = 3;
  mesh.add(edges);
  return root;
}

function raisedEllipse(x: number, z: number, width: number, depth: number, height: number, fill?: string, stroke?: string) {
  const root = new THREE.Group();
  root.position.set(x + width / 2, 0, z + depth / 2);
  const fillStyle = parsedStyle(fill, '#17475b');
  const geometry = new THREE.CylinderGeometry(1, 1, height, 48, 1, false);
  geometry.scale(Math.max(Math.abs(width) / 2, 0.5), 1, Math.max(Math.abs(depth) / 2, 0.5));
  const mesh = new THREE.Mesh(geometry, engineeringMaterial(fillStyle.color, Math.max(0.48, fillStyle.opacity)));
  root.add(mesh);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: colorOf(stroke, '#62e9ff'), transparent: true, opacity: 0.82, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.96, 1.01, 64), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = height / 2 + 0.08;
  ring.scale.set(Math.max(Math.abs(width) / 2, 0.5), Math.max(Math.abs(depth) / 2, 0.5), 1);
  root.add(ring);
  return root;
}

function pipeBetween(x1: number, z1: number, x2: number, z2: number, width: number, stroke: string) {
  const root = new THREE.Group();
  const start = new THREE.Vector3(x1, 0, z1);
  const end = new THREE.Vector3(x2, 0, z2);
  const direction = end.clone().sub(start);
  const length = Math.max(direction.length(), 0.001);
  const radius = Math.max(1.4, width * 0.72);
  root.position.copy(start.clone().add(end).multiplyScalar(0.5));
  const material = routeMaterial(stroke);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 18, 1, false), material);
  pipe.quaternion.setFromUnitVectors(UP, direction.normalize());
  root.add(pipe);
  const couplingGeometry = new THREE.SphereGeometry(radius * 1.16, 16, 12);
  const left = new THREE.Mesh(couplingGeometry, material.clone());
  const right = new THREE.Mesh(couplingGeometry.clone(), material.clone());
  left.position.copy(start.clone().sub(root.position));
  right.position.copy(end.clone().sub(root.position));
  root.add(left, right);
  return root;
}

function tubeRoute(points: THREE.Vector3[], width: number, stroke: string) {
  const root = new THREE.Group();
  if (points.length < 2) return root;
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const geometry = new THREE.TubeGeometry(curve, Math.max(12, points.length * 5), Math.max(1.2, width * 0.65), 12, false);
  root.add(new THREE.Mesh(geometry, routeMaterial(stroke)));
  return root;
}

function dimensionObject(object: Extract<SceneObject, { kind: 'dimension' }>) {
  const root = pipeBetween(object.x1, object.y1, object.x2, object.y2, 1, '#71e8ff');
  const length = Math.hypot(object.x2 - object.x1, object.y2 - object.y1);
  const label = textSprite(`${length >= 100 ? length.toFixed(0) : length.toFixed(1)} ${object.unit}`, '#c7f8ff', true, 11);
  label.position.set((object.x1 + object.x2) / 2 - root.position.x, 8, (object.y1 + object.y2) / 2 - root.position.z);
  label.userData.isPlanLabel = true;
  root.add(label);
  return root;
}

function imageSlab(x: number, z: number, width: number, depth: number, source: string, opacity: number, rotation: number) {
  const root = new THREE.Group();
  root.position.set(x + width / 2, 0, z + depth / 2);
  root.rotation.y = rotation;
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(width, 1), 8, Math.max(depth, 1)),
    engineeringMaterial(new THREE.Color('#102b3b'), 0.92),
  );
  root.add(slab);
  const imageMaterial = new THREE.MeshStandardMaterial({
    color: '#d7edf4',
    roughness: 0.74,
    metalness: 0,
    transparent: opacity < 1,
    opacity: THREE.MathUtils.clamp(opacity, 0.08, 1),
    side: THREE.DoubleSide,
  });
  imageMaterial.userData.baseEmissiveIntensity = 0;
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(width, 1), Math.max(depth, 1)), imageMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 4.12;
  surface.renderOrder = 4;
  root.add(surface);
  const texture = new THREE.TextureLoader().load(
    source,
    loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 4;
      imageMaterial.map = loaded;
      imageMaterial.color.set('#ffffff');
      imageMaterial.needsUpdate = true;
    },
    undefined,
    () => {
      imageMaterial.color.set('#17384a');
      imageMaterial.emissive.set('#0a5369');
      imageMaterial.emissiveIntensity = 0.25;
    },
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  imageMaterial.map = texture;
  imageMaterial.needsUpdate = true;
  return root;
}

function textSprite(text: string, color: string, bold = false, fontSize = 13) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  const font = `${bold ? 700 : 600} ${Math.max(11, fontSize) * scale}px Inter, Arial, sans-serif`;
  context.font = font;
  const width = Math.ceil(context.measureText(text).width + 24 * scale);
  const height = Math.ceil((fontSize + 16) * scale);
  // WebGL2 accepts non-power-of-two textures; exact dimensions keep labels
  // crisp and prevent transparent padding from shifting their anchor.
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(4, 13, 22, .82)';
  roundedRect(context, 1, 1, width - 2, height - 2, 5 * scale);
  context.fill();
  context.strokeStyle = 'rgba(91, 224, 255, .32)';
  context.lineWidth = Math.max(1, scale);
  context.stroke();
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.fillText(text, 12 * scale, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const displayHeight = Math.max(18, fontSize * 1.9);
  sprite.scale.set(displayHeight * (width / height), displayHeight, 1);
  sprite.center.set(0, 0.5);
  return sprite;
}

function engineeringMaterial(color: THREE.Color, opacity: number) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.52,
    metalness: 0.34,
    clearcoat: 0.34,
    clearcoatRoughness: 0.42,
    transparent: opacity < 0.99,
    opacity,
  });
  material.emissive.copy(color).multiplyScalar(0.12);
  material.emissiveIntensity = 0.22;
  material.userData.baseEmissiveIntensity = material.emissiveIntensity;
  return material;
}

function routeMaterial(color: string) {
  const base = colorOf(color, '#52ddff');
  const material = new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: 0.3,
    metalness: 0.52,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  });
  material.emissive.copy(base).multiplyScalar(0.72);
  material.emissiveIntensity = 0.72;
  material.userData.baseEmissiveIntensity = material.emissiveIntensity;
  return material;
}

function parsedStyle(value: string | undefined, fallback: string) {
  if (!value) return { color: colorOf(fallback), opacity: 1 };
  const rgba = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
  if (rgba) {
    return {
      color: new THREE.Color(Number(rgba[1]) / 255, Number(rgba[2]) / 255, Number(rgba[3]) / 255),
      opacity: rgba[4] === undefined ? 1 : THREE.MathUtils.clamp(Number(rgba[4]), 0, 1),
    };
  }
  return { color: colorOf(value, fallback), opacity: 1 };
}

function colorOf(value?: string, fallback = '#4adcf8') {
  const safe = value && !value.startsWith('rgba') ? value : fallback;
  try {
    return new THREE.Color(safe);
  } catch {
    return new THREE.Color(fallback);
  }
}

function layerOrder(layer: SceneObject['layer']) {
  return layer === 'background' ? 0 : layer === 'symbols' ? 1 : 2;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function disposeObject(root: THREE.Object3D) {
  root.traverse(child => {
    const meshLike = child as THREE.Mesh;
    // THREE.Sprite instances share one module-level geometry, so disposing it
    // while rebuilding one model would invalidate every remaining label.
    if (!(child instanceof THREE.Sprite) && 'geometry' in meshLike && meshLike.geometry instanceof THREE.BufferGeometry) meshLike.geometry.dispose();
    const materialOrMaterials = 'material' in meshLike ? meshLike.material : undefined;
    const materials = Array.isArray(materialOrMaterials) ? materialOrMaterials : materialOrMaterials ? [materialOrMaterials] : [];
    materials.forEach(material => {
      if (!(material instanceof THREE.Material)) return;
      Object.values(material).forEach(value => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

export default DigitalTwin3D;
