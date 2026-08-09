"""Electrical asset selector — uses engineering rules from engineering_tables.py."""
from typing import Optional, Dict
from sqlalchemy import text
from app.models.cabinet import DeviceV2
from .engineering_tables import (
    pick_nxb_breaker, pick_nm1_mccb, pick_nxc_contactor, pick_jr36_overload,
    motor_fla_400v_3p
)

def pick_asset(session, device: DeviceV2, tenant_id: str) -> Optional[Dict]:
    """Find a real Asset DB row for this DeviceV2. Falls back to engineering
    rules + part number lookup if the catalog has no exact match.
    """
    kind = device.kind
    poles = device.poles or 3
    rating_a = _amps_from_rating(device.rating or '')
    curve = _curve_from_rating(device.rating or '')

    if kind == 'breaker':
        part_no = device.partNo or pick_nxb_breaker(poles, rating_a, curve or 'C')
        return _query_or_synth(session, tenant_id, 'breaker', part_no, poles, rating_a, curve)
    if kind == 'mccb':
        part_no = device.partNo or pick_nm1_mccb(poles, rating_a)
        return _query_or_synth(session, tenant_id, 'mccb', part_no, poles, rating_a, None)
    if kind == 'contactor':
        # Reverse-derive kW from rating if motor application
        kw = max(rating_a * 0.4, 0.5) if rating_a else 5.5
        spec = pick_nxc_contactor(kw)
        return _query_or_synth(session, tenant_id, 'contactor', spec['partNo'] if spec else None, 3, rating_a, None)
    if kind == 'overload':
        # rating string usually contains the range — parse FLA midpoint
        mid_fla = _fla_midpoint_from_range(device.rating or '')
        part_no = device.partNo or pick_jr36_overload(mid_fla)
        return _query_or_synth(session, tenant_id, 'overload', part_no, 3, mid_fla, None)
    if kind == 'meter':
        return _query_one(session, tenant_id, 'meter', None)
    if kind == 'ct':
        return _query_one(session, tenant_id, 'ct', None)
    return None


def _amps_from_rating(s: str) -> float:
    import re
    m = re.search(r'(\\d+(?:\\.\\d+)?)\\s*A', s)
    return float(m.group(1)) if m else 16.0

def _curve_from_rating(s: str) -> Optional[str]:
    import re
    m = re.search(r'[CD](\\d+)', s)
    return m.group(0)[0] if m else None

def _fla_midpoint_from_range(s: str) -> float:
    import re
    m = re.search(r'(\\d+(?:\\.\\d+)?)\\s*[-–]\\s*(\\d+(?:\\.\\d+)?)\\s*A', s)
    if m:
        lo, hi = float(m.group(1)), float(m.group(2))
        return (lo + hi) / 2
    return _amps_from_rating(s)

def _query_or_synth(session, tenant_id: str, device_kind: str, part_no: Optional[str],
                    poles: int, current_a: float, curve: Optional[str]) -> Dict:
    """Try the DB first, fall back to a synthesized response carrying the engineering pick."""
    if part_no:
        try:
            sql = text("""
              SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
              FROM hnx_rnd_asset
              WHERE tenant_id = :tid
                AND discipline = 'electrical'
                AND asset_kind = 'component_3d'
                AND name = :name
              LIMIT 1
            """)
            row = session.execute(sql, {'tid': tenant_id, 'name': part_no}).first()
            if row:
                return {'source': 'db', 'asset': dict(row._mapping)}
        except Exception:
            pass
    return {
        'source': 'synth',
        'asset': {
            'partNo': part_no,
            'discipline': 'electrical',
            'asset_kind': 'component_3d',
            'params': {
                'device_kind': device_kind,
                'poles': poles,
                'current_a': current_a,
                'curve': curve
            }
        }
    }

def _query_one(session, tenant_id: str, device_kind: str, _criteria) -> Dict:
    return {'source': 'synth', 'asset': {'partNo': f'CHINT {device_kind}', 'discipline': 'electrical'}}


# ============================================================
# CHINT-tuned wrappers — drive directly from question answers
# (feeder.currentA, motor kW, supply voltage).
# Each function tries the Asset DB first, falls back to
# engineering_tables synthesis.
# ============================================================

def pick_chint_nxb(session, tenant_id: str, poles: int, current_a: float,
                   curve: str = "C") -> Optional[Dict]:
    """CHINT NXB-63 MCB selector.
    Matches poles + currentA >= demand, prefers same curve.
    """
    from sqlalchemy import text
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'electrical'
            AND asset_kind = 'component_3d'
            AND params->>'deviceType' = 'MCB'
            AND params->>'series' = 'NXB'
            AND (params->>'poles')::int = :poles
            AND (params->>'currentA')::numeric >= :ca
          ORDER BY
            CASE WHEN params->>'curve' = :curve THEN 0 ELSE 1 END,
            (params->>'currentA')::numeric ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'poles': poles,
                                    'ca': current_a, 'curve': curve}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    part_no = pick_nxb_breaker(poles, current_a, curve)
    return {'source': 'synth', 'asset': {
        'partNo': part_no,
        'discipline': 'electrical',
        'asset_kind': 'component_3d',
        'params': {'deviceType': 'MCB', 'series': 'NXB',
                   'poles': poles, 'currentA': current_a, 'curve': curve,
                   'manufacturer': 'CHINT'}
    }}


def pick_chint_nxc(session, tenant_id: str, motor_kw: float,
                   supply_voltage: str = "3x400") -> Optional[Dict]:
    """CHINT NXC AC-3 contactor selector based on motor kW.
    Computes FLA from kW, picks contactor with AC-3 rating >= FLA*1.25.
    """
    from sqlalchemy import text
    if motor_kw <= 0:
        return None
    u = 400.0 if supply_voltage == "3x400" else 230.0
    fla = motor_kw * 1000.0 / (1.732 * u * 0.8)
    required_ac3 = fla * 1.25
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'electrical'
            AND asset_kind = 'component_3d'
            AND params->>'deviceType' = 'Contactor'
            AND params->>'series' = 'NXC'
            AND (params->>'ac3CurrentA')::numeric >= :req
          ORDER BY (params->>'ac3CurrentA')::numeric ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'req': required_ac3}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    spec = pick_nxc_contactor(motor_kw)
    return {'source': 'synth', 'asset': {
        'partNo': spec['partNo'] if spec else f'NXC-{int(required_ac3)}',
        'discipline': 'electrical',
        'asset_kind': 'component_3d',
        'params': {'deviceType': 'Contactor', 'series': 'NXC',
                   'ac3CurrentA': spec['ac3CurrentA'] if spec else required_ac3,
                   'kwMax400': spec['kwMax400'] if spec else motor_kw,
                   'manufacturer': 'CHINT'}
    }}


def pick_chint_jr36(session, tenant_id: str, motor_kw: float,
                    supply_voltage: str = "3x400") -> Optional[Dict]:
    """CHINT JR36 thermal overload selector — picks a relay whose
    adjustable range brackets the motor FLA.
    """
    from sqlalchemy import text
    if motor_kw <= 0:
        return None
    u = 400.0 if supply_voltage == "3x400" else 230.0
    fla = motor_kw * 1000.0 / (1.732 * u * 0.8)
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'electrical'
            AND asset_kind = 'component_3d'
            AND params->>'deviceType' = 'Overload'
            AND params->>'series' = 'JR36'
            AND (params->>'flMinA')::numeric <= :fla
            AND (params->>'flMaxA')::numeric >= :fla
          ORDER BY
            ((params->>'flMaxA')::numeric - (params->>'flMinA')::numeric) ASC
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'fla': fla}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    part_no = pick_jr36_overload(fla)
    return {'source': 'synth', 'asset': {
        'partNo': part_no,
        'discipline': 'electrical',
        'asset_kind': 'component_3d',
        'params': {'deviceType': 'Overload', 'series': 'JR36', 'fla': fla,
                   'manufacturer': 'CHINT'}
    }}


def pick_energy_meter(session, tenant_id: str,
                      brand: Optional[str] = None) -> Optional[Dict]:
    """3-phase energy meter (CHINT DT862 by default)."""
    from sqlalchemy import text
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'electrical'
            AND asset_kind = 'component_3d'
            AND params->>'deviceType' = 'Meter'
            AND (:brand IS NULL OR params->>'manufacturer' = :brand)
          ORDER BY id
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id,
                                    'brand': brand if brand not in (None, 'NoPref') else None}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    return {'source': 'synth', 'asset': {
        'partNo': 'DT862-4 3x230/400V',
        'discipline': 'electrical',
        'params': {'deviceType': 'Meter', 'manufacturer': brand or 'CHINT'}
    }}


def pick_ct(session, tenant_id: str, ratio: str,
            brand: Optional[str] = None) -> Optional[Dict]:
    """Current transformer by ratio string, e.g. '300/5'."""
    from sqlalchemy import text
    try:
        sql = text("""
          SELECT id, name, params, gltf_key, dim_w_mm, dim_h_mm, dim_d_mm, price_unit
          FROM hnx_rnd_asset
          WHERE tenant_id = :tid
            AND discipline = 'electrical'
            AND asset_kind = 'component_3d'
            AND params->>'deviceType' = 'CT'
            AND params->>'ratio' = :ratio
            AND (:brand IS NULL OR params->>'manufacturer' = :brand)
          LIMIT 1
        """)
        row = session.execute(sql, {'tid': tenant_id, 'ratio': ratio,
                                    'brand': brand if brand not in (None, 'NoPref') else None}).first()
        if row:
            return {'source': 'db', 'asset': dict(row._mapping)}
    except Exception:
        pass
    return {'source': 'synth', 'asset': {
        'partNo': f'LMZJ1-0.5 {ratio}',
        'discipline': 'electrical',
        'params': {'deviceType': 'CT', 'ratio': ratio,
                   'manufacturer': brand or 'CHINT'}
    }}
