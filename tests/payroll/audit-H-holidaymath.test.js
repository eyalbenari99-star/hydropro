/* Audit batch H - holiday arithmetic (ot-holiday-06, -07, -08, -09).
   Every fixture sets the holiday calendar itself inside run(), after boot, so the rule-generated
   holidays the app seeds on start cannot leak into the numbers. All dates are in the past (the
   engine never counts a day after today), so the cases hold on any day the suite runs. */
module.exports=[
/* ---------- ot-holiday-06: a holiday on an OFFICE REST DAY ---------- */
{ name:'office ₱16,000/month, 11–25 Aug 2026 (₱727.27/day): a REGULAR holiday on Sat 15 Aug, worked + signed = Sun OT ₱945.45 + holiday ₱945.45 (260% in all), basic stays ₱8,000.00, gross ₱9,890.90; unsigned it pays ₱0 and waits as ₱945.45 + ₱945.45 = ₱1,890.90, the sum signing pays (was forecast ₱1,890.91) (audit ot-holiday-06, H round 2)',
  run:async()=>{
    const W=o=>{let c={};try{c=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')||{};}catch(e){}const k={};Object.keys(c).forEach(x=>{if(x.charAt(0)==='_')k[x]=c[x];});localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign(k,o)));}; /* keeps the store's one-time amnesty flags, so the 4-second amnesty pass never re-runs over the fixture */
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-15':{name:'Test Regular Holiday',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-08-15':{ANN:rec('present','07:00','17:30')}});
    W({});
    const u=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    W({'ANN|2026-08-15':{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}});
    const l=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    const r2=x=>Math.round(x*100)/100;
    return {rate:r2(l.dailyRate),basicWk:r2(l.basicPay-l.sundayPremium),sun:l.sundayPremium,hol:l.holidayPay,holWorked:l.holidaysWorked,gross:l.grossPay,gap:l.daysGap,
      unsigned:{sun:u.sundayPremium,hol:u.holidayPay,pend:u.pending.sun.n,pendAmt:u.pending.sun.amt}};},
  expect:{rate:727.27,basicWk:8000,sun:945.45,hol:945.45,holWorked:1,gross:9890.9,gap:0,'unsigned.sun':0,'unsigned.hol':0,'unsigned.pend':1,'unsigned.pendAmt':1890.9} },

{ name:'office ₱16,000/month, 11–25 Aug 2026: a SPECIAL holiday on Sun 16 Aug, worked + signed = Sun OT ₱945.45 + holiday ₱145.45 (150% in all, DOLE); a special WORKING day on a rest day stays 130% (holiday ₱0.00) (audit ot-holiday-06)',
  run:async()=>{
    const W=o=>{let c={};try{c=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')||{};}catch(e){}const k={};Object.keys(c).forEach(x=>{if(x.charAt(0)==='_')k[x]=c[x];});localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign(k,o)));}; /* keeps the store's one-time amnesty flags, so the 4-second amnesty pass never re-runs over the fixture */
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-08-16':{ANN:rec('present','07:00','17:30')}});
    W({'ANN|2026-08-16':{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}});
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-16':{name:'Test Special Holiday',kind:'special'}}));
    const sp=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-16':{name:'Test Special Working Day',kind:'special_working'}}));
    const sw=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    return {sp:{sun:sp.sundayPremium,hol:sp.holidayPay,gap:sp.daysGap},sw:{sun:sw.sundayPremium,hol:sw.holidayPay}};},
  expect:{'sp.sun':945.45,'sp.hol':145.45,'sp.gap':0,'sw.sun':945.45,'sw.hol':0} },

{ name:'rest-day holiday rule does not reach the wrong people: six-day card Sat 15 Aug regular worked = scheduled day, holiday ₱666.67 (200%, rate 8,000/12) and no Sun OT; management ₱30,000 = ₱15,000.00 and holiday ₱0; weekly Regular labourer ₱500 Sunday regular = flat ₱500 + ₱500 (unchanged) (audit ot-holiday-06)',
  run:async()=>{
    const W=o=>{let c={};try{c=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')||{};}catch(e){}const k={};Object.keys(c).forEach(x=>{if(x.charAt(0)==='_')k[x]=c[x];});localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign(k,o)));}; /* keeps the store's one-time amnesty flags, so the 4-second amnesty pass never re-runs over the fixture */
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-15':{name:'Test Regular Holiday',kind:'regular'},'2026-08-30':{name:'Test Sunday Holiday',kind:'regular'}}));
    const ed=office('ED','EDERLYN',{monthlyBasic:16000,sixDayWeek:true});
    const m=office('EY','EYAL',{monthlyBasic:30000,salaryCategory:'management',dept:'Management'});
    const jo=labour('JO','JO',{dailyRate:500});
    setE([ed,m,jo]);
    setA({'2026-08-15':{ED:rec('present','07:00','17:00'),EY:rec('present','07:00','17:00')},'2026-08-30':{JO:rec('present','07:00','17:00')}});
    W({'EY|2026-08-15':{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}});
    const six=calcEmployeePayroll(ed,'2026-08-11','2026-08-25','semi_monthly');
    const mg=calcEmployeePayroll(m,'2026-08-11','2026-08-25','semi_monthly');
    const wk=calcEmployeePayroll(jo,'2026-08-27','2026-09-02','weekly');
    return {six:{rate:Math.round(six.dailyRate*100)/100,basic:six.basicPay,sun:six.sundayPremium,hol:six.holidayPay},mg:{basic:mg.basicPay,hol:mg.holidayPay,sun:mg.sundayPremium},wk:{basic:wk.basicPay,hol:wk.holidayPay}};},
  expect:{'six.rate':666.67,'six.basic':8000,'six.sun':0,'six.hol':666.67,'mg.basic':15000,'mg.hol':0,'mg.sun':0,'wk.basic':500,'wk.hol':500} },

{ name:'final pay (priced by the payroll engine): an office leaver\'s worked Sun 16 Aug 2026 that is a REGULAR holiday, SIGNED in Weekend Approvals = unpaid salary ₱1,890.90 (Sun OT ₱945.45 + holiday ₱945.45, 260%; was ₱945.45); UNSIGNED = unpaid ₱0.00 and 1 weekend day waiting "up to ₱1,890.90" (audit ot-holiday-06, H round 2)',
  run:async()=>{
    const W=o=>{let c={};try{c=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')||{};}catch(e){}const k={};Object.keys(c).forEach(x=>{if(x.charAt(0)==='_')k[x]=c[x];});localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign(k,o)));}; /* keeps the store's one-time amnesty flags, so the 4-second amnesty pass never re-runs over the fixture */
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-16':{name:'Test Regular Holiday',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-08-16':{ANN:rec('present','07:00','17:30')}});
    localStorage.setItem('hydroPro_payroll_runs','[]');
    const ov=()=>document.getElementById('hnxFinalPayOverlay');
    const screen=async()=>{
      const old=ov();if(old)old.remove();
      hnxFinalPay('ANN');await sleep(200);
      const set=(id,v)=>{const el=ov().querySelector('#'+id);el.value=v;el.onchange.call(el);};
      set('fpLast','2026-08-16');await sleep(100);set('fpFrom','2026-08-16');await sleep(100);
      const t=(ov().innerText||'').replace(/\s+/g,' ');ov().remove();return t;};
    const opts={lastDay:'2026-08-16',unpaidFrom:'2026-08-16'};
    W({});
    const u=hnxFinalPayCompute('ANN',opts);const ut=await screen();
    W({'ANN|2026-08-16':{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}});
    const s=hnxFinalPayCompute('ANN',opts);const st=await screen();
    const seg=st.slice(st.indexOf('Unpaid salary'),st.indexOf('Unpaid salary')+220);
    return {signed:{unpaid:s.unpaidSalary,sun:s.sunPay,hol:s.holidayPay,sundays:s.sundays,pendSun:s.pending.sun,
                    row:/1 signed weekend day\(s\) @130%/.test(seg)&&/holiday pay ₱945\.45/.test(seg)&&/₱1,890\.90/.test(seg)},
            unsigned:{unpaid:u.unpaidSalary,sun:u.sunPay,hol:u.holidayPay,pendSun:u.pending.sun,pendAmt:u.pending.amt,
                    note:/NOT in this final pay: 1 weekend day\(s\) \(up to ₱1,890\.90\)/.test(ut)}};},
  expect:{'signed.unpaid':1890.9,'signed.sun':945.45,'signed.hol':945.45,'signed.sundays':1,'signed.pendSun':0,'signed.row':true,
          'unsigned.unpaid':0,'unsigned.sun':0,'unsigned.hol':0,'unsigned.pendSun':1,'unsigned.pendAmt':1890.9,'unsigned.note':true} },

{ name:'office ₱16,000/month, 11–25 Aug 2026: a HALF day on Sun 16 Aug that is a REGULAR holiday waits as ₱472.73 + ₱472.73 = ₱945.46 (was forecast ₱1,890.91) and signing pays exactly that - Sun OT ₱472.73 + holiday ₱472.73; the day audit has no gap either way (audit ot-holiday-06/07, H round 2)',
  run:async()=>{
    const W=o=>{let c={};try{c=JSON.parse(localStorage.getItem('hydroPro_weekend_approvals_v1')||'{}')||{};}catch(e){}const k={};Object.keys(c).forEach(x=>{if(x.charAt(0)==='_')k[x]=c[x];});localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify(Object.assign(k,o)));};
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-16':{name:'Test Regular Holiday',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-08-16':{ANN:rec('present','07:00','12:00','manual',{dayFraction:0.5,editedBy:'jinky'})}});
    W({});
    const u=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    W({'ANN|2026-08-16':{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}});
    const l=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    return {unsigned:{n:u.pending.sun.n,amt:u.pending.sun.amt,sun:u.sundayPremium,hol:u.holidayPay,gap:u.daysGap},
            signed:{sun:l.sundayPremium,hol:l.holidayPay,paid:Math.round((l.sundayPremium+l.holidayPay)*100)/100,pend:l.pending.sun.n,gap:l.daysGap,gross:l.grossPay}};},
  expect:{'unsigned.n':1,'unsigned.amt':945.46,'unsigned.sun':0,'unsigned.hol':0,'unsigned.gap':0,
          'signed.sun':472.73,'signed.hol':472.73,'signed.paid':945.46,'signed.pend':0,'signed.gap':0,'signed.gross':8945.46} },

{ name:'HR ▸ Weekend Approvals quotes a rest-day holiday at what signing pays: office ₱16,000/month Sun 16 Aug 2026 (₱727.27/day) REGULAR holiday ₱1,890.90 (260%, was quoted ₱945.45) and a half day of it ₱472.73 + ₱472.73 = ₱945.46, SPECIAL ₱1,090.90 (150%), special working day / no holiday ₱945.45 (130%); the list row names the holiday (audit ot-holiday-06, H round 2)',
  run:async()=>{
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    const H=o=>localStorage.setItem('hydroPro_ph_holidays',JSON.stringify(o));
    const price=d=>(typeof window.hnxWkPriceFor==='function')?window.hnxWkPriceFor(ann,d):{}; /* guarded, so the list check below still runs on a build without it */
    H({'2026-08-16':{name:'Test Regular Holiday',kind:'regular'}});const rg=price('2026-08-16');
    const half=(typeof window.hnxWkPriceFor==='function')?window.hnxWkPriceFor(ann,'2026-08-16',0.5):{};
    H({'2026-08-16':{name:'Test Special Holiday',kind:'special'}});const sp=price('2026-08-16');
    H({'2026-08-16':{name:'Test Special Working Day',kind:'special_working'}});const sw=price('2026-08-16');
    H({});const no=price('2026-08-16');
    /* the list itself only shows the last 10 weeks, so its row is checked on a Sunday about three weeks back,
       made a regular holiday, against what the signed engine line pays for it */
    const base=new Date(today+'T00:00:00');base.setDate(base.getDate()-21);while(base.getDay()!==0)base.setDate(base.getDate()-1);
    const sun=ymd(base);H({[sun]:{name:'Test Regular Holiday',kind:'regular'}});
    const a={};a[sun]={ANN:rec('present','07:00','17:00')};setA(a);localStorage.setItem('hydroPro_payroll_runs','[]');
    localStorage.setItem('hydroPro_weekend_approvals_v1',JSON.stringify({['ANN|'+sun]:{acct:'ok',acctBy:'jinky',acctAt:1,final:'ok',finalBy:'eyal',finalAt:1}}));
    const p=getSemiMonthPeriod(sun);const l=calcEmployeePayroll(ann,p.start,p.end,'semi_monthly');
    const signedPays=Math.round((l.sundayPremium+l.holidayPay)*100)/100;
    let host=document.getElementById('hrWeekendBody');if(!host){host=document.createElement('div');host.id='hrWeekendBody';document.body.appendChild(host);}
    window._hnxWkRender();
    const txt=(host.textContent||'').replace(/\s+/g,' ');host.remove();
    const fmt='₱'+signedPays.toLocaleString('en-PH',{minimumFractionDigits:2});
    return {rg:rg.pay,rgPct:rg.hol&&rg.hol.totalPct,half:half.pay,sp:sp.pay,spPct:sp.hol&&sp.hol.totalPct,sw:sw.pay,swHol:sw.hol,no:no.pay,
            list:{names:/Test Regular Holiday \(regular holiday\) = 260%/.test(txt),sameAsPaid:txt.indexOf(fmt)>=0,notJust130:signedPays>+(l.dailyRate*1.3).toFixed(2)}};},
  expect:{rg:1890.9,rgPct:260,half:945.46,sp:1090.9,spPct:150,sw:945.45,swHol:null,no:945.45,'list.names':true,'list.sameAsPaid':true,'list.notJust130':true} },

/* ---------- ot-holiday-07: a HALF DAY on a holiday ---------- */
{ name:'office ₱16,000/month, 11–25 Aug 2026: SPECIAL 21 Aug worked as a half day = basic ₱8,000.00 + premium ₱109.09 = ₱8,109.09 (was ₱7,854.55; staying home ₱8,000.00, whole day ₱8,218.18), days 11, no day gap (audit ot-holiday-07)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-21':{name:'Ninoy Aquino Day',kind:'special'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({});const home=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    setA({'2026-08-21':{ANN:rec('present','07:00','17:30')}});const whole=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    setA({'2026-08-21':{ANN:rec('present','07:00','12:00','manual',{dayFraction:0.5,editedBy:'jinky'})}});
    const half=calcEmployeePayroll(ann,'2026-08-11','2026-08-25','semi_monthly');
    return {home:home.grossPay,whole:whole.grossPay,half:{basic:half.basicPay,hol:half.holidayPay,gross:half.grossPay,days:half.daysWorked,absA:half.daysAbsentAuth,gap:half.daysGap}};},
  expect:{home:8000,whole:8218.18,'half.basic':8000,'half.hol':109.09,'half.gross':8109.09,'half.days':11,'half.absA':0,'half.gap':0} },

{ name:'office ₱16,000/month, 26 Aug–10 Sep 2026: REGULAR 31 Aug worked as a half day = basic ₱8,000.00 + premium ₱363.64 = ₱8,363.64, the unworked half is a paid holiday half (Auth 0.5), no day gap (audit ot-holiday-07)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);
    setA({'2026-08-31':{ANN:rec('present','07:00','12:00','manual',{dayFraction:0.5,editedBy:'jinky'})}});
    const h=calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly');
    return {rate:Math.round(h.dailyRate*100)/100,basic:h.basicPay,hol:h.holidayPay,gross:h.grossPay,days:h.daysWorked,absA:h.daysAbsentAuth,gap:h.daysGap};},
  expect:{rate:727.27,basic:8000,hol:363.64,gross:8363.64,days:11.5,absA:0.5,gap:0} },

{ name:'weekly Regular labourer ₱500/day: half day on SPECIAL Fri 21 Aug = ₱250 + ₱75 = ₱325.00 (was ₱400); half day on REGULAR Mon 31 Aug = ₱250 + ₱250 premium + ₱250 unworked half = ₱750.00 (unchanged); no day gap (audit ot-holiday-07)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-21':{name:'Ninoy Aquino Day',kind:'special'},'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const jo=labour('JO','JO',{dailyRate:500});setE([jo]);
    const half=rec('present','07:00','12:00','manual',{dayFraction:0.5,editedBy:'jinky'});
    setA({'2026-08-21':{JO:half},'2026-08-31':{JO:half}});
    const sp=calcEmployeePayroll(jo,'2026-08-20','2026-08-26','weekly');
    const rg=calcEmployeePayroll(jo,'2026-08-27','2026-09-02','weekly');
    return {sp:{basic:sp.basicPay,hol:sp.holidayPay,day:sp.basicPay+sp.holidayPay,gap:sp.daysGap},rg:{basic:rg.basicPay,hol:rg.holidayPay,day:rg.basicPay+rg.holidayPay,gap:rg.daysGap}};},
  expect:{'sp.basic':250,'sp.hol':75,'sp.day':325,'sp.gap':0,'rg.basic':250,'rg.hol':500,'rg.day':750,'rg.gap':0} },

/* ---------- ot-holiday-08: 'paid when NOT worked' means a % only on weekly pay ---------- */
{ name:'"paid when NOT worked" set to 50%: weekly ₱500/day gets ₱250.00 for unworked 31 Aug, office ₱16,000/month stays ₱8,000.00 (monthly basic already holds the holiday) - and the Holidays screen says so and flags the 50% (audit ot-holiday-08)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.setItem('hydroPro_pay_holiday_policy_v1',JSON.stringify({regular:{unworked:50,worked:100}}));
    const jo=labour('JO','JO',{dailyRate:500});const ann=office('ANN','ANN',{monthlyBasic:16000});setE([jo,ann]);setA({});
    const wk=calcEmployeePayroll(jo,'2026-08-27','2026-09-02','weekly');
    const of=calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly');
    const old=document.getElementById('hnxHolidayOverlay');if(old)old.remove();
    hnxHolidays();await sleep(200);
    const note=((document.getElementById('hnxHolRestNote')||{}).innerText||'').replace(/\s+/g,' ');
    const ov=document.getElementById('hnxHolidayOverlay');if(ov)ov.remove();
    return {wkHol:wk.holidayPay,ofBasic:of.basicPay,weeklyOnly:/weekly labour/.test(note)&&/Office/.test(note),restDay:/260%/.test(note)&&/150%/.test(note),flag:/Unusual/.test(note)&&/regular 50%/.test(note)};},
  expect:{wkHol:250,ofBasic:8000,weeklyOnly:true,restDay:true,flag:true} },

/* ---------- ot-holiday-09: the payslip's Basic line multiplies out ---------- */
{ name:'payslip, office ₱16,000/month, 26 Aug–10 Sep 2026 with 31 Aug unworked: "Basic Pay (11 regular days × ₱727.2727) ₱8,000.00" (was 12 days) + the regular holiday shown as included; the designed print and the line view say 11 too; an old run without basicDays prints 11 as well (audit ot-holiday-09)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays',JSON.stringify({'2026-08-31':{name:'National Heroes Day',kind:'regular'}}));
    localStorage.removeItem('hydroPro_pay_holiday_policy_v1');
    const ann=office('ANN','ANN',{monthlyBasic:16000});setE([ann]);setA({});
    try{if(Array.isArray(window.employees)){window.employees.length=0;window.employees.push(ann);}}catch(e){}
    const line=calcEmployeePayroll(ann,'2026-08-26','2026-09-10','semi_monthly');
    const oldLine=Object.assign({},line);delete oldLine.basicDays;
    const runs=[{id:'office_2026-08-26_2026-09-10',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:1,approvedBy:'eyal',lines:[line],totals:{}},
                {id:'office_old',type:'semi_monthly',periodStart:'2026-08-26',periodEnd:'2026-09-10',status:'approved',approvedAt:1,approvedBy:'eyal',lines:[oldLine],totals:{}}];
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify(runs));
    const slipTxt=async id=>{payShowPayslip(id,'ANN');await sleep(300);return ((document.getElementById('payslipBody')||{}).innerText||'').replace(/\s+/g,' ');};
    const t=await slipTxt('office_2026-08-26_2026-09-10');
    const b=t.slice(t.indexOf('Basic Pay'),t.indexOf('Basic Pay')+60);
    const hol=/Regular holiday \(1 day\)[^₱]*included/.test(t);
    const t2=await slipTxt('office_old');const b2=t2.slice(t2.indexOf('Basic Pay'),t2.indexOf('Basic Pay')+45);
    /* the designed print: capture the document it writes instead of opening a window */
    let cap='';const wo=window.open;
    window.open=()=>({document:{write:s=>{cap=s;},close:()=>{},getElementById:()=>null},focus:()=>{},print:()=>{}});
    try{window._lastPayslipCtx={runId:'office_2026-08-26_2026-09-10',empId:'ANN'};hnxPrintPayslip();}finally{window.open=wo;}
    const pm=(cap.match(/Basic Pay — [^<]*/)||[''])[0];
    /* the staff line view */
    window._payOfficeCurrentPeriod={start:'2026-08-26',end:'2026-09-10',label:'26 Aug – 10 Sep'};
    openPayrollLine('office_2026-08-26_2026-09-10','ANN','semi_monthly');await sleep(300);
    const lt=((document.getElementById('payrollLineBody')||{}).innerText||'').replace(/\s+/g,' ');
    const lv=lt.slice(lt.indexOf('Basic Pay'),lt.indexOf('Basic Pay')+40);
    return {basicDays:line.basicDays,slip:b.replace(/\s*₱8,000\.00.*/,' ₱8,000.00'),holRow:hol,old:b2.slice(0,b2.indexOf(')')+1),
      print:/^Basic Pay — 11 regular day\(s\) × ₱727\.2727/.test(pm)&&/already inside this half-month/.test(pm),line:lv.slice(0,lv.indexOf('×')+1)};},
  expect:{basicDays:11,slip:'Basic Pay (11 regular days × ₱727.2727) ₱8,000.00',holRow:true,old:'Basic Pay (11 regular days × ₱727.2727)',print:true,line:'Basic Pay (11 day(s) ×'} },

{ name:'payslip, weekly contractor ₱658/day, 7 days incl. a Sunday: "Basic Pay (7 regular days × ₱658.00) ₱4,606.00" (was 6 days beside ₱4,606.00) (audit ot-holiday-09)',
  run:async()=>{
    localStorage.setItem('hydroPro_ph_holidays','{}');
    const e=labour('ERIC','ERIC',{employmentType:'Contractor'});setE([e]);const a={};
    ['2026-09-10','2026-09-11','2026-09-12','2026-09-13','2026-09-14','2026-09-15','2026-09-16'].forEach(d=>{a[d]={ERIC:rec('present','07:00','17:00')};});setA(a);
    try{if(Array.isArray(window.employees)){window.employees.length=0;window.employees.push(e);}}catch(x){}
    const line=calcEmployeePayroll(e,'2026-09-10','2026-09-16','weekly');
    localStorage.setItem('hydroPro_payroll_runs',JSON.stringify([{id:'ops_2026-09-10_2026-09-16',type:'weekly',periodStart:'2026-09-10',periodEnd:'2026-09-16',status:'approved',approvedAt:1,approvedBy:'eyal',lines:[line],totals:{}}]));
    payShowPayslip('ops_2026-09-10_2026-09-16','ERIC');await sleep(300);
    const t=((document.getElementById('payslipBody')||{}).innerText||'').replace(/\s+/g,' ');
    const b=t.slice(t.indexOf('Basic Pay'),t.indexOf('Basic Pay')+60);
    return {basicDays:line.basicDays,slip:b.replace(/\s*₱4,606\.00.*/,' ₱4,606.00')};},
  expect:{basicDays:7,slip:'Basic Pay (7 regular days × ₱658.00) ₱4,606.00'} },
];
