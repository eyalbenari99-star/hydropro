/* v23.08 (Eyal, 13 Oct 2026: "Help guid not dated"): every Help-centre guide carries added + updated {date:'YYYY-MM-DD',
   version:'NN.NN'} on its first line, backfilled from git history (date = the day the change landed on main, Manila; version =
   that commit's APP_VERSION of this page). The list shows "Updated 13 Oct 2026 · v22.88" under each title (🆕 = changed in the
   last 7 days) and can be ordered 🕒 Recently updated; a guide page shows "Added … — Updated …" under its title; the Word guide
   prints the same line under each heading. The Help centre stays read-only.
   KEEP-CURRENT RULE (test "Dates stay current"), against the copy of this page at the point this branch left main (git merge-base;
   on a CI pull_request the merge commit's first parent; origin/main only when the clone is too shallow for either):
   · a guide whose words (title · who · summary · sections) changed carries a newer `updated` — above the base stamp AND above the
     APP_VERSION main already shipped for this page, dated no earlier than the day main's base commit landed (Manila);
   · a guide whose words did not change keeps a stamp that never goes backwards (a header-line merge conflict resolved to the older side);
   · a new guide is dated the same way;
   · promote (index.html ← next.html) is exempt: a guide equal — words and stamps — to the other page's copy at the base passes;
   · while main's copy is still undated (this release itself) every guide's words must equal the fingerprint they had when the stamps
     were derived (STAMPED_FP below) — so a release that lands on main first and edits a guide cannot slip through a clean merge with
     the old stamp. Refresh the table only after re-deriving the stamps:  node tests/payroll/guides-dated-v2304.test.js --fingerprints */
const PAGE=process.env.NEXI_PAGE||'index.html';
const OTHER=p=>p==='next.html'?'index.html':'next.html';
const TXT=g=>JSON.stringify([g.title,g.who,g.summary,g.sections]);           /* the words a reader sees — not id/icon/cat/sens/stamps */
const SJ=x=>JSON.stringify(x||null);
const VN=v=>{const m=/^(\d+)\.(\d+)$/.exec(String(v||''));return m?(+m[1])*1000+(+m[2]):-1;};
const NV=n=>Math.floor(n/1000)+'.'+String(n%1000).padStart(2,'0');
const OK=s=>!!(s&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)&&/^\d+\.\d{2}$/.test(s.version));
const FPX=g=>require('crypto').createHash('sha1').update(TXT(g)).digest('hex').slice(0,10);
function loadGuides(html){ /* the guides block run the way nexidoc/tools/dump-guides.js runs it */
  const vm=require('vm');const i=html.indexOf('<script id="hnx-help-guides-v1991">');if(i<0)return null;
  const st=html.indexOf('>',i)+1,en=html.indexOf('</script>',st);const ctx={window:{}};vm.createContext(ctx);vm.runInContext(html.slice(st,en),ctx);
  const m=html.match(/const APP_VERSION='([\d.]+)'/);return {v:m?m[1]:'',G:ctx.window.HNX_HELP_GUIDES||[]};
}
/* the text fingerprint of every guide when its stamps were derived from history (v23.08 build, base e0e220b = v23.06/v23.07) */
/* v23.28: m_hr, m_overview and m_production re-stamped 2026-10-14 v23.28 / v23.29 (📅 Memos of the day) — their fingerprints refreshed with --fingerprints */
/* v23.22: m_maintenance re-stamped 2026-10-14 v23.22 / v23.23 (❄ cold storage review fixes) — fingerprints refreshed with --fingerprints */
/* v23.18: m_hr, m_payroll, m_production re-stamped 2026-10-14 v23.18 / v23.19 (memo-chain review fixes) — fingerprints refreshed with --fingerprints */
/* v23.16: m_accounting re-stamped 2026-10-14 v23.16 / v23.17 (🖨 offer comparison review fixes) — fingerprints refreshed with --fingerprints */
/* v23.14: m_overview, module_calendar, tasks re-stamped 2026-10-14 v23.14 / v23.15 (🚨 Escalation review fixes) — fingerprints refreshed with --fingerprints */
/* v23.12: tasks and module_calendar re-stamped 2026-10-14 v23.12 / v23.13 (task subjects ➕ + 3-D task pictures) — fingerprints refreshed with --fingerprints */
/* v23.10: m_hr, m_payroll and m_production re-stamped 2026-10-14 v23.10 / v23.11 (memo chain ① Jinky → ② Dr Amy / Eyal + memo scorecard) — their fingerprints refreshed with --fingerprints */
const STAMPED_FP={
 'index.html':{start:'3c7733f9ac',requests:'edadf446ea',gps:'d122131aa0',hr201:'edd74c75b8',trips:'8be7a72a9f',cctv:'e19442f9e5',sos:'b8bc33d9fa',attendance:'8fefbf5e7f',fixed_assets:'4e7237eeec',cea_building:'8e1612340a',crm_customer_care:'bbead5bc93',storage_autoclean:'f8a9679d59',tasks:'b314936dab',module_calendar:'efd0c6796f',crm_customers_guide:'f2471817ae',crm_catalog:'5962d2e4e3',crm_potential:'bfce597ae2',crm_sales_intel:'4351dfb1fd',cea_followup:'01135c7c8d',cea_regulatory:'e241f352e3',m_overview:'c2e1a108f2',m_production:'ce12a1e15e',m_maintenance:'6002c16999',m_irrigation:'bdb1eba921',m_packaging:'3426c9d426',m_logistics:'c4e89e66a2',m_fleet:'6701bef52b',m_it:'552854db23',m_security:'b5bb49ef80',m_quality:'b5118e7ab7',m_crm:'80e0e770dd',m_assistant_pa:'af8f95a6c8',m_hr:'c230ee1435',m_payroll:'2c4ccd7b33',m_inventory:'3cbf819aa7',harvest:'e2663bf76a',meetings:'c75097097f',acct_loyalty:'36a7fc9796',m_accounting:'b3644bfa99',m_licenses:'16d500191e',m_projects:'4c58538240',m_rnd:'0cca2170f8',m_reports:'a2138a49d0',m_assistant:'18996a1aac',m_admin:'9ab417c16e'},
 'next.html':{start:'01a604fdd8',requests:'d2eb861c3e',gps:'d122131aa0',hr201:'edd74c75b8',trips:'cf4434f172',cctv:'e19442f9e5',sos:'b8bc33d9fa',attendance:'643c7e92b3',fixed_assets:'4e7237eeec',cea_building:'8e1612340a',crm_customer_care:'bbead5bc93',storage_autoclean:'f8a9679d59',tasks:'335997a546',module_calendar:'efd0c6796f',crm_customers_guide:'f2471817ae',crm_catalog:'5962d2e4e3',crm_potential:'bfce597ae2',crm_sales_intel:'4351dfb1fd',cea_followup:'8b53c4fddb',cea_regulatory:'e241f352e3',m_overview:'c2e1a108f2',m_production:'ce12a1e15e',m_maintenance:'6002c16999',m_irrigation:'7e6900b147',m_packaging:'3426c9d426',m_logistics:'c4e89e66a2',m_fleet:'6701bef52b',m_it:'ed5b76a4f6',m_security:'b5bb49ef80',m_quality:'b5118e7ab7',m_crm:'80e0e770dd',m_assistant_pa:'af8f95a6c8',m_hr:'fb7720d5f1',m_payroll:'4649179597',m_inventory:'3cbf819aa7',harvest:'e2663bf76a',meetings:'c75097097f',acct_loyalty:'36a7fc9796',m_accounting:'1cbb2ad309',m_licenses:'16d500191e',m_projects:'4c58538240',m_rnd:'0cca2170f8',m_reports:'a2138a49d0',m_assistant:'18996a1aac',m_admin:'2b1d227f60'}};
function staleGuides(cur,base,o){ /* ids that break the keep-current rule (see the header) */
  o=o||{};const B={},O={};((base&&base.G)||[]).forEach(g=>{B[g.id]=g;});((o.other&&o.other.G)||[]).forEach(g=>{O[g.id]=g;});
  const baseV=VN(base&&base.v),baseDate=String(o.baseDate||''),baseDated=((base&&base.G)||[]).some(g=>OK(g.updated));const out=[];
  cur.G.forEach(g=>{const u=g.updated||{},b=B[g.id],ob=O[g.id];
    const asOther=!!ob&&TXT(ob)===TXT(g)&&SJ(ob.updated)===SJ(g.updated)&&SJ(ob.added)===SJ(g.added);   /* promote: index ← next */
    const fresh=()=>OK(u)&&(asOther||(VN(u.version)>baseV&&String(u.date)>=baseDate));             /* a change made in THIS release */
    if(!baseDated&&o.fp&&o.fp[g.id]!==FPX(g)){out.push(g.id);return;}   /* main (or this branch) changed it after the stamps were derived */
    if(!b){ if(!OK(g.added)||!fresh())out.push(g.id); return; }
    const bu=b.updated||{};
    if(TXT(g)===TXT(b)){ if(OK(bu)&&!asOther&&(VN(u.version)<VN(bu.version)||String(u.date)<String(bu.date)))out.push(g.id); return; }
    if(!fresh()||(OK(bu)&&!(VN(u.version)>VN(bu.version)&&String(u.date)>=String(bu.date))))out.push(g.id);
  });
  return out;
}
function manilaDate(iso){const t=Date.parse(iso);return isNaN(t)?'':new Date(t+8*3600e3).toISOString().slice(0,10);}
function gitCheck(root,page,env){ /* the keep-current rule against the copy of `page` where this branch left main */
  const fs=require('fs'),path=require('path'),cp=require('child_process');
  const git=a=>cp.execFileSync('git',['-C',root].concat(a),{maxBuffer:1<<29,stdio:['ignore','pipe','pipe']}).toString('utf8');
  try{git(['rev-parse','--verify','-q','origin/main']);}catch(e){try{git(['fetch','--no-tags','--depth=1','origin','+refs/heads/main:refs/remotes/origin/main']);}catch(e2){}}
  let ref='',kind='';
  if((env||{}).GITHUB_EVENT_NAME==='pull_request'){try{ref=git(['rev-parse','--verify','-q','HEAD^1']).trim();kind='PR merge parent';}catch(e){ref='';}}
  if(!ref){try{ref=git(['merge-base','HEAD','origin/main']).trim();kind='merge-base';}catch(e){ref='';}}
  if(!ref){ref='origin/main';kind='origin/main';}
  let baseHtml;try{baseHtml=git(['show',ref+':'+page]);}catch(e){return {base:ref+':'+page+' could not be read',kind};}
  let other=null;try{other=loadGuides(git(['show',ref+':'+OTHER(page)]));}catch(e){}
  let baseDate='';try{baseDate=manilaDate(git(['log','-1','--format=%cI',ref]).trim());}catch(e){}
  const cur=loadGuides(fs.readFileSync(path.join(root,page),'utf8')),base=loadGuides(baseHtml)||{v:'',G:[]};
  if(!cur)return {base:'no guides block in '+page,kind};
  return {base:'ok',kind,baseDate,cur,baseG:base,stale:staleGuides(cur,base,{other,baseDate,fp:STAMPED_FP[page]})};
}
function fakeRepo(){ /* a branch BEHIND main passes on guides it never touched; the same branch editing a guide without a bump fails */
  const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nexi-guides-dated-'));
  const g=a=>cp.execFileSync('git',['-C',dir,'-c','user.name=t','-c','user.email=t@t','-c','commit.gpgsign=false','-c','init.defaultBranch=main'].concat(a),{stdio:['ignore','pipe','pipe']}).toString('utf8');
  const put=(v,G)=>fs.writeFileSync(path.join(dir,'index.html'),"<script>const APP_VERSION='"+v+"';</script>\n<script id=\"hnx-help-guides-v1991\">window.HNX_HELP_GUIDES="+JSON.stringify(G)+";</script>\n");
  const st=(d,v)=>({date:d,version:v});
  const G0=[{id:'a',title:'A',who:'x',summary:'s',sections:[{h:'h',p:['p']}],added:st('2026-10-14','23.06'),updated:st('2026-10-14','23.06')},
            {id:'b',title:'B',who:'x',summary:'s',sections:[{h:'h',p:['p']}],added:st('2026-10-14','23.06'),updated:st('2026-10-14','23.06')}];
  try{
    g(['init','-q']);put('23.06',G0);g(['add','index.html']);g(['commit','-qm','A']);const A=g(['rev-parse','HEAD']).trim();
    const G1=JSON.parse(JSON.stringify(G0));G1[0].title='A — rewritten by a later release';G1[0].updated=st('2026-10-15','23.08');
    put('23.08',G1);g(['commit','-qam','B (main moves on)']);g(['update-ref','refs/remotes/origin/main','HEAD']);
    g(['checkout','-q','--detach',A]);
    const behind=gitCheck(dir,'index.html',{});
    const tip=staleGuides(loadGuides(fs.readFileSync(path.join(dir,'index.html'),'utf8')),loadGuides(g(['show','origin/main:index.html'])),{});
    const G2=JSON.parse(JSON.stringify(G0));G2[1].summary+=' x';put('23.10',G2);g(['commit','-qam','C (b edited, no bump)']);
    const edited=gitCheck(dir,'index.html',{});
    return {behind:behind.stale,behindKind:behind.kind,tipWouldSay:tip,edited:edited.stale};
  }finally{try{fs.rmSync(dir,{recursive:true,force:true});}catch(e){}}
}
const ADDED={start:'2026-09-13 v19.91',requests:'2026-09-13 v19.91',gps:'2026-09-13 v19.91',hr201:'2026-09-13 v19.91',trips:'2026-09-13 v19.91',
  cctv:'2026-09-13 v19.91',sos:'2026-09-13 v19.91',attendance:'2026-09-13 v19.91',fixed_assets:'2026-09-17 v20.81',cea_building:'2026-09-26 v21.08',
  crm_customer_care:'2026-09-27 v21.15',storage_autoclean:'2026-09-27 v21.16',tasks:'2026-09-27 v21.17',module_calendar:'2026-09-27 v21.15',
  crm_customers_guide:'2026-09-27 v21.18',crm_catalog:'2026-09-27 v21.18',crm_potential:'2026-09-27 v21.18',crm_sales_intel:'2026-09-27 v21.13',
  cea_followup:'2026-09-26 v21.08',cea_regulatory:'2026-09-18 v20.82',m_overview:'2026-09-13 v19.93',m_production:'2026-09-13 v19.93',
  m_maintenance:'2026-09-13 v19.93',m_irrigation:'2026-09-13 v19.93',m_packaging:'2026-09-13 v19.93',m_logistics:'2026-09-13 v19.93',
  m_fleet:'2026-09-13 v19.93',m_it:'2026-09-13 v19.93',m_security:'2026-09-13 v19.93',m_quality:'2026-09-13 v19.93',m_crm:'2026-09-13 v19.93',
  m_assistant_pa:'2026-10-03 v21.41',m_hr:'2026-09-13 v19.93',m_payroll:'2026-09-13 v19.93',m_inventory:'2026-09-13 v19.93',harvest:'2026-10-02 v21.37',
  meetings:'2026-10-01 v21.29',acct_loyalty:'2026-09-29 v21.21',m_accounting:'2026-09-13 v19.93',m_licenses:'2026-09-13 v19.93',m_projects:'2026-09-13 v19.93',
  m_reports:'2026-09-13 v19.93',m_assistant:'2026-09-13 v19.93',m_admin:'2026-09-13 v19.93'};
module.exports=[
{ name:'📅 Guides dated: all 45 guides carry added + updated {date YYYY-MM-DD, version NN.NN}, added ≤ updated ≤ this page’s APP_VERSION; added = git history (start/requests/gps/hr201/trips/cctv/sos/attendance 2026-09-13 v19.91 · the 20 module guides 2026-09-13 v19.93 · fixed_assets 2026-09-17 v20.81 · meetings 2026-10-01 v21.29 · m_rnd 2026-10-13); updated at least: pool meters (m_irrigation) 2026-10-13 v22.88, m_production 2026-10-13 v22.90, tasks · module_calendar · m_overview 2026-10-14 v23.04 (🚨 Escalation), m_accounting 2026-10-14 v23.06 (🖨 offer comparison), start 2026-10-14 v23.08 (this release — any number after main’s v23.06 / v23.07); no guide cites a version (“v23.04”) above its own updated stamp (v23.08)',
  run:new Function(`return (async()=>{const ADDED=${JSON.stringify(ADDED)};
    const G=window.HNX_HELP_GUIDES||[],AV=(typeof APP_VERSION!=='undefined')?String(APP_VERSION):'';
    const vn=v=>{const m=/^(\\d+)\\.(\\d+)$/.exec(String(v||''));return m?(+m[1])*1000+(+m[2]):-1;};
    const ok=s=>!!(s&&/^\\d{4}-\\d{2}-\\d{2}$/.test(s.date)&&/^\\d+\\.\\d{2}$/.test(s.version));
    const by=id=>G.find(g=>g.id===id)||{};
    const undated=G.filter(g=>!ok(g.added)||!ok(g.updated)).map(g=>g.id);
    const order=G.filter(g=>ok(g.added)&&ok(g.updated)&&(g.added.date>g.updated.date||vn(g.added.version)>vn(g.updated.version))).map(g=>g.id);
    const ahead=G.filter(g=>ok(g.updated)&&vn(g.updated.version)>vn(AV)).map(g=>g.id);
    const addedWrong=Object.keys(ADDED).filter(id=>{const a=by(id).added;return !a||(a.date+' v'+a.version)!==ADDED[id];});
    const MIN={m_irrigation:['2026-10-13','22.88'],m_production:['2026-10-13','22.90'],start:['2026-10-14','23.07'],hr201:['2026-09-13','19.91'],m_accounting:['2026-10-14','23.06'],
      tasks:['2026-10-14','23.04'],module_calendar:['2026-10-14','23.04'],m_overview:['2026-10-14','23.04']};
    const below=Object.keys(MIN).filter(id=>{const u=by(id).updated;return !ok(u)||u.date<MIN[id][0]||vn(u.version)<vn(MIN[id][1]);});
    /* a guide that names a version in its words ("… (v23.04)") was changed in that version at the latest — a missed re-stamp shows here */
    const citedAhead=G.filter(g=>ok(g.updated)).map(g=>{const t=JSON.stringify([g.title,g.summary,g.sections]);let mx='';const re=/\\bv(\\d{2}\\.\\d{2})\\b/g;let m;
      while((m=re.exec(t)))if(vn(m[1])>vn(mx))mx=m[1];return mx&&vn(mx)>vn(g.updated.version)?g.id+' cites v'+mx+' > v'+g.updated.version:'';}).filter(Boolean);
    return {atLeast45:G.length>=45,undated,order,ahead,addedWrong,below,citedAhead,rnd:(by('m_rnd').added||{}).date};})()`),
  expect:{atLeast45:true,undated:[],order:[],ahead:[],addedWrong:[],below:[],citedAhead:[],rnd:'2026-10-13'} },

{ name:'📅 Help list: every card shows “Updated <d Mon yyyy> · v<version>” right under its title (🆕 in front only when changed in the last 7 days) — the pool-meters guide (💧 Irrigation) reads “Updated 13 Oct 2026 · v22.88” (v22.89 on the trial copy) or a later stamp (v23.08)',
  run:async()=>{
    HNX_HELP.open();HNX_HELP.sort('topic');await sleep(300);
    const ov=document.getElementById('hnxhOv'),MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const f=d=>{const a=d.split('-');return (+a[2])+' '+MON[+a[1]-1]+' '+a[0];};
    const dn=s=>{const a=String(s).split('-').map(Number);return Date.UTC(a[0],a[1]-1,a[2])/864e5;};
    const T=hnxLocalToday();
    const card=id=>[...ov.querySelectorAll('.hnxh-card')].find(b=>(b.getAttribute('onclick')||'').indexOf("open('"+id+"')")>=0);
    const wrong=[];
    HNX_HELP.guides().forEach(g=>{const c=card(g.id),u=c&&c.querySelector('.hnxh-upd');
      const exp=(dn(T)-dn(g.updated.date)<7?'🆕 ':'')+'Updated '+f(g.updated.date)+' · v'+g.updated.version;
      const under=!!(u&&u.previousElementSibling&&u.previousElementSibling.tagName==='B');
      if(!u||u.textContent!==exp||!under)wrong.push(g.id+': '+(u?u.textContent:'none'));});
    const irr=HNX_HELP_GUIDES.find(g=>g.id==='m_irrigation'),irrTxt=(card('m_irrigation').querySelector('.hnxh-upd')||{}).textContent||'';
    const vn=v=>{const m=/^(\d+)\.(\d+)$/.exec(String(v||''));return m?(+m[1])*1000+(+m[2]):-1;};
    const irrOk=/^(🆕 )?Updated \d{1,2} [A-Z][a-z]{2} \d{4} · v\d+\.\d{2}$/.test(irrTxt)&&irr.updated.date>='2026-10-13'&&vn(irr.updated.version)>=vn('22.88');
    HNX_HELP.close();
    return {cards:HNX_HELP.guides().length>=45,wrong,irrOk,irrTxt};},
  expect:{cards:true,wrong:[],irrOk:true} },

{ name:'📅 The dated line, by hand in local days: a guide added 2026-09-13 v19.93 / updated 2026-10-13 v22.88 reads on 19 Oct “🆕 Updated 13 Oct 2026 · v22.88” (6 days) and on 20 Oct “Updated 13 Oct 2026 · v22.88” (7 days, no 🆕); its page shows “Added 13 Sep 2026 · v19.93 — 🆕 Updated 13 Oct 2026 · v22.88” then “Added 13 Sep 2026 · v19.93 — Updated 13 Oct 2026 · v22.88” right under the title, Contents still 2 for 2 sections; each half (“Added …” / “🆕 Updated …”) is one no-wrap piece, so a narrow screen breaks only at “ — ”; a guide with no stamp shows no line and no error (v23.08)',
  run:async()=>{
    const G=window.HNX_HELP_GUIDES,keep=window.hnxLocalToday;
    G.push({id:'zz_dated_a',icon:'🧪',title:'ZZ dated A',who:'Test',cat:'task',summary:'s',sections:[{h:'One',p:['a']},{h:'Two',p:['b']}],
            added:{date:'2026-09-13',version:'19.93'},updated:{date:'2026-10-13',version:'22.88'}});
    G.push({id:'zz_dated_b',icon:'🧪',title:'ZZ dated B',who:'Test',cat:'task',summary:'s',sections:[{h:'One',p:['a']}]});
    const card=id=>{const b=[...document.querySelectorAll('#hnxhOv .hnxh-card')].find(x=>(x.getAttribute('onclick')||'').indexOf("open('"+id+"')")>=0);
      const u=b&&b.querySelector('.hnxh-upd');return b?(u?u.textContent:'none'):'no card';};
    const page=()=>{const d=document.querySelector('#hnxhOv .hnxh-dated');return d?d.textContent:null;};
    let err=null,out={};
    try{
      window.hnxLocalToday=()=>'2026-10-19';HNX_HELP.open();HNX_HELP.sort('topic');await sleep(200);
      out.d6=card('zz_dated_a');out.noStamp=card('zz_dated_b');
      HNX_HELP.open('zz_dated_a');await sleep(200);out.page6=page();
      const h=document.querySelector('#hnxhOv .hnxh-dh h3');out.underTitle=!!(h&&h.nextElementSibling&&h.nextElementSibling.classList.contains('hnxh-dated'));
      out.toc=document.querySelectorAll('#hnxhOv .hnxh-toc-l button').length;
      out.pieces=[...document.querySelectorAll('#hnxhOv .hnxh-dated .hnxh-st')].map(x=>getComputedStyle(x).whiteSpace+': '+x.textContent);
      window.hnxLocalToday=()=>'2026-10-20';HNX_HELP.home();await sleep(200);out.d7=card('zz_dated_a');
      HNX_HELP.open('zz_dated_a');await sleep(200);out.page7=page();
      HNX_HELP.open('zz_dated_b');await sleep(200);out.pageB=page();
    }catch(e){err=String(e.message||e);}
    window.hnxLocalToday=keep;G.splice(G.length-2,2);HNX_HELP.home();HNX_HELP.close();
    return Object.assign(out,{err});},
  expect:{d6:'🆕 Updated 13 Oct 2026 · v22.88',d7:'Updated 13 Oct 2026 · v22.88',noStamp:'none',
          page6:'Added 13 Sep 2026 · v19.93 — 🆕 Updated 13 Oct 2026 · v22.88',page7:'Added 13 Sep 2026 · v19.93 — Updated 13 Oct 2026 · v22.88',
          underTitle:true,toc:2,pageB:null,err:null,
          pieces:['nowrap: Added 13 Sep 2026 · v19.93','nowrap: 🆕 Updated 13 Oct 2026 · v22.88']} },

{ name:'📱 Phone width 400 px: a guide page’s dated line never splits a stamp — “Added 13 Sep 2026 · v19.93” and “Updated … · v…” each stay on one line (💧 Irrigation, the line used to break as “… Updated 13 Oct” / “2026 · v22.98”); every list card’s “Updated …” stays on one line too (v23.08)',
  viewport:{width:400,height:820},
  run:async()=>{
    HNX_HELP.open('m_irrigation');await sleep(300);
    const lines=el=>{const R=document.createRange();R.selectNodeContents(el);   /* text line boxes: rect centres more than 6 px apart = another line */
      const c=[...R.getClientRects()].filter(q=>q.width>0).map(q=>(q.top+q.bottom)/2).sort((a,b)=>a-b);return c.filter((y,i)=>i===0||y-c[i-1]>6).length;};
    const ov=document.getElementById('hnxhOv'),st=[...ov.querySelectorAll('.hnxh-dated .hnxh-st')];
    const split=st.filter(x=>lines(x)!==1).map(x=>x.textContent);
    const txt=(ov.querySelector('.hnxh-dated')||{}).textContent||'';
    HNX_HELP.home();HNX_HELP.sort('topic');await sleep(300);
    const cards=[...ov.querySelectorAll('.hnxh-upd')],cardSplit=cards.filter(x=>lines(x)!==1).map(x=>x.textContent);
    const wide=document.documentElement.scrollWidth>window.innerWidth+1;
    HNX_HELP.close();
    return {pieces:st.length,split,starts:/^Added 13 Sep 2026 · v19\.93 — (🆕 )?Updated \d{1,2} [A-Z][a-z]{2} \d{4} · v\d+\.\d{2}$/.test(txt),cards:cards.length>=45,cardSplit,wide};},
  expect:{pieces:2,split:[],starts:true,cards:true,cardSplit:[],wide:false} },

{ name:'🕒 Recently updated: one list of every guide the viewer may open (45 for the admin), newest change first — each card’s stamp the same or older than the one before (ties by version); the heading counts the 🆕 guides; 📚 By topic brings back Start here / How to do a job / Module by module; the choice is kept in hydroPro_help_state_v1 (v23.08)',
  run:async()=>{
    HNX_HELP.open();HNX_HELP.sort('recent');await sleep(300);
    const ov=document.getElementById('hnxhOv'),G=HNX_HELP.guides(),by={};G.forEach(g=>{by[g.id]=g;});
    const vn=v=>{const m=/^(\d+)\.(\d+)$/.exec(String(v||''));return m?(+m[1])*1000+(+m[2]):-1;};
    const key=g=>g.updated.date+'|'+String(vn(g.updated.version)).padStart(6,'0');
    const dn=s=>{const a=String(s).split('-').map(Number);return Date.UTC(a[0],a[1]-1,a[2])/864e5;};
    const ids=[...ov.querySelectorAll('.hnxh-card')].map(b=>(/open\('([^']+)'\)/.exec(b.getAttribute('onclick')||'')||[])[1]);
    let sorted=ids.length>0;for(let i=1;i<ids.length;i++)if(key(by[ids[i]])>key(by[ids[i-1]]))sorted=false;
    const maxKey=G.map(key).sort().pop(),nNew=G.filter(g=>dn(hnxLocalToday())-dn(g.updated.date)<7).length;
    const heads=[...ov.querySelectorAll('.hnxh-cat')].map(c=>c.childNodes[0].textContent.trim()),head=(ov.querySelector('.hnxh-cat')||{}).textContent||'';
    const onRecent=!!ov.querySelector('.hnxh-sortb.on[data-sort="recent"]');
    const st=()=>{try{return (JSON.parse(localStorage.getItem('hydroPro_help_state_v1')||'{}')||{}).sort;}catch(e){return 'ERR';}};
    const saved=st();
    HNX_HELP.sort('topic');await sleep(200);
    const heads2=[...ov.querySelectorAll('.hnxh-cat')].map(c=>c.childNodes[0].textContent.trim()),saved2=st();
    HNX_HELP.close();
    return {all:ids.length===G.length&&G.length>=45,sorted,first:!!ids[0]&&key(by[ids[0]])===maxKey,heads,
      headNew:nNew?head.indexOf('🆕 '+nNew+' in the last 7 days')>=0:head.indexOf('🆕')<0,onRecent,saved,heads2,saved2};},
  expect:{all:true,sorted:true,first:true,heads:['Recently updated'],headNew:true,onRecent:true,saved:'recent',
          heads2:['Start here','How to do a job','Module by module'],saved2:'topic'} },

{ name:'🔒 Still read-only: the dated lines are plain text (no link, button or download), copying from them is blocked, printing still prints only the notice, and the Help list has no download / export / print / copy / save control — only 📖 Guides, 💬 Ask, ✕ and the two order buttons (v23.08)',
  run:async()=>{
    HNX_HELP.open('m_irrigation');await sleep(250);
    const ov=document.getElementById('hnxhOv'),d=ov.querySelector('.hnxh-dated');
    const plain=!!d&&d.querySelectorAll('a,button,input,[download]').length===0;
    const ev=new Event('copy',{bubbles:true,cancelable:true});if(d)d.dispatchEvent(ev);
    HNX_HELP.home();await sleep(200);
    const upd=[...ov.querySelectorAll('.hnxh-upd')],updPlain=upd.length>=45&&upd.every(u=>!u.querySelector('a,button'));
    const ctrls=[...ov.querySelectorAll('a,button:not(.hnxh-card),[download]')].filter(b=>/download|export|print|copy|save|pdf|xlsx|docx/i.test(
      (b.textContent||'')+' '+(b.getAttribute('onclick')||'')+' '+(b.getAttribute('href')||'')+(b.hasAttribute('download')?' download':''))).map(b=>b.textContent.trim().slice(0,40));
    const printNotice=/Printing and saving are switched off/.test((document.getElementById('hnxhCss')||{}).textContent||'');
    HNX_HELP.close();
    return {plain,blocked:ev.defaultPrevented,updPlain,ctrls,printNotice};},
  expect:{plain:true,blocked:true,updPlain:true,ctrls:[],printNotice:true} },

{ name:'🛡 Dates stay current: against this page where the branch left main (merge-base; PR merge parent on CI) every guide whose words changed carries a newer `updated` above main’s APP_VERSION and not dated before main’s last landing, an unchanged guide’s stamp never goes backwards, promote (index ← next) passes; this release: tasks · module_calendar · m_overview re-stamped 2026-10-14 v23.04 after 🚨 Escalation and m_accounting 2026-10-14 v23.06 after 🖨 offer comparison, start 2026-10-14 v23.08 → stale []; caught: m_security +1 word no bump → ["m_security"], bumped to old v19.94 → ["m_security"], start left at main’s own number → ["start"], m_production stamp lowered → ["m_production"], main rewrites a guide after stamping (undated base, fingerprint table) → ["m_security"]; a branch behind main passes on a guide it never touched ([] where the old tip compare said ["a"]) and fails on its own unbumped edit (["b"]) (v23.08)',
  drive:async()=>{
    const path=require('path');const root=path.resolve(__dirname,'../..');
    const r=gitCheck(root,PAGE,process.env);if(r.base!=='ok')return {base:r.base,kind:r.kind};
    const cur=r.cur,clone=x=>JSON.parse(JSON.stringify(x)),find=(X,id)=>X.G.find(g=>g.id===id);
    const bumpV=NV(VN(cur.v)+2),strip=X=>{const Y=clone(X);Y.G.forEach(g=>{delete g.added;delete g.updated;});return Y;};
    /* m_security edited, stamp unchanged */
    const m1=clone(cur);find(m1,'m_security').summary+=' x';const caught=staleGuides(m1,cur,{});
    /* m_security edited and "bumped" to a version main shipped long ago */
    const m2=clone(m1);find(m2,'m_security').updated={date:'2026-12-31',version:'19.94'};const oldVer=staleGuides(m2,cur,{});
    /* m_security edited and bumped properly (a later release: page 2 numbers up, date after main's) */
    const m3=clone(m1);m3.v=bumpV;find(m3,'m_security').updated={date:'2026-12-31',version:bumpV};const okBump=staleGuides(m3,cur,{});
    /* renumbered at deploy but start left on the number main already used: main ships start's version with other words */
    const mb=clone(cur);mb.v=find(cur,'start').updated.version;find(mb,'start').sections=find(mb,'start').sections.slice(1);
    const leftover=staleGuides(cur,mb,{baseDate:'2026-10-14'});
    /* unchanged words, stamp lowered (the older side of a header-line conflict) */
    const m4=clone(cur);const mp=find(m4,'m_production');mp.updated={date:mp.updated.date,version:NV(VN(mp.updated.version)-8)};const regress=staleGuides(m4,cur,{});
    /* promote: index.html ← next.html (the trial guides, whole, become the stable ones) */
    const fs=require('fs'),rd=f=>{try{return loadGuides(fs.readFileSync(path.join(root,f),'utf8'));}catch(e){return null;}};
    const idx=rd('index.html'),nxt=rd('next.html');const promote=(idx&&nxt)?staleGuides(nxt,idx,{other:nxt}):'no next.html';
    /* main is still undated and rewrites a guide after the stamps were derived: the clean merge keeps the old stamp */
    const m5=clone(cur);find(m5,'m_security').summary+=' (main)';const und=strip(m5);const mainMoved=staleGuides(m5,und,{fp:STAMPED_FP[PAGE]});
    const fpNow=staleGuides(cur,strip(cur),{fp:STAMPED_FP[PAGE]});
    const st=find(cur,'start').updated||{};
    let fake;try{fake=fakeRepo();}catch(e){fake={err:String(e.message||e).slice(0,160)};}
    return {base:'ok',kind:r.kind,baseDate:r.baseDate,stale:r.stale,caught,oldVer,okBump,leftover,regress,promote,mainMoved,fpNow,fake,
      startOk:String(st.date)>='2026-10-14'&&VN(st.version)>=VN('23.07')};},
  expect:{'drive.base':'ok','drive.stale':[],'drive.caught':['m_security'],'drive.oldVer':['m_security'],'drive.okBump':[],'drive.leftover':['start'],
          'drive.regress':['m_production'],'drive.promote':[],'drive.mainMoved':['m_security'],'drive.fpNow':[],
          'drive.fake.behind':[],'drive.fake.behindKind':'merge-base','drive.fake.tipWouldSay':['a'],'drive.fake.edited':['b'],'drive.startOk':true} },

{ name:'📄 Word guide: in the newest nexidoc/Nexi_User_Guide_v*.docx every guide heading (45) is followed by “Added <d Mon yyyy> · v<NN.NN> — Updated <d Mon yyyy> · v<NN.NN>” — hr201 “Added 13 Sep 2026 · v19.91 — Updated …”, pool meters (Irrigation) “Added 13 Sep 2026 · v19.93 — Updated …” (v23.08)',
  drive:async()=>{
    const fs=require('fs'),path=require('path'),cp=require('child_process');const dir=path.resolve(__dirname,'../../nexidoc');
    const docs=fs.readdirSync(dir).map(f=>/^Nexi_User_Guide_v(\d+)\.(\d+)\.docx$/.exec(f)).filter(Boolean).sort((a,b)=>(+a[1]*1000+ +a[2])-(+b[1]*1000+ +b[2]));
    if(!docs.length)return {doc:'none'};
    const f=path.join(dir,docs[docs.length-1][0]);
    const py="import zipfile,sys,json\nimport xml.etree.ElementTree as ET\nW='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'\n"
      +"x=ET.fromstring(zipfile.ZipFile(sys.argv[1]).read('word/document.xml'))\nout=[]\n"
      +"for p in x.iter(W+'p'):\n  s=p.find(W+'pPr/'+W+'pStyle')\n  out.append([s.get(W+'val') if s is not None else '',''.join(t.text or '' for t in p.iter(W+'t'))])\nprint(json.dumps(out))";
    const P=JSON.parse(cp.execFileSync('python3',['-c',py,f],{maxBuffer:1<<26}).toString('utf8'));
    const RX=/^Added \d{1,2} [A-Z][a-z]{2} \d{4} · v\d+\.\d{2} — Updated \d{1,2} [A-Z][a-z]{2} \d{4} · v\d+\.\d{2}$/;
    const heads=[],bad=[];P.forEach((p,i)=>{if(p[0]==='Heading1'&&p[1]!=='Contents'){heads.push(p[1]);const n=P[i+1]||['',''];if(!RX.test(n[1]))bad.push(p[1].slice(0,40));}});
    const after=t=>{const i=P.findIndex(p=>p[0]==='Heading1'&&p[1].indexOf(t)>=0);return i>=0?String((P[i+1]||[])[1]||''):'';};
    return {doc:'ok',heads:heads.length>=45,bad,hr201:after('201 files').indexOf('Added 13 Sep 2026 · v19.91 — Updated ')===0,
      irr:after('Irrigation').indexOf('Added 13 Sep 2026 · v19.93 — Updated ')===0};},
  expect:{'drive.doc':'ok','drive.heads':true,'drive.bad':[],'drive.hr201':true,'drive.irr':true} },
];
if(require.main===module&&process.argv.includes('--fingerprints')){ /* prints STAMPED_FP for both pages — paste it above ONLY after re-deriving the stamps */
  const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');const out={};
  ['index.html','next.html'].forEach(p=>{let L=null;try{L=loadGuides(fs.readFileSync(path.join(root,p),'utf8'));}catch(e){}
    if(L){out[p]={};L.G.forEach(g=>{out[p][g.id]=FPX(g);});}});
  console.log(JSON.stringify(out));
}
