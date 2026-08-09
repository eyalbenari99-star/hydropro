from fastapi import APIRouter
from app.models.cabinet import CabinetSpecV2
from app.services.dxf import build_dxf

router = APIRouter()

@router.post('/export-dxf')
def export_dxf(spec: CabinetSpecV2):
    return {'dxf': build_dxf(spec)}
