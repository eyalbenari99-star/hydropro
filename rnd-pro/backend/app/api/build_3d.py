from fastapi import APIRouter
from app.models.cabinet import CabinetSpecV2
from app.models.plumbing import PlumbingSpec
from app.models.scene_3d import Scene3D, Scene3DNode, Transform3D

router = APIRouter()

@router.post('/build-3d/cabinet')
def cabinet_to_3d(spec: CabinetSpecV2) -> Scene3D:
    """Build a neutral 3D scene graph from a CabinetSpecV2.
    The frontend Three.js viewer reads this and either loads .glb files for
    each node.assetId, or falls back to primitives (boxes).
    """
    nodes = []

    # Enclosure outline
    nodes.append(Scene3DNode(id='enclosure', primitive='box', color='#94a3b8',
                             transform=Transform3D(x=spec.cabinet.widthMm/2, y=spec.cabinet.heightMm/2, z=spec.cabinet.depthMm/2,
                                                   sx=spec.cabinet.widthMm, sy=spec.cabinet.heightMm, sz=spec.cabinet.depthMm)))

    # Layout sections side-by-side, rails stacked vertically, devices along each rail.
    x = 100
    SECTION_W = 800
    SECTION_GAP = 60
    Y_TOP = spec.cabinet.heightMm - 200
    RAIL_PITCH = 220

    for sec_idx, sec in enumerate(spec.sections or []):
        sec_x = x + sec_idx * (SECTION_W + SECTION_GAP)
        # rails as horizontal bars
        for r_idx, rail in enumerate(sec.rails or []):
            rail_y = Y_TOP - r_idx * RAIL_PITCH
            nodes.append(Scene3DNode(id=f'rail_{sec.id}_{r_idx}', primitive='box', color='#cbd5e0',
                                     transform=Transform3D(x=sec_x + SECTION_W/2, y=rail_y, z=80, sx=SECTION_W, sy=20, sz=15)))
            # devices
            items = rail.items or []
            if not items: continue
            slot = SECTION_W / max(len(items), 1)
            for i_idx, dev in enumerate(items):
                dx = sec_x + slot * (i_idx + 0.5)
                nodes.append(Scene3DNode(
                    id=f'dev_{dev.ref}', assetId=dev.assetId, primitive='box',
                    color=_color_for(dev.kind),
                    transform=Transform3D(x=dx, y=rail_y + 80, z=80, sx=70, sy=140, sz=60),
                    metadata={'kind': dev.kind, 'ref': dev.ref, 'rating': dev.rating, 'partNo': dev.partNo}
                ))

    bbox = [0, 0, 0, spec.cabinet.widthMm, spec.cabinet.heightMm, spec.cabinet.depthMm]
    return Scene3D(nodes=nodes, bbox=bbox)

@router.post('/build-3d/plumbing')
def plumbing_to_3d(spec: PlumbingSpec) -> Scene3D:
    nodes = []
    pos = {}
    for i, n in enumerate(spec.nodes):
        x = (i % 6) * 800
        z = (i // 6) * 800
        y = 100
        pos[n.id] = (x, y, z)
        nodes.append(Scene3DNode(id=n.id, assetId=n.assetId, primitive='cylinder',
                                 color=_plumb_color(n.type),
                                 transform=Transform3D(x=x, y=y, z=z, sx=200, sy=200, sz=200),
                                 metadata={'type': n.type, 'label': n.label}))
    for e in spec.edges:
        a = pos.get(e.fromId); b = pos.get(e.toId)
        if not a or not b: continue
        mx = (a[0] + b[0]) / 2
        my = (a[1] + b[1]) / 2
        mz = (a[2] + b[2]) / 2
        dx = b[0] - a[0]; dz = b[2] - a[2]
        length = (dx*dx + dz*dz) ** 0.5
        nodes.append(Scene3DNode(id=f'pipe_{e.fromId}_{e.toId}', primitive='cylinder', color='#475569',
                                 transform=Transform3D(x=mx, y=my, z=mz, sx=30, sy=30, sz=length),
                                 metadata={'fromId': e.fromId, 'toId': e.toId}))
    return Scene3D(nodes=nodes)

def _color_for(kind: str) -> str:
    return {
        'mccb':'#0b1014','breaker':'#1f2937','rcbo':'#2e7d32',
        'contactor':'#374151','overload':'#b71c1c','meter':'#0d47a1','ct':'#1565c0'
    }.get(kind, '#475569')

def _plumb_color(t: str) -> str:
    return {
        'source':'#0d9488','tank':'#0e7490','pump':'#7c3aed','filter':'#0d47a1',
        'valve':'#dc2626','manifold':'#facc15','dripper':'#06b6d4','sensor':'#22c55e','outlet':'#475569'
    }.get(t, '#64748b')
