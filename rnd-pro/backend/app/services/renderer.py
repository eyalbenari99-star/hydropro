"""PNG renderer for a cabinet spec using Pillow."""
import io
from typing import Dict, Any


def render_item_to_png(spec: Dict[str, Any]) -> bytes:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return _tiny_png()

    W, H = 1400, 1900
    img = Image.new('RGB', (W, H), '#0b0f15')
    draw = ImageDraw.Draw(img)

    font_big = _load_font(28)
    font_mid = _load_font(15)
    font_sm  = _load_font(10)

    draw.text((30, 22), spec.get('title', 'Cabinet'), fill='#7dd3fc', font=font_big)
    if spec.get('subtitle'):
        draw.text((30, 64), spec['subtitle'], fill='#94a3b8', font=font_mid)

    draw.rectangle([(40, 110), (W - 40, H - 40)], outline='#60a5fa', width=3)

    y = 150
    for sec in spec.get('sections', []) or []:
        bg = sec.get('color', '#1e40af')
        draw.rectangle([(60, y), (W - 60, y + 36)], fill=bg)
        draw.text((72, y + 8), sec.get('label', ''), fill='#fff', font=font_mid)
        y += 50
        for rail in sec.get('rails', []) or []:
            draw.text((72, y), rail.get('label', ''), fill='#94a3b8', font=font_sm)
            y += 18
            x = 80
            for item in rail.get('items', []) or []:
                _draw_device(draw, x, y, 110, 80, item, font_sm)
                x += 118
                if x > W - 120:
                    x = 80; y += 90
            y += 100
        y += 12
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return buf.getvalue()


def render_cabinet_png(spec: Any) -> bytes:
    """Compatibility entrypoint for the typed FastAPI route."""
    if hasattr(spec, 'model_dump'):
        payload = spec.model_dump(by_alias=True, exclude_none=True)
    elif isinstance(spec, dict):
        payload = spec
    else:
        raise TypeError('Cabinet specification must be a mapping or Pydantic model')
    return render_item_to_png(payload)


def _draw_device(draw, x, y, w, h, item, font):
    kind = item.get('kind', 'breaker')
    color = {
        'mccb': '#1d4ed8', 'mcb': '#dc2626', 'breaker': '#dc2626',
        'contactor': '#ea580c', 'overload': '#f59e0b',
        'meter': '#7c3aed', 'ct': '#6b7280',
        'plc': '#0ea5e9', 'psu': '#475569', 'relay': '#0891b2',
        'spd': '#16a34a', 'terminal': '#334155',
    }.get(kind, '#7c3aed')
    draw.rectangle([(x, y), (x + w, y + h)], fill=color, outline='#000', width=1)
    draw.text((x + 5, y + 5), str(item.get('ref', '')), fill='#fff', font=font)
    label = str(item.get('label', ''))[:18]
    draw.text((x + 5, y + h - 14), label, fill='#fff', font=font)


def _load_font(size):
    try:
        from PIL import ImageFont
        for path in [
            '/System/Library/Fonts/Helvetica.ttc',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
        ]:
            try: return ImageFont.truetype(path, size)
            except Exception: continue
        return ImageFont.load_default()
    except Exception:
        return None


def _tiny_png() -> bytes:
    return (b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08'
            b'\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00'
            b'\x05\xfe\x02\xfeA5\xc6\x80\x00\x00\x00\x00IEND\xaeB`\x82')
