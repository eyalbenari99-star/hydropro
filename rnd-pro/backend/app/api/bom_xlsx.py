from fastapi import APIRouter, Response
from app.models.cabinet import CabinetSpecV2
from app.services.bom import build_bom_xlsx

router = APIRouter()

@router.post('/bom-xlsx')
def bom_xlsx(spec: CabinetSpecV2):
    blob = build_bom_xlsx(spec)
    return Response(content=blob, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
