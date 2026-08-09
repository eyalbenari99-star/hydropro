from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel

Discipline = Literal['electrical','plumbing','civil']

class WizardAnswer(BaseModel):
    questionId: str
    value: Any

class WizardSession(BaseModel):
    id: Optional[str] = None
    tenantId: str
    discipline: Discipline
    answers: Dict[str, Any] = {}
    status: Literal['draft','complete','abandoned'] = 'draft'

class WizardSubmission(BaseModel):
    discipline: Discipline
    answers: Dict[str, Any]
    title: Optional[str] = None
