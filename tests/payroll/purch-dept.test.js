/* v21.53 (Eyal): Purchasing Workspace — Department is a dropdown with every department; the tab bar is never folded */
module.exports=[
{ name:'🛒 Purchasing request form: Department is a <select> that lists Construction, Projects, Purchasing, Accounting and Production; picking Construction stores it on the draft; after 6 s the 10 workflow tabs + Quick tools are still visible (no "All tools (9)…" picker) (v21.53)',
  seed:()=>{localStorage.setItem('hydroPro_users',JSON.stringify([{username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true}]));},
  run:new Function(`return (async()=>{await sleep(4000);switchView('acct_purch_pro');await sleep(600);__PURPRO.tab('prs');await sleep(200);__PURPRO.newPR();await sleep(300);
    const v=document.getElementById('view-acct_purch_pro');const sel=[...v.querySelectorAll('select.pp-in')].find(x=>[...x.options].some(o=>o.value==='Construction'));
    const opts=sel?[...sel.options].map(o=>o.value):[];sel.value='Construction';sel.dispatchEvent(new Event('change'));
    await sleep(6500);const nav=v.querySelector('.pp-nav');const tabs=nav?[...nav.querySelectorAll('button')].filter(b=>b.offsetParent!==null).length:0;const picker=!!v.querySelector('.hnx-tbsel');
    return {isSelect:!!sel,has:['Construction','Projects','Purchasing','Accounting','Production'].every(x=>opts.includes(x)),stored:(function(){renderPurchPro();var s2=[...v.querySelectorAll('select.pp-in')].find(x=>[...x.options].some(o=>o.value==='Construction'));return s2?s2.value:'(n/a)';})(),tabs,picker};})();`),
  expect:{isSelect:true,has:true,stored:'Construction',tabs:10,picker:false} },
];
