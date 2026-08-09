from fastapi import APIRouter, HTTPException
from app.models.cabinet import CabinetSpecV2
import os, requests

router = APIRouter()

@router.post('/ai-render')
def ai_render(spec: CabinetSpecV2):
    key = os.environ.get('OPENAI_API_KEY')
    if not key:
        raise HTTPException(503, 'OPENAI_API_KEY not configured')
    n_sec = len(spec.sections)
    n_dev = sum(len(r.items) for s in spec.sections for r in s.rails)
    prompt = (
        f'Industrial product photograph of a {n_sec}-section electrical cabinet with {n_dev} devices, '
        'CHINT NXB/NXC/JR36 modules, white background, studio lighting, photoreal, technical product photography.'
    )
    r = requests.post(
        'https://api.openai.com/v1/images/generations',
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        json={'model': 'dall-e-3', 'prompt': prompt, 'size': '1024x1024', 'quality': 'standard', 'n': 1},
        timeout=60,
    )
    if not r.ok:
        raise HTTPException(r.status_code, r.text[:400])
    url = r.json().get('data', [{}])[0].get('url')
    return {'url': url}
