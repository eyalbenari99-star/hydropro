/* Shared by the Production test files whose seed raises items at a fixed hour of "today" (08:15) — CI fix, Oct 2026.
   The app escalates / counts as missed what has stood unanswered for hours (a warning → critical after ~8 h, the daily SOP checks
   after their cut-off), so those cases were only right between ~09:00 and ~16:15 local time. GitHub's runner is UTC: any run
   started after 16:15 UTC saw more criticals and "missed" SOP items (PR #560, CI at 17:15, 19:38 and 19:42 UTC).
   From 15:00 local on, the browser clock is moved back to 10:30 of the same local day (real time keeps running), BEFORE the seed
   reads it; earlier in the day nothing changes. No expectation changes. */
const PIN_CLOCK=`(function(){var R=Date,n0=R.now(),t=new R(n0);if(t.getHours()<15)return;var sh=new R(t.getFullYear(),t.getMonth(),t.getDate(),10,30,0,0).getTime()-n0;
  var D=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+sh);}static now(){return R.now()+sh;}};window.Date=D;
  try{var s=JSON.parse(sessionStorage.getItem('hydroPro_session')||'null');if(s&&s.loginAt){s.loginAt=D.now();sessionStorage.setItem('hydroPro_session',JSON.stringify(s));}}catch(e){}})();`;
/* a seed function that runs with the pinned clock (the harness stringifies seeds, so the pin is prepended as source text) */
const pinned=fn=>new Function(PIN_CLOCK+'('+fn.toString()+')();');
module.exports={PIN_CLOCK,pinned};
