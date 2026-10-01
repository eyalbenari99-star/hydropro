/* v21.34 (Eyal, 1 Oct 2026): qb-api retirement bridge — old Accounting calls go to nexi-qb; failure cool-down; in-flight sharing */
module.exports=[
{ name:'🧮 QB bridge: an old qb-api trial-balance call is rewritten to nexi-qb /qb/report?realm=123145713380624&name=TrialBalance&raw=1 with the Bearer token and the same dates; /api/qb/customers goes to /qb/customers (v21.34)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_qbw_cfg_v1',JSON.stringify({url:'https://nexi-qb.test.workers.dev/',token:'tok-123',at:Date.now()}));
    window.__hnxQbBridgeReset();const seen=[];
    window.__hnxQbBridgeBase=function(u,o){seen.push({u:String(u),auth:o&&o.headers&&o.headers.Authorization});return Promise.resolve(new Response('{"Header":{},"Rows":{}}',{status:200,headers:{'Content-Type':'application/json'}}));};
    const r=await fetch('https://qb-api.eyalbenari99.workers.dev/api/qb/apti/trial-balance?start_date=2026-01-01&end_date=2026-01-31',{headers:{'x-api-key':'old'}});
    const j=await r.json();
    await fetch('https://qb-api.eyalbenari99.workers.dev/api/qb/customers',{headers:{'x-api-key':'old'}});
    const q=new URL(seen[0].u);
    return {ok:r.ok,hasRows:'Rows' in j,host:q.host,path:q.pathname,realm:q.searchParams.get('realm'),name:q.searchParams.get('name'),raw:q.searchParams.get('raw'),start:q.searchParams.get('start_date'),auth:seen[0].auth,cust:seen[1].u};},
  expect:{ok:true,hasRows:true,host:'nexi-qb.test.workers.dev',path:'/qb/report',realm:'123145713380624',name:'TrialBalance',raw:'1',start:'2026-01-01',auth:'Bearer tok-123',cust:'https://nexi-qb.test.workers.dev/qb/customers?realm=123145713380624'} },

{ name:'🧮 QB bridge guards: a failing report is asked once (nexi-qb then the old bridge = 2 network calls), the next 20 calls within 10 minutes reach the network 0 times and get 503; three concurrent calls for one report make 1 network call (v21.34)',
  run:async()=>{
    await sleep(2500);
    localStorage.setItem('hydroPro_qbw_cfg_v1',JSON.stringify({url:'https://nexi-qb.test.workers.dev',token:'tok-123',at:Date.now()}));
    window.__hnxQbBridgeReset();let net=0;
    window.__hnxQbBridgeBase=function(){net++;return Promise.resolve(new Response('{"error":"unauthorized"}',{status:401}));};
    const U='https://qb-api.eyalbenari99.workers.dev/api/qb/apac/profit-loss?start_date=2026-02-01&end_date=2026-02-28';
    const first=await fetch(U,{headers:{'x-api-key':'old'}});const afterFirst=net;
    let st=0;for(let i=0;i<20;i++){const r=await fetch(U,{headers:{'x-api-key':'old'}});st=r.status;}
    const afterBurst=net;
    /* in-flight sharing on a healthy report */
    window.__hnxQbBridgeReset();net=0;
    window.__hnxQbBridgeBase=function(){net++;return new Promise(res=>setTimeout(()=>res(new Response('{"Rows":{}}',{status:200})),150));};
    const U2='https://qb-api.eyalbenari99.workers.dev/api/qb/apti/balance-sheet?start_date=2026-03-01&end_date=2026-03-31';
    const rs=await Promise.all([fetch(U2),fetch(U2),fetch(U2)]);const bodies=await Promise.all(rs.map(r=>r.json()));
    /* a nexi-qb without raw=1 answers 200 in the flattened shape → falls back to the old bridge once, then cools down */
    window.__hnxQbBridgeReset();net=0;const urls=[];
    window.__hnxQbBridgeBase=function(u){net++;urls.push(String(u));return Promise.resolve(new Response(urls.length===1?'{"ok":true,"rows":[]}':'{"error":"gone"}',{status:urls.length===1?200:410}));};
    const U3='https://qb-api.eyalbenari99.workers.dev/api/qb/apti/cash-flow?start_date=2026-01-01&end_date=2026-12-31';
    const r3=await fetch(U3);await fetch(U3);
    /* a healthy report asked twice within 30 s is answered from the first reply */
    window.__hnxQbBridgeReset();net=0;
    window.__hnxQbBridgeBase=function(){net++;return Promise.resolve(new Response('{"Rows":{}}',{status:200}));};
    const U4='https://qb-api.eyalbenari99.workers.dev/api/qb/apti/aged-payables?start_date=2026-01-01&end_date=2026-01-31';
    for(let i=0;i<5;i++)await fetch(U4);
    return {firstStatus:first.status,afterFirst,afterBurst,burstStatus:st,sharedNet:net>=1&&net<=1,allOk:bodies.every(b=>'Rows' in b),flatFallback:urls.length===2&&/qb-api\.eyalbenari99/.test(urls[1]),flatStatus:r3.status,heldNet:net};},
  expect:{firstStatus:401,afterFirst:2,afterBurst:2,burstStatus:503,sharedNet:true,allOk:true,flatFallback:true,flatStatus:410,heldNet:1} },
];
