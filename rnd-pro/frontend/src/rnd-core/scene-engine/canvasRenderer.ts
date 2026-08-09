import type { ImageObj, Scene, SceneObject, SymbolObj } from '../data-model';
import { objectBounds, objectRotation, resizeHandles } from './geometry';

export interface RenderOptions {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  selectedId?: string | null;
  showGrid?: boolean;
}

const imageCache = new Map<string, HTMLImageElement>();

export function paint(canvas: HTMLCanvasElement, scene: Scene, opts: RenderOptions = {}): void {
  const dpr = window.devicePixelRatio || 1;
  const scale = opts.scale ?? 1;
  const offsetX = opts.offsetX ?? 0;
  const offsetY = opts.offsetY ?? 0;
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);

  paintBackground(ctx, scene, opts.showGrid !== false);
  paintObjects(ctx, scene, 'background');
  paintObjects(ctx, scene, 'symbols');
  paintObjects(ctx, scene, 'annotations');

  const selected = scene.objects.find(object => object.id === opts.selectedId);
  if (selected) paintSelection(ctx, selected, scale);
}

function paintBackground(ctx: CanvasRenderingContext2D, scene: Scene, showGrid: boolean): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, scene.h);
  gradient.addColorStop(0, '#0d1724');
  gradient.addColorStop(1, '#08111c');
  ctx.fillStyle = scene.bg.type === 'color' ? scene.bg.color : gradient;
  ctx.fillRect(0, 0, scene.w, scene.h);

  if (showGrid && scene.bg.type === 'grid') {
    const step = scene.bg.grid || 40;
    ctx.lineWidth = 1;
    for (let x = 0; x <= scene.w; x += step) {
      ctx.strokeStyle = x % (step * 5) === 0 ? 'rgba(86, 198, 255, .17)' : 'rgba(126, 163, 194, .07)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, scene.h);
      ctx.stroke();
    }
    for (let y = 0; y <= scene.h; y += step) {
      ctx.strokeStyle = y % (step * 5) === 0 ? 'rgba(86, 198, 255, .17)' : 'rgba(126, 163, 194, .07)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(scene.w, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(75, 213, 255, .32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, scene.w - 1, scene.h - 1);
}

function paintObjects(ctx: CanvasRenderingContext2D, scene: Scene, layer: 'background' | 'symbols' | 'annotations'): void {
  scene.objects.filter(object => object.layer === layer).forEach(object => paintObject(ctx, object));
}

function paintObject(ctx: CanvasRenderingContext2D, object: SceneObject): void {
  ctx.save();
  const bounds = objectBounds(object);
  const rotation = objectRotation(object);
  if (rotation) {
    ctx.translate(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-(bounds.x + bounds.w / 2), -(bounds.y + bounds.h / 2));
  }

  switch (object.kind) {
    case 'rect':
      if (object.fill) {
        ctx.fillStyle = object.fill;
        ctx.fillRect(object.x, object.y, object.w, object.h);
      }
      if (object.stroke) {
        ctx.strokeStyle = object.stroke;
        ctx.lineWidth = object.width || 1;
        ctx.strokeRect(object.x, object.y, object.w, object.h);
      }
      break;
    case 'line':
      ctx.strokeStyle = object.stroke;
      ctx.lineWidth = object.width;
      ctx.beginPath();
      ctx.moveTo(object.x1, object.y1);
      ctx.lineTo(object.x2, object.y2);
      ctx.stroke();
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(object.x + object.w / 2, object.y + object.h / 2, Math.abs(object.w / 2), Math.abs(object.h / 2), 0, 0, Math.PI * 2);
      if (object.fill) {
        ctx.fillStyle = object.fill;
        ctx.fill();
      }
      if (object.stroke) {
        ctx.strokeStyle = object.stroke;
        ctx.lineWidth = object.width || 1;
        ctx.stroke();
      }
      break;
    case 'text':
      ctx.fillStyle = object.color;
      ctx.font = `${object.bold ? '700 ' : '500 '}${object.size}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText(object.text, object.x, object.y);
      break;
    case 'symbol':
      paintSvg(ctx, object);
      break;
    case 'img':
      paintImage(ctx, object);
      break;
    case 'freehand':
      if (object.points.length > 1) {
        ctx.strokeStyle = object.stroke;
        ctx.lineWidth = object.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(object.x + object.points[0][0], object.y + object.points[0][1]);
        object.points.slice(1).forEach(([x, y]) => ctx.lineTo(object.x + x, object.y + y));
        ctx.stroke();
      }
      break;
    case 'dimension':
      paintDimension(ctx, object);
      break;
  }
  ctx.restore();
}

function getImage(src: string, canvas: HTMLCanvasElement) {
  let image = imageCache.get(src);
  if (!image) {
    image = new Image();
    image.decoding = 'async';
    image.onload = () => canvas.dispatchEvent(new Event('hnx-redraw'));
    image.src = src;
    imageCache.set(src, image);
  }
  return image;
}

function paintSvg(ctx: CanvasRenderingContext2D, object: SymbolObj): void {
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(object.svg);
  const image = getImage(src, ctx.canvas);
  if (image.complete && image.naturalWidth > 0) ctx.drawImage(image, object.x, object.y, object.w, object.h);
}

function paintImage(ctx: CanvasRenderingContext2D, object: ImageObj): void {
  const image = getImage(object.src, ctx.canvas);
  if (!image.complete || image.naturalWidth === 0) {
    ctx.fillStyle = 'rgba(16, 34, 50, .92)';
    ctx.fillRect(object.x, object.y, object.w, object.h);
    ctx.strokeStyle = 'rgba(87, 215, 255, .5)';
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(object.x, object.y, object.w, object.h);
    ctx.setLineDash([]);
    return;
  }
  ctx.globalAlpha = object.opacity ?? 1;
  if (object.mirrorX || object.mirrorY) {
    ctx.translate(object.x + object.w / 2, object.y + object.h / 2);
    ctx.scale(object.mirrorX ? -1 : 1, object.mirrorY ? -1 : 1);
    ctx.translate(-(object.x + object.w / 2), -(object.y + object.h / 2));
  }
  if (object.crop) {
    const crop = object.crop;
    ctx.drawImage(
      image,
      crop.x * image.naturalWidth,
      crop.y * image.naturalHeight,
      crop.w * image.naturalWidth,
      crop.h * image.naturalHeight,
      object.x,
      object.y,
      object.w,
      object.h,
    );
  } else {
    ctx.drawImage(image, object.x, object.y, object.w, object.h);
  }
}

function paintDimension(ctx: CanvasRenderingContext2D, object: Extract<SceneObject, { kind: 'dimension' }>): void {
  const dx = object.x2 - object.x1;
  const dy = object.y2 - object.y1;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const label = `${length.toFixed(length >= 100 ? 0 : 1)} ${object.unit}`;
  ctx.strokeStyle = '#6de7ff';
  ctx.fillStyle = '#b7f5ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(object.x1, object.y1);
  ctx.lineTo(object.x2, object.y2);
  ctx.stroke();
  ctx.save();
  ctx.translate((object.x1 + object.x2) / 2, (object.y1 + object.y2) / 2);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(6, 15, 25, .9)';
  ctx.fillRect(-ctx.measureText(label).width / 2 - 6, -18, ctx.measureText(label).width + 12, 18);
  ctx.fillStyle = '#b7f5ff';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -5);
  ctx.restore();
}

function paintSelection(ctx: CanvasRenderingContext2D, object: SceneObject, scale: number): void {
  const bounds = objectBounds(object);
  const rotation = objectRotation(object);
  const handles = resizeHandles(bounds, rotation, 24 / scale);
  const resizable = object.kind === 'rect' || object.kind === 'ellipse' || object.kind === 'symbol' || object.kind === 'img';
  const rotatable = object.kind === 'symbol' || object.kind === 'img';
  const handleSize = 8 / scale;

  ctx.save();
  if (rotation) {
    ctx.translate(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-(bounds.x + bounds.w / 2), -(bounds.y + bounds.h / 2));
  }
  ctx.strokeStyle = '#59e6ff';
  ctx.lineWidth = 1.5 / scale;
  ctx.setLineDash([7 / scale, 4 / scale]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.setLineDash([]);
  ctx.restore();

  ctx.strokeStyle = '#06111c';
  ctx.lineWidth = 1 / scale;
  Object.entries(handles).filter(([key]) => resizable && (key !== 'rotate' || rotatable)).forEach(([key, point]) => {
    ctx.beginPath();
    ctx.fillStyle = key === 'rotate' ? '#f5b942' : '#70efff';
    ctx.arc(point.x, point.y, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  if (rotatable && handles.rotate) {
    const top = resizeHandles(bounds, rotation, 0).n;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(handles.rotate.x, handles.rotate.y);
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
  }
  ctx.restore();
}
