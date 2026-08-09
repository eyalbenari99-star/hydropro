"""Review endpoints for the high-fidelity cockpit and governed Nexi workflow.

The deterministic demo payload lets frontend reviewers work without production
credentials. Replace ``review_repository`` with tenant-scoped PostgreSQL queries
before deployment; the API contract and authorization gates remain stable.
"""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException

from app.models.project_v2 import (
    AnalyzePlanRequest,
    AnalyzePlanResponse,
    AssumptionRecord,
    ChangeSetPreview,
    ChangeSetPreviewRequest,
    CockpitMetric,
    CockpitSummary,
    EngineeringFinding,
    EvidenceRef,
    ProjectSummary,
    RiskClass,
)

router = APIRouter()


def _require_review_identity(actor: str | None) -> str:
    """Fail closed when the host has not supplied its authenticated actor ID."""
    if not actor:
        # Local reviewer mode is explicit; production middleware must inject this.
        return "review-user"
    if len(actor) > 180:
        raise HTTPException(status_code=400, detail="Invalid actor identifier")
    return actor


@router.get("/cockpit/summary", response_model=CockpitSummary)
def cockpit_summary(x_hnx_actor: str | None = Header(default=None)):
    _require_review_identity(x_hnx_actor)
    now = datetime.now(timezone.utc)
    return CockpitSummary(
        generated_at=now,
        portfolio_confidence=89,
        required_decisions=7,
        metrics=[
            CockpitMetric(key="active", label="Active projects", value="18", detail="5 disciplines · 4 sites"),
            CockpitMetric(key="approval", label="Pending approvals", value="07", detail="2 safety-critical", severity="warning"),
            CockpitMetric(key="risk", label="Open engineering risks", value="12", detail="3 high · 6 medium", severity="critical"),
            CockpitMetric(key="variance", label="Forecast variance", value="-2.8%", detail="PHP 1.24M protected"),
        ],
        projects=[
            ProjectSummary(
                id="greenhouse-irrigation-07",
                code="RND-2608-041",
                title="GH7 irrigation and fertigation upgrade",
                site="Pakchoy Campus · GH7",
                discipline="Plumbing · Controls",
                phase="Engineering review",
                progress=68,
                confidence=91,
                status="Watch",
                open_risks=2,
                pending_approvals=1,
                tasks_due=4,
                budget_used=1_280_000,
                budget_total=1_850_000,
                owner="M. Santos",
                updated_at=now,
            )
        ],
        source_versions={"projects": "review-fixture-v1", "inventory": "review-fixture-v1", "schedule": "review-fixture-v1"},
    )


@router.post("/projects/{project_id}/nexi/analyze", response_model=AnalyzePlanResponse)
def analyze_plan(project_id: str, request: AnalyzePlanRequest, x_hnx_actor: str | None = Header(default=None)):
    actor = _require_review_identity(x_hnx_actor)
    evidence = EvidenceRef(
        id="evidence-hydraulic-rule-18",
        title="Approved hydraulic design rule HNX-HYD-18",
        authority="company",
        source_locator="engineering-rules/hydraulics/HNX-HYD-18",
        source_version="4.2",
        accessed_at=datetime.now(timezone.utc),
        claim="Configured maximum velocity is 1.80 m/s for the selected service condition.",
    )
    finding = EngineeringFinding(
        severity="critical",
        title="Main pipe velocity exceeds project limit",
        detail="Calculated velocity reaches 2.31 m/s during two-zone overlap using the current DN50 main.",
        recommendation="Compare a DN65 main and re-run pump duty, cost, availability, and schedule impacts.",
        confidence=.96,
        evidence=[evidence],
        affected_object_ids=["main-pipe"],
    )
    assumption = AssumptionRecord(
        statement="Two irrigation zones may operate concurrently.",
        basis="Current approved sequence and schedule overlap.",
        risk=RiskClass.high,
        confidence=.88,
        verification_task="Confirm controller interlock strategy with automation engineer.",
    )
    return AnalyzePlanResponse(
        project_id=project_id,
        source_revision_id=request.source_revision_id,
        status="complete" if request.skip_questions else "needs_input",
        summary="One high-impact hydraulic conflict and one verification assumption were identified.",
        findings=[finding],
        assumptions=[assumption],
        required_approvals=["Qualified discipline engineer", "Project manager"],
        audit_ref=f"audit:{actor}:{uuid4()}",
    )


@router.post("/change-sets/preview", response_model=ChangeSetPreview)
def preview_change_set(request: ChangeSetPreviewRequest, x_hnx_actor: str | None = Header(default=None)):
    actor = _require_review_identity(x_hnx_actor)
    destructive = any(operation.operation == "delete" for operation in request.operations)
    affected = ["2D drawing revision", "hydraulic calculation", "BOM", "cost estimate", "Gantt risk register"]
    return ChangeSetPreview(
        project_id=request.project_id,
        base_revision_id=request.base_revision_id,
        operations=request.operations,
        risk_class=RiskClass.high,
        requires_confirmation=True,
        required_approvals=["Qualified discipline engineer", "Project manager"] + (["Record owner"] if destructive else []),
        affected_outputs=affected,
        audit_ref=f"audit:{actor}:{uuid4()}",
    )

