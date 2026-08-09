from fastapi import APIRouter, HTTPException
from app.models.item import Item

router = APIRouter()

# TODO(14.4, 14.5): wire to Postgres via SQLAlchemy
_DB: dict[str, Item] = {}

@router.get('/items', response_model=list[Item])
def list_items():
    return list(_DB.values())

@router.post('/items', response_model=Item)
def create_item(item: Item):
    _DB[item.id] = item
    return item

@router.get('/items/{item_id}', response_model=Item)
def get_item(item_id: str):
    if item_id not in _DB:
        raise HTTPException(404, 'Item not found')
    return _DB[item_id]

@router.put('/items/{item_id}', response_model=Item)
def update_item(item_id: str, item: Item):
    _DB[item_id] = item
    return item

@router.delete('/items/{item_id}')
def delete_item(item_id: str):
    _DB.pop(item_id, None)
    return {'ok': True}
