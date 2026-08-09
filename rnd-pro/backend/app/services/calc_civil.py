"""Civil structure builder — turns answers into a CivilSpec.

Generates a 3D-ready grid of columns, rafters, and purlins from
span width, length, and bay pitch.
"""
from typing import Dict, Any
from app.models.civil import CivilSpec, CivilNode, CivilEdge


def build_civil_spec(answers: Dict[str, Any]) -> CivilSpec:
    project_type   = answers.get('project_type', 'greenhouse')
    spans_count    = int(answers.get('spans_count', 3))
    span_width_m   = float(answers.get('span_width_m', 8))
    length_m       = float(answers.get('length_m', 40))
    frame_material = answers.get('frame_material', 'steel')
    roof_type      = answers.get('roof_type', 'gable')

    # Bay pitch: standard 4 m, but never more than length / 2
    bay_pitch_m = 4.0
    bays_count = max(2, int(round(length_m / bay_pitch_m)))
    actual_pitch = length_m / bays_count
    eave_height_m = 4.0
    ridge_height_m = 5.5 if roof_type == 'gable' else 5.0

    nodes = []
    edges = []
    column_id = 0
    rafter_id = 0

    # Columns at each grid intersection (spans+1) x (bays+1)
    for sx in range(spans_count + 1):
        for by in range(bays_count + 1):
            column_id += 1
            cid = f'C{column_id:03d}'
            x = sx * span_width_m
            z = by * actual_pitch
            nodes.append(CivilNode(id=cid, type='column',
                                   label=f'C{column_id}',
                                   xM=x, yM=0, zM=z,
                                   profile='RHS 150x100x4', material=frame_material))
            # Foundation under each column
            fid = f'F{column_id:03d}'
            nodes.append(CivilNode(id=fid, type='foundation',
                                   label=f'F{column_id}',
                                   xM=x, yM=-0.5, zM=z,
                                   material='concrete C30/37'))

    # Rafters: one per span per bay row
    for by in range(bays_count + 1):
        z = by * actual_pitch
        for sx in range(spans_count):
            rafter_id += 1
            rid = f'R{rafter_id:03d}'
            x0 = sx * span_width_m
            x1 = (sx + 1) * span_width_m
            label = f'R{rafter_id}'
            nodes.append(CivilNode(id=rid, type='rafter', label=label,
                                   xM=(x0+x1)/2, yM=eave_height_m, zM=z,
                                   profile='IPE-200', material=frame_material))
            # Edges connecting column tops to rafter midpoint
            edges.append(CivilEdge(fromId=f'C{sx*(bays_count+1)+by+1:03d}',
                                   toId=rid, type='beam',
                                   lengthM=span_width_m/2))

    # Purlins: along the length at 1.5 m spacing on each span
    purlin_pitch = 1.5
    purlin_per_span = max(1, int(span_width_m / purlin_pitch))
    purlin_id = 0
    for sx in range(spans_count):
        for p in range(purlin_per_span):
            purlin_id += 1
            pid = f'P{purlin_id:03d}'
            x = sx * span_width_m + (p + 0.5) * (span_width_m / purlin_per_span)
            nodes.append(CivilNode(id=pid, type='purlin', label=f'P{purlin_id}',
                                   xM=x, yM=eave_height_m, zM=length_m/2,
                                   profile='C-150', material=frame_material))

    spec = CivilSpec(
        title=answers.get('title', f'{project_type.title()} structure'),
        projectType=project_type,
        spansCount=spans_count,
        spanWidthM=span_width_m,
        lengthM=length_m,
        frameMaterial=frame_material,
        roofType=roof_type,
        bayPitchM=actual_pitch,
        nodes=nodes,
        edges=edges,
        meta={
            'eaveHeightM': eave_height_m,
            'ridgeHeightM': ridge_height_m,
            'baysCount': bays_count,
            'totalAreaM2': spans_count * span_width_m * length_m,
            'totalColumns': len([n for n in nodes if n.type == 'column']),
            'totalRafters': len([n for n in nodes if n.type == 'rafter']),
            'totalPurlins': len([n for n in nodes if n.type == 'purlin']),
            'totalFoundations': len([n for n in nodes if n.type == 'foundation']),
        }
    )
    return spec
