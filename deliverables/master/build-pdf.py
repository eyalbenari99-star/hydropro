#!/usr/bin/env python3
"""Build the master combined PDF from the same DSL data. Reads screens-data.js via a compat json export."""
import subprocess, pathlib, html as H, os, sys

# Compile the JS data to JSON by evaluating it in Node
HERE = pathlib.Path(__file__).parent
node_cmd = ['node', '-e', "const d = require('./screens-data'); process.stdout.write(JSON.stringify(d));"]
r = subprocess.run(node_cmd, cwd=str(HERE), capture_output=True)
if r.returncode:
    print(r.stderr.decode(), file=sys.stderr); sys.exit(1)
import json
data = json.loads(r.stdout.decode())
INDEX = data['INDEX']
SCREENS = data['screens']

OUT_PDF = HERE / 'HydroNexis-Purchasing-Developer-Pack.pdf'
TMP_HTML = pathlib.Path('/tmp/pdfmaster.html')

BASE_STYLE = r"""
<style>
  @page { size: Letter; margin: 22mm 20mm 22mm 20mm; }
  :root {
    --paper:#FFFFFF; --paper-2:#F7F6F1; --ink:#0E1815; --ink-2:#2A332F; --muted:#6C7369;
    --rule:#DDE0D7; --rule-strong:#C5C9BE; --accent:#1E7A5F; --accent-soft:#E9F0EC;
    --code-bg:#F4F5F1; --warn:#B08018;
    color-scheme:light;
  }
  html, body { background:#FFFFFF; color:var(--ink); margin:0; }
  body {
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,ui-sans-serif,sans-serif;
    font-size:10.5pt; line-height:1.5; -webkit-font-smoothing:antialiased;
  }
  .cover { padding-top:52mm; border-bottom:2px solid var(--accent); margin-bottom:10mm; }
  .cover .eyebrow { font-family:"SF Mono","Consolas",monospace; font-size:10pt; letter-spacing:.22em; text-transform:uppercase; color:var(--muted); margin-bottom:2mm; }
  .cover .badge   { font-family:"SF Mono","Consolas",monospace; font-size:11pt; color:var(--accent); font-weight:700; letter-spacing:.2em; margin-bottom:6mm; }
  .cover h1 { font-family:"Iowan Old Style","Palatino Linotype","Palatino",ui-serif,Georgia,serif; font-weight:500; font-size:34pt; line-height:1.05; letter-spacing:-.01em; margin:0 0 4mm; }
  .cover .sub { font-family:"Iowan Old Style",ui-serif,serif; font-style:italic; font-size:13pt; color:var(--accent); margin-bottom:10mm; }
  .cover dl { display:grid; grid-template-columns: 34mm 1fr; gap:1.5mm 5mm; font-size:9.5pt; }
  .cover dt { font-family:"SF Mono",monospace; font-size:7.5pt; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin:0; }
  .cover dd { margin:0; color:var(--ink-2); font-family:"SF Mono",monospace; font-size:10pt; }
  .cover dd.plain { font-family:inherit; font-size:10.5pt; }
  .pgbreak { page-break-before:always; }
  .screen-cover {
    padding-top: 25mm;
    border-bottom: 2px solid var(--accent);
    margin-bottom: 10mm;
  }
  .screen-cover .id { font-family:"SF Mono","Consolas",monospace; color:var(--accent); font-size:11pt; letter-spacing:.2em; font-weight:700; margin-bottom:2mm; }
  .screen-cover .title { font-family:"Iowan Old Style",ui-serif,serif; font-weight:500; font-size:30pt; line-height:1.05; margin:0 0 3mm; }
  .screen-cover .subtitle { font-family:"Iowan Old Style",ui-serif,serif; font-style:italic; font-size:13pt; color:var(--accent); }
  h1 {
    font-family:"Iowan Old Style",ui-serif,serif; font-weight:500;
    font-size:19pt; letter-spacing:-.005em; margin:12mm 0 4mm;
    border-top: 1.5px solid var(--ink); padding-top: 3mm;
    page-break-after: avoid;
  }
  h2 {
    font-family:"Iowan Old Style",ui-serif,serif; font-weight:500;
    font-size:14pt; margin:7mm 0 2mm; color:var(--ink);
    page-break-after: avoid;
  }
  h3 {
    font-family:"Iowan Old Style",ui-serif,serif; font-weight:500;
    font-size:11.5pt; margin:5mm 0 2mm; color:var(--accent);
    page-break-after: avoid;
  }
  p { margin:0 0 3mm; max-width:70em; }
  ul { margin:0 0 3mm; padding-left:5mm; }
  li { margin:0 0 1mm; max-width:65em; }
  code, .mono { font-family:"SF Mono",monospace; font-size:9pt; background:var(--code-bg); padding:0.4mm 1.4mm; border-radius:1mm; border:1px solid var(--rule); }
  .accent-code { color:var(--accent); font-family:"SF Mono",monospace; font-size:9pt; }
  .codeblock {
    background: var(--code-bg);
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    padding: 3mm 4mm;
    margin: 3mm 0 5mm;
    font-family:"SF Mono",monospace; font-size:9.5pt;
    page-break-inside: avoid;
  }
  .flow {
    display: inline-block;
    font-family:"SF Mono",monospace; font-size:10pt;
    color: var(--accent); font-weight:600;
    margin: 2mm 0 5mm;
    word-spacing: 3px;
  }
  table {
    width:100%; border-collapse:collapse; font-size:9.5pt; margin: 2mm 0 6mm;
    font-variant-numeric: tabular-nums; page-break-inside: avoid;
  }
  th, td {
    text-align:left; padding:1.8mm 2.5mm; vertical-align:top;
    border-bottom: 1px solid var(--rule);
  }
  thead th {
    background: var(--paper-2); font-family:"SF Mono",monospace; font-weight:600;
    font-size:8pt; letter-spacing:.1em; text-transform:uppercase; color:var(--muted);
    border-bottom: 1.5px solid var(--rule-strong); border-top: 1.5px solid var(--ink);
  }
  .note {
    border-left: 3px solid var(--accent); background: var(--paper-2);
    padding: 3mm 4mm; margin: 3mm 0 5mm; font-size: 10pt;
    page-break-inside: avoid;
  }
  .note .lbl { display:block; font-family:"SF Mono",monospace; font-size:8pt; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:1mm; }
  footer.foot { margin-top:12mm; padding-top:3mm; border-top:1px solid var(--rule-strong); font-family:"SF Mono",monospace; font-size:8pt; color:var(--muted); display:flex; justify-content:space-between; }
</style>
"""

def esc(s): return H.escape(str(s))

def render_nodes(nodes):
    out = []
    for n in nodes:
        k = n[0]
        if k == 'h1':
            out.append(f'<h1>{esc(n[1])}</h1>')
        elif k == 'h2':
            out.append(f'<h2>{esc(n[1])}</h2>')
        elif k == 'h3':
            out.append(f'<h3>{esc(n[1])}</h3>')
        elif k == 'p':
            out.append(f'<p>{esc(n[1])}</p>')
        elif k == 'ul':
            out.append('<ul>' + ''.join(f'<li>{esc(x)}</li>' for x in n[1]) + '</ul>')
        elif k == 'fl':
            for item in n[1]:
                lbl, _, val = item.partition(':')
                out.append(f'<p><strong>{esc(lbl)}:</strong> {esc(val.strip())}</p>')
        elif k == 'code':
            out.append(f'<div class="codeblock">{esc(n[1])}</div>')
        elif k == 'flow':
            arrows = '   →   '.join(esc(x) for x in n[1])
            out.append(f'<div class="flow">{arrows}</div>')
        elif k == 'tbl':
            headers = n[1]; rows = n[2]
            widths = n[3] if len(n) > 3 else [round(100/len(headers)) for _ in headers]
            th_cells = ''.join(f'<th style="width:{w}%">{esc(h)}</th>' for h,w in zip(headers, widths))
            body_rows = ''
            for r in rows:
                cells = ''.join(f'<td>{esc(c)}</td>' for c in r)
                body_rows += f'<tr>{cells}</tr>'
            out.append(f'<table><thead><tr>{th_cells}</tr></thead><tbody>{body_rows}</tbody></table>')
        elif k == 'note':
            out.append(f'<div class="note"><span class="lbl">{esc(n[1])}</span>{esc(n[2])}</div>')
    return '\n'.join(out)

def cover_html():
    return f"""
<div class="cover">
  <div class="eyebrow">HydroNexis-AI · Accounting Module</div>
  <div class="badge">PURCHASING SUB-MODULE</div>
  <h1>Developer specification pack</h1>
  <div class="sub">Complete screen index + 13 developer-ready screen specifications</div>
  <dl>
    <dt>Contents</dt><dd class="plain">Screen Index (91 screens across 18 sections) + Screens 001 → 013 in full technical detail</dd>
    <dt>Repository</dt><dd>eyalbenari99-star/hydropro</dd>
    <dt>Branch</dt><dd>claude/accounting-purchasing-suppliers-5p94sz</dd>
    <dt>Status</dt><dd class="plain">Ready for Development</dd>
    <dt>Version</dt><dd>1.0</dd>
    <dt>Document date</dt><dd>2026-07-28</dd>
  </dl>
</div>
"""

def index_html():
    total = sum(len(s[2]) for s in INDEX)
    parts = ['<div class="pgbreak"></div>']
    parts.append('<h1>Part I — Complete Screen Index</h1>')
    parts.append('<p>Master navigation for the Purchasing sub-module. Every screen has a unique numeric identifier (e.g. 1.5 for Pending Approval) that will be used as the router key, the URL segment, and the primary reference in all subsequent deliverables.</p>')
    parts.append(f'<p>Total screens: <strong>{total}</strong> across 18 sections (0–17).</p>')
    for num, title, items in INDEX:
        parts.append(f'<h3>{esc(num)}.  {esc(title)}</h3>')
        parts.append('<table><thead><tr><th style="width:12%">ID</th><th>Screen</th></tr></thead><tbody>')
        for i, name in enumerate(items, 1):
            parts.append(f'<tr><td><span class="accent-code">{esc(num)}.{i}</span></td><td><strong>{esc(name)}</strong></td></tr>')
        parts.append('</tbody></table>')
    parts.append('<h3>Summary counts</h3>')
    parts.append('<table><thead><tr><th>Section</th><th style="width:20%;text-align:right">Screens</th></tr></thead><tbody>')
    for num, title, items in INDEX:
        parts.append(f'<tr><td>{esc(num)}. {esc(title)}</td><td style="text-align:right"><span class="accent-code">{len(items)}</span></td></tr>')
    parts.append(f'<tr><td><strong>TOTAL</strong></td><td style="text-align:right"><span class="accent-code" style="font-weight:700">{total}</span></td></tr>')
    parts.append('</tbody></table>')
    return '\n'.join(parts)

def screen_html(s):
    parts = ['<div class="pgbreak"></div>']
    parts.append('<div class="screen-cover">')
    parts.append(f'<div class="id">SCREEN {esc(s["n"])} · {esc(s["docId"])}</div>')
    parts.append(f'<div class="title">{esc(s["title"])}</div>')
    parts.append(f'<div class="subtitle">{esc(s.get("subtitle",""))}</div>')
    parts.append('</div>')
    parts.append(render_nodes(s['sections']))
    return '\n'.join(parts)

full = ['<!doctype html><html><head><meta charset="utf-8">', BASE_STYLE, '</head><body>',
        cover_html(),
        index_html(),
       ]
for s in SCREENS:
    full.append(screen_html(s))
full.append('<footer class="foot"><span>HydroNexis-AI · Purchasing sub-module · Developer specification pack</span><span>rev 2026-07-28</span></footer>')
full.append('</body></html>')

TMP_HTML.write_text('\n'.join(full))
print(f'wrote {TMP_HTML} ({os.path.getsize(TMP_HTML)} bytes)')

CHROMIUM = '/opt/pw-browsers/chromium'
r = subprocess.run([
    CHROMIUM, '--headless', '--disable-gpu', '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    f'--print-to-pdf={OUT_PDF}',
    '--print-to-pdf-no-header',
    '--virtual-time-budget=10000',
    f'file://{TMP_HTML}',
], capture_output=True)
if r.returncode:
    print(r.stderr.decode(), file=sys.stderr); sys.exit(1)
print(f'wrote {OUT_PDF} ({os.path.getsize(OUT_PDF)} bytes)')
