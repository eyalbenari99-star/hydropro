"""Plumbing asset selector — uses pump duty point and pipe DN from engineering_tables."""
from typing import Optional, Dict
from app.models.plumbing import PlumbNode
from .engineering_tables import pick_pipe_dn

def pick_asset(session, node: PlumbNode, tenant_id: str) -> Optional[Dict]:
    if node.type == 'pump':
        return {
            'source': 'rule',
            'criteria': {'type': 'pump', 'flow_m3h_min': node.flowM3h, 'head_m_min': node.pressureBar * 10},
            'recommended_kw': _pump_kw(node.flowM3h or 0, (node.pressureBar or 0) * 10)
        }
    if node.type == 'valve':
        return {
            'source': 'rule',
            'criteria': {
                'type': 'valve', 'dn': node.dnMm, 'pn_min': node.pnBar or 10,
                'material': node.material or 'brass'
            }
        }
    if node.type == 'filter':
        return {'source': 'rule', 'criteria': {'type': 'filter', 'flow_m3h_min': node.flowM3h}}
    if node.type == 'tank':
        return {'source': 'rule', 'criteria': {'type': 'tank'}}
    if node.type == 'manifold':
        return {'source': 'rule', 'criteria': {'type': 'manifold', 'dn': node.dnMm}}
    return None

def _pump_kw(flow_m3h: float, head_m: float, efficiency: float = 0.65) -> float:
    """Pump power: P (kW) = ρ × g × Q × H / (1000 × η)
       = 1000 × 9.81 × (Q m³/s) × H / (1000 × η)
       ≈ 0.00272 × Q(m³/h) × H(m) / η
    """
    q = flow_m3h / 3600.0
    return round((1000 * 9.81 * q * head_m) / (1000 * efficiency), 2)
