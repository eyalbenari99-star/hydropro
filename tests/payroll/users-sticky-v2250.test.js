/* v22.50 (Eyal, 11 Oct 2026, screenshot of Administration ▸ Users: "how come all set up in details what to give access gone?").
   Nothing was gone: since v21.73 the Users table scrolls sideways (≈1,800 px in a ≈1,050–1,200 px box at a 1512 laptop), so the
   Actions column — ✏️ Edit (permissions), 🔎 Access, 🧭 Assistant, 💰, Block — always started off-screen to the right. The username
   and the Actions are now pinned to the two edges of the table's box; the middle columns scroll between them. */
const SEED=()=>{localStorage.setItem('hydroPro_users',JSON.stringify([
  {username:'tester',fullname:'Tester',passwordHash:'x',role:'admin',active:true},
  {username:'meajeanm',fullname:'Meajean Magracia',passwordHash:'x',role:'supervisor',active:true,email:'meajeanm@abapardes.com.ph'},
  {username:'Jinkyp',fullname:'Jinky S. Pagtama',passwordHash:'x',role:'admin_secondary',active:true,allDepts:true,email:'jinkyp@abapardes.com.ph'},
  {username:'Rea-Jane',fullname:'Gaco',passwordHash:'x',role:'supervisor',active:true,mustChangePassword:true,email:'reag@abapardes.com.ph'},
  {username:'oldstaff',fullname:'Old Staff',passwordHash:'x',role:'operator',active:false}]));};
module.exports=[
{ name:'👥 Users at the 1512 laptop (Eyal 11 Oct: "access gone?"): with 5 users the table still scrolls sideways, but on every row ✏️ Edit, 🔎 Access and 🧭 Assistant and all 9 action buttons are inside the box at the start AND after scrolling to the end; the username (incl. "🔑 Must change pw" under it) stays visible at both ends; rows ≤ 110 px; the Actions cell ≥ 440 px (v21.73 layout kept); a blocked user\'s row is still dimmed',
  viewport:{width:1512,height:982}, seed:SEED,
  run:new Function(`return (async()=>{await sleep(4000);switchView('users');await sleep(2500);
    const t=document.getElementById('usersTable'),box=t.closest('.users-table-wrap'),B=box.getBoundingClientRect();
    const inBox=e=>{if(!e)return false;const q=e.getBoundingClientRect();return q.width>0&&q.left>=B.left-1&&q.right<=B.right+1;};
    const rows=[...t.querySelectorAll('tbody tr')];
    const key=tr=>{const b=[...tr.querySelectorAll('.user-actions > button')];const want=b.filter(x=>/Edit|Access|Assistant/.test(x.textContent));
      return [b.filter(inBox).length,b.length,want.length===3&&want.every(inBox),inBox(tr.children[0].querySelector('strong'))];};
    const scrolls=box.scrollWidth>box.clientWidth+20;
    const start=rows.map(key);box.scrollLeft=box.scrollWidth;await sleep(300);const end=rows.map(key);box.scrollLeft=0;
    const all=a=>a.every(k=>k[0]===k[1]&&k[1]>=7&&k[2]&&k[3]);
    const flag=rows[3].children[0].querySelector('span');const fl=flag?getComputedStyle(flag).display:'';
    const blocked=rows[4].classList.contains('blocked')&&+getComputedStyle(rows[4].lastElementChild.firstElementChild).opacity<1;
    return {rows:rows.length,scrolls,start:all(start),end:all(end),flagUnder:fl==='block',short:Math.max(...rows.map(r=>r.getBoundingClientRect().height))<=110,
      wide:Math.min(...rows.map(r=>r.lastElementChild.getBoundingClientRect().width))>=440,blocked};})();`),
  expect:{rows:5,scrolls:true,start:true,end:true,flagUnder:true,short:true,wide:true,blocked:true} }
];
