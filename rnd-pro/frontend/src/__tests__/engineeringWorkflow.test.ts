import { describe, expect, it } from 'vitest';
import type { Scene } from '../rnd-core/data-model';
import { cockpitProjects } from '../rnd-core/review-data';
import { hydraulic } from '../rnd-ui/EngineeringIntelligencePanels';
import { nexiResponse, sceneToDxf, sceneToSvg } from '../rnd-ui/EngineeringStudioV2';

const scene: Scene = {
  w: 1200,
  h: 800,
  bg: { type: 'grid', grid: 20 },
  objects: [
    { id: 'pipe', kind: 'line', layer: 'symbols', x1: 100, y1: 150, x2: 700, y2: 150, stroke: '#38e8d3', width: 4 },
    { id: 'zone', kind: 'rect', layer: 'background', x: 80, y: 90, w: 680, h: 260, stroke: '#40dfea', fill: 'none' },
    { id: 'title', kind: 'text', layer: 'annotations', x: 90, y: 75, text: 'GH7 <MAIN>', size: 18, color: '#ffffff' },
  ],
};

describe('R&D Pro engineering workflow primitives', () => {
  it('calculates a traceable hydraulic result from live inputs', () => {
    const result = hydraulic(10.35, 50, 186, 150, 18, 72);
    expect(result.velocity).toBeGreaterThan(1.4);
    expect(result.velocity).toBeLessThan(1.6);
    expect(result.frictionHead).toBeGreaterThan(5);
    expect(result.totalHead).toBeGreaterThan(18);
    expect(result.powerKw).toBeGreaterThan(0);
  });

  it('routes a supervised DN65 request to a governed preview action', () => {
    const response = nexiResponse('Preview the DN65 hydraulic change', scene, []);
    expect(response.action).toBe('dn65');
    expect(response.text).toContain('nothing is applied until you approve');
    expect(response.audit).toContain('governed change set');
  });

  it('routes warehouse questions to the BOM workbench', () => {
    const response = nexiResponse('Check warehouse stock and procurement shortages', scene, []);
    expect(response.view).toBe('bom');
    expect(response.text).toContain('shortage');
  });

  it('exports editable DXF entities and a controlled SVG title block', () => {
    const dxf = sceneToDxf(scene);
    const svg = sceneToSvg(scene, cockpitProjects[0], 12);
    expect(dxf).toContain('SECTION\n2\nENTITIES');
    expect(dxf.match(/\nLINE\n/g)?.length).toBe(5);
    expect(dxf).toContain('\nTEXT\n');
    expect(svg).toContain('REV 12');
    expect(svg).toContain('GH7 &lt;MAIN&gt;');
    expect(svg).toContain('CONFIDENTIAL ABA PARDES COMPANY ASSET');
  });
});
