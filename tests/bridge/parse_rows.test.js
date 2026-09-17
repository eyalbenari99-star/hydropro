/* The Gmail bio bridge's row parser, run under node with the Apps Script globals stubbed.
   Guards: a non-ID cell must not inherit the previous person's ID; the date column is locked
   once; a future date is never a punch day. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','..','workers','gmail-bio-bridge.gs'),'utf8');
const pick=name=>{const m=src.match(new RegExp('\\nfunction '+name+'\\s*\\([\\s\\S]*?\\n}\\n'));if(!m)throw new Error('no '+name);return m[0];};
const ctx={Logger:{log(){}},Utilities:{formatDate:()=> '2026-09-17'}};
vm.createContext(ctx);
vm.runInContext(src.match(/var PUNCH_RE[^\n]*\n/)[0]+src.match(/var SKIP_RE[^\n]*\n/)[0]+pick('parseRows')+pick('normDate')+"function pad(n){return ('0'+n).slice(-2);}\n",ctx);
const rows=[
  ['Person ID','Name','Date','Clock In','Clock Out'],
  ['PROD001','REAL, RODMAR','2026-09-10','07:01','17:02'],
  ['PROD 002','LLAGAS, MELVIN','2026-09-10','07:05','17:00'],   // space inside the ID
  ['Total','', '2026-09-10','08:00',''],                          // a label in the ID column
  ['PROD001','REAL, RODMAR','2026-09-18','07:00','17:00'],        // future date
  ['','','2026-09-11','07:03','17:01'],                            // blank ID: continues PROD001 (the future row above was only skipped)
];
const out=ctx.parseRows(rows);
const by={};out.forEach(p=>{(by[p.userId]=by[p.userId]||[]).push(p.ts);});
const fails=[];
const eq=(a,b,msg)=>{if(JSON.stringify(a)!==JSON.stringify(b))fails.push(msg+': expected '+JSON.stringify(b)+' got '+JSON.stringify(a));};
eq(by.PROD001,['2026-09-10 07:01:00','2026-09-10 17:02:00','2026-09-11 07:03:00','2026-09-11 17:01:00'],'PROD001 keeps its own days, the future day is dropped, the blank-ID row continues it');
eq(by.PROD002,['2026-09-10 07:05:00','2026-09-10 17:00:00'],'an ID with a space is the same person without the space');
eq(by.Total,undefined,'a label row is not a person');
eq(Object.keys(by).sort(),['PROD001','PROD002'],'no punch is credited to a previous person');
if(fails.length){fails.forEach(f=>console.log('  ✗ bridge: '+f));process.exit(1);}
console.log('  ✓ bridge parser: IDs are never inherited from a non-blank cell, the date column is locked, future dates are dropped');
