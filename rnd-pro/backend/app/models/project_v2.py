"""Typed contracts for the reviewable R&D cockpit and governed Nexi actions.

These models are intentionally transport-focused. Persistence models should be
generated separately so API compatibility is not coupled to one ORM strategy.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AutonomyMode(str, Enum):
    copilot = "copilot"
    supervised = "supervised"
    maximum = "maximum"


class RiskClass(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    safety_critical = "safety_critical"


class ProjectSummary(BaseModel):
    id: str
    code: str
    title: str
    site: str
    discipline: str
    phase: str
    progress: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    status: Literal["Nominal", "Watch", "Critical", "For review"]
    open_risks: int = Field(ge=0)
    pending_approvals: int = Field(ge=0)
    tasks_due: int = Field(ge=0)
    budget_used: float = Field(ge=0)
    budget_total: float = Field(ge=0)
    owner: str
    updated_at: datetime


class CockpitMetric(BaseModel):
    key: str
    label: str
    value: str
    detail: str
    severity: Literal["nominal", "information", "warning", "critical"] = "nominal"


class CockpitSummary(BaseModel):
    generated_at: datetime
    portfolio_confidence: int = Field(ge=0, le=100)
    metrics: list[CockpitMetric]
    projects: list[ProjectSummary]
    required_decisions: int = Field(ge=0)
    source_versions: dict[str, str]


class EvidenceRef(BaseModel):
    id: str
    title: str
    authority: Literal["law", "client", "company", "manufacturer", "professional", "project"]
    source_locator: str
    source_version: str | None = None
    accessed_at: datetime
    claim: str


class AssumptionRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    statement: str
    basis: str
    risk: RiskClass
    confidence: float = Field(ge=0, le=1)
    verification_task: str | None = None


class EngineeringFinding(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    severity: Literal["critical", "warning", "opportunity", "information"]
    title: str
    detail: str
    recommendation: str
    confidence: float = Field(ge=0, le=1)
    evidence: list[EvidenceRef] = Field(default_factory=list)
    affected_object_ids: list[str] = Field(default_factory=list)


class AnalyzePlanRequest(BaseModel):
    source_revision_id: str
    autonomy_mode: AutonomyMode = AutonomyMode.supervised
    discipline: str
    jurisdiction: str = "Philippines"
    user_instruction: str | None = None
    skip_questions: bool = False


class AnalyzePlanResponse(BaseModel):
    analysis_id: UUID = Field(default_factory=uuid4)
    project_id: str
    source_revision_id: str
    status: Literal["complete", "needs_input", "blocked"]
    summary: str
    findings: list[EngineeringFinding]
    assumptions: list[AssumptionRecord]
    required_approvals: list[str]
    audit_ref: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SceneOperation(BaseModel):
    operation: Literal["create", "update", "delete", "move", "resize", "rotate", "connect"]
    object_id: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    reason: str


class ChangeSetPreviewRequest(BaseModel):
    project_id: str
    base_revision_id: str
    operations: list[SceneOperation]
    requested_by: str
    autonomy_mode: AutonomyMode = AutonomyMode.supervised


class ChangeSetPreview(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    project_id: str
    base_revision_id: str
    operations: list[SceneOperation]
    risk_class: RiskClass
    requires_confirmation: bool
    required_approvals: list[str]
    affected_outputs: list[str]
    rollback_available: bool = True
    audit_ref: str
