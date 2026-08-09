from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services import parser

router = APIRouter()


@router.post('/parse-cabinet-and-create-board')
def parse_cabinet_and_create_board(body: Dict[str, Any]):
    text = body.get('text', '')
    fmt  = body.get('format', 'unknown')
    if not text:
        raise HTTPException(400, 'text is required')
    spec = parser.parse_cabinet_text(text, fmt)
    item_id = f'item_{abs(hash(text)) % 100000000:08d}'
    return {'itemId': item_id,
            'spec': spec.model_dump() if hasattr(spec, 'model_dump') else spec}


@router.post('/parse-plumbing-and-create-board')
def parse_plumbing_and_create_board(body: Dict[str, Any]):
    text = body.get('text', '')
    fmt  = body.get('format', 'unknown')
    if not text:
        raise HTTPException(400, 'text is required')
    spec = parser.parse_plumbing_text(text, fmt)
    item_id = f'item_{abs(hash(text)) % 100000000:08d}'
    return {'itemId': item_id,
            'spec': spec.model_dump() if hasattr(spec, 'model_dump') else spec}
