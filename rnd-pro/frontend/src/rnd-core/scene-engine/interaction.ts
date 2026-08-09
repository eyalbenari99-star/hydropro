import type { Scene, SceneObject } from '../data-model';
import { hitObject, inverseRotatePoint, objectBounds, objectRotation, resizeHandles, type Bounds, type ResizeHandle } from './geometry';

export interface InteractionState {
  selectedId: string | null;
  hoveringId: string | null;
}

export interface InteractionOptions {
  getView?: () => { scale: number; offsetX: number; offsetY: number };
  getTool?: () => CanvasTool;
  getSelectedId?: () => string | null;
  onSelectionChange?: (id: string | null) => void;
  onHistoryCommit?: (before: Scene, after: Scene) => void;
  onViewChange?: (view: { scale: number; offsetX: number; offsetY: number }) => void;
  onToolComplete?: () => void;
  readOnly?: boolean;
  snap?: number;
}

export type CanvasTool = 'select' | 'pan' | 'rect' | 'line' | 'dimension' | 'text';

type Operation =
  | { kind: 'move'; id: string; startX: number; startY: number; before: Scene }
  | { kind: 'resize'; id: string; handle: ResizeHandle; startX: number; startY: number; before: Scene; bounds: Bounds; rotation: number }
  | { kind: 'rotate'; id: string; startAngle: number; startRotation: number; before: Scene; bounds: Bounds }
  | { kind: 'pan'; startClientX: number; startClientY: number; startView: { scale: number; offsetX: number; offsetY: number } }
  | { kind: 'draw'; id: string; tool: 'rect' | 'line' | 'dimension'; startX: number; startY: number; before: Scene };

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
    const activeTool = options.getTool?.() ?? 'select';

    if (activeTool === 'pan') {
      operation = {
        kind: 'pan',
        startClientX: event.clientX,
        startClientY: event.clientY,
        startView: { ...view() },
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
      event.preventDefault();
      return;
    }

    if (options.readOnly) {
      const hit = [...latestScene.objects].reverse().find(object => hitObject(object, p.x, p.y, 7 / view().scale));
      choose(hit?.id ?? null);
      event.preventDefault();
      return;
    }

    if (activeTool === 'rect' || activeTool === 'line' || activeTool === 'dimension') {
      const before = cloneScene(latestScene);
      const id = `${activeTool}-${Date.now()}`;
      const object: SceneObject = activeTool === 'rect'
        ? { id, kind: 'rect', layer: 'symbols', x: p.x, y: p.y, w: 1, h: 1, fill: 'rgba(65, 205, 235, .08)', stroke: '#5be4ff', width: 2 }
        : activeTool === 'line'
          ? { id, kind: 'line', layer: 'symbols', x1: p.x, y1: p.y, x2: p.x, y2: p.y, stroke: '#5be4ff', width: 3 }
          : { id, kind: 'dimension', layer: 'annotations', x1: p.x, y1: p.y, x2: p.x, y2: p.y, unit: 'mm' };
      latestScene = { ...cloneScene(before), objects: [...before.objects, object] };
      onMutate(latestScene);
      choose(id);
      operation = { kind: 'draw', id, tool: activeTool, startX: p.x, startY: p.y, before };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'crosshair';
      event.preventDefault();
      return;
    }

    if (activeTool === 'text') {
      const before = cloneScene(latestScene);
      const id = `text-${Date.now()}`;
      const object: SceneObject = { id, kind: 'text', layer: 'annotations', x: p.x, y: p.y, text: 'DOUBLE-CLICK PROPERTY TO EDIT', size: 14, color: '#dff8ff', bold: true };
      latestScene = { ...cloneScene(before), objects: [...before.objects, object] };
      onMutate(latestScene);
      options.onHistoryCommit?.(before, latestScene);
      choose(id);
      options.onToolComplete?.();
      event.preventDefault();
      return;
    }

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
      const activeTool = options.getTool?.() ?? 'select';
      if (activeTool === 'pan') {
        canvas.style.cursor = 'grab';
        return;
      }
      if (activeTool !== 'select') {
        canvas.style.cursor = 'crosshair';
        return;
      }
      const selected = getScene().objects.find(object => object.id === selectedId);
      const handle = selected ? handleAt(selected, p.x, p.y, 12 / view().scale) : null;
      canvas.style.cursor = handle ? cursorForHandle(handle) : ([...getScene().objects].reverse().some(object => hitObject(object, p.x, p.y, 6 / view().scale)) ? 'move' : 'crosshair');
      return;
    }

    if (operation.kind === 'pan') {
      options.onViewChange?.({
        ...operation.startView,
        offsetX: operation.startView.offsetX + event.clientX - operation.startClientX,
        offsetY: operation.startView.offsetY + event.clientY - operation.startClientY,
      });
      canvas.style.cursor = 'grabbing';
      return;
    }

    const currentOperation = operation;
    const next = cloneScene(currentOperation.before);
    if (currentOperation.kind === 'draw') {
      const object = latestScene.objects.find(candidate => candidate.id === currentOperation.id);
      const base = cloneScene(currentOperation.before);
      if (!object) return;
      const snapValue = options.snap && !event.altKey ? options.snap : 0;
      const round = (value: number) => snapValue ? Math.round(value / snapValue) * snapValue : value;
      let drawn: SceneObject;
      if (object.kind === 'rect') {
        drawn = {
          ...object,
          x: round(Math.min(currentOperation.startX, p.x)),
          y: round(Math.min(currentOperation.startY, p.y)),
          w: Math.max(1, round(Math.abs(p.x - currentOperation.startX))),
          h: Math.max(1, round(Math.abs(p.y - currentOperation.startY))),
        };
      } else if (object.kind === 'line' || object.kind === 'dimension') {
        drawn = { ...object, x2: round(p.x), y2: round(p.y) };
      } else return;
      latestScene = { ...base, objects: [...base.objects, drawn] };
      onMutate(latestScene);
      canvas.style.cursor = 'crosshair';
      return;
    }
    const object = next.objects.find(candidate => candidate.id === currentOperation.id);
    if (!object) return;

    if (currentOperation.kind === 'move') {
      const dx = p.x - currentOperation.startX;
      const dy = p.y - currentOperation.startY;
      moveObject(object, dx, dy, options.snap && !event.altKey ? options.snap : 0);
      canvas.style.cursor = 'grabbing';
    } else if (currentOperation.kind === 'resize') {
      resizeObject(object, currentOperation, p.x, p.y, event.shiftKey, options.snap && !event.altKey ? options.snap : 0);
      canvas.style.cursor = cursorForHandle(currentOperation.handle);
    } else {
      const cx = currentOperation.bounds.x + currentOperation.bounds.w / 2;
      const cy = currentOperation.bounds.y + currentOperation.bounds.h / 2;
      const currentAngle = Math.atan2(p.y - cy, p.x - cx);
      const degrees = currentOperation.startRotation + (currentAngle - currentOperation.startAngle) * 180 / Math.PI;
      setRotation(object, event.shiftKey ? Math.round(degrees / 15) * 15 : Math.round(degrees * 10) / 10);
      canvas.style.cursor = 'grabbing';
    }
    latestScene = next;
    onMutate(next);
  };

  const finish = (event: PointerEvent) => {
    if (!operation) return;
    const completed = operation;
    operation = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = 'default';
    if (completed.kind === 'pan') return;
    const before = completed.before;
    const after = latestScene;
    if (JSON.stringify(before) !== JSON.stringify(after)) options.onHistoryCommit?.(before, after);
    if (completed.kind === 'draw') options.onToolComplete?.();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (options.readOnly) return;
    if (!selectedId) return;
    const current = getScene();
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selected = current.objects.find(object => object.id === selectedId);
      if (!selected || isLocked(selected)) return;
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
  const handle = Object.entries(handles).find(([, point]) => Math.hypot(x - point.x, y - point.y) <= radius)?.[0] as ResizeHandle | undefined;
  if (handle === 'rotate' && object.kind !== 'img' && object.kind !== 'symbol') return null;
  return handle ?? null;
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
