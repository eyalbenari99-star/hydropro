from fastapi import APIRouter, UploadFile, File
from app.services import parser

router = APIRouter()


@router.post('/import-spec')
async def import_spec(file: UploadFile = File(...)):
    """Extract text from an uploaded spec file (PDF/Word/Excel/text/JSON/markdown)
    and return heuristics about which discipline it likely describes.
    """
    content = await file.read()
    text, meta = parser.extract_text_and_meta(file.filename or 'unknown', content)
    return {
        'text': text,
        'maybeCabinet':  meta.get('maybeCabinet', False),
        'maybePlumbing': meta.get('maybePlumbing', False),
        'format':       meta.get('format', 'unknown'),
        'sourceExt':    meta.get('sourceExt', ''),
        'lengthChars':  meta.get('lengthChars', 0),
    }
