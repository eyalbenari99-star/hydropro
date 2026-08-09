"""Engineering reference tables. Single source of truth for motor FLA,
ampacity, contactor categories, overload trip-range matching, and pipe DN.

Sources:
- NEC 430.250 / IEC 60034 for motor FLA.
- IEC 60364-5-52 for ampacity.
- CHINT product catalogs for NXB / NXC / JR36 frame ranges.
- Hazen-Williams approximation for pipe DN sizing.
"""
from typing import Optional, List, Dict, Tuple

# ---- Motor FLA at 400V 3-phase 0.85 pf 0.9 efficiency (rounded to typical NEC/IEC values) ----
# (kW, FLA in A)
MOTOR_FLA_400V_3P: List[Tuple[float, float]] = [
    (0.37, 1.0), (0.55, 1.5), (0.75, 1.8), (1.1, 2.6), (1.5, 3.5),
    (2.2, 4.9), (3.0, 6.6), (4.0, 8.7), (5.5, 11.5), (7.5, 15.5),
    (11, 22), (15, 29), (18.5, 35), (22, 41), (30, 55),
    (37, 67), (45, 80), (55, 97), (75, 130), (90, 153), (110, 188),
    (132, 224), (160, 268), (200, 332), (250, 415), (315, 524)
]

def motor_fla_400v_3p(kw: float) -> float:
    """Return FLA at 400V 3P for the given kW (linear interpolation between table points)."""
    if kw <= 0:
        return 0
    for i in range(len(MOTOR_FLA_400V_3P) - 1):
        kw1, fla1 = MOTOR_FLA_400V_3P[i]
        kw2, fla2 = MOTOR_FLA_400V_3P[i+1]
        if kw1 <= kw <= kw2:
            t = (kw - kw1) / max(kw2 - kw1, 1e-9)
            return fla1 + t * (fla2 - fla1)
    # Out of range — extrapolate from the last 2 points
    kw1, fla1 = MOTOR_FLA_400V_3P[-2]
    kw2, fla2 = MOTOR_FLA_400V_3P[-1]
    slope = (fla2 - fla1) / (kw2 - kw1)
    return fla2 + slope * (kw - kw2)

# ---- IEC 60364-5-52 ampacity (Cu PVC, in air, 30°C, 2 loaded conductors) ----
AMPACITY: List[Tuple[float, float]] = [
    (1.5, 18), (2.5, 24), (4.0, 32), (6.0, 41),
    (10, 57), (16, 76), (25, 101), (35, 125),
    (50, 151), (70, 192), (95, 232), (120, 269),
    (150, 309), (185, 353), (240, 415), (300, 476)
]

def pick_cable_mm2(continuous_a: float, derate: float = 1.0) -> Tuple[float, float]:
    """Smallest standard cable mm² whose derated ampacity ≥ continuous_a.
    derate is the combined correction (grouping, ambient). Returns (mm², ampacity).
    """
    target = continuous_a / max(derate, 0.01)
    for mm2, a in AMPACITY:
        if a >= target:
            return mm2, a
    return AMPACITY[-1]

# ---- NXB-63 frame catalogue (poles, curve, ratings) ----
NXB63_C_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63]
NXB63_D_RATINGS = [16, 20, 25, 32, 40, 50, 63]

def pick_nxb_breaker(poles: int, demand_a: float, curve: str = 'C') -> Optional[str]:
    """Pick the smallest NXB-63 frame whose rating ≥ demand_a."""
    ratings = NXB63_C_RATINGS if curve.upper() == 'C' else NXB63_D_RATINGS
    chosen = next((r for r in ratings if r >= demand_a), None)
    if not chosen:
        return None  # outside NXB-63 range → caller should escalate to MCCB
    return f'NXB-63 {poles}P {curve.upper()}{chosen}'

# ---- NM1 MCCB families ----
NM1_FRAMES = {
    100: [16, 20, 25, 32, 40, 50, 63, 80, 100],
    250: [125, 160, 180, 200, 225, 250],
    400: [250, 315, 400],
    630: [400, 500, 630],
    800: [630, 700, 800],
    1250: [800, 1000, 1250, 1600],
}

def pick_nm1_mccb(poles: int, demand_a: float) -> Optional[str]:
    for frame, ratings in NM1_FRAMES.items():
        chosen = next((r for r in ratings if r >= demand_a), None)
        if chosen and chosen <= frame:
            return f'NM1-{frame}S/3{poles}00 {chosen}A'
    return None

# ---- NXC contactors (AC-3) ----
NXC_TABLE: List[Dict] = [
    {'partNo': 'NXC-09', 'currentA': 9,  'kWMax400': 4.0},
    {'partNo': 'NXC-12', 'currentA': 12, 'kWMax400': 5.5},
    {'partNo': 'NXC-18', 'currentA': 18, 'kWMax400': 7.5},
    {'partNo': 'NXC-25', 'currentA': 25, 'kWMax400': 11},
    {'partNo': 'NXC-32', 'currentA': 32, 'kWMax400': 15},
    {'partNo': 'NXC-38', 'currentA': 38, 'kWMax400': 18.5},
    {'partNo': 'NXC-40', 'currentA': 40, 'kWMax400': 18.5},
    {'partNo': 'NXC-50', 'currentA': 50, 'kWMax400': 22},
    {'partNo': 'NXC-65', 'currentA': 65, 'kWMax400': 30},
    {'partNo': 'NXC-85', 'currentA': 85, 'kWMax400': 37},
    {'partNo': 'NXC-100','currentA': 100,'kWMax400': 45},
    {'partNo': 'NXC-150','currentA': 150,'kWMax400': 75},
]

def pick_nxc_contactor(kw: float, voltage: int = 400) -> Optional[Dict]:
    """Smallest NXC that handles kw at AC-3."""
    for row in NXC_TABLE:
        if row['kWMax400'] >= kw:
            return row
    return NXC_TABLE[-1]

# ---- JR36 overload relay trip ranges ----
JR36_20_RANGES = [
    (0.25, 0.35), (0.35, 0.5), (0.45, 0.72), (0.68, 1.1),
    (1.0, 1.6), (1.4, 2.2), (2.0, 3.2), (2.8, 4.5),
    (4.0, 6.4), (5.5, 9.0), (6.8, 11.0), (9.0, 13.0),
    (12.0, 18.0), (14.0, 22.0), (17.0, 25.0), (20.0, 32.0)
]
JR36_63_RANGES = [(25, 40), (28, 45), (32, 50), (40, 63)]

def pick_jr36_overload(fla: float) -> Optional[str]:
    """Pick the JR36 range that brackets the motor FLA."""
    if fla <= 0:
        return None
    for lo, hi in JR36_20_RANGES:
        if lo <= fla <= hi:
            return f'JR36-20 {lo}-{hi}A'
    for lo, hi in JR36_63_RANGES:
        if lo <= fla <= hi:
            return f'JR36-63 {lo}-{hi}A'
    return None

# ---- Pipe DN sizing (Hazen-Williams simplification) ----
# Standard pipe IDs in mm
DN_TABLE: List[Tuple[int, float]] = [
    (15, 16),   (20, 21.6), (25, 27.2), (32, 35.9),
    (40, 41.8), (50, 53.0), (65, 68.7), (80, 80.7),
    (100, 105.3), (125, 130), (150, 156.3), (200, 207.3), (250, 257.2),
]

def pick_pipe_dn(flow_m3h: float, max_velocity_ms: float = 1.8) -> Tuple[int, float]:
    """Pick the smallest DN whose ID gives velocity ≤ max_velocity_ms at the given flow.

    v (m/s) = Q (m³/s) / A (m²)
            = (flow_m3h / 3600) / (π × (id_mm/2000)² )
    """
    import math
    q_m3s = flow_m3h / 3600.0
    for dn, id_mm in DN_TABLE:
        area_m2 = math.pi * (id_mm / 2000.0) ** 2
        v = q_m3s / area_m2 if area_m2 else 1e9
        if v <= max_velocity_ms:
            return dn, v
    dn, id_mm = DN_TABLE[-1]
    area_m2 = math.pi * (id_mm / 2000.0) ** 2
    return dn, q_m3s / area_m2

# ---- Pump duty point with safety margin ----
def pump_duty(flow_m3h: float, pressure_bar: float, elevation_m: float = 0,
              losses_m: float = 5, flow_margin: float = 1.15, head_margin: float = 1.20) -> Dict:
    """Compute pump duty point: total head = pressure head + static head + losses."""
    pressure_head_m = pressure_bar * 10.197    # 1 bar ≈ 10.197 m of water
    total_head = pressure_head_m + elevation_m + losses_m
    return {
        'flow_design_m3h': round(flow_m3h * flow_margin, 2),
        'head_design_m': round(total_head * head_margin, 1),
        'flow_required_m3h': round(flow_m3h, 2),
        'head_required_m': round(total_head, 1),
        'pressure_head_m': round(pressure_head_m, 1),
        'static_head_m': round(elevation_m, 1),
        'losses_m': round(losses_m, 1),
    }
