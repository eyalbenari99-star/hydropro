from fastapi import APIRouter
from typing import Dict, Any
from app.services import bom, dxf, renderer
from app.services.files import upload_to_r2

router = APIRouter()


@router.post('/items/{item_id}/submit')
def submit_item(item_id: str, spec: Dict[str, Any]):
    """Build a submission package: PNG + BOM XLSX + Panel PDF + DXF.
    Each artifact uploaded; storage keys returned. Errors are non-fatal per artifact.
    """
    out: Dict[str, Any] = {'itemId': item_id, 'attachments': {}, 'errors': {}}
    prefix = f'rnd-exports/{item_id}'

    for name, ext, mime_check, builder in [
        ('png',  'png',  None, lambda: renderer.render_item_to_png(spec)),
        ('xlsx', 'xlsx', None, lambda: bom.generate_bom_xlsx(spec)),
        ('pdf',  'pdf',  None, lambda: bom.generate_panel_pdf(spec)),
        ('dxf',  'dxf',  None, lambda: dxf.export_dxf(spec)),
    ]:
        try:
            content = builder()
            key = upload_to_r2(content, prefix, f'{item_id}.{ext}')
            out['attachments'][name] = {'key': key, 'sizeBytes': len(content)}
        except Exception as e:
            out['errors'][name] = str(e)

    out['status'] = 'Submitted'
    return out
