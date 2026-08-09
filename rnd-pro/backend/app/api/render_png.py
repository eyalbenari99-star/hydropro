from fastapi import APIRouter, Response
from app.models.cabinet import CabinetSpecV2
from app.services.renderer import render_cabinet_png

router = APIRouter()

@router.post('/render-png')
def render_png(spec: CabinetSpecV2):
    png_bytes = render_cabinet_png(spec)
    return Response(content=png_bytes, media_type='image/png')
