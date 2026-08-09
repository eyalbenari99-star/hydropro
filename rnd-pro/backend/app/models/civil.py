"""Civil spec model — minimal greenhouse/structure data model."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class CivilNode(BaseModel):
    id: str
    type: str   # 'column' | 'rafter' | 'purlin' | 'foundation' | 'brace'
    label: str = ''
    xM: float = 0
    yM: float = 0
    zM: float = 0
    profile: Optional[str] = None
    material: Optional[str] = None
    partNo: Optional[str] = None


class CivilEdge(BaseModel):
    fromId: str
    toId: str
    type: str = 'beam'
    lengthM: Optional[float] = None


class CivilSpec(BaseModel):
    title: str = 'Greenhouse structure'
    projectType: str = 'greenhouse'   # 'greenhouse' | 'pump_room' | 'storage'
    spansCount: int = 3
    spanWidthM: float = 8.0
    lengthM: float = 40.0
    frameMaterial: str = 'steel'      # 'steel' | 'aluminum'
    roofType: str = 'gable'           # 'gable' | 'arched' | 'flat'
    bayPitchM: float = 4.0
    nodes: List[CivilNode] = []
    edges: List[CivilEdge] = []
    meta: Dict[str, Any] = Field(default_factory=dict)
