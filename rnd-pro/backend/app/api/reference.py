from fastapi import APIRouter

router = APIRouter()

@router.get('/reference')
def reference():
    return {
        'categories': [
            {'id': 'cabinets',       'name': 'Cabinet drawings',    'emoji': '🗄'},
            {'id': 'electrical_ref', 'name': 'Electrical reference','emoji': '⚡'},
            {'id': 'cables',         'name': 'Cable ampacity & IP', 'emoji': '🔌'},
            {'id': 'plumbing',       'name': 'Plumbing & pipes',    'emoji': '💧'},
            {'id': 'calculators',    'name': 'Calculators',         'emoji': '🧮'},
            {'id': 'conversions',    'name': 'Unit conversions',    'emoji': '🔀'},
        ]
    }
