/* Dispatcher: routes a SpecAny to the right renderer.
 * v2 cabinet uses our richest renderer. v1 cabinet kept for legacy items.
 */
import type { SpecAny, Scene } from '../data-model';
import { renderCabinetV2 } from './renderCabinetV2';
import { normalizeCabSpec } from './normalizeCabSpec';

export function renderSpec(spec: SpecAny): Scene {
  if (!spec) return blankScene();
  if ('specType' in spec && spec.specType === 'cabinet' && spec.specVersion === 2) {
    return renderCabinetV2(spec);
  }
  if ('rails' in spec) {
    // v1 cabinet — normalize then render via v2 (always richer output)
    const v2 = normalizeCabSpec(spec);
    if (v2) return renderCabinetV2(v2);
  }
  if ('rooms' in spec) {
    // TODO(14.4): port renderPlan from legacy IIFE
    return blankScene();
  }
  if ('nodes' in spec) {
    // TODO(14.4): port plumbing renderSpec from legacy IIFE
    return blankScene();
  }
  return blankScene();
}

export function blankScene(): Scene {
  return { w: 1800, h: 1100, bg: { type: 'grid', grid: 40 }, objects: [] };
}
