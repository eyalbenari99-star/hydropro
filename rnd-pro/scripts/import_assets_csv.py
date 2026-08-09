"""Bulk-import a CSV of components into the Asset DB.

Builds the right `params` jsonb shape per `device_kind` / `node_type`
so the selectors (selector_electrical.py, selector_plumbing.py) can
query directly:

  params->>'deviceType' = 'MCB'
  params->>'series'     = 'NXB'
  (params->>'poles')::int = 3
  (params->>'currentA')::numeric >= 16

Electrical column mapping (snake_case CSV -> camelCase params):
  device_kind     -> deviceType   (MCB | MCCB | Contactor | Overload | Meter | CT | ...)
  series          -> series       (NXB | NXC | JR36 | NM1 | DT862 | LMZJ1 | ...)
  poles           -> poles
  current_a       -> currentA
  curve           -> curve
  u_n_v           -> uN_V
  i_cn_ka         -> iCn_kA
  frame_a         -> frameA       (MCCB only)
  ac3_current_a   -> ac3CurrentA  (Contactor only)
  kw_max_400      -> kwMax400     (Contactor only)
  fl_min_a        -> flMinA       (Overload only)
  fl_max_a        -> flMaxA       (Overload only)
  ratio           -> ratio        (CT only)
  primary_a       -> primaryA     (CT only)
  secondary_a     -> secondaryA   (CT only)

Plumbing column mapping:
  node_type       -> nodeType     (pump | filter | pipe | valve | tank | manifold | sensor)
  flow_m3h_max    -> flowM3hMax
  head_m_max      -> headMMax
  micron          -> micron
  dn              -> dn
  pn              -> pn
  material        -> material

Usage:
    python3 scripts/import_assets_csv.py <api_base> <tenant_id> <csv_file>
    python3 scripts/import_assets_csv.py --dry-run <csv_file>   # validate only
"""
import sys, csv, json, uuid
try:
    import requests
except ImportError:
    requests = None

# --- column -> params key translation tables ---

ELEC_KEY_MAP = {
    'device_kind':   'deviceType',
    'series':        'series',
    'manufacturer':  'manufacturer',
    'poles':         'poles',
    'current_a':     'currentA',
    'curve':         'curve',
    'u_n_v':         'uN_V',
    'i_cn_ka':       'iCn_kA',
    'frame_a':       'frameA',
    'ac3_current_a': 'ac3CurrentA',
    'kw_max_400':    'kwMax400',
    'fl_min_a':      'flMinA',
    'fl_max_a':      'flMaxA',
    'ratio':         'ratio',
    'primary_a':     'primaryA',
    'secondary_a':   'secondaryA',
}

PLUMB_KEY_MAP = {
    'node_type':     'nodeType',
    'manufacturer':  'manufacturer',
    'series':        'series',
    'flow_m3h_max':  'flowM3hMax',
    'head_m_max':    'headMMax',
    'micron':        'micron',
    'dn':            'dn',
    'pn':            'pn',
    'material':      'material',
}

# Per device_kind, which params are *required* — used by validation
ELEC_REQUIRED = {
    'MCB':       ['deviceType', 'series', 'poles', 'currentA', 'curve'],
    'MCCB':      ['deviceType', 'series', 'poles', 'currentA', 'frameA'],
    'Contactor': ['deviceType', 'series', 'ac3CurrentA', 'kwMax400'],
    'Overload':  ['deviceType', 'series', 'flMinA', 'flMaxA'],
    'Meter':     ['deviceType'],
    'CT':        ['deviceType', 'ratio'],
}
PLUMB_REQUIRED = {
    'pump':     ['nodeType', 'flowM3hMax', 'headMMax'],
    'filter':   ['nodeType', 'micron', 'flowM3hMax'],
    'pipe':     ['nodeType', 'dn', 'material'],
    'valve':    ['nodeType', 'dn', 'pn', 'material'],
    'tank':     ['nodeType'],
    'manifold': ['nodeType', 'dn'],
    'sensor':   ['nodeType'],
}

def main():
    dry = '--dry-run' in sys.argv
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    if dry:
        if len(args) != 1:
            print('usage: import_assets_csv.py --dry-run <csv_file>')
            sys.exit(1)
        path = args[0]
        api = tenant = None
    else:
        if len(args) < 3:
            print('usage: import_assets_csv.py <api_base> <tenant_id> <csv_file>')
            print('       import_assets_csv.py --dry-run <csv_file>')
            sys.exit(1)
        api, tenant, path = args[0], args[1], args[2]

    ok = fail = warn = 0
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for ix, row in enumerate(reader, start=2):
            discipline = (row.get('discipline') or 'electrical').strip()
            params = _build_params(row, discipline)
            errs = _validate(params, discipline)

            asset = {
                'id': str(uuid.uuid4()),
                'tenantId': tenant,
                'discipline': discipline,
                'asset_kind': row.get('asset_kind', 'component_3d'),
                'name': row.get('name') or row.get('part_no'),
                'description': row.get('name') or row.get('part_no'),
                'partNo': row.get('part_no'),
                'gltfKey': row.get('gltf_key') or None,
                'tags': [t.strip() for t in (row.get('tags') or '').split(',') if t.strip()],
                'params': params
            }

            label = asset['name'] or f'row {ix}'
            if errs:
                warn += 1
                print(f'  WARN line {ix} ({label}): {", ".join(errs)}')

            if dry:
                if not errs:
                    ok += 1
                continue

            if not requests:
                print('ERROR: `requests` module not installed; use --dry-run or pip install requests')
                sys.exit(2)
            try:
                r = requests.post(f'{api}/api/rnd/assets', json=asset, timeout=15)
                if r.ok:
                    ok += 1
                else:
                    fail += 1
                    print(f'  FAIL line {ix} ({label}): {r.status_code} {r.text[:200]}')
            except Exception as e:
                fail += 1
                print(f'  ERROR line {ix} ({label}): {e}')

    suffix = ' (dry run)' if dry else ''
    print(f'\nImported{suffix}: ok={ok} fail={fail} warn={warn}')


def _build_params(row, discipline):
    """Turn snake_case CSV columns into the camelCase params jsonb the selectors expect."""
    params = {}
    key_map = ELEC_KEY_MAP if discipline == 'electrical' else PLUMB_KEY_MAP if discipline == 'plumbing' else {}
    for csv_key, params_key in key_map.items():
        v = row.get(csv_key)
        if v is None or v == '':
            continue
        params[params_key] = _coerce(v)
    return params


def _validate(params, discipline):
    """Return a list of error strings (empty == OK)."""
    errs = []
    if discipline == 'electrical':
        dt = params.get('deviceType')
        if not dt:
            errs.append('missing deviceType (device_kind)')
            return errs
        required = ELEC_REQUIRED.get(dt, [])
        for k in required:
            if params.get(k) in (None, ''):
                errs.append(f'{dt}: missing {k}')
    elif discipline == 'plumbing':
        nt = params.get('nodeType')
        if not nt:
            errs.append('missing nodeType (node_type)')
            return errs
        required = PLUMB_REQUIRED.get(nt, [])
        for k in required:
            if params.get(k) in (None, ''):
                errs.append(f'{nt}: missing {k}')
    return errs


def _coerce(v):
    if isinstance(v, str):
        s = v.strip()
        if s == '':
            return None
        # Try int, then float, else keep string
        try:
            return int(s)
        except ValueError:
            pass
        try:
            return float(s)
        except ValueError:
            pass
        return s
    return v


if __name__ == '__main__':
    main()
