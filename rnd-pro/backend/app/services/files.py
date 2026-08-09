"""File storage abstraction. Local disk by default; R2/S3 when env vars set."""
import os, uuid
from typing import Optional

UPLOAD_DIR = os.environ.get('HNX_UPLOAD_DIR', '/tmp/hnx-rnd-uploads')


def upload_to_r2(content: bytes, prefix: str, filename: str) -> str:
    """Returns the storage key. Local disk by default; switches to S3-compatible
    when R2_BUCKET / R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are set.
    """
    if os.environ.get('R2_BUCKET'):
        try:
            return _upload_s3(content, prefix, filename)
        except Exception as e:
            print(f'[files] R2 upload failed, falling back to local: {e}')
    return _upload_local(content, prefix, filename)


def _safe_name(name: str) -> str:
    cleaned = ''.join(c for c in name if c.isalnum() or c in '._-')
    return cleaned or 'file'


def _upload_local(content: bytes, prefix: str, filename: str) -> str:
    key = f"{prefix.rstrip('/')}/{uuid.uuid4().hex[:8]}_{_safe_name(filename)}"
    full = os.path.join(UPLOAD_DIR, key)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'wb') as f:
        f.write(content)
    return key


def _upload_s3(content: bytes, prefix: str, filename: str) -> str:
    import boto3
    from botocore.config import Config
    bucket = os.environ['R2_BUCKET']
    endpoint = os.environ.get('R2_ENDPOINT')
    s3 = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
        config=Config(signature_version='s3v4'),
    )
    key = f"{prefix.rstrip('/')}/{uuid.uuid4().hex[:8]}_{_safe_name(filename)}"
    s3.put_object(Bucket=bucket, Key=key, Body=content,
                  ContentType=_content_type(filename))
    return key


def _content_type(name: str) -> str:
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    return {
        'pdf': 'application/pdf',
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'dxf': 'application/dxf',
        'glb': 'model/gltf-binary',
        'json': 'application/json',
    }.get(ext, 'application/octet-stream')
