"""One-off migration: read localStorage JSON dump and POST to the new backend.

Usage:
    1. In Chrome DevTools (legacy app open), run:
         JSON.stringify({
           items: localStorage.getItem('hydroPro_rnd_items_v1'),
           subjects: localStorage.getItem('hydroPro_rnd_subjects_v1'),
           projects: localStorage.getItem('hydroPro_rnd_projects_v1'),
           assets: localStorage.getItem('hydroPro_rnd_assets_v1'),
         })
       Copy the result into a file (e.g. dump.json).
    2. Run:  python3 scripts/migrate_localstorage.py dump.json http://localhost:8001 <tenant_uuid>
"""
import json, sys, requests

def main():
    if len(sys.argv) < 4:
        print('usage: migrate_localstorage.py <dump.json> <backend_url> <tenant_id>')
        sys.exit(1)
    path, base, tenant = sys.argv[1], sys.argv[2], sys.argv[3]
    dump = json.load(open(path))
    items = json.loads(dump.get('items') or '[]')
    subjects = json.loads(dump.get('subjects') or '[]')
    projects = json.loads(dump.get('projects') or '[]')
    assets = json.loads(dump.get('assets') or '[]')

    print(f'Subjects: {len(subjects)}  Projects: {len(projects)}  Items: {len(items)}  Assets: {len(assets)}')

    for it in items:
        it['tenantId'] = tenant
        try:
            r = requests.post(f'{base}/api/rnd/items', json=it, timeout=30)
            print(f'  item {it.get("id")[:12]} → {r.status_code}')
        except Exception as e:
            print(f'  FAILED {it.get("id")}: {e}')

if __name__ == '__main__':
    main()
