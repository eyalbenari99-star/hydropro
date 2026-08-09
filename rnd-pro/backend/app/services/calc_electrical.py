"""Per-feeder calculator: motor kW → FLA → breaker / contactor / overload."""
from typing import Dict, Optional
from .engineering_tables import (
    motor_fla_400v_3p, pick_nxb_breaker, pick_nm1_mccb,
    pick_nxc_contactor, pick_jr36_overload, pick_cable_mm2
)

def size_motor_feeder(kw: float, voltage: int = 400, curve: str = 'D',
                       service_factor: float = 1.25) -> Dict:
    """Return a dict containing every device selected for this feeder."""
    fla = motor_fla_400v_3p(kw)
    breaker_demand_a = fla * 2.5             # NEC 430.52 inverse-time × 2.5 for motor branch
    cable_a = fla * service_factor
    breaker = pick_nxb_breaker(3, breaker_demand_a, curve=curve)
    if not breaker:
        breaker = pick_nm1_mccb(3, breaker_demand_a)
    contactor = pick_nxc_contactor(kw, voltage)
    overload = pick_jr36_overload(fla)
    cable_mm2, cable_ampacity = pick_cable_mm2(cable_a)

    return {
        'kw': kw,
        'voltage': voltage,
        'flaA': round(fla, 1),
        'breakerDemandA': round(breaker_demand_a, 1),
        'cableDemandA': round(cable_a, 1),
        'breaker': breaker or 'OUT OF RANGE',
        'contactor': contactor['partNo'] if contactor else 'OUT OF RANGE',
        'overload': overload or 'OUT OF RANGE',
        'cableMm2': cable_mm2,
        'cableAmpacityA': cable_ampacity,
    }

def size_non_motor_feeder(continuous_a: float, voltage: int = 400, curve: str = 'C') -> Dict:
    """Outlets / lighting / general feeders — no motor multiplier."""
    breaker_demand_a = continuous_a * 1.25
    cable_mm2, cable_ampacity = pick_cable_mm2(continuous_a * 1.25)
    breaker = pick_nxb_breaker(3 if continuous_a > 16 else 1, breaker_demand_a, curve=curve)
    if not breaker:
        breaker = pick_nm1_mccb(3, breaker_demand_a)
    return {
        'currentA': continuous_a,
        'voltage': voltage,
        'breakerDemandA': round(breaker_demand_a, 1),
        'breaker': breaker or 'OUT OF RANGE',
        'cableMm2': cable_mm2,
        'cableAmpacityA': cable_ampacity,
    }
