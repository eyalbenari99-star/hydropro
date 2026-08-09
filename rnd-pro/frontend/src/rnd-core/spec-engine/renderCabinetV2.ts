/* renderCabinetV2 — port of the Python aba_all.py rendering logic to TS.
 *
 * Layout: one column per section, header bar, then per-rail items as cards.
 * Each card carries: brand strip, kind badge, ref tag, label, rating, plate.
 * Output is a Scene that the canvas renderer paints.
 */
import type { CabinetSpecV2, Scene, SceneObject, DeviceV2, Rail, Section } from '../data-model';

const COLORS = {
  bgFrame: '#3a4148',
  bgPanel: '#f5f7fa',
  panelStroke: '#94a3b8',
  hdrBar: '#0f172a',
  hdrText: '#ffffff',
  textDark: '#1f2937',
  textMid: '#475569',
  textLight: '#cbd5e0',
  rail: '#94a3b8',
  busbarBolt: '#cbd5e0',
  ledOn: '#22c55e',
  ledOff: '#dc2626',
  badge: '#fbbf24',
  plate: '#ffffff'
};

const KIND_FILL: Record<string, string> = {
  mccb: '#0b1014', breaker: '#1f2937', rcbo: '#2e7d32',
  contactor: '#374151', overload: '#b71c1c', meter: '#0d47a1',
  ct: '#1565c0', vfd: '#202833', plc: '#065f46', smps: '#e2e8f0',
  transformer: '#5b6b7b', terminal: '#d8c79a', busbar: '#c47b2e',
  relay: '#7c2d12', other: '#475569'
};

const KIND_BADGE: Record<string, string> = {
  mccb: 'MCCB', breaker: 'MCB', rcbo: 'RCBO', contactor: 'KM',
  overload: 'OL', vfd: 'VFD', plc: 'PLC', smps: 'PSU',
  transformer: 'TX', terminal: 'TB', relay: 'KA', busbar: 'BB',
  meter: 'Wh', ct: 'CT', other: 'DEV'
};

let _id = 0;
const uid = (p: string) => `${p}_${++_id}`;

export function renderCabinetV2(cab: CabinetSpecV2): Scene {
  _id = 0;
  const objects: SceneObject[] = [];
  const sections = cab.sections || [];

  const TBH = 84, MARGIN = 40, SECT_GAP = 24, RAIL_HEIGHT = 138, HEADER_H = 50;
  const widths = sections.map(estimateSectionWidth);
  const maxRails = sections.reduce((m, s) => Math.max(m, (s.rails || []).length), 1);
  const totalW = widths.reduce((a, b) => a + b, 0) + Math.max(0, sections.length - 1) * SECT_GAP + MARGIN * 2;
  const sectionH = HEADER_H + 30 + maxRails * (RAIL_HEIGHT + 14) + 20;
  const totalH = TBH + 30 + sectionH + MARGIN + 60;

  const w = Math.max(1800, totalW);
  const h = Math.max(1100, totalH);

  addTitleBlock(objects, cab, w);

  let x = MARGIN;
  const secY = TBH + 24;
  sections.forEach((sec, si) => {
    const ww = widths[si];

    // section frame
    objects.push({ id: uid('sx_bg'), kind: 'rect', layer: 'background', x: x - 6, y: secY - 6, w: ww + 12, h: sectionH + 12, fill: COLORS.bgFrame, stroke: '#0f172a', width: 2 });
    objects.push({ id: uid('sx_pl'), kind: 'rect', layer: 'background', x, y: secY, w: ww, h: sectionH, fill: COLORS.bgPanel, stroke: COLORS.panelStroke, width: 1 });
    objects.push({ id: uid('sx_hb'), kind: 'rect', layer: 'background', x, y: secY, w: ww, h: HEADER_H, fill: COLORS.hdrBar, stroke: '#000', width: 1 });
    objects.push({ id: uid('sx_hs'), kind: 'rect', layer: 'symbols',    x, y: secY, w: 14, h: HEADER_H, fill: sec.color || '#3b82f6', stroke: sec.color || '#3b82f6', width: 1 });
    objects.push({ id: uid('sx_ht'), kind: 'text', layer: 'annotations', x: x + 28, y: secY + 33, text: String(sec.label || sec.id || 'Section'), size: 17, color: COLORS.hdrText });

    let rY = secY + HEADER_H + 18;
    (sec.rails || []).forEach((rail, _ri) => {
      if (rail.label) objects.push({ id: uid('rl'), kind: 'text', layer: 'annotations', x: x + 18, y: rY + 12, text: rail.label, size: 12, color: COLORS.textDark });
      if (rail.wireSize) objects.push({ id: uid('rw'), kind: 'text', layer: 'annotations', x: x + ww - 92, y: rY + 12, text: rail.wireSize, size: 11, color: COLORS.textMid });

      if (rail.bus) addBusbar(objects, x + 30, rY + 22, ww - 46, rail);
      else addDeviceRail(objects, x + 18, rY + 22, ww - 36, rail);

      rY += RAIL_HEIGHT + 14;
    });

    x += ww + SECT_GAP;
  });

  return { w, h, bg: { type: 'grid', grid: 40 }, objects };
}

function addTitleBlock(objects: SceneObject[], cab: CabinetSpecV2, W: number) {
  const hbH = 84;
  objects.push({ id: uid('tb_bg'), kind: 'rect', layer: 'background', x: 0, y: 0, w: W, h: hbH, fill: '#0f172a', stroke: '#020617', width: 1 });
  objects.push({ id: uid('tb_st'), kind: 'rect', layer: 'symbols',    x: 0, y: 0, w: 12, h: hbH, fill: '#0ea5e9', stroke: '#0ea5e9', width: 1 });
  objects.push({ id: uid('tb_t'), kind: 'text', layer: 'annotations', x: 38, y: 40, text: cab.title || 'Control panel', size: 28, color: '#fff' });
  if (cab.subtitle) objects.push({ id: uid('tb_s'), kind: 'text', layer: 'annotations', x: 38, y: 66, text: cab.subtitle, size: 13, color: '#cbd5e0' });
}

function addBusbar(objects: SceneObject[], x: number, y: number, w: number, rail: Rail) {
  const phases = rail.busPhases || ['L1', 'L2', 'L3', 'N', 'PE'];
  const barH = 13, gap = 3;
  phases.forEach((ph, i) => {
    const by = y + i * (barH + gap);
    const col = phaseColor(ph);
    objects.push({ id: uid(`bb_${ph}`), kind: 'rect', layer: 'symbols', x, y: by, w, h: barH, fill: col, stroke: '#0f172a', width: 1 });
    objects.push({ id: uid(`phl_${ph}`), kind: 'text', layer: 'annotations', x: x - 26, y: by + barH - 1, text: ph, size: 11, color: COLORS.textDark });
  });
}

function addDeviceRail(objects: SceneObject[], x: number, y: number, w: number, rail: Rail) {
  const items = rail.items || [];
  if (!items.length) return;
  const devH = 86, dropZone = 22;
  const railLineY = y + devH + dropZone;

  objects.push({ id: uid('din'), kind: 'rect', layer: 'background', x, y: railLineY, w, h: 6, fill: COLORS.rail, stroke: '#475569', width: 1 });

  const spacing = w / items.length;
  const devW = Math.max(74, Math.min(spacing - 8, 130));
  items.forEach((dev, idx) => {
    const cx = x + spacing * (idx + 0.5);
    const dx = cx - devW / 2;
    addDevice(objects, dx, y, devW, devH, dev);
    addWireDrop(objects, cx, y + devH, railLineY, dev);
  });
}

function addDevice(objects: SceneObject[], x: number, y: number, w: number, h: number, dev: DeviceV2) {
  const kind = dev.kind || 'other';
  const fill = KIND_FILL[kind] || KIND_FILL.other;
  objects.push({ id: uid('dv_body'), kind: 'rect', layer: 'symbols', x, y, w, h, fill, stroke: '#000', width: 3 });
  const stripH = Math.max(16, h * 0.20);
  objects.push({ id: uid('dv_brand'), kind: 'rect', layer: 'symbols', x, y, w, h: stripH, fill: '#000', stroke: '#000', width: 1 });

  // LED
  const ledR = Math.max(4, stripH * 0.30);
  const ledColor = dev.status === 'fault' ? '#dc2626' : dev.status === 'off' ? '#6b7280' : COLORS.ledOn;
  objects.push({ id: uid('dv_led'), kind: 'ellipse', layer: 'symbols', x: x + w - stripH, y: y + stripH * 0.18, w: ledR * 2, h: ledR * 2, fill: ledColor, stroke: '#000', width: 1 });

  // Ref tag
  if (dev.ref) objects.push({ id: uid('dv_ref'), kind: 'text', layer: 'annotations', x: x + 6, y: y + stripH - 5, text: String(dev.ref), size: Math.max(9, stripH * 0.55), color: '#fff', bold: true });

  // Kind badge centre
  if (w >= 64) {
    const badge = KIND_BADGE[kind] || 'DEV';
    const bsize = Math.max(8, stripH * 0.46);
    objects.push({ id: uid('dv_kb'), kind: 'text', layer: 'annotations', x: x + w / 2 - badge.length * bsize * 0.28, y: y + stripH - 5, text: badge, size: bsize, color: COLORS.badge, bold: true });
  }

  // Label
  let labelText = String(dev.label || dev.sym || '');
  if (labelText.length > 22) labelText = labelText.slice(0, 21) + '…';
  objects.push({ id: uid('dv_lbl'), kind: 'text', layer: 'annotations', x: x + 6, y: y + stripH + 18, text: labelText, size: 11, color: '#fff', bold: true });

  // Rating + poles
  if (dev.rating || dev.poles) {
    let rate = (dev.rating || '') + (dev.poles ? ` · ${dev.poles}P` : '');
    if (rate.length > 26) rate = rate.slice(0, 25) + '…';
    objects.push({ id: uid('dv_rt'), kind: 'text', layer: 'annotations', x: x + 6, y: y + stripH + 34, text: rate, size: 10, color: COLORS.textLight });
  }

  // Bottom name plate
  if (dev.sym) {
    const plateH = Math.max(13, h * 0.18);
    objects.push({ id: uid('dv_plate'), kind: 'rect', layer: 'symbols', x: x + 4, y: y + h - plateH - 3, w: w - 8, h: plateH, fill: COLORS.plate, stroke: '#000', width: 1 });
    objects.push({ id: uid('dv_pltxt'), kind: 'text', layer: 'annotations', x: x + 8, y: y + h - 3 - plateH * 0.25, text: dev.sym, size: Math.max(8, plateH * 0.55), color: '#000', bold: true });
  }

  // TODO(14.7): if dev.assetId is set, fetch SVG from /api/rnd/assets/{assetId} and render as a SymbolObj overlay.
}

function addWireDrop(objects: SceneObject[], cx: number, fromY: number, toY: number, dev: DeviceV2) {
  const set = dev.wireColorSet || '3P+N';
  const phases =
    set === '3P+N' ? ['L1', 'L2', 'L3', 'N'] :
    set === '3P'   ? ['L1', 'L2', 'L3'] :
    set === 'DC'   ? ['DC+', 'DC-'] :
    set === '1P'   ? ['L1', 'N'] : ['L1'];
  const spread = (phases.length - 1) * 4;
  phases.forEach((ph, i) => {
    const offset = i * 4 - spread / 2;
    objects.push({ id: uid(`w_${ph}`), kind: 'line', layer: 'symbols', x1: cx + offset, y1: fromY, x2: cx + offset, y2: toY, stroke: phaseColor(ph), width: 2 });
  });
  if (dev.cableTag) objects.push({ id: uid('cbl'), kind: 'text', layer: 'annotations', x: cx - 22, y: toY + 15, text: dev.cableTag, size: 9, color: '#475569' });
}

function phaseColor(p: string): string {
  switch (p) {
    case 'L1': return '#dc2626';
    case 'L2': return '#000000';
    case 'L3': return '#2563eb';
    case 'N':  return '#3b82f6';
    case 'PE': return '#16a34a';
    case 'DC+': return '#dc2626';
    case 'DC-': return '#1e3a8a';
    default: return '#64748b';
  }
}

function estimateSectionWidth(sec: Section): number {
  let maxItems = 0;
  (sec.rails || []).forEach(r => { maxItems = Math.max(maxItems, (r.items || []).length); });
  return Math.max(360, 100 + maxItems * 142);
}
