from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from app.models.cabinet import CabinetSpecV2, Section, Rail, DeviceV2, CabinetMeta
from app.models.plumbing import PlumbingSpec, PlumbNode, PlumbEdge
from app.services.calc_electrical import size_motor_feeder, size_non_motor_feeder
from app.services.calc_plumbing import size_plumbing_system

router = APIRouter()

class Feeder(BaseModel):
    label: str
    kind: str  # 'pump' | 'fan' | 'machine' | 'outlet' | 'lighting'
    count: int = 1
    kw: float = 0
    current_a: float = 0
    voltage: str = '400V'

class ElectricalSubmission(BaseModel):
    title: str = ''
    application_type: str
    supply_voltage: str
    short_circuit_ka: int = 10
    main_breaker_a: int = 500
    has_metering: bool = True
    has_surge_protection: bool = False
    cabinet_enclosure: str = 'IP54'
    preferred_manufacturer: str = 'chint'
    include_plc: bool = False
    feeders: List[Feeder] = []

class PlumbingSubmission(BaseModel):
    title: str = ''
    system_type: str
    source_type: str
    zones_count: int = 4
    total_flow_m3h: float = 12
    working_pressure_bar: float = 3.5
    elevation_m: float = 0
    filter_micron: int = 130
    has_fertigation: bool = True
    fert_drums_count: int = 2
    has_dosing_unit: bool = True
    has_ec_ph_sensors: bool = True
    pipe_material: str = 'pe'
    max_velocity_ms: float = 1.8


@router.get('/wizards/{discipline}/questions')
def get_questions(discipline: str):
    import os, json
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', f'{discipline}_question_set.json'))
    if not os.path.exists(path):
        raise HTTPException(404, f'No question set for {discipline}')
    return json.load(open(path))


@router.post('/wizards/electrical/build')
def electrical_build(sub: ElectricalSubmission) -> Dict[str, Any]:
    """Returns { spec, computed } so the UI can show engineering math."""
    voltage_int = 400 if '400' in sub.supply_voltage else (380 if '380' in sub.supply_voltage else (480 if '480' in sub.supply_voltage else 230))

    main_sec = Section(id='SEC_MAIN', label='Main incomer & metering', type='power', color='#1f2937', rails=[
        Rail(id='R_MAIN', label='Main + busbars', railType='DIN', bus=True,
             busPhases=['L1','L2','L3','N','PE'],
             items=[DeviceV2(id='QF_main', sym='MCCB 3P', kind='mccb',
                             label=f'Main · {sub.main_breaker_a}A',
                             ref='QF', rating=f'{sub.main_breaker_a} A', poles=3,
                             manufacturer='CHINT', partNo=f'NM1-630S/3300 {sub.main_breaker_a}A')])
    ])
    if sub.has_metering:
        main_sec.rails.append(Rail(id='R_METER', label='CTs & meter', railType='DIN', items=[
            DeviceV2(id='CT_L1', sym='CT', kind='ct', label='CT L1', ref='1Ta', rating=f'{sub.main_breaker_a}/5'),
            DeviceV2(id='CT_L2', sym='CT', kind='ct', label='CT L2', ref='1Tb', rating=f'{sub.main_breaker_a}/5'),
            DeviceV2(id='CT_L3', sym='CT', kind='ct', label='CT L3', ref='1Tc', rating=f'{sub.main_breaker_a}/5'),
            DeviceV2(id='WH',    sym='Wh', kind='meter', label='DT862', ref='Wh', rating='1.5(6)A')
        ]))

    # ---- Per-feeder sizing ----
    feeder_breakers, feeder_contactors, feeder_overloads = [], [], []
    computed_feeders = []
    ref_idx = 0
    for feeder in sub.feeders:
        for inst in range(feeder.count):
            ref_idx += 1
            ref = f'{ref_idx}QF'
            if feeder.kind in ('pump', 'fan', 'machine'):
                sz = size_motor_feeder(feeder.kw, voltage_int)
                feeder_breakers.append(DeviceV2(
                    id=f'F{ref_idx}_QF', sym='MCB 3P', kind='breaker',
                    label=f'{feeder.label} {inst+1}' if feeder.count > 1 else feeder.label,
                    ref=ref, rating=sz['breaker'], poles=3,
                    manufacturer='CHINT', partNo=sz['breaker']
                ))
                feeder_contactors.append(DeviceV2(
                    id=f'F{ref_idx}_KM', sym='Contactor', kind='contactor',
                    label=f'{feeder.label} contactor',
                    ref=f'{ref_idx}KM', rating=sz['contactor'],
                    manufacturer='CHINT', partNo=sz['contactor']
                ))
                if sz['overload'] != 'OUT OF RANGE':
                    feeder_overloads.append(DeviceV2(
                        id=f'F{ref_idx}_FR', sym='Overload relay', kind='overload',
                        label=f'{feeder.label} overload',
                        ref=f'{ref_idx}FR', rating=sz['overload'],
                        manufacturer='CHINT', partNo=sz['overload']
                    ))
                computed_feeders.append({'ref': ref, 'label': feeder.label, **sz})
            else:
                sz = size_non_motor_feeder(feeder.current_a or 16, voltage_int, curve='C')
                kind = 'rcbo' if feeder.kind == 'outlet' else 'breaker'
                sym = 'RCBO 2P' if kind == 'rcbo' else 'MCB 3P'
                feeder_breakers.append(DeviceV2(
                    id=f'F{ref_idx}_QF', sym=sym, kind=kind,
                    label=f'{feeder.label} {inst+1}' if feeder.count > 1 else feeder.label,
                    ref=ref, rating=sz['breaker'], poles=(2 if kind == 'rcbo' else 3),
                    manufacturer='CHINT', partNo=sz['breaker']
                ))
                computed_feeders.append({'ref': ref, 'label': feeder.label, **sz})

    feeder_rails = [Rail(id='R_FB', label='Feeder MCBs', railType='DIN', items=feeder_breakers)]
    if feeder_contactors: feeder_rails.append(Rail(id='R_KM', label='Contactors', railType='DIN', items=feeder_contactors))
    if feeder_overloads:  feeder_rails.append(Rail(id='R_FR', label='Overload relays', railType='DIN', items=feeder_overloads))
    feeder_sec = Section(id='SEC_FEEDERS', label='Feeders', type='power', color='#2563eb', rails=feeder_rails)

    spec = CabinetSpecV2(
        title=sub.title or f'{sub.supply_voltage} cabinet',
        subtitle=f'Wizard · {sub.supply_voltage} · {sub.main_breaker_a}A main · {len(computed_feeders)} feeders',
        cabinet=CabinetMeta(enclosureType=sub.cabinet_enclosure),
        sections=[main_sec, feeder_sec]
    )

    return {
        'spec': spec.model_dump(),
        'computed': {
            'voltage': voltage_int,
            'main_breaker_a': sub.main_breaker_a,
            'short_circuit_ka': sub.short_circuit_ka,
            'feeders': computed_feeders,
            'totals': {
                'feeder_count': len(computed_feeders),
                'total_design_kw': round(sum(f.get('kw', 0) * (1) for f in computed_feeders), 2)
            }
        }
    }


@router.post('/wizards/plumbing/build')
def plumbing_build(sub: PlumbingSubmission) -> Dict[str, Any]:
    """Returns { spec, computed } with pump duty point, pipe DN, filter sizing."""
    computed = size_plumbing_system(sub.model_dump())

    nodes = [
        PlumbNode(id='SRC', type='source', label=sub.source_type.replace('_', ' ').title(),
                  flowM3h=sub.total_flow_m3h, pressureBar=sub.working_pressure_bar),
        PlumbNode(id='PUMP_MAIN', type='pump', label=f"Main pump · {computed['pump']['flow_design_m3h']} m³/h × {computed['pump']['head_design_m']} m",
                  flowM3h=computed['pump']['flow_design_m3h'], pressureBar=computed['pump']['head_design_m'] / 10.197),
        PlumbNode(id='FLT_MAIN', type='filter', label=f"Main filter · {computed['filtration']['micron']} µm",
                  flowM3h=computed['pump']['flow_design_m3h'])
    ]
    edges = [
        PlumbEdge(fromId='SRC', toId='PUMP_MAIN'),
        PlumbEdge(fromId='PUMP_MAIN', toId='FLT_MAIN')
    ]

    if sub.has_fertigation:
        for i in range(sub.fert_drums_count):
            nodes.append(PlumbNode(id=f'DRUM_{i+1}', type='tank', label=f'Fertilizer drum {chr(65+i)} 200L'))
        nodes.append(PlumbNode(id='ACID', type='tank', label='Acid drum'))
        if sub.has_dosing_unit:
            nodes.append(PlumbNode(id='DOSE_UNIT', type='pump', label='Dosing unit'))
            for i in range(sub.fert_drums_count):
                edges.append(PlumbEdge(fromId=f'DRUM_{i+1}', toId='DOSE_UNIT'))
            edges.append(PlumbEdge(fromId='ACID', toId='DOSE_UNIT'))
            edges.append(PlumbEdge(fromId='DOSE_UNIT', toId='FLT_MAIN'))

    if sub.has_ec_ph_sensors:
        nodes.append(PlumbNode(id='EC', type='sensor', label='EC sensor'))
        nodes.append(PlumbNode(id='PH', type='sensor', label='pH sensor'))
        edges += [PlumbEdge(fromId='FLT_MAIN', toId='EC'), PlumbEdge(fromId='EC', toId='PH')]
        last_node = 'PH'
    else:
        last_node = 'FLT_MAIN'

    nodes.append(PlumbNode(id='MAN', type='manifold',
                           label=f"Manifold · DN{computed['mainPipe']['dn']} · {sub.zones_count} ports",
                           dnMm=computed['mainPipe']['dn']))
    edges.append(PlumbEdge(fromId=last_node, toId='MAN'))
    for z in range(sub.zones_count):
        zid = f'Z{z+1}'
        nodes.append(PlumbNode(id=f'V_{zid}', type='valve',
                               label=f'Zone {z+1} valve · DN{computed["zonePipe"]["dn"]}',
                               dnMm=computed['zonePipe']['dn'], pnBar=10))
        nodes.append(PlumbNode(id=f'OUT_{zid}', type='outlet', label=f'Zone {z+1}'))
        edges += [
            PlumbEdge(fromId='MAN', toId=f'V_{zid}', lengthM=computed['mainPipe']['dn'] * 0.1),
            PlumbEdge(fromId=f'V_{zid}', toId=f'OUT_{zid}')
        ]

    spec = PlumbingSpec(title=sub.title or 'Fertigation plant',
                        zones=sub.zones_count, nodes=nodes, edges=edges)

    return {
        'spec': spec.model_dump(),
        'computed': computed
    }


class CivilSubmission(BaseModel):
    title: str = ''
    project_type: str = 'greenhouse'
    spans_count: int = 3
    span_width_m: float = 8
    length_m: float = 40
    frame_material: str = 'steel'
    roof_type: str = 'gable'
    design_loads: str = ''


@router.post('/wizards/civil/build')
def civil_build(sub: CivilSubmission) -> Dict[str, Any]:
    """Returns { spec, computed } for a civil structure."""
    from app.services.calc_civil import build_civil_spec
    spec = build_civil_spec(sub.model_dump())
    return {
        'spec': spec.model_dump(),
        'computed': {
            'totalAreaM2': spec.meta.get('totalAreaM2'),
            'baysCount': spec.meta.get('baysCount'),
            'bayPitchM': round(spec.bayPitchM, 2),
            'eaveHeightM': spec.meta.get('eaveHeightM'),
            'ridgeHeightM': spec.meta.get('ridgeHeightM'),
            'totals': {
                'columns': spec.meta.get('totalColumns'),
                'rafters': spec.meta.get('totalRafters'),
                'purlins': spec.meta.get('totalPurlins'),
                'foundations': spec.meta.get('totalFoundations'),
            }
        }
    }
