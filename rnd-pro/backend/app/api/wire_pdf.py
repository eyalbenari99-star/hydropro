from fastapi import APIRouter, Response
from app.models.cabinet import CabinetSpecV2
from app.services.bom import build_wire_pdf

router = APIRouter()

@router.post('/wire-pdf')
def wire_pdf(spec: CabinetSpecV2):
    pdf = build_wire_pdf(spec)
    return Response(content=pdf, media_type='application/pdf')
