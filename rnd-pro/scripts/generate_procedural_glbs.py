#!/usr/bin/env python3
"""Generate procedural .glb files for every part in the electrical + plumbing catalogs.

Output: ~/Desktop/HydroNexis-AI-RND-rebuild-skeleton/rnd-3d-assets/{mfg}/{partno}.glb
Hand-written GLB (binary glTF 2.0) — no external libs.

Each .glb is a colored box sized for the device kind. Coordinate frame:
  X = width (mm), Y = height (mm), Z = depth (mm)
Origin at corner. Color encoded as material.pbrMetallicRoughness.baseColorFactor.
"""
import os, csv, struct, json, sys
from typing import Tuple, List

ROOT = "/Users/eyalbenari/Desktop/HydroNexis-AI-RND-rebuild-skeleton"
ASSETS_DIR = os.path.join(ROOT, "rnd-3d-assets")

# ===================================================================
# GLB writer
# ===================================================================

def hex_to_rgb(hex_color: str) -> Tuple[float, float, float]:
    h = hex_color.lstrip('#')
    if len(h) != 6:
        return (0.5, 0.5, 0.5)
    return (int(h[0:2], 16)/255.0, int(h[2:4], 16)/255.0, int(h[4:6], 16)/255.0)


def box_glb(w: float, h: float, d: float, color_rgb: Tuple[float, float, float],
            name: str = 'device') -> bytes:
    """Build a minimal glTF 2.0 binary box with the given dimensions (mm) and color.

    Geometry: 8 vertices, 12 triangles (24 indices).
    """
    # 8 corners of an axis-aligned box from (0,0,0) to (w,h,d)
    verts: List[float] = [
        0, 0, 0,  w, 0, 0,  w, h, 0,  0, h, 0,   # back face (z=0)
        0, 0, d,  w, 0, d,  w, h, d,  0, h, d,   # front face (z=d)
    ]
    # 12 triangles, CCW winding
    indices: List[int] = [
        # back (-Z)
        0, 2, 1,  0, 3, 2,
        # front (+Z)
        4, 5, 6,  4, 6, 7,
        # left (-X)
        0, 7, 3,  0, 4, 7,
        # right (+X)
        1, 2, 6,  1, 6, 5,
        # bottom (-Y)
        0, 1, 5,  0, 5, 4,
        # top (+Y)
        3, 6, 2,  3, 7, 6,
    ]

    # Pack binary buffer: vertex positions (float32) + indices (uint16)
    vert_bytes = struct.pack('<' + 'f' * len(verts), *verts)
    idx_bytes  = struct.pack('<' + 'H' * len(indices), *indices)

    # 4-byte align between bufferViews
    while len(vert_bytes) % 4 != 0: vert_bytes += b'\x00'
    while len(idx_bytes)  % 4 != 0: idx_bytes  += b'\x00'

    buffer_data = vert_bytes + idx_bytes
    while len(buffer_data) % 4 != 0: buffer_data += b'\x00'

    # Find min/max for accessor bounds
    xs = verts[0::3]; ys = verts[1::3]; zs = verts[2::3]
    pos_min = [min(xs), min(ys), min(zs)]
    pos_max = [max(xs), max(ys), max(zs)]

    gltf = {
        "asset": {"version": "2.0", "generator": "HydroNexis-AI procedural GLB writer"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{
            "primitives": [{
                "attributes": {"POSITION": 0},
                "indices": 1,
                "material": 0,
                "mode": 4
            }],
            "name": name
        }],
        "materials": [{
            "name": name + "_mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [color_rgb[0], color_rgb[1], color_rgb[2], 1.0],
                "metallicFactor": 0.2,
                "roughnessFactor": 0.6
            }
        }],
        "buffers": [{"byteLength": len(buffer_data)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0,             "byteLength": len(vert_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": len(vert_bytes),"byteLength": len(idx_bytes),  "target": 34963}
        ],
        "accessors": [
            {
                "bufferView": 0, "componentType": 5126, "count": 8, "type": "VEC3",
                "min": pos_min, "max": pos_max
            },
            {
                "bufferView": 1, "componentType": 5123, "count": len(indices), "type": "SCALAR",
                "min": [0], "max": [7]
            }
        ]
    }

    json_str = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    while len(json_str) % 4 != 0: json_str += b' '

    # Chunks
    json_chunk = struct.pack('<II', len(json_str), 0x4E4F534A) + json_str  # 'JSON'
    bin_chunk  = struct.pack('<II', len(buffer_data), 0x004E4942) + buffer_data  # 'BIN\0'

    total_length = 12 + len(json_chunk) + len(bin_chunk)
    header = struct.pack('<III', 0x46546C67, 2, total_length)  # 'glTF', version 2

    return header + json_chunk + bin_chunk


# ===================================================================
# Color + size per device kind
# ===================================================================

ELEC_KIND_COLOR = {
    'MCB':       '#dc2626',
    'MCCB':      '#1d4ed8',
    'Contactor': '#ea580c',
    'Overload':  '#f59e0b',
    'Meter':     '#7c3aed',
    'CT':        '#6b7280',
    'SPD':       '#16a34a',
    'PLC':       '#0ea5e9',
    'PSU':       '#475569',
    'Relay':     '#0891b2',
    'Terminal':  '#334155',
}

# DIN-rail-mounted device dimensions (mm) — width × height × depth
# Width scales with poles or rating.
def elec_dims(row: dict) -> Tuple[float, float, float]:
    dk = row.get('device_kind', 'MCB')
    poles = int(row.get('poles') or 1)
    if dk == 'MCB':
        return (18.0 * max(1, poles), 80.0, 70.0)
    if dk == 'MCCB':
        try:
            frame = float(row.get('frame_a') or 100)
        except ValueError:
            frame = 100
        # 100/250 frames: smaller; 400/630 mid; 800/1250 big
        if frame <= 100:  return (95, 130, 75)
        if frame <= 250:  return (125, 160, 80)
        if frame <= 400:  return (160, 250, 95)
        if frame <= 630:  return (185, 280, 110)
        if frame <= 800:  return (210, 320, 130)
        return (310, 400, 175)
    if dk == 'Contactor':
        try:
            kw = float(row.get('kw_max_400') or 5.5)
        except ValueError:
            kw = 5.5
        if kw <= 5.5:  return (45,  87, 86)
        if kw <= 11:   return (45,  92, 86)
        if kw <= 22:   return (55, 122, 100)
        if kw <= 37:   return (75, 145, 122)
        return (110, 180, 135)
    if dk == 'Overload':
        return (45, 87, 60)
    if dk == 'Meter':
        return (108, 105, 75)
    if dk == 'CT':
        return (80, 90, 38)
    return (35, 80, 70)  # default DIN

PLUMB_NODE_COLOR = {
    'pump':     '#0ea5e9',
    'filter':   '#16a34a',
    'pipe':     '#475569',
    'valve':    '#ea580c',
    'tank':     '#7c3aed',
    'manifold': '#1d4ed8',
    'sensor':   '#dc2626',
}

def plumb_dims(row: dict) -> Tuple[float, float, float]:
    nt = row.get('node_type', 'pump')
    if nt == 'pump':
        try: q = float(row.get('flow_m3h_max') or 10)
        except: q = 10
        scale = max(0.6, min(2.0, q / 15.0))
        return (320 * scale, 280 * scale, 220 * scale)
    if nt == 'filter':
        try: q = float(row.get('flow_m3h_max') or 10)
        except: q = 10
        scale = max(0.6, min(2.0, q / 15.0))
        return (280 * scale, 600 * scale, 280 * scale)
    if nt == 'pipe':
        try: dn = int(row.get('dn') or 50)
        except: dn = 50
        return (1000, dn, dn)
    if nt == 'valve':
        try: dn = int(row.get('dn') or 50)
        except: dn = 50
        return (dn * 1.5, dn * 2.0, dn * 1.5)
    if nt == 'tank':
        return (800, 1200, 800)
    if nt == 'manifold':
        return (600, 200, 200)
    return (100, 100, 100)


# ===================================================================
# Generate
# ===================================================================

def safe_path_segment(s: str) -> str:
    return ''.join(c if c.isalnum() or c in '._-' else '_' for c in (s or 'asset'))


def gltf_key_to_path(key: str) -> str:
    """Map a gltf_key like 'rnd-3d-assets/chint/NXB-63_C6_1P.glb'
    to an absolute path under ASSETS_DIR."""
    # If key already begins with rnd-3d-assets/, strip and join under ASSETS_DIR's parent.
    if key.startswith('rnd-3d-assets/'):
        rel = key[len('rnd-3d-assets/'):]
        return os.path.join(ASSETS_DIR, rel)
    # otherwise use the whole thing under ASSETS_DIR
    return os.path.join(ASSETS_DIR, key)


def generate_electrical():
    csv_path = os.path.join(ROOT, 'data/sample_electrical_products.csv')
    count = 0
    skipped = 0
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row.get('gltf_key') or '').strip()
            if not key:
                skipped += 1; continue
            out = gltf_key_to_path(key)
            if os.path.exists(out):
                skipped += 1; continue
            kind = row.get('device_kind', 'MCB')
            color = hex_to_rgb(ELEC_KIND_COLOR.get(kind, '#7c3aed'))
            w, h, d = elec_dims(row)
            name = row.get('part_no') or 'device'
            glb = box_glb(w, h, d, color, name=safe_path_segment(name))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, 'wb') as f2:
                f2.write(glb)
            count += 1
    print(f"  electrical: wrote {count}, skipped {skipped}")
    return count


def generate_plumbing():
    csv_path = os.path.join(ROOT, 'data/sample_plumbing_products.csv')
    count = 0
    skipped = 0
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row.get('gltf_key') or '').strip()
            if not key:
                skipped += 1; continue
            out = gltf_key_to_path(key)
            if os.path.exists(out):
                skipped += 1; continue
            nt = row.get('node_type', 'pump')
            color = hex_to_rgb(PLUMB_NODE_COLOR.get(nt, '#0ea5e9'))
            w, h, d = plumb_dims(row)
            name = row.get('part_no') or 'asset'
            glb = box_glb(w, h, d, color, name=safe_path_segment(name))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, 'wb') as f2:
                f2.write(glb)
            count += 1
    print(f"  plumbing:   wrote {count}, skipped {skipped}")
    return count


def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    print("Generating procedural GLB placeholders...")
    e = generate_electrical()
    p = generate_plumbing()
    total = e + p
    # Quick stats
    total_size = 0
    file_count = 0
    for root, dirs, files in os.walk(ASSETS_DIR):
        for f in files:
            if f.endswith('.glb'):
                total_size += os.path.getsize(os.path.join(root, f))
                file_count += 1
    print(f"\nTotal .glb files: {file_count}")
    print(f"Total size:       {total_size:,} bytes")
    print(f"Location:         {ASSETS_DIR}/")
    # Sample
    print(f"\nFirst GLB sample:")
    samples = []
    for root, dirs, files in os.walk(ASSETS_DIR):
        for f in files[:1]:
            samples.append(os.path.join(root, f))
            if len(samples) >= 3: break
        if len(samples) >= 3: break
    for s in samples[:3]:
        print(f"  {os.path.relpath(s, ROOT)}  ({os.path.getsize(s)} B)")

if __name__ == '__main__':
    main()
