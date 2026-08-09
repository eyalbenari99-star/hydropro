from fastapi import APIRouter, Query
from app.models.asset import Asset
from typing import Optional

router = APIRouter()

# TODO(14.7, 14.8): wire to Postgres + R2 for blobs
_DB: dict[str, Asset] = {}

@router.get('/assets', response_model=list[Asset])
def list_assets(domain: Optional[str] = Query(None), search: Optional[str] = Query(None)):
    out = list(_DB.values())
    if domain:
        out = [a for a in out if a.domain == domain]
    if search:
        q = search.lower()
        out = [a for a in out if q in a.name.lower()]
    return out

@router.post('/assets', response_model=Asset)
def create_asset(asset: Asset):
    _DB[asset.id] = asset
    return asset
