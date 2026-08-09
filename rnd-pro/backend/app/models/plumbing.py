from typing import List, Optional, Literal
from pydantic import BaseModel

PlumbNodeKind = Literal['source','tank','pump','filter','valve','manifold','dripper','sensor','outlet']

class PlumbNode(BaseModel):
    id: str
    type: PlumbNodeKind
    label: str
    flowM3h: Optional[float] = None
    pressureBar: Optional[float] = None
    dnMm: Optional[int] = None
    pnBar: Optional[int] = None
    material: Optional[str] = None
    assetId: Optional[str] = None

class PlumbEdge(BaseModel):
    fromId: str
    toId: str
    pipeAssetId: Optional[str] = None
    lengthM: Optional[float] = None

class PlumbingSpec(BaseModel):
    specType: Literal['plumbing'] = 'plumbing'
    specVersion: Literal[1] = 1
    title: str
    zones: int = 1
    nodes: List[PlumbNode] = []
    edges: List[PlumbEdge] = []
