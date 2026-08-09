from typing import List, Optional
from pydantic import BaseModel

class Transform3D(BaseModel):
    x: float = 0
    y: float = 0
    z: float = 0
    rx: float = 0
    ry: float = 0
    rz: float = 0
    sx: float = 1
    sy: float = 1
    sz: float = 1

class Scene3DNode(BaseModel):
    id: str
    assetId: Optional[str] = None   # null → primitive
    primitive: Optional[str] = None  # 'box' | 'cylinder' | 'sphere' | 'line'
    color: Optional[str] = None
    transform: Transform3D = Transform3D()
    children: List['Scene3DNode'] = []
    metadata: Optional[dict] = None

class Scene3D(BaseModel):
    nodes: List[Scene3DNode] = []
    bbox: Optional[List[float]] = None  # [minX,minY,minZ, maxX,maxY,maxZ]
