import { describe, expect, it } from 'vitest';
import type { ImageObj } from '../rnd-core/data-model';
import { hitObject, objectBounds, resizeHandles } from '../rnd-core/scene-engine/geometry';

const image: ImageObj = {
  id: 'plan-image',
  kind: 'img',
  layer: 'background',
  x: 100,
  y: 80,
  w: 400,
  h: 240,
  src: 'data:image/png;base64,review-fixture',
  name: 'plan.png',
  rot: 0,
  aspectLocked: true,
};

describe('professional scene geometry', () => {
  it('returns eight resize handles plus rotation for image objects', () => {
    const handles = resizeHandles(objectBounds(image));
    expect(Object.keys(handles).sort()).toEqual(['e', 'n', 'ne', 'nw', 'rotate', 's', 'se', 'sw', 'w']);
    expect(handles.se).toEqual({ x: 500, y: 320 });
  });

  it('hit tests the visible image bounds', () => {
    expect(hitObject(image, 300, 200)).toBe(true);
    expect(hitObject(image, 700, 500)).toBe(false);
  });

  it('hit tests a rotated image through inverse rotation', () => {
    const rotated = { ...image, rot: 90 };
    expect(hitObject(rotated, 300, 200)).toBe(true);
    expect(hitObject(rotated, 430, 200)).toBe(false);
  });
});
