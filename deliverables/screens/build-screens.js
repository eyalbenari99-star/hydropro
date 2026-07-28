// Build developer-ready specs for three deliverables:
//   D1  Screen Index (v1.0)
//   D2  Screen 001 · Purchasing Mission Control
//   D3  Screen 002 · Purchase Request
// Emits three .docx files under this directory.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, LevelFormat, Header, Footer, PageNumber
} = require('docx');

// -------- palette + helpers (shared with build-spec.js) --------
const INK = '111827';
const MUTED = '6B7280';
const ACCENT = '1E7A5F';
const RULE = 'D1D5DB';
const CODE_BG = 'F4F5F1';
const TABLE_HEAD_BG = 'EEF1EA';
const STATUS_COLOR = { done:'1E7A5F', partial:'B08018', roadmap:'6B7280', na:'6B7280' };

const t   = (text, opts = {}) => new TextRun({ text, size: 22, color: INK, ...opts });
const tb  = (text, opts = {}) => new TextRun({ text, size: 22, color: INK, bold:true, ...opts });
const tm  = (text, opts = {}) => new TextRun({ text, size: 22, color: MUTED, ...opts });
const mono = (text, opts = {}) => new TextRun({ text, font: 'Consolas', size: 18, color: INK, ...opts });
const monoA = (text, opts = {}) => new TextRun({ text, font: 'Consolas', size: 18, color: ACCENT, ...opts });

const p = (children, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 300 },
  children: Array.isArray(children) ? children : [children],
  ...opts,
});
const body = (text, opts = {}) => p([t(text)], opts);

const h1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 160 },
  border: { bottom: { color: ACCENT, size: 12, space: 6, style: BorderStyle.SINGLE } },
  children: [new TextRun({ text, size: 32, bold: true, color: INK })],
});
const h2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 100 },
  children: [new TextRun({ text, size: 26, bold: true, color: INK })],
});
const h3 = text => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 60 },
  children: [new TextRun({ text, size: 22, bold: true, color: ACCENT })],
});

const bullet = (children, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { after: 40 },
  children: Array.isArray(children) ? children : [children],
});

const callout = (label, text, color = ACCENT) => new Paragraph({
  spacing: { before: 100, after: 160 },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F7F3' },
  border: {
    left: { style: BorderStyle.SINGLE, size: 16, color, space: 8 },
    top: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
    right: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
  },
  children: [
    new TextRun({ text: label.toUpperCase() + '  ', bold: true, size: 18, color }),
    new TextRun({ text, size: 22, color: INK }),
  ],
});

function buildTable(rows, colWidthsPct, hasHeader = true) {
  const pageContentDxa = 8640;
  const columnWidths = colWidthsPct.map(pct => Math.round(pageContentDxa * pct / 100));
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    columnWidths,
    width: { size: totalWidth, type: WidthType.DXA },
    rows: rows.map((row, rIdx) => new TableRow({
      children: row.map((cellContent, cIdx) => {
        const isHeader = hasHeader && rIdx === 0;
        return new TableCell({
          width: { size: columnWidths[cIdx], type: WidthType.DXA },
          shading: isHeader ? { type: ShadingType.CLEAR, color: 'auto', fill: TABLE_HEAD_BG } : undefined,
          margins: { top: 90, bottom: 90, left: 130, right: 130 },
          borders: {
            top:    { style: BorderStyle.SINGLE, size: isHeader ? 8 : 4, color: isHeader ? INK : RULE },
            bottom: { style: BorderStyle.SINGLE, size: isHeader ? 8 : 4, color: isHeader ? INK : RULE },
            left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          children: Array.isArray(cellContent)
            ? cellContent
            : [new Paragraph({
                spacing: { after: 0 },
                children: [ isHeader
                  ? new TextRun({ text: cellContent, bold: true, size: 18, color: INK, allCaps: true })
                  : new TextRun({ text: cellContent, size: 20, color: INK })
                ],
              })],
        });
      }),
    })),
  });
}

const cell  = (runs, opts = {}) => [new Paragraph({ spacing: { after: 0 }, children: runs, ...opts })];
const cellT = text => cell([new TextRun({ text, size: 20, color: INK })]);
const cellB = text => cell([new TextRun({ text, size: 20, color: INK, bold: true })]);
const cellM = text => cell([new TextRun({ text, font:'Consolas', size: 18, color: INK })]);
const cellA = text => cell([new TextRun({ text, font:'Consolas', size: 18, color: ACCENT })]);

const meta = (label, value, code=false) => new Paragraph({
  spacing: { after: 30 },
  children: [
    new TextRun({ text: label.toUpperCase() + '  ', bold: true, size: 16, color: MUTED, characterSpacing: 40 }),
    code ? new TextRun({ text: value, font:'Consolas', size: 20, color: INK })
         : new TextRun({ text: value, size: 22, color: INK }),
  ],
});

const rule = () => new Paragraph({
  spacing: { before: 160, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
  children: [new TextRun({ text: ' ', size: 2 })],
});

// ========================================================================
// Cover builder
// ========================================================================
function cover(idTag, moduleLine, title, subtitle, statusBadge) {
  return [
    new Paragraph({ spacing: { before: 1600 }, children: [
      new TextRun({ text: 'HYDRONEXIS-AI · ACCOUNTING MODULE · PURCHASING SUB-MODULE', size: 18, color: MUTED, characterSpacing: 40, allCaps: true }),
    ]}),
    new Paragraph({ spacing: { after: 200 }, children: [
      new TextRun({ text: idTag, size: 20, color: ACCENT, bold: true, font: 'Consolas', characterSpacing: 40 }),
    ]}),
    new Paragraph({ spacing: { after: 100 }, children: [
      new TextRun({ text: title, size: 56, bold: true, color: INK }),
    ]}),
    new Paragraph({ spacing: { after: 200 }, children: [
      new TextRun({ text: subtitle, size: 28, italics: true, color: ACCENT }),
    ]}),
    new Paragraph({
      spacing: { before: 100, after: 220 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 8 } },
      children: [new TextRun({ text: ' ', size: 2 })],
    }),
    meta('Module', moduleLine),
    meta('Document ID', idTag, true),
    meta('Status', statusBadge),
    meta('Version', '1.0'),
    meta('Repository', 'eyalbenari99-star/hydropro'),
    meta('Branch', 'claude/accounting-purchasing-suppliers-5p94sz', true),
    meta('Document date', '2026-07-28'),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ========================================================================
// DELIVERABLE #1  —  Complete Screen Index (Version 1.0)
// ========================================================================
const INDEX = [
  { n: '0',  title: 'Purchasing Home', items: [
    ['0.1', 'Purchasing Mission Control'],
    ['0.2', 'Purchasing Calendar'],
    ['0.3', 'My Tasks'],
    ['0.4', 'Notifications'],
    ['0.5', 'AI Assistant (Nexi)'],
  ]},
  { n: '1', title: 'Purchase Requests', items: [
    ['1.1', 'New Purchase Request'],
    ['1.2', 'Purchase Request Details'],
    ['1.3', 'Draft Requests'],
    ['1.4', 'Submitted Requests'],
    ['1.5', 'Pending Approval'],
    ['1.6', 'Approved Requests'],
    ['1.7', 'Rejected Requests'],
    ['1.8', 'Cancelled Requests'],
    ['1.9', 'Archived Requests'],
  ]},
  { n: '2', title: 'AI Validation', items: [
    ['2.1', 'AI Review'],
    ['2.2', 'Duplicate Detection'],
    ['2.3', 'Budget Verification'],
    ['2.4', 'Consumption Analysis'],
    ['2.5', 'Suggested Alternatives'],
    ['2.6', 'Risk Analysis'],
  ]},
  { n: '3', title: 'SOS Inventory Integration', items: [
    ['3.1', 'Current Stock'],
    ['3.2', 'Available Stock'],
    ['3.3', 'Incoming Deliveries'],
    ['3.4', 'Reserved Inventory'],
    ['3.5', 'Warehouse Transfer Suggestions'],
    ['3.6', 'Internal Availability'],
    ['3.7', 'Previous Purchase History'],
  ]},
  { n: '4', title: 'Technical Specifications', items: [
    ['4.1', 'Product Specification'],
    ['4.2', 'Brand Requirements'],
    ['4.3', 'Drawing Viewer'],
    ['4.4', 'Attachments'],
    ['4.5', 'Technical Approval'],
    ['4.6', 'Revision History'],
  ]},
  { n: '5', title: 'Supplier Management', items: [
    ['5.1', 'Supplier Directory'],
    ['5.2', 'Supplier Profile'],
    ['5.3', 'Supplier Qualification'],
    ['5.4', 'Supplier Categories'],
    ['5.5', 'Supplier Performance'],
    ['5.6', 'Blacklisted Suppliers'],
    ['5.7', 'Preferred Suppliers'],
    ['5.8', 'New Supplier Registration'],
  ]},
  { n: '6', title: 'Supplier Discovery', items: [
    ['6.1', 'AI Supplier Search'],
    ['6.2', 'Local Suppliers'],
    ['6.3', 'International Suppliers'],
    ['6.4', 'Manufacturer Search'],
    ['6.5', 'Distributor Search'],
    ['6.6', 'Supplier Comparison'],
  ]},
  { n: '7', title: 'RFQ Center', items: [
    ['7.1', 'Create RFQ'],
    ['7.2', 'RFQ Wizard'],
    ['7.3', 'Send RFQ'],
    ['7.4', 'RFQ Tracking'],
    ['7.5', 'Supplier Responses'],
    ['7.6', 'RFQ Expiration'],
  ]},
  { n: '8', title: 'Communication Center', items: [
    ['8.1', 'Email'],
    ['8.2', 'SMS'],
    ['8.3', 'Communication Timeline'],
    ['8.4', 'Attachments'],
    ['8.5', 'AI Summary'],
    ['8.6', 'Follow-up Scheduler'],
  ]},
  { n: '9', title: 'Quotation Management', items: [
    ['9.1', 'Quotation Inbox'],
    ['9.2', 'AI Extraction'],
    ['9.3', 'Price Comparison'],
    ['9.4', 'Technical Comparison'],
    ['9.5', 'Commercial Comparison'],
    ['9.6', 'Currency Conversion'],
    ['9.7', 'Landed Cost'],
  ]},
  { n: '10', title: 'Negotiation', items: [
    ['10.1', 'Negotiation Workspace'],
    ['10.2', 'Counter Offers'],
    ['10.3', 'Price History'],
    ['10.4', 'AI Negotiation Suggestions'],
    ['10.5', 'Supplier Commitments'],
  ]},
  { n: '11', title: 'Evaluation', items: [
    ['11.1', 'Supplier Scorecard'],
    ['11.2', 'Risk Score'],
    ['11.3', 'Quality History'],
    ['11.4', 'Delivery Performance'],
    ['11.5', 'Financial Stability'],
    ['11.6', 'AI Recommendation'],
  ]},
  { n: '12', title: 'Approval Center', items: [
    ['12.1', 'Approval Queue'],
    ['12.2', 'Approval Details'],
    ['12.3', 'Multi-Level Approval'],
    ['12.4', 'Digital Signature'],
    ['12.5', 'Audit Log'],
  ]},
  { n: '13', title: 'Purchase Orders', items: [
    ['13.1', 'Create PO'],
    ['13.2', 'Draft PO'],
    ['13.3', 'Approved PO'],
    ['13.4', 'Sent PO'],
    ['13.5', 'Supplier Confirmation'],
    ['13.6', 'Amendment History'],
  ]},
  { n: '14', title: 'Receiving', items: [
    ['14.1', 'Expected Deliveries'],
    ['14.2', 'Goods Receiving'],
    ['14.3', 'Partial Deliveries'],
    ['14.4', 'Quality Inspection'],
    ['14.5', 'Variance Management'],
    ['14.6', 'Close Purchase Order'],
  ]},
  { n: '15', title: 'Supplier Evaluation', items: [
    ['15.1', 'Delivery Rating'],
    ['15.2', 'Quality Rating'],
    ['15.3', 'Service Rating'],
    ['15.4', 'Price Rating'],
    ['15.5', 'Overall Supplier Score'],
  ]},
  { n: '16', title: 'Reports & Analytics', items: [
    ['16.1', 'Spend Analysis'],
    ['16.2', 'Supplier Analysis'],
    ['16.3', 'Savings Report'],
    ['16.4', 'Budget vs Actual'],
    ['16.5', 'Procurement KPI Dashboard'],
    ['16.6', 'Executive Reports'],
  ]},
  { n: '17', title: 'Administration', items: [
    ['17.1', 'Purchasing Settings'],
    ['17.2', 'Approval Matrix'],
    ['17.3', 'User Roles'],
    ['17.4', 'Permissions'],
    ['17.5', 'Email Templates'],
    ['17.6', 'SMS Templates'],
    ['17.7', 'AI Configuration'],
    ['17.8', 'Integration Settings'],
    ['17.9', 'Security & Audit'],
  ]},
];

function buildDeliverable1() {
  const totalScreens = INDEX.reduce((a, s) => a + s.items.length, 0);
  const c = [
    ...cover('ACC-PUR-D1', 'HydroNexis-AI · Accounting · Purchasing', 'Complete Screen Index', 'Master navigation for the Purchasing sub-module', 'Ready for Development'),

    h1('Purpose'),
    body('This document defines every screen that will exist under Accounting → Purchasing. It is the master navigation the development team will build against. Each subsequent deliverable specifies one screen in full technical detail.'),
    body('Total screens: ' + totalScreens + ' across 18 sections (0–17). Every screen has a unique numeric identifier (e.g. 1.5 for Pending Approval) that will be used as the router key, the URL segment, and the primary reference in all subsequent deliverables.'),

    h1('Screen Index'),
    ...INDEX.flatMap(sec => {
      const rows = [
        ['ID', 'Screen'],
        ...sec.items.map(row => [cellA(row[0]), cellB(row[1])])
      ];
      return [
        h3(sec.n + '.  ' + sec.title),
        buildTable(rows, [15, 85]),
      ];
    }),

    h1('Summary counts'),
    buildTable([
      ['Section', 'Screens'],
      ...INDEX.map(s => [ cellT(s.n + '. ' + s.title), cellA(String(s.items.length)) ]),
      [ cellB('TOTAL'), cellA(String(totalScreens)) ]
    ], [70, 30]),
  ];
  return docFromChildren(c, 'ACC-PUR-D1 · Screen Index');
}

// ========================================================================
// DELIVERABLE #2  —  Screen 001  Purchasing Mission Control
// ========================================================================
function buildDeliverable2() {
  const c = [
    ...cover('ACC-PUR-002', 'HydroNexis-AI · Accounting · Purchasing · Screen 001', 'Purchasing Mission Control', 'Operational control center — 5-second comprehension, no scroll', 'Ready for Development'),

    h1('Purpose'),
    body('This is the first screen displayed when a user enters Accounting → Purchasing. It is the operational control center for the Purchasing Department. A trained user must comprehend the entire purchasing operation within 5 seconds. No vertical scroll on a 27" monitor. Critical information only.'),

    h1('Access matrix'),
    buildTable([
      ['Role', 'Access'],
      [cellB('Purchasing Officer'),   cellT('Full')],
      [cellB('Purchasing Manager'),   cellT('Full')],
      [cellB('Accounting Manager'),   cellT('Full')],
      [cellB('Finance Manager'),      cellT('Read only')],
      [cellB('CEO'),                  cellT('Read only')],
      [cellB('Warehouse'),            cellT('Limited (deliveries + receiving alerts only)')],
      [cellB('Department Requester'), cellT('No access')],
    ], [40, 60]),

    h1('Page chrome'),

    h2('Header (80 px)'),
    body('Left-to-right: Company logo · breadcrumb (Accounting → Purchasing → Mission Control) · current user · current date · notifications bell · AI status indicator · global search · profile menu.'),

    h2('Left navigation'),
    p([t('Vertical rail. Icon + label. Sections:')]),
    ...['Dashboard','Purchase Requests','Suppliers','RFQs','Quotations','Negotiations','Purchase Orders','Receiving','Reports','Administration'].map(x => bullet([t(x)])),

    h1('Main dashboard layout'),
    body('12-column responsive grid. Three rows. Nothing below the fold on a 27" monitor at 100% zoom.'),

    h2('Row 1  —  KPI cards (5)'),
    buildTable([
      ['#', 'Card', 'Displays', 'Click target'],
      [cellA('1'), cellB('Purchase Requests'),  cellT('New · Pending · Approved · Rejected · Urgent'),          cellT('Opens screen 1.x with the matching status filter applied')],
      [cellA('2'), cellB('RFQs'),               cellT('Open · Sent · Waiting · Expired'),                       cellT('Opens 7.4 RFQ Tracking, pre-filtered')],
      [cellA('3'), cellB('Supplier Responses'), cellT('Unread · Today · Late · Urgent'),                        cellT('Opens 7.5 Supplier Responses')],
      [cellA('4'), cellB('Purchase Orders'),    cellT('Draft · Approved · Issued · Receiving · Closed'),        cellT('Opens 13.x')],
      [cellA('5'), cellB('Budget Status'),      cellT('Monthly Budget · Committed · Available · Forecast'),     cellT('Opens 16.4 Budget vs Actual')],
    ], [6, 22, 40, 32]),

    h2('Row 2  —  Priority queue + activity timeline'),
    h3('Left panel · AI Priority Queue'),
    body('Top 20 purchasing tasks requiring attention, ranked by Nexi. Columns: Priority · Request Number · Supplier · Issue · Due Date · AI Recommendation. Row actions: Review · Approve · Assign.'),
    h3('Right panel · Purchasing Activity Timeline'),
    body('Reverse-chronological. Icons per event type: Created Request · Supplier Replied · PO Approved · Shipment Delayed · Goods Received · Invoice Received · Supplier Warning. Every item click-through to the source record.'),

    h2('Row 3  —  Performance · budget · alerts'),
    buildTable([
      ['Panel', 'Contents'],
      [cellB('Supplier Performance (left)'),   cellT('Top suppliers · Average delivery · Average quality · Response time · Risk score · Trend (last 30 / 90 days)')],
      [cellB('Budget Utilization (middle)'),   cellT('Monthly spend · Department spend · Project spend · Budget remaining · Graph (stacked bar per month)')],
      [cellB('Alerts (right)'),                cellT('Late supplier · Budget exceeded · No supplier found · Duplicate request · Approval waiting · Delivery delay · Critical inventory')],
    ], [30, 70]),

    h1('Floating AI panel (Nexi)'),
    body('Always visible, bottom-right. Persistent across navigation inside Purchasing.'),
    p([t('Functions:')]),
    ...['Find supplier','Compare quotes','Create RFQ','Generate PO draft','Summarize supplier emails','Risk analysis','Open chat'].map(x => bullet([t(x)])),

    h1('Universal search'),
    body('Single input, keyboard shortcut "/". Searchable entities:'),
    ...['Item','Supplier','Purchase Request','Purchase Order','RFQ','Invoice reference','SOS item code','Barcode','QR'].map(x => bullet([t(x)])),

    h1('Filters (dashboard-wide)'),
    ...['Project','Department','Supplier','Category','Priority','Status','Warehouse','Date range','Budget code'].map(x => bullet([t(x)])),
    body('Filters persist per user session and are echoed in the URL for shareable links.'),

    h1('Live updates'),
    body('WebSocket subscription. Widgets update in under 2 seconds. Manual refresh is not required. If the socket drops, a "reconnecting…" chip appears and the dashboard falls back to a 15-second polling interval.'),

    h1('Notifications'),
    body('Bell icon in the header with unread counter. Types:'),
    ...['Approval required','Supplier reply','Price change','Inventory alert','Delivery delay','Budget alert','Security alert'].map(x => bullet([t(x)])),

    h1('Colour semantics'),
    buildTable([
      ['Colour', 'Meaning'],
      [cellB('Green'),   cellT('Completed / on-target')],
      [cellB('Blue'),    cellT('Informational')],
      [cellB('Orange'),  cellT('Warning · attention required')],
      [cellB('Red'),     cellT('Critical · immediate action')],
      [cellB('Grey'),    cellT('Inactive / disabled')],
    ], [20, 80]),

    h1('Security'),
    ...['Widget-level RBAC — users only see data they are authorised for.','No direct database access from the client.','Every user action written to AuditLog.','Session timeout with configurable idle window.','MFA required for any Approve / Award action.','All traffic over TLS; WebSocket over WSS.'].map(x => bullet([t(x)])),

    h1('APIs required'),
    buildTable([
      ['Method + Path', 'Purpose'],
      [cellA('GET /api/purchasing/dashboard'),      cellT('Aggregated row-1 KPI card counts')],
      [cellA('GET /api/purchasing/alerts'),          cellT('Row-3 alerts panel')],
      [cellA('GET /api/purchasing/tasks'),           cellT('Row-2 AI Priority Queue')],
      [cellA('GET /api/purchasing/timeline'),        cellT('Row-2 activity timeline')],
      [cellA('GET /api/purchasing/kpi'),             cellT('Header + row-3 KPIs')],
      [cellA('GET /api/suppliers/performance'),      cellT('Row-3 supplier performance')],
      [cellA('GET /api/budget/status'),              cellT('Row-1 card 5 + row-3 budget')],
      [cellA('GET /api/sos/inventory'),              cellT('Live inventory hooks for alerts')],
      [cellA('GET /api/notifications'),              cellT('Header bell')],
      [cellA('WS  /ws/purchasing'),                   cellT('Live updates channel')],
    ], [42, 58]),

    h1('Database tables used'),
    ...[
      'PurchaseRequests','PurchaseRequestItems','Suppliers','SupplierPerformance',
      'RFQs','RFQResponses','PurchaseOrders','Receiving','Budget','Projects',
      'Departments','Users','Notifications','AuditLog'
    ].map(x => bullet([mono(x)])),

    h1('KPIs displayed'),
    buildTable([
      ['KPI', 'Definition'],
      [cellB('Average Purchase Cycle'),   cellT('Days from PR submission to PO closed')],
      [cellB('Average Supplier Response'), cellT('Median time between RFQ sent and first quote received')],
      [cellB('Savings'),                   cellT('(Baseline price − awarded price) × qty, monthly rolling')],
      [cellB('Open RFQs'),                 cellT('Count of RFQs whose status is Sent or Waiting')],
      [cellB('Late Deliveries'),           cellT('Count of PO lines past promised delivery date and not fully received')],
      [cellB('Budget Utilization'),        cellT('Committed + spent as % of allocated budget, monthly')],
      [cellB('Supplier Score'),            cellT('Weighted mean of delivery, quality, service, price ratings')],
      [cellB('Purchase Lead Time'),        cellT('Days from PO issued to first receipt')],
      [cellB('Inventory Risk'),            cellT('SKUs projected to stock-out within lead time × unit cost')],
      [cellB('Approval Time'),             cellT('Median hours from PR submitted to first approval action')],
    ], [30, 70]),

    h1('Acceptance criteria'),
    ...[
      'Dashboard loads in under 3 seconds on the reference workstation (Chromium latest, 100 Mbps, warm cache).',
      'All widgets respect role-based permissions; hidden data never reaches the client.',
      'Real-time updates occur without page refresh within 2 seconds of the source event.',
      'All counts reconcile exactly with the underlying transaction data (nightly reconciliation job).',
      'Every alert links directly to the transaction that raised it.',
      'Every user action is written to AuditLog with actor, timestamp, before/after state, IP, device.',
      'Dashboard is responsive from 1366×768 desktop up to 4K displays; no horizontal scroll at any size.',
      'MFA prompt appears before any Approve / Award action from within the dashboard.',
    ].map(x => bullet([t(x)])),
  ];
  return docFromChildren(c, 'ACC-PUR-002 · Purchasing Mission Control');
}

// ========================================================================
// DELIVERABLE #3  —  Screen 002  Purchase Request
// ========================================================================
function buildDeliverable3() {
  const c = [
    ...cover('ACC-PUR-003', 'HydroNexis-AI · Accounting · Purchasing · Screen 002', 'Purchase Request', 'Entry point for every purchasing workflow', 'Ready for Development'),

    h1('Purpose'),
    body('This screen creates every purchase request in HydroNexis. Nothing can be purchased without an approved Purchase Request. Every Purchase Request receives a unique PR Number and becomes fully traceable through the workflow to a closed PO.'),

    h1('Access matrix'),
    buildTable([
      ['Role', 'Create', 'Edit', 'Approve', 'Cancel'],
      [cellB('Employee'),           cellT('Yes'), cellT('Draft only'), cellT('No'),       cellT('Draft only')],
      [cellB('Department Manager'), cellT('Yes'), cellT('Yes'),        cellT('Level 1'),  cellT('Yes')],
      [cellB('Purchasing Officer'), cellT('Yes'), cellT('Yes'),        cellT('No'),       cellT('Yes')],
      [cellB('Purchasing Manager'), cellT('Yes'), cellT('Yes'),        cellT('Level 2'),  cellT('Yes')],
      [cellB('Accounting Manager'), cellT('Yes'), cellT('Yes'),        cellT('Financial'), cellT('Yes')],
      [cellB('CEO'),                cellT('Yes'), cellT('Yes'),        cellT('Final'),    cellT('Yes')],
    ], [26, 14, 18, 20, 22]),

    h1('PR Number'),
    body('Automatically generated on Save Draft. Format:'),
    p([monoA('PR-YYYY-NNNNNN')]),
    body('Example: PR-2026-000458. Immutable once assigned. Sequence is monotonic per calendar year; the counter resets on 1 January.'),

    h1('Header fields (read-only after creation)'),
    ...['Purchase Request No.','Status','Created By','Created Date','Last Modified','Revision','Priority','Workflow Stage'].map(x => bullet([t(x)])),

    h1('Workflow'),
    body('Linear pipeline. Each stage advances only when its exit conditions are met.'),
    buildTable([
      ['#', 'Stage', 'Exit condition'],
      [cellA('01'), cellB('Draft'),                    cellT('User clicks Submit and all Submit-Validation checks pass')],
      [cellA('02'), cellB('Submitted'),                cellT('AI Validation job completes')],
      [cellA('03'), cellB('AI Validation'),            cellT('No blocking issues, or user acknowledges warnings')],
      [cellA('04'), cellB('Department Approval'),      cellT('Level 1 approver decision recorded')],
      [cellA('05'), cellB('Purchasing Review'),        cellT('Purchasing Officer/Manager assigns handling')],
      [cellA('06'), cellB('Inventory Verification'),   cellT('SOS reconfirms need after any pending transfers')],
      [cellA('07'), cellB('Supplier Sourcing'),        cellT('Purchasing selects supplier list or triggers Supplier Discovery')],
      [cellA('08'), cellB('RFQ'),                      cellT('RFQ sent; awaiting responses')],
      [cellA('09'), cellB('Quotation Evaluation'),     cellT('At least one qualifying quote received and scored')],
      [cellA('10'), cellB('Approval'),                 cellT('All required approval levels recorded')],
      [cellA('11'), cellB('Purchase Order'),           cellT('PO created and sent')],
      [cellA('12'), cellB('Receiving'),                cellT('Goods received against PO')],
      [cellA('13'), cellB('Completed'),                cellT('PO closed, three-way match complete')],
    ], [6, 34, 60]),

    h1('Main form — general information'),
    buildTable([
      ['Field', 'Type', 'Rule', 'Required'],
      [cellB('Request Title'),          cellT('Text'),         cellT('Max 150 chars'),                                   cellT('Yes')],
      [cellB('Department'),             cellT('Dropdown'),     cellT('Sourced from Departments'),                        cellT('Yes')],
      [cellB('Project'),                cellT('Dropdown'),     cellT('Sourced from Projects'),                           cellT('No')],
      [cellB('Cost Center'),            cellT('Dropdown'),     cellT('Accounting integration'),                          cellT('Yes')],
      [cellB('Budget Code'),            cellT('Lookup'),       cellT('Accounting Budget'),                               cellT('Yes')],
      [cellB('Required Delivery Date'), cellT('Date'),         cellT('Must be ≥ today; may be constrained by category'), cellT('Yes')],
      [cellB('Priority'),               cellT('Enum'),         cellT('Normal · High · Urgent · Emergency'),              cellT('Yes')],
      [cellB('Justification'),          cellT('Text area'),    cellT('Min 30 · Max 3000 chars'),                         cellT('Yes')],
    ], [24, 14, 46, 16]),

    h1('Item grid'),
    body('A single Purchase Request may contain multiple items. Every row is independently validated.'),
    buildTable([
      ['Column', 'Rule'],
      [cellB('Line No.'),                 cellT('Auto, 1..N per PR')],
      [cellB('Item Code'),                cellT('Free text OR lookup into SOS Items · triggers Intelligent Item Recognition')],
      [cellB('Item Description'),         cellT('Populated from lookup, editable')],
      [cellB('Category'),                 cellT('Inherited from item; overridable')],
      [cellB('Quantity'),                 cellT('Positive number · decimals allowed per unit definition')],
      [cellB('Unit'),                     cellT('From item master')],
      [cellB('Estimated Unit Price'),     cellT('Populated from last purchase · editable')],
      [cellB('Estimated Total'),          cellT('Computed: qty × unit price · read-only')],
      [cellB('Currency'),                 cellT('Defaults to company currency · overridable per line')],
      [cellB('Preferred Brand'),          cellT('Optional; drives supplier suggestion ranking')],
      [cellB('Alternative Brand Allowed'), cellT('Boolean; if false, Nexi must not suggest substitutes')],
      [cellB('Warehouse Destination'),    cellT('Which warehouse receives the goods')],
      [cellB('Required Date'),            cellT('Per-line override of the header Required Delivery Date')],
      [cellB('Remarks'),                  cellT('Free text')],
      [cellB('Attachment'),               cellT('Per-line file upload (drawing, spec sheet, etc.)')],
    ], [30, 70]),

    h1('Intelligent item recognition'),
    body('When an Item Code is entered, Nexi immediately queries every source she has and returns results inline within 500 ms:'),
    ...['SOS Inventory (on-hand + reserved)','Previous purchases of this item','Supplier database (who has sold this item)','Warehouse availability (all sites)','Historical pricing (last 12 months, per supplier)','Open purchase orders for the same item','Approved brands','Existing draft/submitted duplicate requests'].map(x => bullet([t(x)])),

    h1('AI suggestion panel'),
    body('Right-side rail, always visible while the form is open. Suggestions appear as cards; each card is dismissible and time-stamped.'),
    body('Representative outputs:'),
    ...[
      'Current stock available at Warehouse A — internal transfer recommended',
      'Transfer from GH5 Warehouse (48 units on hand)',
      'Supplier already delivering tomorrow — add to that PO',
      'Previous price ₱142 · current market estimate ₱138',
      'Preferred supplier: ABC Industrial (score 87, 8 past orders)',
      'Savings opportunity: ₱3,250 by consolidating with PR-000452',
      'Risk level: LOW',
    ].map(x => bullet([t(x)])),

    h1('Attachments'),
    buildTable([
      ['Rule', 'Value'],
      [cellB('Formats'), cellT('PDF · DWG · DXF · Excel · Word · Images (JPG/PNG/HEIC) · Videos (MP4/MOV) · ZIP')],
      [cellB('Max size per file'), cellT('500 MB')],
      [cellB('Virus scan'),        cellT('Every upload scanned before persistence; failed scans quarantined and audit-logged')],
      [cellB('Retention'),         cellT('Tied to the PR record; kept per company retention policy (default 7 years)')],
    ], [25, 75]),

    h1('Technical drawing preview'),
    body('Built-in viewer for PDF/DWG/DXF/Image line-item attachments. Features: zoom · rotate · fullscreen · version history · markup (annotations saved back to the PR).'),

    h1('Budget validation'),
    body('Real-time. Every quantity or unit-price change re-runs the check.'),
    ...['Budget available for the selected Budget Code','Remaining budget in the current period','Project budget (if a project is selected)','Department budget','Monthly allocation','Annual allocation'].map(x => bullet([t(x)])),
    buildTable([
      ['Result', 'Behaviour'],
      [cellB('OK'),           cellT('Green tick shown next to the amount')],
      [cellB('Insufficient'), cellT('Yellow warning — submission allowed with manager acknowledgement')],
      [cellB('Exceeded'),     cellT('Red block — Submit button disabled until fixed or a higher-level override is granted')],
    ], [30, 70]),

    h1('Inventory validation'),
    body('Calls SOS Inventory on every recomputation.'),
    ...['Current stock','Reserved stock','Incoming orders','Warehouse transfers in flight','Alternative items (same category / substitutable)'].map(x => bullet([t(x)])),
    callout('Rule', 'If inventory already exists that satisfies the request, Nexi recommends internal transfer instead of purchasing and marks the PR line as blocked pending user acknowledgement.'),

    h1('Duplicate detection'),
    body('Searches for open or submitted PRs matching all of:'),
    ...['Same Item','Same Department','Same Project','Same week','Same Supplier (if preferred is set)','Same Quantity band (±20 %)'].map(x => bullet([t(x)])),
    body('If matches are found, the user is shown a "Possible duplicate" panel with links and must explicitly confirm before submission.'),

    h1('Supplier intelligence preview'),
    body('Per line item, shows:'),
    ...['Preferred supplier','Last supplier','Last purchase price','Average lead time','Supplier rating (0-100)','Warranty history','Quality rating'].map(x => bullet([t(x)])),

    h1('AI recommendation panel'),
    body('Persistent right-side panel. Recommendations are informational unless a policy flag makes them blocking. Example outputs:'),
    ...[
      'Purchase not required — internal transfer covers the need',
      'Internal transfer recommended (GH5 → GH1, 48 units)',
      'Combine with PR-458 to unlock 5 % volume discount',
      'Use existing contract with Supplier XYZ (contract expires 2026-11)',
      'Wait two days — this item price is trending down 8 %',
      'Alternative supplier available with 30 % shorter lead time',
      'Risk alert — supplier under credit review'
    ].map(x => bullet([t(x)])),

    h1('Approval matrix preview'),
    body('Shown to the user before Submit. Reflects the live approval matrix based on total value, department, category, and any category-specific overrides.'),
    body('Example route:'),
    p([monoA('Department Manager  →  Purchasing Manager  →  Accounting Manager  →  CEO')]),
    body('Route is snapshotted onto the PR at submission time; subsequent matrix changes do not retro-affect in-flight requests.'),

    h1('Submit validation'),
    body('Submit is disabled unless ALL of the following are true:'),
    ...[
      'All mandatory fields complete',
      'Budget check is OK or warning-acknowledged',
      'Every line item has a valid quantity, unit, and estimated total',
      'Required attachments (per category rules) are uploaded and scanned',
      'AI Validation job has returned',
      'Every raised duplicate warning has been acknowledged',
    ].map(x => bullet([t(x)])),

    h1('Buttons'),
    buildTable([
      ['Button', 'Effect'],
      [cellB('Save Draft'),      cellT('Persists as Draft; PR Number assigned on first save')],
      [cellB('Submit'),          cellT('Advances to AI Validation stage; kicks off the workflow')],
      [cellB('Validate'),        cellT('Runs the full validation suite without submitting')],
      [cellB('Check Inventory'), cellT('Forces a fresh SOS query and re-evaluates transfer suggestions')],
      [cellB('Find Supplier'),   cellT('Opens 6.1 AI Supplier Search seeded with the current item(s)')],
      [cellB('Estimate Cost'),   cellT('Refreshes unit-price estimates from historical + market data')],
      [cellB('Cancel'),          cellT('Cancels the PR (respects Access matrix)')],
      [cellB('Print'),           cellT('Print-friendly view')],
      [cellB('Export PDF'),      cellT('Downloads a PDF of the PR with a QR link back')],
      [cellB('Clone Request'),   cellT('Duplicates the PR into a new Draft')],
    ], [22, 78]),

    h1('Notifications'),
    body('On submission, notifications are dispatched immediately to:'),
    ...['Department Manager (Level 1 approver)','Purchasing Officer + Manager','Accounting (if a Budget Code override is used)','AI Engine (for the validation job)'].map(x => bullet([t(x)])),

    h1('Audit trail'),
    body('Every change to a Purchase Request is persisted and cannot be deleted.'),
    buildTable([
      ['Field', 'Captured'],
      [cellB('User'),        cellT('User id + display name at time of change')],
      [cellB('Timestamp'),   cellT('UTC, ms precision')],
      [cellB('Old Value'),   cellT('JSON snapshot')],
      [cellB('New Value'),   cellT('JSON snapshot')],
      [cellB('Reason'),      cellT('Free-text, required for edits after Submitted stage')],
      [cellB('IP Address'),  cellT('Source IP')],
      [cellB('Device'),      cellT('User-agent fingerprint')],
    ], [22, 78]),

    h1('APIs'),
    buildTable([
      ['Method + Path', 'Purpose'],
      [cellA('POST /api/purchasing/pr'),          cellT('Create a new PR (Draft)')],
      [cellA('PUT  /api/purchasing/pr/{id}'),     cellT('Update fields or line items')],
      [cellA('GET  /api/purchasing/pr/{id}'),     cellT('Fetch a single PR with items + workflow state')],
      [cellA('POST /api/purchasing/pr/{id}/submit'), cellT('Submit the PR — advances to AI Validation stage')],
      [cellA('POST /api/purchasing/pr/{id}/cancel'), cellT('Cancel the PR')],
      [cellA('POST /api/purchasing/pr/{id}/clone'),  cellT('Clone into a new Draft')],
      [cellA('GET  /api/sos/items'),               cellT('Item lookup for the Item Code field')],
      [cellA('GET  /api/sos/stock'),               cellT('Current + reserved stock for a given item')],
      [cellA('GET  /api/budget/check'),            cellT('Real-time budget validation')],
      [cellA('GET  /api/projects'),                cellT('Project dropdown source')],
      [cellA('GET  /api/departments'),             cellT('Department dropdown source')],
      [cellA('GET  /api/suppliers/history'),       cellT('Supplier intelligence panel')],
      [cellA('POST /api/attachments/upload'),      cellT('Multi-part upload; returns attachment ids')],
      [cellA('POST /api/ai/pr/validate'),          cellT('Run AI validation for the PR')],
    ], [42, 58]),

    h1('Database tables'),
    ...[
      'PurchaseRequest','PurchaseRequestItems','PurchaseRequestWorkflow','PurchaseRequestAttachments',
      'Departments','Projects','Budget','Inventory','Suppliers','AuditLog','Notifications'
    ].map(x => bullet([mono(x)])),

    h1('Acceptance criteria'),
    ...[
      'PR number is generated automatically and is immutable.',
      'A single PR supports N line items with independent, per-line validation.',
      'Budget checks and SOS inventory checks are real-time and re-run on every relevant edit.',
      'Duplicate requests are surfaced before submission and require explicit acknowledgement.',
      'AI recommendations are non-blocking by default; policy flags can make specific recommendations blocking.',
      'All changes are captured by the audit trail with the fields listed above.',
      'Submission creates the workflow instance and notifies the next approver within 5 seconds.',
      'A submitted PR cannot be edited except through the versioned Revision mechanism.',
    ].map(x => bullet([t(x)])),
  ];
  return docFromChildren(c, 'ACC-PUR-003 · Purchase Request');
}

// ========================================================================
// Package a doc from a children array
// ========================================================================
function docFromChildren(children, headerLine) {
  return new Document({
    creator: 'HydroNexis-AI',
    title: headerLine,
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 240 } } } },
        ],
      }],
    },
    styles: { default: { document: { run: { font: 'Calibri', size: 22, color: INK } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [ new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [ new TextRun({ text: headerLine, size: 16, color: MUTED, italics: true }) ],
          }) ],
        }),
      },
      footers: {
        default: new Footer({
          children: [ new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'page ', size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
              new TextRun({ text: ' of ', size: 16, color: MUTED }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
            ],
          }) ],
        }),
      },
      children,
    }],
  });
}

// ========================================================================
// Build + write all three
// ========================================================================
async function main() {
  const out = __dirname;
  const jobs = [
    { name: 'D1-Screen-Index.docx',            build: buildDeliverable1 },
    { name: 'D2-Screen-001-Mission-Control.docx', build: buildDeliverable2 },
    { name: 'D3-Screen-002-Purchase-Request.docx', build: buildDeliverable3 },
  ];
  for (const j of jobs) {
    const buf = await Packer.toBuffer(j.build());
    const p = path.join(out, j.name);
    fs.writeFileSync(p, buf);
    console.log('WROTE', p, '(' + buf.length + ' bytes)');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
