"""DXF R12 ASCII exporter from CabinetSpecV2 or flat device spec.
Mirrors the v4.54-rnd injection's DXF builder so client and server stay in sync.
"""
from typing import Dict, Any, List

KIND_LAYER = {
    'breaker': 'BREAKER', 'mcb': 'BREAKER', 'mccb': 'BREAKER',
    'contactor': 'CONTACTOR',
    'overload': 'OVERLOAD',
    'relay': 'CONTROL', 'plc': 'CONTROL', 'psu': 'CONTROL',
    'terminal': 'CONTROL', 'spd': 'CONTROL',
    'meter': 'METER',
    'ct': 'CT',
}


def export_dxf(spec: Dict[str, Any]) -> bytes:
    """Return DXF bytes for the given spec. Accepts either:
       - flat 3D-style spec {enclosure:{widthMM,heightMM}, devices:[{xMM,yMM,wMM,hMM,kind,...}]}
       - CabinetSpecV2 {cabinet:{...}, sections:[{rails:[{items:[...]}]}]}
    """
    enc = spec.get('enclosure') or spec.get('cabinet') or {}
    W = float(enc.get('widthMM', 1200))
    H = float(enc.get('heightMM', 2200))
    out: List[str] = []

    def emit(*xs):
        for x in xs:
            out.append(str(x))

    # HEADER
    emit('0','SECTION','2','HEADER',
         '9','$ACADVER','1','AC1009',
         '9','$EXTMIN','10','0','20','0','30','0',
         '9','$EXTMAX','10', W,'20', H,'30','0',
         '0','ENDSEC')

    # TABLES (layers)
    emit('0','SECTION','2','TABLES','0','TABLE','2','LAYER','70','8')
    for name, color in [
        ('ENCLOSURE', 4), ('BREAKER', 1), ('CONTACTOR', 2), ('OVERLOAD', 40),
        ('CONTROL', 5), ('METER', 6), ('CT', 8), ('LABEL', 7), ('DEVICE', 7),
    ]:
        emit('0','LAYER','2',name,'70','0','62',color,'6','CONTINUOUS')
    emit('0','ENDTAB','0','ENDSEC')

    # ENTITIES
    emit('0','SECTION','2','ENTITIES')

    def rect(layer, x, y, w, h):
        x2, y2 = x + w, y + h
        emit('0','LINE','8',layer,'10',x,  '20',y,  '30','0', '11',x2, '21',y,  '31','0')
        emit('0','LINE','8',layer,'10',x2, '20',y,  '30','0', '11',x2, '21',y2, '31','0')
        emit('0','LINE','8',layer,'10',x2, '20',y2, '30','0', '11',x,  '21',y2, '31','0')
        emit('0','LINE','8',layer,'10',x,  '20',y2, '30','0', '11',x,  '21',y,  '31','0')

    def text(layer, x, y, hh, value):
        emit('0','TEXT','8',layer,'10',x,'20',y,'30','0','40',hh,'1', str(value or ''))

    # Enclosure
    rect('ENCLOSURE', 0, 0, W, H)
    rect('ENCLOSURE', 20, 20, W - 40, H - 40)
    text('LABEL', 40, H - 38, 20, spec.get('title', 'Cabinet'))
    if spec.get('subtitle'):
        text('LABEL', 40, H - 60, 10, spec['subtitle'])

    # Devices: flat list (preferred) OR derive from sections/rails
    if 'devices' in spec:
        for d in spec.get('devices', []):
            x = float(d.get('xMM', 0))
            y = H - (float(d.get('yMM', 0)) + float(d.get('hMM', 100)))
            w_ = float(d.get('wMM', 100))
            h_ = float(d.get('hMM', 100))
            layer = KIND_LAYER.get(d.get('kind', 'breaker'), 'DEVICE')
            rect(layer, x, y, w_, h_)
            text('LABEL', x + 4, y + h_ - 14, 8, d.get('ref', ''))
            if d.get('label'):
                text('LABEL', x + 4, y + 4, 6, str(d['label'])[:48])
    else:
        cur_y = H - 200
        for sec in spec.get('sections', []) or []:
            for rail in sec.get('rails', []) or []:
                cur_x = 80
                for item in rail.get('items', []) or []:
                    layer = KIND_LAYER.get(item.get('kind', 'breaker'), 'DEVICE')
                    rect(layer, cur_x, cur_y, 80, 120)
                    text('LABEL', cur_x + 4, cur_y + 100, 8, item.get('ref', ''))
                    text('LABEL', cur_x + 4, cur_y + 4, 6, str(item.get('label', ''))[:30])
                    cur_x += 92
                cur_y -= 140

    emit('0','ENDSEC','0','EOF')
    return '\n'.join(out).encode('utf-8')


def build_dxf(spec: Any) -> str:
    """Return text for the JSON API while the package service keeps bytes."""
    if hasattr(spec, 'model_dump'):
        payload = spec.model_dump(by_alias=True, exclude_none=True)
    elif isinstance(spec, dict):
        payload = spec
    else:
        raise TypeError('Cabinet specification must be a mapping or Pydantic model')
    return export_dxf(payload).decode('utf-8')
