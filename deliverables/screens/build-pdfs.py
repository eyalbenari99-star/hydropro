#!/usr/bin/env python3
"""Build print-ready HTML for each of the three deliverables and render to PDF via headless Chromium."""
import os, subprocess, textwrap, html, sys, pathlib

OUT_DIR = pathlib.Path('/home/user/hydropro/deliverables/screens')
TMP_DIR = pathlib.Path('/tmp/screenpdf')
TMP_DIR.mkdir(exist_ok=True)

CHROMIUM = '/opt/pw-browsers/chromium'

BASE_STYLE = r"""
<style>
  @page { size: Letter; margin: 22mm 20mm 22mm 20mm; }
  :root {
    --paper:#FFFFFF; --ink:#0E1815; --ink-2:#2A332F; --muted:#6C7369;
    --rule:#DDE0D7; --rule-strong:#C5C9BE; --accent:#1E7A5F; --accent-soft:#E9F0EC;
    --paper-2:#F7F6F1; --code-bg:#F4F5F1; --good:#2E7D5A; --warn:#B08018;
    color-scheme: light;
  }
  html, body { background:#FFFFFF; color:var(--ink); margin:0; }
  body {
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,ui-sans-serif,sans-serif;
    font-size:11pt; line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .cover {
    padding-top: 60mm;
    border-bottom: 2px solid var(--accent);
    margin-bottom: 12mm;
  }
  .cover .eyebrow { font-family:"SF Mono","Consolas",monospace; font-size:10pt; letter-spacing:.22em; text-transform:uppercase; color:var(--muted); margin-bottom:8mm; }
  .cover .docid { font-family:"SF Mono","Consolas",monospace; font-size:11pt; color:var(--accent); letter-spacing:.15em; margin-bottom:4mm; font-weight:700; }
  .cover h1 { font-family:"Iowan Old Style","Palatino Linotype","Palatino",ui-serif,Georgia,serif; font-weight:500; font-size:36pt; line-height:1.05; letter-spacing:-.01em; margin:0 0 4mm; }
  .cover .sub { font-family:"Iowan Old Style",ui-serif,serif; font-style:italic; font-size:14pt; color:var(--accent); margin-bottom:12mm; }
  .cover .meta { display:grid; grid-template-columns:1fr 1fr; gap:2mm 8mm; font-size:9.5pt; }
  .cover .meta dt { font-family:"SF Mono","Consolas",monospace; font-size:8pt; letter-spacing:.15em; text-transform:uppercase; color:var(--muted); margin:0; }
  .cover .meta dd { margin:0 0 3mm; color:var(--ink-2); font-family:"SF Mono","Consolas",monospace; font-size:10pt; }
  .cover .meta dd.plain { font-family:inherit; font-size:11pt; }
  .pgbreak { page-break-before: always; }
  h1 {
    font-family:"Iowan Old Style","Palatino Linotype","Palatino",ui-serif,Georgia,serif;
    font-weight:500; font-size:22pt; letter-spacing:-.005em; margin:16mm 0 5mm;
    border-top: 1.5px solid var(--ink); padding-top: 4mm;
    page-break-after: avoid;
  }
  h2 {
    font-family:"Iowan Old Style",ui-serif,serif;
    font-weight:500; font-size:15pt; margin:8mm 0 3mm; color:var(--ink);
    page-break-after: avoid;
  }
  h3 {
    font-family:"Iowan Old Style",ui-serif,serif;
    font-weight:500; font-size:12.5pt; margin:6mm 0 2mm; color:var(--accent);
    page-break-after: avoid;
  }
  p { margin: 0 0 4mm; max-width: 70em; }
  ul { margin: 0 0 4mm; padding-left: 5mm; }
  li { margin: 0 0 1.5mm; max-width: 65em; }
  code, .mono { font-family:"SF Mono","Consolas",monospace; font-size:9.5pt; background:var(--code-bg); padding:0.4mm 1.4mm; border-radius:1mm; border:1px solid var(--rule); }
  .accent-code { color:var(--accent); background:transparent; border:none; padding:0; font-family:"SF Mono","Consolas",monospace; font-size:9.5pt; }
  table {
    width:100%; border-collapse:collapse; font-size:9.5pt; margin: 3mm 0 6mm;
    font-variant-numeric: tabular-nums; page-break-inside: avoid;
  }
  th, td {
    text-align:left; padding: 2mm 3mm; vertical-align: top;
    border-bottom: 1px solid var(--rule);
  }
  thead th {
    background: var(--paper-2); font-family:"SF Mono","Consolas",monospace; font-weight:600;
    font-size:8pt; letter-spacing:.1em; text-transform:uppercase; color:var(--muted);
    border-bottom: 1.5px solid var(--rule-strong); border-top: 1.5px solid var(--ink);
  }
  .cal {
    border-left: 3px solid var(--accent);
    background: var(--paper-2);
    padding: 3mm 4mm;
    margin: 4mm 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  .cal .lbl { display:block; font-family:"SF Mono",monospace; font-size:8pt; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:1mm; }
  .kv { display:grid; grid-template-columns: 40mm 1fr; gap: 1.5mm 4mm; margin: 3mm 0 5mm; }
  .kv dt { font-family:"SF Mono",monospace; font-size:8pt; letter-spacing:.15em; text-transform:uppercase; color:var(--muted); margin:0; }
  .kv dd { margin:0; }
  .rule { border:0; border-top:1px solid var(--rule); margin: 6mm 0; }
  footer.foot { margin-top:12mm; padding-top:3mm; border-top:1px solid var(--rule-strong); font-family:"SF Mono",monospace; font-size:8pt; color:var(--muted); display:flex; justify-content:space-between; }
</style>
"""

def cover_html(docid, module_line, title, sub):
    return f"""
<div class="cover">
  <div class="eyebrow">HydroNexis-AI · Accounting Module · Purchasing Sub-module</div>
  <div class="docid">{html.escape(docid)}</div>
  <h1>{html.escape(title)}</h1>
  <div class="sub">{html.escape(sub)}</div>
  <dl class="meta">
    <dt>Module</dt><dd class="plain">{html.escape(module_line)}</dd>
    <dt>Document ID</dt><dd>{html.escape(docid)}</dd>
    <dt>Status</dt><dd class="plain">Ready for Development</dd>
    <dt>Version</dt><dd>1.0</dd>
    <dt>Repository</dt><dd>eyalbenari99-star/hydropro</dd>
    <dt>Branch</dt><dd>claude/accounting-purchasing-suppliers-5p94sz</dd>
    <dt>Document date</dt><dd>2026-07-28</dd>
  </dl>
</div>
"""

# ============================================================
# D1 — Screen Index
# ============================================================
INDEX = [
    ('0',  'Purchasing Home', [
        ('0.1','Purchasing Mission Control'),('0.2','Purchasing Calendar'),('0.3','My Tasks'),
        ('0.4','Notifications'),('0.5','AI Assistant (Nexi)'),
    ]),
    ('1',  'Purchase Requests', [
        ('1.1','New Purchase Request'),('1.2','Purchase Request Details'),('1.3','Draft Requests'),
        ('1.4','Submitted Requests'),('1.5','Pending Approval'),('1.6','Approved Requests'),
        ('1.7','Rejected Requests'),('1.8','Cancelled Requests'),('1.9','Archived Requests'),
    ]),
    ('2',  'AI Validation', [
        ('2.1','AI Review'),('2.2','Duplicate Detection'),('2.3','Budget Verification'),
        ('2.4','Consumption Analysis'),('2.5','Suggested Alternatives'),('2.6','Risk Analysis'),
    ]),
    ('3',  'SOS Inventory Integration', [
        ('3.1','Current Stock'),('3.2','Available Stock'),('3.3','Incoming Deliveries'),
        ('3.4','Reserved Inventory'),('3.5','Warehouse Transfer Suggestions'),
        ('3.6','Internal Availability'),('3.7','Previous Purchase History'),
    ]),
    ('4',  'Technical Specifications', [
        ('4.1','Product Specification'),('4.2','Brand Requirements'),('4.3','Drawing Viewer'),
        ('4.4','Attachments'),('4.5','Technical Approval'),('4.6','Revision History'),
    ]),
    ('5',  'Supplier Management', [
        ('5.1','Supplier Directory'),('5.2','Supplier Profile'),('5.3','Supplier Qualification'),
        ('5.4','Supplier Categories'),('5.5','Supplier Performance'),('5.6','Blacklisted Suppliers'),
        ('5.7','Preferred Suppliers'),('5.8','New Supplier Registration'),
    ]),
    ('6',  'Supplier Discovery', [
        ('6.1','AI Supplier Search'),('6.2','Local Suppliers'),('6.3','International Suppliers'),
        ('6.4','Manufacturer Search'),('6.5','Distributor Search'),('6.6','Supplier Comparison'),
    ]),
    ('7',  'RFQ Center', [
        ('7.1','Create RFQ'),('7.2','RFQ Wizard'),('7.3','Send RFQ'),
        ('7.4','RFQ Tracking'),('7.5','Supplier Responses'),('7.6','RFQ Expiration'),
    ]),
    ('8',  'Communication Center', [
        ('8.1','Email'),('8.2','SMS'),('8.3','Communication Timeline'),
        ('8.4','Attachments'),('8.5','AI Summary'),('8.6','Follow-up Scheduler'),
    ]),
    ('9',  'Quotation Management', [
        ('9.1','Quotation Inbox'),('9.2','AI Extraction'),('9.3','Price Comparison'),
        ('9.4','Technical Comparison'),('9.5','Commercial Comparison'),
        ('9.6','Currency Conversion'),('9.7','Landed Cost'),
    ]),
    ('10', 'Negotiation', [
        ('10.1','Negotiation Workspace'),('10.2','Counter Offers'),('10.3','Price History'),
        ('10.4','AI Negotiation Suggestions'),('10.5','Supplier Commitments'),
    ]),
    ('11', 'Evaluation', [
        ('11.1','Supplier Scorecard'),('11.2','Risk Score'),('11.3','Quality History'),
        ('11.4','Delivery Performance'),('11.5','Financial Stability'),('11.6','AI Recommendation'),
    ]),
    ('12', 'Approval Center', [
        ('12.1','Approval Queue'),('12.2','Approval Details'),('12.3','Multi-Level Approval'),
        ('12.4','Digital Signature'),('12.5','Audit Log'),
    ]),
    ('13', 'Purchase Orders', [
        ('13.1','Create PO'),('13.2','Draft PO'),('13.3','Approved PO'),
        ('13.4','Sent PO'),('13.5','Supplier Confirmation'),('13.6','Amendment History'),
    ]),
    ('14', 'Receiving', [
        ('14.1','Expected Deliveries'),('14.2','Goods Receiving'),('14.3','Partial Deliveries'),
        ('14.4','Quality Inspection'),('14.5','Variance Management'),('14.6','Close Purchase Order'),
    ]),
    ('15', 'Supplier Evaluation', [
        ('15.1','Delivery Rating'),('15.2','Quality Rating'),('15.3','Service Rating'),
        ('15.4','Price Rating'),('15.5','Overall Supplier Score'),
    ]),
    ('16', 'Reports & Analytics', [
        ('16.1','Spend Analysis'),('16.2','Supplier Analysis'),('16.3','Savings Report'),
        ('16.4','Budget vs Actual'),('16.5','Procurement KPI Dashboard'),('16.6','Executive Reports'),
    ]),
    ('17', 'Administration', [
        ('17.1','Purchasing Settings'),('17.2','Approval Matrix'),('17.3','User Roles'),
        ('17.4','Permissions'),('17.5','Email Templates'),('17.6','SMS Templates'),
        ('17.7','AI Configuration'),('17.8','Integration Settings'),('17.9','Security & Audit'),
    ]),
]

def build_d1():
    total = sum(len(items) for _,_,items in INDEX)
    parts = [cover_html('ACC-PUR-D1', 'HydroNexis-AI · Accounting · Purchasing',
                        'Complete Screen Index',
                        'Master navigation for the Purchasing sub-module')]
    parts.append('<div class="pgbreak"></div>')
    parts.append('<h1>Purpose</h1>')
    parts.append(f'<p>This document defines every screen that will exist under Accounting → Purchasing. It is the master navigation the development team will build against. Each subsequent deliverable specifies one screen in full technical detail.</p>')
    parts.append(f'<p>Total screens: <strong>{total}</strong> across 18 sections (0–17). Every screen has a unique numeric identifier (e.g. 1.5 for Pending Approval) that will be used as the router key, the URL segment, and the primary reference in all subsequent deliverables.</p>')

    parts.append('<h1>Screen Index</h1>')
    for num, title, items in INDEX:
        parts.append(f'<h3>{num}.  {html.escape(title)}</h3>')
        parts.append('<table><thead><tr><th style="width:12%">ID</th><th>Screen</th></tr></thead><tbody>')
        for sid, sname in items:
            parts.append(f'<tr><td><span class="accent-code">{sid}</span></td><td><strong>{html.escape(sname)}</strong></td></tr>')
        parts.append('</tbody></table>')

    parts.append('<h1>Summary counts</h1>')
    parts.append('<table><thead><tr><th>Section</th><th style="width:20%;text-align:right">Screens</th></tr></thead><tbody>')
    for num, title, items in INDEX:
        parts.append(f'<tr><td>{num}. {html.escape(title)}</td><td style="text-align:right"><span class="accent-code">{len(items)}</span></td></tr>')
    parts.append(f'<tr><td><strong>TOTAL</strong></td><td style="text-align:right"><span class="accent-code" style="font-weight:700">{total}</span></td></tr>')
    parts.append('</tbody></table>')

    parts.append('<footer class="foot"><span>HydroNexis-AI · Purchasing sub-module · Screen Index</span><span>ACC-PUR-D1 · rev 2026-07-28</span></footer>')
    return ''.join(parts)

# ============================================================
# D2 — Screen 001 Purchasing Mission Control
# ============================================================
def kv_table(rows, col_widths=None):
    if col_widths is None: col_widths = [None] * len(rows[0])
    out = ['<table><thead><tr>']
    for i, h in enumerate(rows[0]):
        w = f' style="width:{col_widths[i]}"' if col_widths[i] else ''
        out.append(f'<th{w}>{h}</th>')
    out.append('</tr></thead><tbody>')
    for r in rows[1:]:
        out.append('<tr>')
        for c in r:
            out.append(f'<td>{c}</td>')
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)

def ul(items):
    return '<ul>' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'

def build_d2():
    parts = [cover_html('ACC-PUR-002',
                        'HydroNexis-AI · Accounting · Purchasing · Screen 001',
                        'Purchasing Mission Control',
                        'Operational control center — 5-second comprehension, no scroll')]
    parts.append('<div class="pgbreak"></div>')

    parts.append('<h1>Purpose</h1>')
    parts.append('<p>This is the first screen displayed when a user enters Accounting → Purchasing. It is the operational control center for the Purchasing Department. A trained user must comprehend the entire purchasing operation within <strong>5 seconds</strong>. No vertical scroll on a 27" monitor. Critical information only.</p>')

    parts.append('<h1>Access matrix</h1>')
    parts.append(kv_table([
        ['Role','Access'],
        ['<strong>Purchasing Officer</strong>','Full'],
        ['<strong>Purchasing Manager</strong>','Full'],
        ['<strong>Accounting Manager</strong>','Full'],
        ['<strong>Finance Manager</strong>','Read only'],
        ['<strong>CEO</strong>','Read only'],
        ['<strong>Warehouse</strong>','Limited (deliveries + receiving alerts only)'],
        ['<strong>Department Requester</strong>','No access'],
    ], ['30%','70%']))

    parts.append('<h1>Page chrome</h1>')
    parts.append('<h2>Header (80 px)</h2>')
    parts.append('<p>Left-to-right: Company logo · breadcrumb (Accounting → Purchasing → Mission Control) · current user · current date · notifications bell · AI status indicator · global search · profile menu.</p>')

    parts.append('<h2>Left navigation</h2>')
    parts.append('<p>Vertical rail. Icon + label. Sections:</p>')
    parts.append(ul(['Dashboard','Purchase Requests','Suppliers','RFQs','Quotations','Negotiations','Purchase Orders','Receiving','Reports','Administration']))

    parts.append('<h1>Main dashboard layout</h1>')
    parts.append('<p>12-column responsive grid. Three rows. Nothing below the fold on a 27" monitor at 100% zoom.</p>')

    parts.append('<h2>Row 1  —  KPI cards (5)</h2>')
    parts.append(kv_table([
        ['#','Card','Displays','Click target'],
        ['<span class="accent-code">1</span>','<strong>Purchase Requests</strong>','New · Pending · Approved · Rejected · Urgent','Opens screen 1.x with the matching status filter applied'],
        ['<span class="accent-code">2</span>','<strong>RFQs</strong>','Open · Sent · Waiting · Expired','Opens 7.4 RFQ Tracking, pre-filtered'],
        ['<span class="accent-code">3</span>','<strong>Supplier Responses</strong>','Unread · Today · Late · Urgent','Opens 7.5 Supplier Responses'],
        ['<span class="accent-code">4</span>','<strong>Purchase Orders</strong>','Draft · Approved · Issued · Receiving · Closed','Opens 13.x'],
        ['<span class="accent-code">5</span>','<strong>Budget Status</strong>','Monthly Budget · Committed · Available · Forecast','Opens 16.4 Budget vs Actual'],
    ], ['5%','20%','40%','35%']))

    parts.append('<h2>Row 2  —  Priority queue + activity timeline</h2>')
    parts.append('<h3>Left panel · AI Priority Queue</h3>')
    parts.append('<p>Top 20 purchasing tasks requiring attention, ranked by Nexi. Columns: Priority · Request Number · Supplier · Issue · Due Date · AI Recommendation. Row actions: Review · Approve · Assign.</p>')
    parts.append('<h3>Right panel · Purchasing Activity Timeline</h3>')
    parts.append('<p>Reverse-chronological. Icons per event type: Created Request · Supplier Replied · PO Approved · Shipment Delayed · Goods Received · Invoice Received · Supplier Warning. Every item click-through to the source record.</p>')

    parts.append('<h2>Row 3  —  Performance · budget · alerts</h2>')
    parts.append(kv_table([
        ['Panel','Contents'],
        ['<strong>Supplier Performance (left)</strong>','Top suppliers · Average delivery · Average quality · Response time · Risk score · Trend (last 30 / 90 days)'],
        ['<strong>Budget Utilization (middle)</strong>','Monthly spend · Department spend · Project spend · Budget remaining · Graph (stacked bar per month)'],
        ['<strong>Alerts (right)</strong>','Late supplier · Budget exceeded · No supplier found · Duplicate request · Approval waiting · Delivery delay · Critical inventory'],
    ], ['32%','68%']))

    parts.append('<h1>Floating AI panel (Nexi)</h1>')
    parts.append('<p>Always visible, bottom-right. Persistent across navigation inside Purchasing.</p>')
    parts.append('<p>Functions:</p>')
    parts.append(ul(['Find supplier','Compare quotes','Create RFQ','Generate PO draft','Summarize supplier emails','Risk analysis','Open chat']))

    parts.append('<h1>Universal search</h1>')
    parts.append('<p>Single input, keyboard shortcut <code>/</code>. Searchable entities:</p>')
    parts.append(ul(['Item','Supplier','Purchase Request','Purchase Order','RFQ','Invoice reference','SOS item code','Barcode','QR']))

    parts.append('<h1>Filters (dashboard-wide)</h1>')
    parts.append(ul(['Project','Department','Supplier','Category','Priority','Status','Warehouse','Date range','Budget code']))
    parts.append('<p>Filters persist per user session and are echoed in the URL for shareable links.</p>')

    parts.append('<h1>Live updates</h1>')
    parts.append('<p>WebSocket subscription. Widgets update in under 2 seconds. Manual refresh is not required. If the socket drops, a "reconnecting…" chip appears and the dashboard falls back to a 15-second polling interval.</p>')

    parts.append('<h1>Notifications</h1>')
    parts.append('<p>Bell icon in the header with unread counter. Types:</p>')
    parts.append(ul(['Approval required','Supplier reply','Price change','Inventory alert','Delivery delay','Budget alert','Security alert']))

    parts.append('<h1>Colour semantics</h1>')
    parts.append(kv_table([
        ['Colour','Meaning'],
        ['<strong>Green</strong>','Completed / on-target'],
        ['<strong>Blue</strong>','Informational'],
        ['<strong>Orange</strong>','Warning · attention required'],
        ['<strong>Red</strong>','Critical · immediate action'],
        ['<strong>Grey</strong>','Inactive / disabled'],
    ], ['18%','82%']))

    parts.append('<h1>Security</h1>')
    parts.append(ul([
        'Widget-level RBAC — users only see data they are authorised for.',
        'No direct database access from the client.',
        'Every user action written to AuditLog.',
        'Session timeout with configurable idle window.',
        'MFA required for any Approve / Award action.',
        'All traffic over TLS; WebSocket over WSS.',
    ]))

    parts.append('<h1>APIs required</h1>')
    parts.append(kv_table([
        ['Method + Path','Purpose'],
        ['<span class="accent-code">GET /api/purchasing/dashboard</span>','Aggregated row-1 KPI card counts'],
        ['<span class="accent-code">GET /api/purchasing/alerts</span>','Row-3 alerts panel'],
        ['<span class="accent-code">GET /api/purchasing/tasks</span>','Row-2 AI Priority Queue'],
        ['<span class="accent-code">GET /api/purchasing/timeline</span>','Row-2 activity timeline'],
        ['<span class="accent-code">GET /api/purchasing/kpi</span>','Header + row-3 KPIs'],
        ['<span class="accent-code">GET /api/suppliers/performance</span>','Row-3 supplier performance'],
        ['<span class="accent-code">GET /api/budget/status</span>','Row-1 card 5 + row-3 budget'],
        ['<span class="accent-code">GET /api/sos/inventory</span>','Live inventory hooks for alerts'],
        ['<span class="accent-code">GET /api/notifications</span>','Header bell'],
        ['<span class="accent-code">WS  /ws/purchasing</span>','Live updates channel'],
    ], ['42%','58%']))

    parts.append('<h1>Database tables used</h1>')
    parts.append(ul([f'<code>{t}</code>' for t in [
        'PurchaseRequests','PurchaseRequestItems','Suppliers','SupplierPerformance',
        'RFQs','RFQResponses','PurchaseOrders','Receiving','Budget','Projects',
        'Departments','Users','Notifications','AuditLog'
    ]]))

    parts.append('<h1>KPIs displayed</h1>')
    parts.append(kv_table([
        ['KPI','Definition'],
        ['<strong>Average Purchase Cycle</strong>','Days from PR submission to PO closed'],
        ['<strong>Average Supplier Response</strong>','Median time between RFQ sent and first quote received'],
        ['<strong>Savings</strong>','(Baseline price − awarded price) × qty, monthly rolling'],
        ['<strong>Open RFQs</strong>','Count of RFQs whose status is Sent or Waiting'],
        ['<strong>Late Deliveries</strong>','Count of PO lines past promised delivery date and not fully received'],
        ['<strong>Budget Utilization</strong>','Committed + spent as % of allocated budget, monthly'],
        ['<strong>Supplier Score</strong>','Weighted mean of delivery, quality, service, price ratings'],
        ['<strong>Purchase Lead Time</strong>','Days from PO issued to first receipt'],
        ['<strong>Inventory Risk</strong>','SKUs projected to stock-out within lead time × unit cost'],
        ['<strong>Approval Time</strong>','Median hours from PR submitted to first approval action'],
    ], ['32%','68%']))

    parts.append('<h1>Acceptance criteria</h1>')
    parts.append(ul([
        'Dashboard loads in under 3 seconds on the reference workstation (Chromium latest, 100 Mbps, warm cache).',
        'All widgets respect role-based permissions; hidden data never reaches the client.',
        'Real-time updates occur without page refresh within 2 seconds of the source event.',
        'All counts reconcile exactly with the underlying transaction data (nightly reconciliation job).',
        'Every alert links directly to the transaction that raised it.',
        'Every user action is written to AuditLog with actor, timestamp, before/after state, IP, device.',
        'Dashboard is responsive from 1366×768 desktop up to 4K displays; no horizontal scroll at any size.',
        'MFA prompt appears before any Approve / Award action from within the dashboard.',
    ]))

    parts.append('<footer class="foot"><span>HydroNexis-AI · Screen 001 · Purchasing Mission Control</span><span>ACC-PUR-002 · rev 2026-07-28</span></footer>')
    return ''.join(parts)

# ============================================================
# D3 — Screen 002 Purchase Request
# ============================================================
def build_d3():
    parts = [cover_html('ACC-PUR-003',
                        'HydroNexis-AI · Accounting · Purchasing · Screen 002',
                        'Purchase Request',
                        'Entry point for every purchasing workflow')]
    parts.append('<div class="pgbreak"></div>')

    parts.append('<h1>Purpose</h1>')
    parts.append('<p>This screen creates every purchase request in HydroNexis. Nothing can be purchased without an approved Purchase Request. Every Purchase Request receives a unique PR Number and becomes fully traceable through the workflow to a closed PO.</p>')

    parts.append('<h1>Access matrix</h1>')
    parts.append(kv_table([
        ['Role','Create','Edit','Approve','Cancel'],
        ['<strong>Employee</strong>','Yes','Draft only','No','Draft only'],
        ['<strong>Department Manager</strong>','Yes','Yes','Level 1','Yes'],
        ['<strong>Purchasing Officer</strong>','Yes','Yes','No','Yes'],
        ['<strong>Purchasing Manager</strong>','Yes','Yes','Level 2','Yes'],
        ['<strong>Accounting Manager</strong>','Yes','Yes','Financial','Yes'],
        ['<strong>CEO</strong>','Yes','Yes','Final','Yes'],
    ]))

    parts.append('<h1>PR Number</h1>')
    parts.append('<p>Automatically generated on Save Draft. Format:</p>')
    parts.append('<p><span class="accent-code" style="font-size:12pt">PR-YYYY-NNNNNN</span></p>')
    parts.append('<p>Example: <code>PR-2026-000458</code>. Immutable once assigned. Sequence is monotonic per calendar year; the counter resets on 1 January.</p>')

    parts.append('<h1>Header fields (read-only after creation)</h1>')
    parts.append(ul(['Purchase Request No.','Status','Created By','Created Date','Last Modified','Revision','Priority','Workflow Stage']))

    parts.append('<h1>Workflow</h1>')
    parts.append('<p>Linear pipeline. Each stage advances only when its exit conditions are met.</p>')
    parts.append(kv_table([
        ['#','Stage','Exit condition'],
        ['<span class="accent-code">01</span>','<strong>Draft</strong>','User clicks Submit and all Submit-Validation checks pass'],
        ['<span class="accent-code">02</span>','<strong>Submitted</strong>','AI Validation job completes'],
        ['<span class="accent-code">03</span>','<strong>AI Validation</strong>','No blocking issues, or user acknowledges warnings'],
        ['<span class="accent-code">04</span>','<strong>Department Approval</strong>','Level 1 approver decision recorded'],
        ['<span class="accent-code">05</span>','<strong>Purchasing Review</strong>','Purchasing Officer/Manager assigns handling'],
        ['<span class="accent-code">06</span>','<strong>Inventory Verification</strong>','SOS reconfirms need after any pending transfers'],
        ['<span class="accent-code">07</span>','<strong>Supplier Sourcing</strong>','Purchasing selects supplier list or triggers Supplier Discovery'],
        ['<span class="accent-code">08</span>','<strong>RFQ</strong>','RFQ sent; awaiting responses'],
        ['<span class="accent-code">09</span>','<strong>Quotation Evaluation</strong>','At least one qualifying quote received and scored'],
        ['<span class="accent-code">10</span>','<strong>Approval</strong>','All required approval levels recorded'],
        ['<span class="accent-code">11</span>','<strong>Purchase Order</strong>','PO created and sent'],
        ['<span class="accent-code">12</span>','<strong>Receiving</strong>','Goods received against PO'],
        ['<span class="accent-code">13</span>','<strong>Completed</strong>','PO closed, three-way match complete'],
    ], ['6%','30%','64%']))

    parts.append('<h1>Main form — general information</h1>')
    parts.append(kv_table([
        ['Field','Type','Rule','Required'],
        ['<strong>Request Title</strong>','Text','Max 150 chars','Yes'],
        ['<strong>Department</strong>','Dropdown','Sourced from Departments','Yes'],
        ['<strong>Project</strong>','Dropdown','Sourced from Projects','No'],
        ['<strong>Cost Center</strong>','Dropdown','Accounting integration','Yes'],
        ['<strong>Budget Code</strong>','Lookup','Accounting Budget','Yes'],
        ['<strong>Required Delivery Date</strong>','Date','Must be ≥ today; may be constrained by category','Yes'],
        ['<strong>Priority</strong>','Enum','Normal · High · Urgent · Emergency','Yes'],
        ['<strong>Justification</strong>','Text area','Min 30 · Max 3000 chars','Yes'],
    ], ['24%','14%','46%','16%']))

    parts.append('<h1>Item grid</h1>')
    parts.append('<p>A single Purchase Request may contain multiple items. Every row is independently validated.</p>')
    parts.append(kv_table([
        ['Column','Rule'],
        ['<strong>Line No.</strong>','Auto, 1..N per PR'],
        ['<strong>Item Code</strong>','Free text OR lookup into SOS Items · triggers Intelligent Item Recognition'],
        ['<strong>Item Description</strong>','Populated from lookup, editable'],
        ['<strong>Category</strong>','Inherited from item; overridable'],
        ['<strong>Quantity</strong>','Positive number · decimals allowed per unit definition'],
        ['<strong>Unit</strong>','From item master'],
        ['<strong>Estimated Unit Price</strong>','Populated from last purchase · editable'],
        ['<strong>Estimated Total</strong>','Computed: qty × unit price · read-only'],
        ['<strong>Currency</strong>','Defaults to company currency · overridable per line'],
        ['<strong>Preferred Brand</strong>','Optional; drives supplier suggestion ranking'],
        ['<strong>Alternative Brand Allowed</strong>','Boolean; if false, Nexi must not suggest substitutes'],
        ['<strong>Warehouse Destination</strong>','Which warehouse receives the goods'],
        ['<strong>Required Date</strong>','Per-line override of the header Required Delivery Date'],
        ['<strong>Remarks</strong>','Free text'],
        ['<strong>Attachment</strong>','Per-line file upload (drawing, spec sheet, etc.)'],
    ], ['28%','72%']))

    parts.append('<h1>Intelligent item recognition</h1>')
    parts.append('<p>When an Item Code is entered, Nexi immediately queries every source she has and returns results inline within 500 ms:</p>')
    parts.append(ul([
        'SOS Inventory (on-hand + reserved)',
        'Previous purchases of this item',
        'Supplier database (who has sold this item)',
        'Warehouse availability (all sites)',
        'Historical pricing (last 12 months, per supplier)',
        'Open purchase orders for the same item',
        'Approved brands',
        'Existing draft/submitted duplicate requests',
    ]))

    parts.append('<h1>AI suggestion panel</h1>')
    parts.append('<p>Right-side rail, always visible while the form is open. Suggestions appear as cards; each card is dismissible and time-stamped. Representative outputs:</p>')
    parts.append(ul([
        'Current stock available at Warehouse A — internal transfer recommended',
        'Transfer from GH5 Warehouse (48 units on hand)',
        'Supplier already delivering tomorrow — add to that PO',
        'Previous price ₱142 · current market estimate ₱138',
        'Preferred supplier: ABC Industrial (score 87, 8 past orders)',
        'Savings opportunity: ₱3,250 by consolidating with PR-000452',
        'Risk level: LOW',
    ]))

    parts.append('<h1>Attachments</h1>')
    parts.append(kv_table([
        ['Rule','Value'],
        ['<strong>Formats</strong>','PDF · DWG · DXF · Excel · Word · Images (JPG/PNG/HEIC) · Videos (MP4/MOV) · ZIP'],
        ['<strong>Max size per file</strong>','500 MB'],
        ['<strong>Virus scan</strong>','Every upload scanned before persistence; failed scans quarantined and audit-logged'],
        ['<strong>Retention</strong>','Tied to the PR record; kept per company retention policy (default 7 years)'],
    ], ['26%','74%']))

    parts.append('<h1>Technical drawing preview</h1>')
    parts.append('<p>Built-in viewer for PDF/DWG/DXF/Image line-item attachments. Features: zoom · rotate · fullscreen · version history · markup (annotations saved back to the PR).</p>')

    parts.append('<h1>Budget validation</h1>')
    parts.append('<p>Real-time. Every quantity or unit-price change re-runs the check.</p>')
    parts.append(ul([
        'Budget available for the selected Budget Code',
        'Remaining budget in the current period',
        'Project budget (if a project is selected)',
        'Department budget','Monthly allocation','Annual allocation',
    ]))
    parts.append(kv_table([
        ['Result','Behaviour'],
        ['<strong>OK</strong>','Green tick shown next to the amount'],
        ['<strong>Insufficient</strong>','Yellow warning — submission allowed with manager acknowledgement'],
        ['<strong>Exceeded</strong>','Red block — Submit button disabled until fixed or a higher-level override is granted'],
    ], ['30%','70%']))

    parts.append('<h1>Inventory validation</h1>')
    parts.append('<p>Calls SOS Inventory on every recomputation.</p>')
    parts.append(ul([
        'Current stock','Reserved stock','Incoming orders','Warehouse transfers in flight',
        'Alternative items (same category / substitutable)',
    ]))
    parts.append('<div class="cal"><span class="lbl">Rule</span>If inventory already exists that satisfies the request, Nexi recommends internal transfer instead of purchasing and marks the PR line as blocked pending user acknowledgement.</div>')

    parts.append('<h1>Duplicate detection</h1>')
    parts.append('<p>Searches for open or submitted PRs matching all of:</p>')
    parts.append(ul(['Same Item','Same Department','Same Project','Same week','Same Supplier (if preferred is set)','Same Quantity band (±20 %)']))
    parts.append('<p>If matches are found, the user is shown a "Possible duplicate" panel with links and must explicitly confirm before submission.</p>')

    parts.append('<h1>Supplier intelligence preview</h1>')
    parts.append('<p>Per line item, shows:</p>')
    parts.append(ul(['Preferred supplier','Last supplier','Last purchase price','Average lead time','Supplier rating (0-100)','Warranty history','Quality rating']))

    parts.append('<h1>AI recommendation panel</h1>')
    parts.append('<p>Persistent right-side panel. Recommendations are informational unless a policy flag makes them blocking. Example outputs:</p>')
    parts.append(ul([
        'Purchase not required — internal transfer covers the need',
        'Internal transfer recommended (GH5 → GH1, 48 units)',
        'Combine with PR-458 to unlock 5 % volume discount',
        'Use existing contract with Supplier XYZ (contract expires 2026-11)',
        'Wait two days — this item price is trending down 8 %',
        'Alternative supplier available with 30 % shorter lead time',
        'Risk alert — supplier under credit review',
    ]))

    parts.append('<h1>Approval matrix preview</h1>')
    parts.append('<p>Shown to the user before Submit. Reflects the live approval matrix based on total value, department, category, and any category-specific overrides.</p>')
    parts.append('<p>Example route:</p>')
    parts.append('<p><span class="accent-code" style="font-size:11pt">Department Manager  →  Purchasing Manager  →  Accounting Manager  →  CEO</span></p>')
    parts.append('<p>Route is snapshotted onto the PR at submission time; subsequent matrix changes do not retro-affect in-flight requests.</p>')

    parts.append('<h1>Submit validation</h1>')
    parts.append('<p>Submit is disabled unless ALL of the following are true:</p>')
    parts.append(ul([
        'All mandatory fields complete',
        'Budget check is OK or warning-acknowledged',
        'Every line item has a valid quantity, unit, and estimated total',
        'Required attachments (per category rules) are uploaded and scanned',
        'AI Validation job has returned',
        'Every raised duplicate warning has been acknowledged',
    ]))

    parts.append('<h1>Buttons</h1>')
    parts.append(kv_table([
        ['Button','Effect'],
        ['<strong>Save Draft</strong>','Persists as Draft; PR Number assigned on first save'],
        ['<strong>Submit</strong>','Advances to AI Validation stage; kicks off the workflow'],
        ['<strong>Validate</strong>','Runs the full validation suite without submitting'],
        ['<strong>Check Inventory</strong>','Forces a fresh SOS query and re-evaluates transfer suggestions'],
        ['<strong>Find Supplier</strong>','Opens 6.1 AI Supplier Search seeded with the current item(s)'],
        ['<strong>Estimate Cost</strong>','Refreshes unit-price estimates from historical + market data'],
        ['<strong>Cancel</strong>','Cancels the PR (respects Access matrix)'],
        ['<strong>Print</strong>','Print-friendly view'],
        ['<strong>Export PDF</strong>','Downloads a PDF of the PR with a QR link back'],
        ['<strong>Clone Request</strong>','Duplicates the PR into a new Draft'],
    ], ['22%','78%']))

    parts.append('<h1>Notifications</h1>')
    parts.append('<p>On submission, notifications are dispatched immediately to:</p>')
    parts.append(ul(['Department Manager (Level 1 approver)','Purchasing Officer + Manager','Accounting (if a Budget Code override is used)','AI Engine (for the validation job)']))

    parts.append('<h1>Audit trail</h1>')
    parts.append('<p>Every change to a Purchase Request is persisted and cannot be deleted.</p>')
    parts.append(kv_table([
        ['Field','Captured'],
        ['<strong>User</strong>','User id + display name at time of change'],
        ['<strong>Timestamp</strong>','UTC, ms precision'],
        ['<strong>Old Value</strong>','JSON snapshot'],
        ['<strong>New Value</strong>','JSON snapshot'],
        ['<strong>Reason</strong>','Free-text, required for edits after Submitted stage'],
        ['<strong>IP Address</strong>','Source IP'],
        ['<strong>Device</strong>','User-agent fingerprint'],
    ], ['22%','78%']))

    parts.append('<h1>APIs</h1>')
    parts.append(kv_table([
        ['Method + Path','Purpose'],
        ['<span class="accent-code">POST /api/purchasing/pr</span>','Create a new PR (Draft)'],
        ['<span class="accent-code">PUT  /api/purchasing/pr/{id}</span>','Update fields or line items'],
        ['<span class="accent-code">GET  /api/purchasing/pr/{id}</span>','Fetch a single PR with items + workflow state'],
        ['<span class="accent-code">POST /api/purchasing/pr/{id}/submit</span>','Submit the PR — advances to AI Validation stage'],
        ['<span class="accent-code">POST /api/purchasing/pr/{id}/cancel</span>','Cancel the PR'],
        ['<span class="accent-code">POST /api/purchasing/pr/{id}/clone</span>','Clone into a new Draft'],
        ['<span class="accent-code">GET  /api/sos/items</span>','Item lookup for the Item Code field'],
        ['<span class="accent-code">GET  /api/sos/stock</span>','Current + reserved stock for a given item'],
        ['<span class="accent-code">GET  /api/budget/check</span>','Real-time budget validation'],
        ['<span class="accent-code">GET  /api/projects</span>','Project dropdown source'],
        ['<span class="accent-code">GET  /api/departments</span>','Department dropdown source'],
        ['<span class="accent-code">GET  /api/suppliers/history</span>','Supplier intelligence panel'],
        ['<span class="accent-code">POST /api/attachments/upload</span>','Multi-part upload; returns attachment ids'],
        ['<span class="accent-code">POST /api/ai/pr/validate</span>','Run AI validation for the PR'],
    ], ['42%','58%']))

    parts.append('<h1>Database tables</h1>')
    parts.append(ul([f'<code>{t}</code>' for t in [
        'PurchaseRequest','PurchaseRequestItems','PurchaseRequestWorkflow','PurchaseRequestAttachments',
        'Departments','Projects','Budget','Inventory','Suppliers','AuditLog','Notifications'
    ]]))

    parts.append('<h1>Acceptance criteria</h1>')
    parts.append(ul([
        'PR number is generated automatically and is immutable.',
        'A single PR supports N line items with independent, per-line validation.',
        'Budget checks and SOS inventory checks are real-time and re-run on every relevant edit.',
        'Duplicate requests are surfaced before submission and require explicit acknowledgement.',
        'AI recommendations are non-blocking by default; policy flags can make specific recommendations blocking.',
        'All changes are captured by the audit trail with the fields listed above.',
        'Submission creates the workflow instance and notifies the next approver within 5 seconds.',
        'A submitted PR cannot be edited except through the versioned Revision mechanism.',
    ]))

    parts.append('<footer class="foot"><span>HydroNexis-AI · Screen 002 · Purchase Request</span><span>ACC-PUR-003 · rev 2026-07-28</span></footer>')
    return ''.join(parts)

# ============================================================
# Render each to PDF
# ============================================================
def render(body_html, out_pdf, tmp_name):
    full = f'<!doctype html><html><head><meta charset="utf-8">{BASE_STYLE}</head><body>{body_html}</body></html>'
    html_path = TMP_DIR / tmp_name
    html_path.write_text(full)
    cmd = [
        CHROMIUM, '--headless', '--disable-gpu', '--no-sandbox',
        '--run-all-compositor-stages-before-draw',
        f'--print-to-pdf={out_pdf}',
        '--print-to-pdf-no-header',
        '--virtual-time-budget=6000',
        f'file://{html_path}',
    ]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode() + '\n')
        raise SystemExit('chromium failed for '+tmp_name)
    print(f'wrote {out_pdf}  ({os.path.getsize(out_pdf)} bytes)')

jobs = [
    (build_d1(), OUT_DIR / 'D1-Screen-Index.pdf',            'd1.html'),
    (build_d2(), OUT_DIR / 'D2-Screen-001-Mission-Control.pdf', 'd2.html'),
    (build_d3(), OUT_DIR / 'D3-Screen-002-Purchase-Request.pdf', 'd3.html'),
]
for body, out, tmp in jobs:
    render(body, str(out), tmp)
