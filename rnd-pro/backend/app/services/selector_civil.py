"""Civil asset selector — stub.

Same pattern as electrical/plumbing. Picks structural members
(columns, beams, rafters, purlins, foundations) from the Asset DB
based on span width, length, frame material, roof type.
"""
from typing import Optional, Dict
from sqlalchemy import text


def pick_column(session, tenant_id: str, height_m: float,
                material: str = 'steel') -> Optional[Dict]:
    """Pick a structural column profile sized for the height."""
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'civil'
            AND asset_kind = 'component_3d'
            AND params->>'nodeType' = 'column'
            AND params->>'material' = :mat
            AND (params->>'heightMaxM')::numeric >= :h
          ORDER BY (params->>'heightMaxM')::numeric ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'mat': material, 'h': height_m}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    # Synth: pick a reasonable steel RHS by height bracket
    profile = '100x50x3 RHS' if height_m <= 4 else '150x100x4 RHS' if height_m <= 7 else '200x150x5 RHS'
    return {'source': 'synth', 'asset': {
        'partNo': profile,
        'discipline': 'civil',
        'params': {'nodeType': 'column', 'material': material,
                   'heightMaxM': height_m, 'profile': profile}
    }}


def pick_rafter(session, tenant_id: str, span_m: float,
                material: str = 'steel', roof_type: str = 'gable') -> Optional[Dict]:
    """Pick a rafter/beam sized for the span."""
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'civil'
            AND asset_kind = 'component_3d'
            AND params->>'nodeType' = 'rafter'
            AND params->>'material' = :mat
            AND (params->>'spanMaxM')::numeric >= :s
          ORDER BY (params->>'spanMaxM')::numeric ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'mat': material, 's': span_m}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    profile = 'IPE-160' if span_m <= 6 else 'IPE-200' if span_m <= 9 else 'IPE-240' if span_m <= 12 else 'IPE-300'
    return {'source': 'synth', 'asset': {
        'partNo': profile,
        'discipline': 'civil',
        'params': {'nodeType': 'rafter', 'material': material,
                   'spanMaxM': span_m, 'profile': profile, 'roofType': roof_type}
    }}


def pick_purlin(session, tenant_id: str, spacing_m: float,
                material: str = 'steel') -> Optional[Dict]:
    """Pick a purlin sized for the bay spacing."""
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'civil'
            AND asset_kind = 'component_3d'
            AND params->>'nodeType' = 'purlin'
            AND params->>'material' = :mat
            AND (params->>'spacingMaxM')::numeric >= :sp
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'mat': material, 'sp': spacing_m}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    profile = 'C-150' if spacing_m <= 5 else 'C-200'
    return {'source': 'synth', 'asset': {
        'partNo': profile,
        'discipline': 'civil',
        'params': {'nodeType': 'purlin', 'material': material,
                   'spacingMaxM': spacing_m, 'profile': profile}
    }}


def pick_foundation(session, tenant_id: str, column_load_kn: float) -> Optional[Dict]:
    """Pick a concrete pad foundation sized by column load."""
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'civil'
            AND asset_kind = 'component_3d'
            AND params->>'nodeType' = 'foundation'
            AND (params->>'capacityKN')::numeric >= :load
          ORDER BY (params->>'capacityKN')::numeric ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'load': column_load_kn}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    size = '600x600x500' if column_load_kn <= 50 else '800x800x600' if column_load_kn <= 100 else '1000x1000x800'
    return {'source': 'synth', 'asset': {
        'partNo': f'Concrete pad {size} mm',
        'discipline': 'civil',
        'params': {'nodeType': 'foundation', 'capacityKN': column_load_kn,
                   'sizeMM': size, 'material': 'concrete C30/37'}
    }}
