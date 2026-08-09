#!/usr/bin/env python3
"""Bulk-upload all .glb files under rnd-3d-assets/ to Cloudflare R2 (or any S3-compatible).

Reads the gltf_key column from the catalog CSVs and uploads each file using its
local relative path as the R2 key (so the keys match what the selectors stored).

Usage:
    R2_BUCKET=hnx-rnd \\
    R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com \\
    R2_ACCESS_KEY_ID=... \\
    R2_SECRET_ACCESS_KEY=... \\
    python3 scripts/upload_glb_to_r2.py [--dry-run]

Or upload to local-disk staging (no R2 needed):
    HNX_UPLOAD_DIR=/tmp/hnx-staging python3 scripts/upload_glb_to_r2.py
"""
import os, csv, sys, hashlib, argparse

try:
    import boto3
    from botocore.config import Config
    HAS_BOTO = True
except ImportError:
    HAS_BOTO = False

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ASSETS_DIR = os.path.join(ROOT, 'rnd-3d-assets')


def collect_keys() -> list:
    """Read gltf_key from both CSVs."""
    keys = []
    for csv_file in (
        os.path.join(ROOT, 'data/sample_electrical_products.csv'),
        os.path.join(ROOT, 'data/sample_plumbing_products.csv'),
    ):
        if not os.path.exists(csv_file): continue
        with open(csv_file, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                k = (row.get('gltf_key') or '').strip()
                if k: keys.append(k)
    return keys


def get_s3_client():
    bucket = os.environ.get('R2_BUCKET')
    if not bucket or not HAS_BOTO:
        return None, None
    endpoint = os.environ.get('R2_ENDPOINT')
    s3 = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
        config=Config(signature_version='s3v4'),
    )
    return s3, bucket


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true', help='List uploads without sending')
    ap.add_argument('--prefix',  default='', help='Optional R2 key prefix (e.g. "v1/")')
    args = ap.parse_args()

    keys = collect_keys()
    print(f"{len(keys)} catalog gltf_keys")

    s3, bucket = (None, None)
    if not args.dry_run:
        s3, bucket = get_s3_client()
        if not bucket:
            print("R2_BUCKET not set or boto3 missing. Falling back to local staging.")
            staging = os.environ.get('HNX_UPLOAD_DIR', '/tmp/hnx-staging')
            os.makedirs(staging, exist_ok=True)
            print(f"Staging dir: {staging}")
        else:
            print(f"Uploading to s3://{bucket}/ via {os.environ.get('R2_ENDPOINT', 'AWS')}")

    ok = miss = fail = 0
    for key in keys:
        # local file
        if key.startswith('rnd-3d-assets/'):
            rel = key[len('rnd-3d-assets/'):]
        else:
            rel = key
        local = os.path.join(ASSETS_DIR, rel)
        if not os.path.exists(local):
            print(f"  MISS  {key}")
            miss += 1
            continue

        full_key = args.prefix.rstrip('/') + '/' + key if args.prefix else key

        if args.dry_run:
            sz = os.path.getsize(local)
            print(f"  WOULD UPLOAD  {full_key}  ({sz:,} B)")
            ok += 1
            continue

        if bucket:
            try:
                with open(local, 'rb') as f:
                    body = f.read()
                s3.put_object(Bucket=bucket, Key=full_key, Body=body, ContentType='model/gltf-binary')
                ok += 1
                if ok % 25 == 0:
                    print(f"  ... uploaded {ok}")
            except Exception as e:
                fail += 1
                print(f"  FAIL  {full_key}: {e}")
        else:
            # local staging
            staging = os.environ.get('HNX_UPLOAD_DIR', '/tmp/hnx-staging')
            dest = os.path.join(staging, full_key)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            import shutil
            shutil.copy2(local, dest)
            ok += 1

    print(f"\nDone: ok={ok}  miss={miss}  fail={fail}  total_keys={len(keys)}")


if __name__ == '__main__':
    main()
