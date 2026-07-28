// Render the master combined docx from screens-data.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, LevelFormat, Header, Footer, PageNumber
} = require('docx');
const { INDEX, screens } = require('./screens-data');

const INK='111827', MUTED='6B7280', ACCENT='1E7A5F', RULE='D1D5DB', CODE_BG='F4F5F1', HEAD_BG='EEF1EA';

const t   = (text, opts={}) => new TextRun({ text, size:22, color:INK, ...opts });
const tb  = (text, opts={}) => new TextRun({ text, size:22, color:INK, bold:true, ...opts });
const mono = (text, opts={}) => new TextRun({ text, font:'Consolas', size:18, color:INK, ...opts });
const monoA = (text, opts={}) => new TextRun({ text, font:'Consolas', size:18, color:ACCENT, ...opts });

const p = (children, opts={}) => new Paragraph({
  spacing:{after:120, line:300},
  children: Array.isArray(children)?children:[children],
  ...opts,
});
const body = text => p([t(text)]);

const h1 = text => new Paragraph({
  heading:HeadingLevel.HEADING_1,
  spacing:{before:320, after:140},
  border:{bottom:{color:ACCENT, size:12, space:6, style:BorderStyle.SINGLE}},
  children:[new TextRun({text, size:30, bold:true, color:INK})],
});
const h2 = text => new Paragraph({
  heading:HeadingLevel.HEADING_2, spacing:{before:220, after:90},
  children:[new TextRun({text, size:25, bold:true, color:INK})],
});
const h3 = text => new Paragraph({
  heading:HeadingLevel.HEADING_3, spacing:{before:160, after:60},
  children:[new TextRun({text, size:22, bold:true, color:ACCENT})],
});

const bullet = children => new Paragraph({
  numbering:{reference:'bullets', level:0},
  spacing:{after:30},
  children: Array.isArray(children)?children:[children],
});

const note = (label, text) => new Paragraph({
  spacing:{before:100, after:160},
  shading:{type:ShadingType.CLEAR, color:'auto', fill:'F5F7F3'},
  border:{
    left:{style:BorderStyle.SINGLE, size:16, color:ACCENT, space:8},
    top:{style:BorderStyle.SINGLE, size:2, color:RULE, space:4},
    bottom:{style:BorderStyle.SINGLE, size:2, color:RULE, space:4},
    right:{style:BorderStyle.SINGLE, size:2, color:RULE, space:4},
  },
  children:[
    new TextRun({text: label.toUpperCase()+'  ', bold:true, size:18, color:ACCENT}),
    new TextRun({text, size:22, color:INK}),
  ],
});

const codeBlock = text => new Paragraph({
  spacing:{before:60, after:160},
  shading:{type:ShadingType.CLEAR, color:'auto', fill:CODE_BG},
  border:{
    left:{style:BorderStyle.SINGLE, size:12, color:ACCENT, space:8},
    top:{style:BorderStyle.SINGLE, size:4, color:RULE, space:4},
    bottom:{style:BorderStyle.SINGLE, size:4, color:RULE, space:4},
    right:{style:BorderStyle.SINGLE, size:4, color:RULE, space:4},
  },
  children:[new TextRun({text, font:'Consolas', size:18, color:INK})],
});

function buildTable(rows, colPct, hasHeader=true) {
  const totalDxa = 8640;
  const widths = colPct.map(pc => Math.round(totalDxa*pc/100));
  const totalW = widths.reduce((a,b)=>a+b,0);
  return new Table({
    columnWidths: widths,
    width:{size:totalW, type:WidthType.DXA},
    rows: rows.map((row, rIdx) => new TableRow({
      children: row.map((val, cIdx) => {
        const isH = hasHeader && rIdx===0;
        return new TableCell({
          width:{size:widths[cIdx], type:WidthType.DXA},
          shading: isH?{type:ShadingType.CLEAR, color:'auto', fill:HEAD_BG}:undefined,
          margins:{top:90, bottom:90, left:130, right:130},
          borders:{
            top:{style:BorderStyle.SINGLE, size:isH?8:4, color:isH?INK:RULE},
            bottom:{style:BorderStyle.SINGLE, size:isH?8:4, color:isH?INK:RULE},
            left:{style:BorderStyle.NONE, size:0, color:'FFFFFF'},
            right:{style:BorderStyle.NONE, size:0, color:'FFFFFF'},
          },
          children:[new Paragraph({
            spacing:{after:0},
            children:[ isH
              ? new TextRun({text:String(val), bold:true, size:18, color:INK, allCaps:true})
              : new TextRun({text:String(val), size:20, color:INK})
            ],
          })],
        });
      }),
    })),
  });
}

// Render a DSL node array into docx children
function renderNodes(nodes) {
  const out = [];
  for (const n of nodes) {
    switch(n[0]) {
      case 'h1': out.push(h1(n[1])); break;
      case 'h2': out.push(h2(n[1])); break;
      case 'h3': out.push(h3(n[1])); break;
      case 'p':  out.push(body(n[1])); break;
      case 'ul': for(const item of n[1]) out.push(bullet([t(item)])); break;
      case 'fl': for(const item of n[1]) out.push(p([tb(item.split(':')[0]+': '), t(item.split(':').slice(1).join(':').trim())])); break;
      case 'code': out.push(codeBlock(n[1])); break;
      case 'flow': {
        const arrows = n[1].join('   →   ');
        out.push(p([monoA(arrows)]));
        break;
      }
      case 'tbl': {
        const headers = n[1], rows = n[2];
        const widths = n[3] || headers.map(()=>Math.round(100/headers.length));
        out.push(buildTable([headers, ...rows], widths, true));
        break;
      }
      case 'note': out.push(note(n[1], n[2])); break;
      default: break;
    }
  }
  return out;
}

// Cover page
const cover = [
  new Paragraph({ spacing:{before:1400}, children:[
    new TextRun({text:'HYDRONEXIS-AI · ACCOUNTING MODULE', size:18, color:MUTED, characterSpacing:40, allCaps:true}),
  ]}),
  new Paragraph({ spacing:{after:200}, children:[
    new TextRun({text:'PURCHASING SUB-MODULE', size:16, color:ACCENT, characterSpacing:40, bold:true, allCaps:true}),
  ]}),
  new Paragraph({ spacing:{after:120}, children:[
    new TextRun({text:'Developer specification pack', size:52, bold:true, color:INK}),
  ]}),
  new Paragraph({ spacing:{after:200}, children:[
    new TextRun({text:'Complete screen index + 13 developer-ready screen specifications', size:26, italics:true, color:ACCENT}),
  ]}),
  new Paragraph({ spacing:{before:100, after:240}, border:{bottom:{style:BorderStyle.SINGLE, size:8, color:ACCENT, space:8}}, children:[new TextRun({text:' ', size:2})]}),
  p([tb('Contents:   '), t('Screen Index (91 screens across 18 sections)  +  Screens 001 → 013 in full technical detail.')]),
  new Paragraph({spacing:{before:400, after:20}, children:[new TextRun({text:'REPOSITORY', size:16, color:MUTED, bold:true, characterSpacing:40})]}),
  p([mono('eyalbenari99-star/hydropro')]),
  new Paragraph({spacing:{before:120, after:20}, children:[new TextRun({text:'BRANCH', size:16, color:MUTED, bold:true, characterSpacing:40})]}),
  p([mono('claude/accounting-purchasing-suppliers-5p94sz')]),
  new Paragraph({spacing:{before:120, after:20}, children:[new TextRun({text:'DOCUMENT DATE', size:16, color:MUTED, bold:true, characterSpacing:40})]}),
  p([mono('2026-07-28')]),
  new Paragraph({spacing:{before:120, after:20}, children:[new TextRun({text:'STATUS', size:16, color:MUTED, bold:true, characterSpacing:40})]}),
  p([t('Ready for Development')]),
  new Paragraph({children:[new PageBreak()]}),
];

// Screen Index part
function indexPart() {
  const total = INDEX.reduce((a,s)=>a+s[2].length, 0);
  const out = [
    h1('Part I — Complete Screen Index'),
    body('Master navigation for the Purchasing sub-module. Every screen has a unique numeric identifier (e.g. 1.5 for Pending Approval) that will be used as the router key, the URL segment, and the primary reference in all subsequent deliverables.'),
    body('Total screens: '+total+' across 18 sections (0-17).'),
  ];
  for (const [num, title, items] of INDEX) {
    out.push(h3(num+'.  '+title));
    const rows = [['ID','Screen'], ...items.map((name,i)=>[num+'.'+(i+1), name])];
    out.push(buildTable(rows, [15,85]));
  }
  out.push(h3('Summary counts'));
  out.push(buildTable([
    ['Section','Screens'],
    ...INDEX.map(s=>[s[0]+'. '+s[1], String(s[2].length)]),
    ['TOTAL', String(total)],
  ], [70,30]));
  return out;
}

// Screen section — one big cover strip + rendered nodes
function screenPart(s) {
  return [
    new Paragraph({children:[new PageBreak()]}),
    new Paragraph({spacing:{before:120, after:60}, children:[
      new TextRun({text:'SCREEN '+s.n+'  ·  '+s.docId, size:16, color:ACCENT, bold:true, font:'Consolas', characterSpacing:40}),
    ]}),
    new Paragraph({spacing:{after:200}, children:[
      new TextRun({text:s.title, size:40, bold:true, color:INK}),
    ]}),
    new Paragraph({spacing:{after:200}, border:{bottom:{style:BorderStyle.SINGLE, size:6, color:ACCENT, space:6}}, children:[
      new TextRun({text:s.subtitle||'', size:22, italics:true, color:ACCENT}),
    ]}),
    ...renderNodes(s.sections),
  ];
}

const children = [
  ...cover,
  ...indexPart(),
  ...screens.flatMap(screenPart),
];

const doc = new Document({
  creator:'HydroNexis-AI',
  title:'HydroNexis-AI · Purchasing sub-module · Developer specification pack',
  numbering:{ config:[{
    reference:'bullets',
    levels:[{level:0, format:LevelFormat.BULLET, text:'•', alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:360, hanging:240}}}}],
  }]},
  styles:{default:{document:{run:{font:'Calibri', size:22, color:INK}}}},
  sections:[{
    properties:{
      page:{
        size:{width:12240, height:15840},
        margin:{top:1440, bottom:1440, left:1440, right:1440},
      },
    },
    headers:{ default: new Header({children:[new Paragraph({
      alignment:AlignmentType.RIGHT,
      children:[new TextRun({text:'HydroNexis-AI · Purchasing sub-module · Developer specification pack', size:16, color:MUTED, italics:true})],
    })]})},
    footers:{ default: new Footer({children:[new Paragraph({
      alignment:AlignmentType.RIGHT,
      children:[
        new TextRun({text:'page ', size:16, color:MUTED}),
        new TextRun({children:[PageNumber.CURRENT], size:16, color:MUTED}),
        new TextRun({text:' of ', size:16, color:MUTED}),
        new TextRun({children:[PageNumber.TOTAL_PAGES], size:16, color:MUTED}),
      ],
    })]})},
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(__dirname, 'HydroNexis-Purchasing-Developer-Pack.docx');
  fs.writeFileSync(out, buf);
  console.log('WROTE', out, '('+buf.length+' bytes)');
});
