from typing import List, Optional, Literal
from pydantic import BaseModel

class DeviceV2(BaseModel):
    id: str
    sym: str
    assetId: Optional[str] = None
    kind: str
    label: str
    ref: str
    rating: Optional[str] = None
    poles: Optional[int] = None
    cableTag: Optional[str] = None
    wireColorSet: Optional[str] = None
    voltage: Optional[str] = None
    manufacturer: Optional[str] = None
    partNo: Optional[str] = None
    positionIndex: Optional[int] = None
    status: Optional[str] = None

class Rail(BaseModel):
    id: str
    label: str
    wireSize: Optional[str] = None
    railType: str = 'DIN'
    bus: bool = False
    busPhases: Optional[List[str]] = None
    items: List[DeviceV2] = []

class Section(BaseModel):
    id: str
    label: str
    type: Literal['power', 'control', 'terminals']
    color: str
    rails: List[Rail] = []

class CabinetMeta(BaseModel):
    widthMm: int = 1000
    heightMm: int = 2000
    depthMm: int = 400
    enclosureType: Optional[str] = 'IP54'
    manufacturer: Optional[str] = None
    partNo: Optional[str] = None

class CabinetSpecV2(BaseModel):
    specType: Literal['cabinet'] = 'cabinet'
    specVersion: Literal[2] = 2
    title: str
    subtitle: Optional[str] = ''
    cabinet: CabinetMeta = CabinetMeta()
    sections: List[Section] = []
    notes: Optional[str] = ''
