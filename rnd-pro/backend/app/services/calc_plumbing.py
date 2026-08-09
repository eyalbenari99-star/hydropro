"""Per-system calculator: flow / pressure / source → pump duty / pipe DN / filter."""
from typing import Dict
from .engineering_tables import pump_duty, pick_pipe_dn

def size_plumbing_system(answers: Dict) -> Dict:
    flow = float(answers.get('total_flow_m3h', 12))
    pressure = float(answers.get('working_pressure_bar', 3.5))
    elevation = float(answers.get('elevation_m', 0))
    losses = float(answers.get('estimated_losses_m', 5))
    max_vel = float(answers.get('max_velocity_ms', 1.8))

    duty = pump_duty(flow, pressure, elevation, losses)
    main_dn, main_vel = pick_pipe_dn(duty['flow_design_m3h'], max_vel)

    # Per-zone: divide design flow by number of zones, pick smaller DN
    zones = int(answers.get('zones_count', 4))
    zone_flow = duty['flow_design_m3h'] / max(zones, 1)
    zone_dn, zone_vel = pick_pipe_dn(zone_flow, max_vel)

    filter_micron = int(answers.get('filter_micron', 130))

    return {
        'pump': duty,
        'mainPipe': {
            'dn': main_dn, 'velocityMs': round(main_vel, 2),
            'material': answers.get('pipe_material', 'pe')
        },
        'zonePipe': {
            'dn': zone_dn, 'velocityMs': round(zone_vel, 2),
            'flowPerZoneM3h': round(zone_flow, 2)
        },
        'filtration': {
            'micron': filter_micron,
            'flowM3h': duty['flow_design_m3h'],
            'kind': 'disc' if filter_micron >= 50 else 'sand+disc'
        },
        'zones': zones,
    }
