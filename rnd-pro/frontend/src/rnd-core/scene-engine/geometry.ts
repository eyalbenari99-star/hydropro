import type { SceneObject } from '../data-model';

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

export function objectBounds(object: SceneObject): Bounds {
  switch (object.kind) {
    case 'line':
    case 'dimension': {
      const x = Math.min(object.x1, object.x2);
      const y = Math.min(object.y1, object.y2);
      return { x, y, w: Math.max(1, Math.abs(object.x2 - object.x1)), h: Math.max(1, Math.abs(object.y2 - object.y1)) };
    }
    case 'freehand': {
      const xs = object.points.map(([x]) => object.x + x);
      const ys = object.points.map(([, y]) => object.y + y);
      const x = Math.min(...xs, object.x);
      const y = Math.min(...ys, object.y);
      return { x, y, w: Math.max(1, Math.max(...xs, object.x) - x), h: Math.max(1, Math.max(...ys, object.y) - y) };
    }
    case 'text':
      return { x: object.x, y: object.y - object.size, w: Math.max(object.size, object.text.length * object.size * 0.58), h: object.size * 1.25 };
    default:
      return { x: object.x, y: object.y, w: object.w, h: object.h };
  }
}

export function objectRotation(object: SceneObject): number {
  if (object.kind === 'img' || object.kind === 'symbol') return object.rot || 0;
  return 0;
}

export function resizeHandles(bounds: Bounds, rotation = 0, offset = 24): Record<ResizeHandle, { x: number; y: number }> {
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const raw: Record<ResizeHandle, { x: number; y: number }> = {
    nw: { x: bounds.x, y: bounds.y },
    n: { x: cx, y: bounds.y },
    ne: { x: bounds.x + bounds.w, y: bounds.y },
    e: { x: bounds.x + bounds.w, y: cy },
    se: { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
    s: { x: cx, y: bounds.y + bounds.h },
    sw: { x: bounds.x, y: bounds.y + bounds.h },
    w: { x: bounds.x, y: cy },
    rotate: { x: cx, y: bounds.y - offset },
  };
  if (!rotation) return raw;
  const radians = rotation * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return Object.fromEntries(Object.entries(raw).map(([key, point]) => {
    const dx = point.x - cx;
    const dy = point.y - cy;
    return [key, { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }];
  })) as Record<ResizeHandle, { x: number; y: number }>;
}

export function inverseRotatePoint(x: number, y: number, bounds: Bounds, rotation: number) {
  if (!rotation) return { x, y };
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  const radians = -rotation * Math.PI / 180;
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: cy + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}

export function hitObject(object: SceneObject, x: number, y: number, tolerance = 6): boolean {
  const bounds = objectBounds(object);
  const local = inverseRotatePoint(x, y, bounds, objectRotation(object));
  if (object.kind === 'line' || object.kind === 'dimension') {
    return distanceToSegment(local.x, local.y, object.x1, object.y1, object.x2, object.y2) <= tolerance;
  }
  return local.x >= bounds.x - tolerance && local.x <= bounds.x + bounds.w + tolerance
    && local.y >= bounds.y - tolerance && local.y <= bounds.y + bounds.h + tolerance;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
