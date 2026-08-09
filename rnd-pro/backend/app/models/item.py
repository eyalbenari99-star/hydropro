from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class Item(BaseModel):
    id: str
    tenantId: str
    title: str
    description: Optional[str] = None
    subjectId: Optional[str] = None
    projectId: Optional[str] = None
    type: str = 'quick_board'
    status: str = 'Draft'
    version: int = 1
    spec: Optional[Any] = None
    scene: Any
    createdAt: datetime
    updatedAt: datetime
