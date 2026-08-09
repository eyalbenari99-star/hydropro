/* AI Apply pipeline.
 * Online path goes through the backend's /api/rnd/parse-cabinet or /ai-apply.
 * Offline path tries deterministic patterns (fertigation 'N drums to M pools').
 */
import { api } from './api-client';
import type { CabinetSpecV2, Item } from './data-model';

export async function applyOnline(text: string, current: Item | null): Promise<CabinetSpecV2 | null> {
  // Heuristic: if the text contains cabinet markers, route to the deterministic cabinet parser
  if (/\|.*Breaker.*\|/i.test(text) || /NXB-\d|NXC-\d|JR36|NM1-\d/.test(text)) {
    return await api.parseCabinet(text, current?.title);
  }
  // Else: TODO(14.6) call /api/rnd/ai-apply for general AI handling
  return null;
}

export function applyOffline(text: string): { ok: false; reason: string } | { ok: true; spec: CabinetSpecV2 } {
  // TODO(8.10): port the legacy fertigation heuristics ('4 drums to 2 pools' etc.)
  return { ok: false, reason: 'Offline AI Apply not yet ported' };
}
