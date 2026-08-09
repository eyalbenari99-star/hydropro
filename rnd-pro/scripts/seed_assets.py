"""Seed the Asset DB with the legacy 127 + the 300-mega symbol set.

Reuses the SVG generator functions from the OLD INJECT_FAIL files (the SVG
authoring code was good — only the injection pattern was bad).

Usage:
    python3 scripts/seed_assets.py http://localhost:8001 <tenant-uuid>
"""
import sys, json, requests, uuid

# TODO: import and call the SVG generators from
# the rolled-back library expander code (`04_failed_patterns_DO_NOT_REUSE/INJECT_FAIL_v1.py`
# inside the developer handoff zip). Their `buildExpansion()` and
# `buildMega()` functions produce ~600 distinct industrial symbols.

def seed(api_base: str, tenant_id: str) -> int:
    # Placeholder — produce a handful of minimal assets to prove the path.
    base = [
        ('mcb 1p',  'electrical', 'NXB-63 1P C6',  'breaker'),
        ('mcb 3p',  'electrical', 'NXB-63 3P D16', 'breaker'),
        ('contactor', 'electrical', 'NXC-12',      'contactor'),
        ('overload', 'electrical', 'JR36-20',      'overload'),
        ('ball valve', 'plumbing', 'Ball valve 1"', 'fitting'),
    ]
    count = 0
    for name, domain, partNo, kind in base:
        asset = {
            'id': str(uuid.uuid4()),
            'tenantId': tenant_id,
            'kind': 'symbol',
            'domain': domain,
            'name': partNo,
            'description': f'{kind} - {partNo}',
            'category': domain,
            'tags': [kind],
            'standard': 'CHINT' if 'NX' in partNo or 'JR' in partNo else 'generic',
        }
        r = requests.post(f'{api_base}/api/rnd/assets', json=asset, timeout=10)
        if r.ok: count += 1
    return count

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('usage: seed_assets.py <api_base> <tenant_id>')
        sys.exit(1)
    n = seed(sys.argv[1], sys.argv[2])
    print(f'Seeded {n} assets')
