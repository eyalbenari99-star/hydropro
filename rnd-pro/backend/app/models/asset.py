from typing import Optional, List, Any
from pydantic import BaseModel

class Asset(BaseModel):
    id: str
    tenantId: str
    kind: str = 'symbol'
    domain: str
    name: str
    description: Optional[str] = None
    svg: Optional[str] = None
    rasterKey: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    standard: Optional[str] = None
    meta: Any = None
