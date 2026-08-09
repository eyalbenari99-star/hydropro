import type { CabinetSpecV2, Scene3D, Scene3DNode } from '../data-model';

/* Same logic as backend/api/build_3d.py — frontend can call backend OR run locally.
 * Local path lets the developer iterate without round-tripping. */

const KIND_COLOR: Record<string, string> = {
  mccb: '#0b1014', breaker: '#1f2937', rcbo: '#2e7d32',
  contactor: '#374151', overload: '#b71c1c',
  meter: '#0d47a1', ct: '#1565c0', other: '#475569'
};

export function cabinetTo3DGeometry(spec: CabinetSpecV2): Scene3D {
  const nodes: Scene3DNode[] = [];
  const cab = spec.cabinet;

  nodes.push({
    id: 'enclosure', primitive: 'box', color: '#94a3b8',
    transform: { x: cab.widthMm / 2, y: cab.heightMm / 2, z: cab.depthMm / 2, sx: cab.widthMm, sy: cab.heightMm, sz: cab.depthMm }
  });

  const SECTION_W = 800, SECTION_GAP = 60, Y_TOP = cab.heightMm - 200, RAIL_PITCH = 220;
  let x = 100;
  (spec.sections || []).forEach((sec, sidx) => {
    const secX = x + sidx * (SECTION_W + SECTION_GAP);
    (sec.rails || []).forEach((rail, ridx) => {
      const railY = Y_TOP - ridx * RAIL_PITCH;
      nodes.push({
        id: `rail_${sec.id}_${ridx}`, primitive: 'box', color: '#cbd5e0',
        transform: { x: secX + SECTION_W / 2, y: railY, z: 80, sx: SECTION_W, sy: 20, sz: 15 }
      });
      const items = rail.items || [];
      if (!items.length) return;
      const slot = SECTION_W / items.length;
      items.forEach((dev, idx) => {
        const dx = secX + slot * (idx + 0.5);
        nodes.push({
          id: `dev_${dev.ref}`, assetId: dev.assetId, primitive: 'box',
          color: KIND_COLOR[dev.kind] || KIND_COLOR.other,
          transform: { x: dx, y: railY + 80, z: 80, sx: 70, sy: 140, sz: 60 },
          metadata: { kind: dev.kind, ref: dev.ref, rating: dev.rating, partNo: dev.partNo }
        });
      });
    });
  });

  return { nodes, bbox: [0, 0, 0, cab.widthMm, cab.heightMm, cab.depthMm] };
}
