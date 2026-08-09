from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.files import upload_to_r2

router = APIRouter()


@router.post('/uploads/bg')
async def upload_bg_image(file: UploadFile = File(...)):
    """Upload a floor plan PNG/JPG as a board background. Returns the storage key."""
    ext = (file.filename or '').rsplit('.', 1)[-1].lower() if '.' in (file.filename or '') else ''
    if ext not in ('png', 'jpg', 'jpeg'):
        raise HTTPException(400, 'Only PNG/JPG allowed')
    content = await file.read()
    key = upload_to_r2(content, 'rnd-bg', file.filename or 'bg.png')
    return {'imageKey': key, 'filename': file.filename}


@router.post('/uploads/attachment')
async def upload_attachment(file: UploadFile = File(...)):
    """Upload a generic attachment (datasheet, quote, calculation)."""
    content = await file.read()
    key = upload_to_r2(content, 'rnd-attachments', file.filename or 'file')
    return {'attachmentKey': key, 'filename': file.filename, 'sizeBytes': len(content)}
