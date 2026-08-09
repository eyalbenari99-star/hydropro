import type { Scene, SceneObject } from '../data-model';
import { hitObject, inverseRotatePoint, objectBounds, objectRotation, resizeHandles, type Bounds, type ResizeHandle } from './geometry';

export interface InteractionState {
  selectedId: string | null;
  hoveringId: string | null;
}

export interface InteractionOptions {
  getView?: () => { scale: number; offsetX: number; offsetY: number };
  getSelectedId?: () => string | null;
  onSelectionChange?: (id: string | null) => void;
  onHistoryCommit?: (before: Scene, after: Scene) => void;
  snap?: number;
}

type Operation =
  | { kind: 'move'; id: string; startX: number; startY: number; before: Scene }
  | { kind: 'resize'; id: string; handle: ResizeHandle; startX: number; startY: number; before: Scene; bounds: Bounds; rotation: number }
  | { kind: 'rotate'; id: string; startAngle: number; startRotation: number; before: Scene; bounds: Bounds };

type ResizableObject = Extract<SceneObject, { kind: 'rect' | 'ellipse' | 'symbol' | 'img' }>;

export function attach(
  canvas: HTMLCanvasElement,
  sceneInput: Scene | (() => Scene),
  onMutate: (next: Scene) => void,
  options: InteractionOptions = {},
): () => void {
  const getScene = typeof sceneInput === 'function' ? sceneInput : () => sceneInput;
  let selectedId = options.getSelectedId?.() ?? null;
  let operation: Operation | null = null;
  let latestScene = getScene();

  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Professional 2D engineering canvas');

  const view = () => options.getView?.() ?? { scale: 1, offsetX: 0, offsetY: 0 };
  const point = (event: PointerEvent | WheelEvent) => {
    const rect = canvas.getBoundingClientRect();
    const current = view();
    return {
      x: (event.clientX - rect.left - current.offsetX) / current.scale,
      y: (event.clientY - rect.top - current.offsetY) / current.scale,
    };
  };

  const choose = (id: string | null) => {
    selectedId = id;
    options.onSelectionChange?.(id);
    canvas.dispatchEvent(new Event('hnx-redraw'));
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    canvas.focus();
    latestScene = getScene();
    const p = point(event);
    const selected = latestScene.objects.find(object => object.id === selectedId);
    if (selected && !isLocked(selected)) {
      const handle = handleAt(selected, p.x, p.y, 12 / view().scale);
      if (handle === 'rotate') {
        const bounds = objectBounds(selected);
        operation = {
          kind: 'rotate',
          id: selected.id,
          startAngle: Math.atan2(p.y - (bounds.y + bounds.h / 2), p.x - (bounds.x + bounds.w / 2)),
          startRotation: objectRotation(selected),
          before: cloneScene(latestScene),
          bounds,
        };
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (handle && supportsResize(selected)) {
        operation = {
          kind: 'resize',
          id: selected.id,
          handle,
          startX: p.x,
          startY: p.y,
          before: cloneScene(latestScene),
          bounds: objectBounds(selected),
          rotation: objectRotation(selected),
        };
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
    }

    const hit = [...latestScene.objects].reverse().find(object => !isLocked(object) && hitObject(object, p.x, p.y, 7 / view().scale));
    choose(hit?.id ?? null);
    if (hit) {
      operation = { kind: 'move', id: hit.id, startX: p.x, startY: p.y, before: cloneScene(latestScene) };
      canvas.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    const p = point(event);
    if (!operation) {
      const selected = getScene().objects.find(object => object.id === selectedId);
      const handle = selected ? handleAt(selected, p.x, p.y, 12 / view().scale) : null;
      canvas.style.cursor = handle ? cursorForHandle(handle) : ([...getScene().objects].reverse().some(object => hitObject(object, p.x, p.y, 6 / view().scale)) ? 'move' : 'crosshair');
      return;
    }

    const next = cloneScene(operation.before);
    const object = next.objects.find(candidate => candidate.id === operation?.id);
    if (!object) return;

    if (operation.kind === 'move') {
      const dx = p.x - operation.startX;
      const dy = p.y - operation.startY;
      moveObject(object, dx, dy, options.snap && !event.altKey ? options.snap : 0);
      canvas.style.cursor = 'grabbing';
    } else if (operation.kind === 'resize') {
      resizeObject(object, operation, p.x, p.y, event.shiftKey, options.snap && !event.altKey ? options.snap : 0);
      canvas.style.cursor = cursorForHandle(operation.handle);
    } else {
      const cx = operation.bounds.x + operation.bounds.w / 2;
      const cy = operation.bounds.y + operation.bounds.h / 2;
      const currentAngle = Math.atan2(p.y - cy, p.x - cx);
      const degrees = operation.startRotation + (currentAngle - operation.startAngle) * 180 / Math.PI;
      setRotation(object, event.shiftKey ? Math.round(degrees / 15) * 15 : Math.round(degrees * 10) / 10);
      canvas.style.cursor = 'grabbing';
    }
    latestScene = next;
    onMutate(next);
  };

  const finish = (event: PointerEvent) => {
    if (!operation) return;
    const before = operation.before;
    const after = latestScene;
    operation = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = 'default';
    if (JSON.stringify(before) !== JSON.stringify(after)) options.onHistoryCommit?.(before, after);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!selectedId) return;
    const current = getScene();
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const before = cloneScene(current);
      const next = { ...cloneScene(current), objects: current.objects.filter(object => object.id !== selectedId) };
      onMutate(next);
      options.onHistoryCommit?.(before, next);
      choose(null);
      event.preventDefault();
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const before = cloneScene(current);
      const next = cloneScene(current);
      const object = next.objects.find(candidate => candidate.id === selectedId);
      if (!object || isLocked(object)) return;
      const distance = event.shiftKey ? 10 : 1;
      moveObject(object, event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0, event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0, 0);
      onMutate(next);
      options.onHistoryCommit?.(before, next);
      event.preventDefault();
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('keydown', onKeyDown);
  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', finish);
    canvas.removeEventListener('pointercancel', finish);
    canvas.removeEventListener('keydown', onKeyDown);
  };
}

function handleAt(object: SceneObject, x: number, y: number, radius: number): ResizeHandle | null {
  if (!supportsResize(object)) return null;
  const handles = resizeHandles(objectBounds(object), objectRotation(object), 24);
  return (Object.entries(handles).find(([, point]) => Math.hypot(x - point.x, y - point.y) <= radius)?.[0] as ResizeHandle | undefined) ?? null;
}

function supportsResize(object: SceneObject): object is ResizableObject {
  return object.kind === 'rect' || object.kind === 'ellipse' || object.kind === 'symbol' || object.kind === 'img';
}

function isLocked(object: SceneObject): boolean {
  return object.kind === 'img' && Boolean(object.locked);
}

function moveObject(object: SceneObject, dx: number, dy: number, snap: number) {
  const round = (value: number) => snap ? Math.round(value / snap) * snap : value;
  if (object.kind === 'line' || object.kind === 'dimension') {
    object.x1 = round(object.x1 + dx);
    object.y1 = round(object.y1 + dy);
    object.x2 = round(object.x2 + dx);
    object.y2 = round(object.y2 + dy);
  } else {
    object.x = round(object.x + dx);
    object.y = round(object.y + dy);
  }
}

function resizeObject(object: SceneObject, operation: Extract<Operation, { kind: 'resize' }>, x: number, y: number, shiftKey: boolean, snap: number) {
  if (!supportsResize(object)) return;
  const start = operation.bounds;
  const startPoint = inverseRotatePoint(operation.startX, operation.startY, start, operation.rotation);
  const currentPoint = inverseRotatePoint(x, y, start, operation.rotation);
  const dx = currentPoint.x - startPoint.x;
  const dy = currentPoint.y - startPoint.y;
  let left = start.x;
  let top = start.y;
  let right = start.x + start.w;
  let bottom = start.y + start.h;
  if (operation.handle.includes('w')) left += dx;
  if (operation.handle.includes('e')) right += dx;
  if (operation.handle.includes('n')) top += dy;
  if (operation.handle.includes('s')) bottom += dy;

  const aspectLocked = shiftKey || (object.kind === 'img' && object.aspectLocked);
  if (aspectLocked) {
    const ratio = Math.max(0.01, start.w / start.h);
    const width = Math.max(20, right - left);
    const height = Math.max(20, bottom - top);
    if (Math.abs(dx) >= Math.abs(dy)) {
      const adjusted = width / ratio;
      if (operation.handle.includes('n')) top = bottom - adjusted;
      else bottom = top + adjusted;
    } else {
      const adjusted = height * ratio;
      if (operation.handle.includes('w')) left = right - adjusted;
      else right = left + adjusted;
    }
  }

  const round = (value: number) => snap ? Math.round(value / snap) * snap : value;
  object.x = round(Math.min(left, right - 20));
  object.y = round(Math.min(top, bottom - 20));
  object.w = round(Math.max(20, right - left));
  object.h = round(Math.max(20, bottom - top));
}

function setRotation(object: SceneObject, rotation: number) {
  if (object.kind === 'img' || object.kind === 'symbol') object.rot = ((rotation % 360) + 360) % 360;
}

function cursorForHandle(handle: ResizeHandle): string {
  const cursors: Record<ResizeHandle, string> = {
    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
    se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize', rotate: 'grab',
  };
  return cursors[handle];
}

function cloneScene(scene: Scene): Scene {
  return typeof structuredClone === 'function' ? structuredClone(scene) : JSON.parse(JSON.stringify(scene)) as Scene;
}
