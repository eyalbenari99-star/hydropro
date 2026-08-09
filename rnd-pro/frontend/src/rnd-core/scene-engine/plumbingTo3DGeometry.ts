import type { Scene3D, Scene3DNode } from '../data-model';

interface PlumbNode { id: string; type: string; label: string; assetId?: string; }
interface PlumbEdge { fromId: string; toId: string; }
interface PlumbingSpec { nodes: PlumbNode[]; edges: PlumbEdge[]; }

const PLUMB_COLOR: Record<string, string> = {
  source: '#0d9488', tank: '#0e7490', pump: '#7c3aed', filter: '#0d47a1',
  valve: '#dc2626', manifold: '#facc15', dripper: '#06b6d4', sensor: '#22c55e', outlet: '#475569'
};

export function plumbingTo3DGeometry(spec: PlumbingSpec): Scene3D {
  const nodes: Scene3DNode[] = [];
  const pos: Record<string, [number, number, number]> = {};
  spec.nodes.forEach((n, i) => {
    const x = (i % 6) * 800;
    const z = Math.floor(i / 6) * 800;
    const y = 100;
    pos[n.id] = [x, y, z];
    nodes.push({
      id: n.id, assetId: n.assetId, primitive: 'cylinder',
      color: PLUMB_COLOR[n.type] || '#64748b',
      transform: { x, y, z, sx: 200, sy: 200, sz: 200 },
      metadata: { type: n.type, label: n.label }
    });
  });
  spec.edges.forEach(e => {
    const a = pos[e.fromId], b = pos[e.toId];
    if (!a || !b) return;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2;
    const dx = b[0] - a[0], dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dz * dz);
    nodes.push({
      id: `pipe_${e.fromId}_${e.toId}`, primitive: 'cylinder', color: '#475569',
      transform: { x: mx, y: my, z: mz, sx: 30, sy: 30, sz: len }
    });
  });
  return { nodes };
}
