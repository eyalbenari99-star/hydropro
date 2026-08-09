import { describe, it, expect } from 'vitest';
import { renderCabinetV2 } from '../rnd-core/spec-engine/renderCabinetV2';
import type { CabinetSpecV2 } from '../rnd-core/data-model';

describe('renderCabinetV2 (14.4)', () => {
  it('produces a Scene with non-zero objects for a populated spec', () => {
    const spec: CabinetSpecV2 = {
      specType: 'cabinet',
      specVersion: 2,
      title: 'Test',
      cabinet: { widthMm: 1000, heightMm: 2000, depthMm: 400 },
      sections: [{
        id: 'S1',
        label: 'Power',
        type: 'power',
        color: '#1f2937',
        rails: [{
          id: 'R1',
          label: 'Feeders',
          railType: 'DIN',
          bus: false,
          items: [{
            id: 'D1', sym: 'MCB 3P', kind: 'breaker', label: 'WL1', ref: '1QF',
            rating: '16A', poles: 3
          }]
        }]
      }]
    };
    const scene = renderCabinetV2(spec);
    expect(scene.objects.length).toBeGreaterThan(5);
    expect(scene.w).toBeGreaterThan(800);
  });

  it('handles empty sections without crashing', () => {
    const spec: CabinetSpecV2 = {
      specType: 'cabinet',
      specVersion: 2,
      title: 'Empty',
      cabinet: { widthMm: 1000, heightMm: 2000, depthMm: 400 },
      sections: []
    };
    const scene = renderCabinetV2(spec);
    expect(scene).toBeDefined();
  });
});
