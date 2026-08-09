/* Normalize a v1 cabinet spec (flat rails) into v2 (sections + rails + items).
 * Port of the working logic from the rolled-back v4.73 IIFE patch.
 */
import type { CabinetSpecV1, CabinetSpecV2, Section, Rail, DeviceV2, DeviceKind } from '../data-model';

const ratingRe = /(\d+(?:\.\d+)?)\s*A/;
const polesRe = /(\d)P(?:\+N)?/i;

function kindOf(sym: string): DeviceKind {
  const s = sym.toLowerCase();
  if (/mccb/.test(s)) return 'mccb';
  if (/rcbo|nxble/.test(s)) return 'rcbo';
  if (/mcb|breaker|nxb/.test(s)) return 'breaker';
  if (/contactor|nxc/.test(s)) return 'contactor';
  if (/overload|jr/.test(s)) return 'overload';
  if (/vfd|inverter|drive/.test(s)) return 'vfd';
  if (/plc/.test(s)) return 'plc';
  if (/smps|psu/.test(s)) return 'smps';
  if (/transformer|tx|lmz/.test(s)) return 'ct';
  if (/terminal/.test(s)) return 'terminal';
  if (/busbar/.test(s)) return 'busbar';
  if (/relay/.test(s)) return 'relay';
  if (/dt862|wh|meter/.test(s)) return 'meter';
  if (/ct/.test(s)) return 'ct';
  return 'other';
}

function classify(label: string): { id: string; label: string } {
  const l = (label || '').toLowerCase();
  if (l.includes('control') || l.includes('plc')) return { id: 'CTL', label: 'Control' };
  if (l.includes('terminal')) return { id: 'TRM', label: 'Terminals' };
  if (l.includes('incomer') || l.includes('main') || l.includes('busbar')) return { id: 'INC', label: 'Incomer · Busbar' };
  return { id: 'PWR', label: 'Power' };
}

const COLOR: Record<string, string> = {
  INC: '#1f2937', PWR: '#2563eb', CTL: '#7c3aed', TRM: '#0d9488'
};

export function normalizeCabSpec(spec: CabinetSpecV1): CabinetSpecV2 | null {
  if (!Array.isArray(spec.rails)) return null;
  const sectionMap = new Map<string, Section>();
  spec.rails.forEach((r, ri) => {
    const cls = classify(r.label);
    let sec = sectionMap.get(cls.id);
    if (!sec) {
      sec = { id: cls.id, label: cls.label, type: cls.id === 'CTL' ? 'control' : cls.id === 'TRM' ? 'terminals' : 'power', color: COLOR[cls.id] || '#475569', rails: [] };
      sectionMap.set(cls.id, sec);
    }
    const items: DeviceV2[] = (r.items || []).map((it, ii) => {
      const sym = it.sym || 'MCB 3P';
      const kind = kindOf(sym);
      const polesMatch = polesRe.exec(it.label || '');
      const poles = polesMatch ? parseInt(polesMatch[1], 10) : (sym.match(/(\d)P/) ? parseInt(RegExp.$1, 10) : 3);
      const ratingMatch = ratingRe.exec(it.label || '');
      const rating = ratingMatch ? ratingMatch[0] : undefined;
      return {
        id: `D_${cls.id}_${ri}_${ii}`,
        sym,
        kind,
        label: it.label || sym,
        ref: `${cls.id}-${ri}-${ii}`,
        rating,
        poles,
        positionIndex: ii,
        status: 'on'
      };
    });
    const railV2: Rail = {
      id: `R_${cls.id}_${sec.rails.length}`,
      label: r.label || `Rail ${ri + 1}`,
      wireSize: r.wire,
      railType: 'DIN',
      bus: false,
      items
    };
    sec.rails.push(railV2);
  });

  return {
    specType: 'cabinet',
    specVersion: 2,
    title: (spec as any).title || 'Control panel',
    subtitle: (spec as any).subtitle || '',
    cabinet: { widthMm: 1000, heightMm: 2000, depthMm: 400, enclosureType: 'IP54' },
    sections: Array.from(sectionMap.values()),
    legend: (spec as any).legend || [],
    notes: ''
  };
}
