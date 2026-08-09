#!/usr/bin/env python3
"""Convert STEP / IGES / STL files to .glb using Blender CLI.

Usage:
    blender --background --python scripts/convert_step_to_glb.py -- \
            --input rnd-3d-assets-raw/chint/NXB-63.step \
            --output rnd-3d-assets/chint/NXB-63_C16_3P.glb \
            --color "#dc2626"

Or batch mode:
    blender --background --python scripts/convert_step_to_glb.py -- --batch rnd-3d-assets-raw/

Blender is required (https://www.blender.org/). Install:
  - macOS:   brew install --cask blender
  - Linux:   apt install blender   (Ubuntu) or snap install blender
  - Windows: download from blender.org

The STEP importer requires the bundled `STEP/IGES` add-on (Blender 4.x) or
the third-party `step_import` add-on for older Blender. STL works out of the box.

For real engineering CAD files from manufacturer datasheets:
  1. Download .step / .stp from CHINT / ABB / Schneider / Pedrollo websites
  2. Place them under rnd-3d-assets-raw/{manufacturer}/{partno}.step
  3. Run this script (batch mode) — generates .glb at rnd-3d-assets/{mfg}/{partno}.glb
  4. Run scripts/upload_glb_to_r2.py to push the .glb files to R2

Falls back to scripts/generate_procedural_glbs.py for parts with no STEP file.
"""
import sys, os, argparse

try:
    import bpy   # type: ignore[import]
except ImportError:
    print("ERROR: This script must be run inside Blender. Use:")
    print("  blender --background --python scripts/convert_step_to_glb.py -- [args]")
    sys.exit(1)


def hex_to_rgb(hex_color: str):
    h = hex_color.lstrip('#')
    if len(h) != 6:
        return (0.5, 0.5, 0.5, 1.0)
    return (int(h[0:2], 16)/255.0, int(h[2:4], 16)/255.0, int(h[4:6], 16)/255.0, 1.0)


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def import_file(path: str) -> bool:
    """Import STEP / IGES / STL / OBJ / FBX. Returns True on success."""
    ext = path.rsplit('.', 1)[-1].lower()
    try:
        if ext in ('step', 'stp'):
            # Blender 4.x bundled importer
            if hasattr(bpy.ops.import_scene, 'occ_import_step'):
                bpy.ops.import_scene.occ_import_step(filepath=path)
            elif hasattr(bpy.ops.wm, 'stp_import'):
                bpy.ops.wm.stp_import(filepath=path)
            else:
                # Fall back to FreeCAD-converted STL if STEP not supported
                print(f"  WARN: STEP importer not available; expecting pre-converted .stl")
                return False
        elif ext in ('iges', 'igs'):
            bpy.ops.import_scene.occ_import_iges(filepath=path)
        elif ext == 'stl':
            bpy.ops.import_mesh.stl(filepath=path)
        elif ext == 'obj':
            bpy.ops.wm.obj_import(filepath=path)
        elif ext == 'fbx':
            bpy.ops.import_scene.fbx(filepath=path)
        else:
            print(f"  WARN: Unknown extension {ext}")
            return False
        return True
    except Exception as e:
        print(f"  ERROR importing {path}: {e}")
        return False


def apply_material(color_rgba):
    """Apply a single PBR material with the given color to all imported meshes."""
    mat = bpy.data.materials.new(name="PartMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color_rgba
        bsdf.inputs["Metallic"].default_value = 0.2
        bsdf.inputs["Roughness"].default_value = 0.6
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.data.materials.clear()
            obj.data.materials.append(mat)


def export_glb(out_path: str):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
    )


def convert_one(input_path: str, output_path: str, color_hex: str):
    print(f"  -> {input_path}")
    clear_scene()
    if not import_file(input_path):
        return False
    apply_material(hex_to_rgb(color_hex))
    export_glb(output_path)
    size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    print(f"     wrote {output_path}  ({size:,} B)")
    return True


def batch_convert(raw_dir: str, out_dir: str = None):
    """Walk raw_dir, convert every .step/.stp/.stl found to corresponding .glb."""
    if out_dir is None:
        out_dir = os.path.join(os.path.dirname(raw_dir.rstrip('/')), 'rnd-3d-assets')
    ok = fail = 0
    for root, dirs, files in os.walk(raw_dir):
        for f in files:
            ext = f.rsplit('.', 1)[-1].lower() if '.' in f else ''
            if ext not in ('step', 'stp', 'stl', 'iges', 'igs', 'obj', 'fbx'):
                continue
            in_path = os.path.join(root, f)
            rel = os.path.relpath(in_path, raw_dir)
            out_path = os.path.join(out_dir, os.path.splitext(rel)[0] + '.glb')
            color = '#7c3aed'  # default purple — override per-part if you have a mapping CSV
            if convert_one(in_path, out_path, color):
                ok += 1
            else:
                fail += 1
    print(f"\nBatch done: ok={ok} fail={fail}")


def main():
    argv = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument('--input',  help='Single STEP/STL/IGES input file')
    ap.add_argument('--output', help='Output .glb path')
    ap.add_argument('--color',  default='#7c3aed', help='Material baseColor (hex)')
    ap.add_argument('--batch',  help='Batch convert directory tree')
    args = ap.parse_args(argv)

    if args.batch:
        batch_convert(args.batch)
    elif args.input and args.output:
        convert_one(args.input, args.output, args.color)
    else:
        ap.print_help()


if __name__ == '__main__':
    main()
