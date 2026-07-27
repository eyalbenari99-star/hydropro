// Build the Purchasing sub-module design spec as a .docx
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, LevelFormat, TabStopType, TabStopPosition,
  Header, Footer, PageNumber, NumberFormat
} = require('docx');

// -------- style helpers --------
const INK = '111827';
const MUTED = '6B7280';
const ACCENT = '1E7A5F';
const RULE = 'D1D5DB';
const CODE_BG = 'F4F5F1';
const TABLE_HEAD_BG = 'EEF1EA';

const mono = (text, opts = {}) => new TextRun({ text, font: 'Consolas', size: 18, color: INK, ...opts });
const t   = (text, opts = {}) => new TextRun({ text, size: 22, color: INK, ...opts });
const tm  = (text, opts = {}) => new TextRun({ text, size: 22, color: MUTED, ...opts });

const p = (children, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 300 },
  children: Array.isArray(children) ? children : [children],
  ...opts,
});

const body = (text, opts = {}) => p([t(text)], opts);

const h1 = text => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 200 },
  border: { bottom: { color: ACCENT, size: 12, space: 6, style: BorderStyle.SINGLE } },
  children: [new TextRun({ text, size: 36, bold: true, color: INK })],
});
const h2 = text => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 120 },
  children: [new TextRun({ text, size: 28, bold: true, color: INK })],
});
const h3 = text => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, size: 24, bold: true, color: ACCENT })],
});

const bullet = (children, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { after: 60 },
  children: Array.isArray(children) ? children : [children],
});

const codeBlock = (text) => new Paragraph({
  spacing: { before: 100, after: 160 },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: CODE_BG },
  border: {
    left:   { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 8 },
    top:    { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 },
    right:  { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 },
  },
  children: text.split('\n').map((line, i) => new TextRun({
    text: line,
    break: i > 0 ? 1 : 0,
    font: 'Consolas', size: 18, color: INK,
  })),
});

const callout = (label, text) => new Paragraph({
  spacing: { before: 100, after: 160 },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F7F3' },
  border: {
    left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT, space: 8 },
    top:    { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
    right:  { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 },
  },
  children: [
    new TextRun({ text: label.toUpperCase() + '  ', bold: true, size: 18, color: ACCENT }),
    new TextRun({ text, size: 22, color: INK }),
  ],
});

// -------- table helper --------
// widthsPct = array of percentages summing to 100
// header row = first row of `rows` if hasHeader
function buildTable(rows, colWidthsPct, hasHeader = true) {
  const pageContentDxa = 8640; // Letter width 12240 minus 1440*2 margins = 9360, use 8640 for margins
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
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
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

// helper for cells that carry inline styling
const cell = (runs, opts = {}) => [new Paragraph({ spacing: { after: 0 }, children: runs, ...opts })];
const cellCode = (text) => cell([new TextRun({ text, font: 'Consolas', size: 18, color: ACCENT })]);
const cellT = (text) => cell([new TextRun({ text, size: 20, color: INK })]);
const cellB = (text) => cell([new TextRun({ text, size: 20, color: INK, bold: true })]);

// -------- build the document --------

const cover = [
  new Paragraph({ spacing: { before: 2000 }, children: [
    new TextRun({ text: 'HYDRONEXIS-AI · ACCOUNTING', size: 20, color: MUTED, characterSpacing: 40, allCaps: true }),
  ]}),
  new Paragraph({ spacing: { after: 200 }, children: [
    new TextRun({ text: 'Purchasing sub-module', size: 56, bold: true, color: INK }),
  ]}),
  new Paragraph({ spacing: { after: 100 }, children: [
    new TextRun({ text: 'Design specification for engineering', size: 30, italics: true, color: ACCENT }),
  ]}),
  new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 8 } }, children: [ new TextRun({ text: ' ', size: 2 }) ]}),
  new Paragraph({ spacing: { after: 100 }, children: [ new TextRun({ text: 'Three-supplier comparison · SOS-integrated purchase history · Nexi RFQ outreach (email + SMS) · learning log · geo-scoped supplier search (radius scales with order value).', size: 24, color: INK }) ] }),

  new Paragraph({ spacing: { before: 400, after: 60 }, children: [ new TextRun({ text: 'Repository', size: 18, color: MUTED, bold: true, allCaps: true, characterSpacing: 40 }) ]}),
  new Paragraph({ spacing: { after: 40 }, children: [ new TextRun({ text: 'eyalbenari99-star/hydropro', size: 22, font: 'Consolas', color: INK }) ]}),
  new Paragraph({ spacing: { before: 200, after: 60 }, children: [ new TextRun({ text: 'Branch', size: 18, color: MUTED, bold: true, allCaps: true, characterSpacing: 40 }) ]}),
  new Paragraph({ spacing: { after: 40 }, children: [ new TextRun({ text: 'claude/accounting-purchasing-suppliers-5p94sz', size: 22, font: 'Consolas', color: INK }) ]}),
  new Paragraph({ spacing: { before: 200, after: 60 }, children: [ new TextRun({ text: 'Head commit', size: 18, color: MUTED, bold: true, allCaps: true, characterSpacing: 40 }) ]}),
  new Paragraph({ spacing: { after: 40 }, children: [ new TextRun({ text: '4fac878 · 2026-07-27', size: 22, font: 'Consolas', color: INK }) ]}),
  new Paragraph({ spacing: { before: 200, after: 60 }, children: [ new TextRun({ text: 'File touched', size: 18, color: MUTED, bold: true, allCaps: true, characterSpacing: 40 }) ]}),
  new Paragraph({ spacing: { after: 40 }, children: [ new TextRun({ text: 'index.html  (all changes are additive; ~1600 new lines around line 88400 and one small block in the Accountant-AI overlay ~line 164010)', size: 22, color: INK }) ]}),

  new Paragraph({ children: [new PageBreak()] }),
];

// -------- Sections --------

const sec1 = [
  h1('1. Purpose & scope'),
  p([
    new TextRun({ text: 'Every non-trivial purchase at AteretPaz should be shopped across three suppliers. Today that shopping happens in email threads and paper quotes; nothing carries forward. ', size: 22, color: INK }),
    new TextRun({ text: 'The Purchasing sub-module is a place to do the comparison once, keep it, and let Nexi contact suppliers directly by email/SMS so every reply is stored — the next time the same product comes up, the answer is already half-written.', size: 22, color: INK }),
  ]),
  h3('It handles'),
  bullet([t('Side-by-side comparison of up to three suppliers per product — unit / specs / quantity / cost / delivery / other.')]),
  bullet([t('Merged purchase history from SOS Inventory purchase-orders plus manual entries plus RFQ quotes.')]),
  bullet([t('Supplier ledger with per-supplier orders, spend, last purchase and activity status.')]),
  bullet([t('Nexi RFQ dispatch (email via existing EmailJS integration, or SMS via device sms: URL) with a full audit log of every attempt and reply.')]),
  bullet([t('Geo-scoped supplier search: radius grows with the estimated order value, with auto-widen safety.')]),
  bullet([t('Nexi Q&A over all of the above via the app-wide domain-registry hook.')]),
  h3('It does NOT'),
  bullet([t('Replace SOS Inventory as the system of record for POs or receipts (it reads from SOS, does not push back yet).')]),
  bullet([t('Replace QuickBooks as the ledger of bills.')]),
  bullet([t('Approve payments.')]),
  callout('Design stance', 'This is a decision-support and audit layer on top of SOS + QB. Every write goes to localStorage under the hydroPro_* prefix used throughout the app — no new backend services required to run it.'),
];

const sec2 = [
  h1('2. Where it lives'),
  bullet([new TextRun({ text: 'Primary view: ', size: 22, color: INK }), mono('acct_purchasing'), t(' — registered in the app-wide '), mono('switchView()'), t(' dispatcher the same way '), mono('acct_vendors'), t(', '), mono('acct_customers'), t(' and '), mono('acct_invoices'), t(' are. Mounted lazily inside '), mono('#appMain'), t('.')]),
  bullet([t('Module attribution: '), mono('VIEW_TO_MODULE'), t(' gets '), mono("acct_purchasing: 'accounting'"), t(' so the module header and permission checks resolve correctly.')]),
  bullet([t('Deep-link from Accountant-AI overlay: a new '), mono('purchasing'), t(' entry in '), mono('ACCT_TABS'), t(' renders a summary panel + an "Open Purchasing workspace" button that closes the overlay and calls '), mono("switchView('acct_purchasing')"), t('.')]),
  bullet([t('Direct URL / console: '), mono("switchView('acct_purchasing')"), t(' from anywhere.')]),
  bullet([t('New header actions: '), new TextRun({ text: '🤖 Nexi · Find & contact suppliers', bold: true, size: 22 }), t(' (opens the outreach modal), '), new TextRun({ text: '📍 Location & radius', bold: true, size: 22 }), t(' (opens the geo settings), '), new TextRun({ text: '⬇ Export CSV', bold: true, size: 22 }), t('.')]),
];

const sec3 = [
  h1('3. Four tabs'),
  p([t('The view surfaces one header (banner + integration status + action strip) and four working tabs.')]),
  buildTable([
    ['Tab', 'What it does', 'Writes to'],
    [
      cell([new TextRun({ text: '📊 Comparisons', bold: true, size: 20 })]),
      cellT('Add a product to shop for; capture up to three supplier quotes side by side; expand a card to see the matrix, the cheapest badge, per-supplier history, and a SOS item hint. Actions: award a winner, close, delete, log a purchase from a chosen quote, or ask Nexi for more quotes.'),
      cellCode('hydroPro_acct_purch_comparisons'),
    ],
    [
      cell([new TextRun({ text: '📜 Purchase History', bold: true, size: 20 })]),
      cellT('Flat log of every purchase — product, supplier, unit, qty, unit cost, total, PO ref, notes. Filterable search, CSV export. Rows imported from SOS show a SOS badge and cannot be manually deleted.'),
      cellCode('hydroPro_acct_purch_history'),
    ],
    [
      cell([new TextRun({ text: '🏭 Suppliers Ledger', bold: true, size: 20 })]),
      cellT('Rollup per supplier: orders count, distinct products, total qty, total spend, last purchase date, activity status (ACTIVE / DORMANT / NEW), recent product chips.'),
      cellT('(computed, read-only)'),
    ],
    [
      cell([new TextRun({ text: '📬 Nexi RFQ Log', bold: true, size: 20 })]),
      cellT('Every RFQ Nexi dispatched: sent-at, product, supplier, channel, response status, quoted unit cost, lead days, notes. Marking a row "quoted" with a unit price auto-appends a soft quote-record to Purchase History so it surfaces in future comparisons.'),
      cellCode('hydroPro_acct_purch_outreach'),
    ],
  ], [22, 58, 20]),
];

const sec4 = [
  h1('4. Data model — storage keys'),
  p([t('Everything is stored in '), mono('localStorage'), t(' under the '), mono('hydroPro_*'), t(' prefix used across the app. Nothing new is written to a backend without going through the existing hnx-sync worker (SOS pulls only).')]),
  buildTable([
    ['Key', 'Shape', 'Purpose'],
    [ cellCode('hydroPro_acct_purch_comparisons'), cellT('array'), cellT('Saved 3-supplier comparison sheets.') ],
    [ cellCode('hydroPro_acct_purch_history'), cellT('array'), cellT('Merged purchase log — manual entries, SOS-imported PO lines, and RFQ-quote softlines.') ],
    [ cellCode('hydroPro_acct_purch_outreach'), cellT('array'), cellT('RFQ send log with response tracking. The memory Nexi learns from.') ],
    [ cellCode('hydroPro_acct_purch_sync_meta'), cellT('object'), cellT('SOS import status: {status, lastSync, poCount, added, updated}.') ],
    [ cellCode('hydroPro_acct_purch_rfq_template'), cellT('string'), cellT('User-editable RFQ message template with variables.') ],
    [ cellCode('hydroPro_acct_purch_base_location'), cellT('object'), cellT('Base coords + radius tiers + auto-widen floor (see §9).') ],
    [ cellCode('hydroPro_acct_purch_supplier_locations'), cellT('object (map)'), cellT('Per-supplier {lat, lng, address, city, country}, keyed by lowercased supplier name.') ],
    [ cellCode('hydroPro_acct_vendors'), cellT('array'), cellT('Existing Accounting Vendors list. Read for contacts; new web-found suppliers are written back here so Nexi remembers.') ],
    [ cellCode('hydroPro_inv_suppliers_v1'), cellT('array'), cellT('Existing Inventory Master suppliers — richer contact + reliability score.') ],
    [ cellCode('hydroPro_sos_items_v1'), cellT('array (IDB)'), cellT('SOS items cache. Read for preferred vendor and last purchase cost per SKU.') ],
    [ cellCode('hydroPro_emailjs_config_v1'), cellT('object'), cellT('Existing EmailJS credentials. Reused for silent RFQ auto-send.') ],
  ], [40, 15, 45]),

  h3('4.1  Comparison record'),
  codeBlock(
`{
  id: "pc_lqm7…",
  product: "Rockwool cube 100×100",
  category: "Growing media",
  needBy:  "2026-08-14",
  requester: "EB",
  status: "open" | "awarded" | "closed",
  chosenSupplier: 0 | 1 | 2 | null,
  createdAt: 1721001600000,
  awardedAt: 1721005200000,
  suppliers: [                          // up to 3 slots
    { name, unit, qty, specs, unitCost,
      deliveryDays, payTerms, warranty, notes }
  ]
}`),

  h3('4.2  Purchase-history record'),
  codeBlock(
`{
  id: "ph_sos_2026-21-PO0528-01_0",
  source: "sos" | "manual" | "rfq-quote",
  poNumber: "2026-21-PO0528-01",         // sos only
  lineIdx: 0,                            // sos only — dedup key
  date: "2026-05-28",
  product: "Business Card 2×3.5",
  supplier: "Micropoint Graphics",
  sku: "",
  unit: "pc",
  qty: 700,
  receivedQty: 0,
  unitCost: 6.75,
  totalAmount: 4725,
  ref: "2026-21-PO0528-01",
  status: "open" | "partial" | "closed",
  notes: "From SOS PO · open",
  importedAt: 1721001600000
}`),

  h3('4.3  Outreach record'),
  codeBlock(
`{
  id: "rfq_lqmz…_0",
  sentAt: 1721001600000,
  product, qty, unit, specs, needBy, requester,
  supplier, supplierEmail, supplierPhone,
  subject: "RFQ · Rockwool cube 100×100",
  message: "Hello …",                          // fully-rendered body
  channel: "email" | "sms",
  delivery: "emailjs" | "mailto" | "sms-app" | "error",
  status: "sent" | "opened" | "error",         // dispatch result
  responseStatus: "pending" | "quoted" | "declined" | "no-response",
  responseAt: 1721005200000,
  quotedUnitCost: 6.50,
  quotedDeliveryDays: 4,
  responseNotes: "…"
}`),

  h3('4.4  Base-location record'),
  codeBlock(
`// hydroPro_acct_purch_base_location
{
  name: "AteretPaz farm",
  address: "",
  lat: 14.5995,
  lng: 120.9842,
  tiers: [                                                // sorted ascending by maxValue
    { maxValue: 10000,   radiusKm: 25,   label: "Small · local only" },
    { maxValue: 50000,   radiusKm: 100,  label: "Regular · metro" },
    { maxValue: 200000,  radiusKm: 500,  label: "Mid · regional" },
    { maxValue: 1000000, radiusKm: 2000, label: "Large · national" },
    { maxValue: Infinity, radiusKm: null, label: "Very large · worldwide" }
  ],
  minSuppliersForRadius: 3,        // auto-widen floor
  includeUnknown: true             // include suppliers with no known location
}`),
  callout('Persistence gotcha', 'Infinity cannot survive a JSON round-trip. On save the top tier’s maxValue is serialised as null; on load _purchGetBase() restores it to Infinity. Consumers that read through _purchGetBase() never see the sentinel.'),
];

const sec5 = [
  h1('5. Comparison logic'),
  bullet([new TextRun({ text: 'Cheapest badge · ', bold: true, size: 22 }), t('for each supplier column, '), mono('total = qty × unitCost'), t('. Only columns with a positive total are eligible; the lowest wins the 💰 CHEAPEST tag. Ties resolve to first-filled.')]),
  bullet([new TextRun({ text: 'Award vs cheapest · ', bold: true, size: 22 }), t('the buyer’s choice can differ from the cheapest — the column with the buyer’s award gets a green top-border and a ✓ Chosen action; the cheapest tag stays independently. When a comparison has no explicit award yet, the cheapest is used as the visual default.')]),
  bullet([new TextRun({ text: 'NEW / EXISTING supplier badge · ', bold: true, size: 22 }), t('a supplier is EXISTING if their name appears in the merged history OR in the Vendors master (case-insensitive, trimmed). Otherwise NEW. Computed at render time.')]),
  bullet([new TextRun({ text: 'Per-product history sub-row · ', bold: true, size: 22 }), mono('_purchLookupHistory(product, supplier)'), t(' filters merged history and returns {times, totalQty, totalCost, lastDate, rows[]}. The card renders the last six line-items so drift in quantity and price is visible without opening another view.')]),
  bullet([new TextRun({ text: 'SOS item hint row · ', bold: true, size: 22 }), mono('_purchSosItemHint(product)'), t(' scans '), mono('window.__hnxSos.getItems()'), t(' for a name/sku match and returns the item’s preferred vendor, SKU, last purchase cost and on-hand. Rendered as a single blue-tinted row between the criteria table and the history rows. If the supplier under review matches SOS’s preferred vendor, an extra note surfaces on that column’s history cell.')]),
];

const sec6 = [
  h1('6. Purchase history sources'),
  p([t('Three streams merged into one log; every row carries a '), mono('source'), t(' tag so an audit can trace it back.')]),
  buildTable([
    ['Source', 'How it lands', 'Editable?'],
    [ cellB('SOS Inventory'), cellT('_purchSyncFromSOS() calls /sos/purchase-orders through the existing hnx-sync Cloudflare Worker. Every PO line becomes one history row. Dedup key: poNumber + lineIdx.'), cellT('No — re-sync overwrites. Bulk clear only.') ],
    [ cellB('Manual entry'), cellT('The History tab has an add form. Also written by "➕ Log purchase" on a comparison card, using the chosen quote.'), cellT('Yes — fully editable + deletable.') ],
    [ cellB('RFQ quotes'), cellT('When an outreach row is marked "quoted" with a unit price, a soft row is auto-appended with qty:0 so it prices future comparisons without pretending a purchase happened.'), cellT('Deletable when RFQ is deleted.') ],
    [ cellB('QuickBooks'), cellT('Deferred. QB currently caches only trial-balance and aging in hydroPro_acct_qb_v1. The banner reads its connection state as a hint.'), cellT('n/a') ],
  ], [22, 60, 18]),
  callout('Guarantee', 'Once _purchSyncFromSOS() has run, every comparison card’s per-supplier “n× before · ₱x total · last DATE” row is real. The buyer never types history — they type comparisons.'),
];

const sec7 = [
  h1('7. Nexi outreach flow — RFQ email & SMS'),
  p([t('Entry points: the header primary button, or "🤖 Ask Nexi for more quotes" on any comparison card. Both open the outreach modal, prefilled with product / qty / unit / need-by from the card if launched from context.')]),

  h3('7.1  Five-step flow'),
  bullet([new TextRun({ text: 'Step 1 · Gather candidates. ', bold: true, size: 22 }), mono('_purchGatherAllSuppliers(product)'), t(' unions Inventory Master, Accounting Vendors, SOS items’ preferred vendors, past PO vendors, and past-outreach responders.')]),
  bullet([new TextRun({ text: 'Step 2 · Rank & tag. ', bold: true, size: 22 }), t('Product-history match > has email > has phone > reliability score > alpha. Each row shows source chips, EXISTING / NEW / HAS-HISTORY, past reply-rate, and the 📍 distance chip (see §9).')]),
  bullet([new TextRun({ text: 'Step 3 · User picks. ', bold: true, size: 22 }), t('Manual checkboxes, or one-click "Top 3 in range" / "Existing in range" / "All in range". A separate form lets the user add a web-found supplier; saved to Vendors master so Nexi remembers.')]),
  bullet([new TextRun({ text: 'Step 4 · Compose. ', bold: true, size: 22 }), t('Editable RFQ template with variable substitution: '), mono('{{product}} {{qty}} {{unit}} {{specs}} {{needBy}} {{supplierContact}} {{requester}} {{companyName}}'), t('. "Save as default" persists in localStorage.')]),
  bullet([new TextRun({ text: 'Step 5 · Send & log. ', bold: true, size: 22 }), t('Email via existing EmailJS auto-send (silent) or '), mono('mailto:'), t('. SMS via device '), mono('sms:'), t(' URL scheme with body ≤ 380 chars. Every dispatch appends one row to the outreach log with the full body archived.')]),

  h3('7.2  Channel semantics'),
  buildTable([
    ['Channel', 'Delivery mode', 'Behavior'],
    [ cellB('✉ Email'), cellCode('emailjs'), cellT('Silent send via existing EmailJS integration. Status "sent". Requires the shared EmailJS config already used for report auto-send.') ],
    [ cellT(''), cellCode('mailto'), cellT('Fallback when EmailJS is not configured. Opens the device mail client with recipient, subject, and body pre-filled. Status "opened" — the app can’t verify actual send.') ],
    [ cellB('📱 SMS'), cellCode('sms-app'), cellT('Opens the device SMS composer via sms: URL scheme. Body auto-shortened to 380 chars with an ellipsis. Status "opened".') ],
    [ cellT(''), cellCode('error'), cellT('Dispatch threw. Full error stored in the row’s error field.') ],
  ], [18, 22, 60]),
];

const sec8 = [
  h1('8. Nexi intelligence — registered domain'),
  p([t('The purchasing sub-module registers a Nexi domain via '), mono('registerNexiDomain()'), t(' (the same hook Irrigation, Logistics, Inventory etc. use). The registration exposes the three collections and provides a custom '), mono('answer(qLower)'), t(' function.')]),

  buildTable([
    ['Ask Nexi', 'She reads', 'She returns'],
    [ cellT('"who supplies rockwool?"'), cellT('All supplier sources + history'), cellT('Ranked list with contact info + past-order counts') ],
    [ cellT('"best price on rockwool cubes"'), cellT('Purchase history incl. RFQ quotes'), cellT('Cheapest supplier + next two, with reply-rate') ],
    [ cellT('"supplier reply rate"'), cellT('Outreach log'), cellT('Per-supplier quoted/sent scoreboard') ],
    [ cellT('"how many RFQs have I sent"'), cellT('Outreach log'), cellT('Totals + open comparisons + records') ],
    [ cellT('"suppliers near me" / "within 50 km"'), cellT('Base location + supplier coords'), cellT('Ranked by distance, honours the tier ladder or the explicit km') ],
  ], [30, 30, 40]),

  callout('The compounding effect', 'Every outreach is logged. Every quote reply is logged. Every awarded winner is logged. On the third comparison for the same product, Nexi’s ranking already knows: who quoted, who replied within a day, who was cheapest, who won last time. Manual entry is only ever for what hasn’t happened yet.'),
];

const sec9 = [
  h1('9. Geo-scoped supplier search — the rule'),
  p([new TextRun({ text: 'Value determines geography. ', bold: true, size: 22 }), t('A ₱4,000 pack of consumables shouldn’t be sourced from another country. A ₱1.2M capex order shouldn’t be limited to the barangay. The system encodes that judgement so Nexi doesn’t need to be reminded, and every buyer follows the same rule.')]),

  h3('9.1  Default tier ladder'),
  buildTable([
    ['Up to ₱', 'Radius', 'Meaning · when it fires'],
    [ cellCode('10,000'),    cellCode('25 km'),    cellT('Small · local only — consumables, replacements, urgent top-ups. Freight would dwarf the order.') ],
    [ cellCode('50,000'),    cellCode('100 km'),   cellT('Regular · metro — weekly resupply, mid-size components. Same-day / next-day trucking still economic.') ],
    [ cellCode('200,000'),   cellCode('500 km'),   cellT('Mid · regional — bulk media, quarterly packaging runs. Willing to wait a few days for better price.') ],
    [ cellCode('1,000,000'), cellCode('2,000 km'), cellT('Large · national — equipment, project-scale inputs. Whole-country search opens meaningful competition.') ],
    [ cellCode('∞'),         cellCode('∞'),        cellT('Very large · worldwide — capex, imports, one-off large-ticket. International freight is a rounding error against the deal.') ],
  ], [18, 15, 67]),

  h3('9.2  How the value is inferred'),
  bullet([new TextRun({ text: 'From SOS hint · ', bold: true, size: 22 }), t('if the product matches a SOS item with a '), mono('purchaseCost'), t(', estimated value = qty × lastCost. Primary path once SOS is connected.')]),
  bullet([new TextRun({ text: 'From past history · ', bold: true, size: 22 }), t('if any past PO line has the same product name, the median past unit cost × current qty is used as a fallback (roadmap).')]),
  bullet([new TextRun({ text: 'Buyer override · ', bold: true, size: 22 }), t('typing a number in the Est. value ₱ field wins over any guess. The Override km field wins over the tier the value picks.')]),

  h3('9.3  Auto-widen safety'),
  p([t('Every tier has a floor — '), mono('minSuppliersForRadius'), t(' (default 3). If the requested radius surfaces fewer than that many contactable suppliers, Nexi automatically promotes the search to the next larger tier and re-runs. The status strip in the modal flags the widen explicitly: '), new TextRun({ text: '"auto-widened · fewer than min in the requested tier"', italics: true }), t('.')]),

  h3('9.4  Distance computation'),
  p([mono('_purchDistanceKm(lat1, lng1, lat2, lng2)'), t(' uses the Haversine formula. Great-circle, not driving distance — cheap, deterministic, no external service, correct within a fraction of a percent at country-scale distances. Correct trade-off for a filter; driving distance is a roadmap item only if lead-time promises depend on it.')]),

  h3('9.5  Base location'),
  p([t('Set once from the header button 📍 Location & radius. The modal captures a display name, address, latitude, longitude — and offers a 📡 Use my current location button that reads '), mono('navigator.geolocation'), t(' and fills the coords in place. Default until edited: Manila metro at 14.5995, 120.9842.')]),

  h3('9.6  Supplier coordinates'),
  p([t('Explicit coords stored per supplier in '), mono('hydroPro_acct_purch_supplier_locations'), t(', keyed by lowercased name so a rename in one place doesn’t sever the link. Fallback: if a supplier has no explicit coord record, '), mono('_purchGetSupplierLocation()'), t(' reads any address/city/country on the existing Vendors records. Every supplier row in the outreach modal shows a 📍 chip; rows without coords get a clickable "no location · add" chip that prompts for lat/lng inline.')]),

  h3('9.7  UI changes to the outreach modal'),
  buildTable([
    ['Where', 'What'],
    [ cellB('Top strip'), cellT('New "Est. value ₱" field (auto-guessed) and "Override km" input.') ],
    [ cellB('Status banner'), cellT('🎯 Radius X km · tier Y · in-range vs outside count · widen flag · base name + coords.') ],
    [ cellB('Each row'), cellT('📍 distance chip. In-range rows full opacity, out-of-range rows dimmed. Unknown-location rows get a "add" chip.') ],
    [ cellB('Selectors'), cellT('Top 3 / Existing / All-in-range — all respect the in-range flag by default. Nexi never sends RFQs outside the effective radius unless the buyer explicitly checks the box.') ],
  ], [22, 78]),
];

const sec10 = [
  h1('10. Permissions & audit'),
  bullet([t('Accounting role has full manageHR/payroll access and read-only on operational modules — the Purchasing sub-tab sits within Accounting and inherits the module’s permission gate.')]),
  bullet([t('Each outreach row records '), mono('requester'), t(' from the current user profile ('), mono('getCurrentUser()'), t('). Once dispatched, an RFQ’s body and dispatch metadata are immutable; only the response fields ('), mono('responseStatus, quotedUnitCost, quotedDeliveryDays, responseNotes'), t(') are editable.')]),
  bullet([t('SOS-imported history rows are protected from manual deletion. '), mono('_purchDeleteHistory()'), t(' explicitly refuses them and tells the user to delete the PO in SOS or use "Clear SOS-imported rows".')]),
  bullet([t('CSV export writes '), mono('source, status, ref, receivedQty'), t(' alongside numeric fields, so an offline audit can trace every row to its origin.')]),
];

const sec11 = [
  h1('11. Wiring points — globals & hooks'),
  buildTable([
    ['Global / hook', 'Direction', 'Purpose'],
    [ cellCode('switchView(v)'), cellT('hooked'), cellT('Registers acct_purchasing in the dispatcher.') ],
    [ cellCode('VIEW_TO_MODULE'), cellT('write (merge)'), cellT('Adds acct_purchasing: "accounting".') ],
    [ cellCode('ACCT_TABS'), cellT('write (splice)'), cellT('Adds the purchasing sub-tab to the Accountant-AI overlay dropdown.') ],
    [ cellCode('window.__hnxApi()'), cellT('call'), cellT('Fetches /sos/purchase-orders for history import.') ],
    [ cellCode('window.__hnxSos.getItems()'), cellT('call'), cellT('Reads cached SOS items for the item hint row + fallback vendors.') ],
    [ cellCode('window.__hnxSos.getMeta()'), cellT('call'), cellT('SOS connection state for the banner.') ],
    [ cellCode('_sendViaEmailJs(to, subj, body)'), cellT('call'), cellT('Silent RFQ auto-send via existing EmailJS integration.') ],
    [ cellCode('registerNexiDomain({…})'), cellT('call'), cellT('Exposes purchasing intelligence to Nexi’s chat/brain.') ],
    [ cellCode('showToast(msg, tone)'), cellT('call'), cellT('User feedback on sync / send / save.') ],
    [ cellCode('getCurrentUser()'), cellT('call'), cellT('Requester name in the outreach signature.') ],
    [ cellCode('navigator.geolocation'), cellT('call'), cellT('"📡 Use my current location" button in the base-location settings.') ],
  ], [40, 20, 40]),
];

const sec12 = [
  h1('12. Public function surface'),
  p([t('Functions the developer will most often need to reach for or extend. All are on '), mono('window'), t(' unless noted.')]),
  buildTable([
    ['Function', 'Purpose'],
    [ cellCode('_renderAcctPurchasing()'), cellT('Full re-render of the view. Called by switchView hook + every write.') ],
    [ cellCode('_purchGatherAllSuppliers(productHint)'), cellT('Unions all supplier sources, enriched with history + outreach stats + hasProductHistory flag.') ],
    [ cellCode('_purchLookupHistory(product, supplier)'), cellT('Returns {isNew, times, totalQty, totalCost, lastDate, rows} for a product-supplier pair.') ],
    [ cellCode('_purchSosItemHint(product)'), cellT('SOS item hint {vendor, lastCost, sku, onHand} used in comparison cards.') ],
    [ cellCode('_purchSyncFromSOS(cb)'), cellT('Pull /sos/purchase-orders and merge into history. cb({ok, added, updated, poCount}).') ],
    [ cellCode('_purchClearSOSHistory()'), cellT('Wipe SOS-imported rows (keeps manual).') ],
    [ cellCode('_purchOpenOutreach(prefill)'), cellT('Open the Nexi outreach modal. prefill accepts {product, specs, qty, unit, needBy, company, estimatedValue, overrideRadiusKm}.') ],
    [ cellCode('_purchOutreachSend()'), cellT('Dispatch RFQs for every checked supplier. Reads modal DOM.') ],
    [ cellCode('_purchOutreachSetResponse(id, field, value)'), cellT('Update a logged RFQ. Marking "quoted" with unit cost auto-appends to history.') ],
    [ cellCode('_purchGetBase() / _purchSaveBase(b)'), cellT('Base-location config accessor. Restores Infinity on load.') ],
    [ cellCode('_purchGetSupplierLocation(name)'), cellT('Lookup coords for a supplier (falls back to address on Vendors master).') ],
    [ cellCode('_purchSetSupplierLocation(name, loc)'), cellT('Write per-supplier coord record.') ],
    [ cellCode('_purchDistanceKm(a,b,c,d)'), cellT('Haversine great-circle distance in km.') ],
    [ cellCode('_purchTierForValue(value)'), cellT('First tier whose maxValue ≥ value. Returns {maxValue, radiusKm, label}.') ],
    [ cellCode('_purchApplyRadius(suppliers, value, overrideKm)'), cellT('Enrich each supplier with distanceKm + inRadius, run auto-widen. Returns {suppliers, tier, radius, requestedRadius, widened, base}.') ],
    [ cellCode('_purchOpenLocationSettings()'), cellT('Base-location + tier-ladder settings modal.') ],
    [ cellCode('_purchExportCsv()'), cellT('CSV of the merged purchase history.') ],
  ], [46, 54]),
];

const sec13 = [
  h1('13. Limits & roadmap'),
  p([t('Nothing on this list breaks the current model. Each extension either adds a stored field, adds one worker route, or plugs a new signal into the same tier lookup / merged history log.')]),
  buildTable([
    ['Not yet', 'Why', 'What unlocks it'],
    [ cellB('Automated web supplier search'), cellT('Browser HTML app can’t crawl external sites (CORS, no server).'), cellT('Add /nexi/supplier-search?q= to the hnx-sync worker; the modal already has a slot for it.') ],
    [ cellB('Silent SMS auto-send'), cellT('Browsers have no direct SMS API; sms: hands off to the device app.'), cellT('Add a Twilio-backed /nexi/sms worker route; swap the sms: handoff for a POST.') ],
    [ cellB('QB bill-line import'), cellT('Current QB cache is TB/aging only.'), cellT('Add a Make scenario for "Bills by Vendor with Lines"; feed _purchSyncFromQB().') ],
    [ cellB('Automatic reply detection'), cellT('Response state is human-set today.'), cellT('Inbound-email webhook (Zapier/Make on quotes inbox) → /nexi/rfq-reply?rfqId= → auto-flip responseStatus.') ],
    [ cellB('Multi-currency & VAT split'), cellT('Amounts are single-currency, VAT-inclusive.'), cellT('Add currency, vatRate, vatMode to history + quote fields; render alt-currency next to totals.') ],
    [ cellB('Approval workflow > ₱X'), cellT('Awards are direct today.'), cellT('Add a threshold rule + approver assignment on the comparison card, gated by role.') ],
    [ cellB('PO creation back into SOS'), cellT('Only pulls from SOS, doesn’t push.'), cellT('POST via a new /sos/purchase-orders worker route on award.') ],
    [ cellB('Geocode supplier address'), cellT('Manual coord entry today.'), cellT('/nexi/geocode?address= on the worker; auto-fill supplier coords from any address on the vendor record.') ],
    [ cellB('Driving distance / travel time'), cellT('Great-circle only.'), cellT('OSRM or Google Distance Matrix through the worker. Only worth adding if lead-time promises depend on it.') ],
    [ cellB('Freight-cost-aware radius'), cellT('Radius is set by ordered ₱, not delivered ₱.'), cellT('Multiply qty×unitCost by freight-per-km rate before tier lookup so the tier reflects delivered cost.') ],
    [ cellB('Per-category tier overrides'), cellT('One ladder for all products.'), cellT('Attach a categoryOverrides map on the base — e.g. "perishables never past 200 km".') ],
    [ cellB('Multi-site (per-farm) bases'), cellT('Single base pin.'), cellT('Promote the base record to an array keyed by site; the modal picks the site the buyer selects.') ],
  ], [30, 32, 38]),
];

const sec14 = [
  h1('14. Deliverable checklist for the developer'),
  bullet([t('Pull branch '), mono('claude/accounting-purchasing-suppliers-5p94sz'), t('.')]),
  bullet([t('Open '), mono('index.html'), t(' in a browser. Sign in.')]),
  bullet([t('Console: '), mono("switchView('acct_purchasing')"), t(' to open the sub-tab.')]),
  bullet([t('Verify the 4 tabs render: 📊 Comparisons · 📜 Purchase History · 🏭 Suppliers Ledger · 📬 Nexi RFQ Log.')]),
  bullet([t('Open 📍 Location & radius, save a base coord (or click "📡 Use my current location"). Adjust tiers.')]),
  bullet([t('Add a comparison with 3 suppliers. Verify the cheapest badge, the SOS item hint (once SOS is connected), and the NEW/EXISTING flags.')]),
  bullet([t('Connect SOS if not already (Admin → 📦 SOS Inventory Sync). Click "📥 Sync purchase history from SOS" and verify PO lines land in the History tab tagged as SOS.')]),
  bullet([t('Open "🤖 Nexi · Find & contact suppliers". Verify: est. value auto-fills, radius chip shows, in-range vs outside counts are correct, distance chips render per row.')]),
  bullet([t('Send a test RFQ (email to yourself). Verify a row lands in 📬 Nexi RFQ Log with full body. Mark it "quoted" with a unit cost; verify a soft row appears in Purchase History.')]),
  bullet([t('In the Nexi chat panel, ask: '), new TextRun({ text: '"who supplies rockwool"', italics: true }), t(', '), new TextRun({ text: '"best price on X"', italics: true }), t(', '), new TextRun({ text: '"suppliers near me"', italics: true }), t(', '), new TextRun({ text: '"suppliers within 50 km"', italics: true }), t('. Confirm grounded answers.')]),
  bullet([t('Read this document’s §11 (Wiring points) + §12 (Public function surface) before extending anything.')]),
];

// Combine everything
const children = [
  ...cover,
  ...sec1,
  ...sec2,
  ...sec3,
  ...sec4,
  ...sec5,
  ...sec6,
  ...sec7,
  ...sec8,
  ...sec9,
  ...sec10,
  ...sec11,
  ...sec12,
  ...sec13,
  ...sec14,
];

// Numbering config for bullets
const doc = new Document({
  creator: 'HydroNexis-AI',
  title: 'Purchasing sub-module — design specification',
  description: 'Design spec for the Accounting → Purchasing sub-module',
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 240 } } } },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: INK },
        paragraph: { spacing: { line: 300 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [ new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [ new TextRun({ text: 'HydroNexis-AI · Accounting · Purchasing sub-module · design specification', size: 16, color: MUTED, italics: true }) ],
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

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, 'Purchasing-Design-Spec.docx');
  fs.writeFileSync(out, buf);
  console.log('WROTE ' + out + '  (' + buf.length + ' bytes)');
});
