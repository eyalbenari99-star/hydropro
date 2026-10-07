/* v22.07: nothing rebuilds the call buttons on the login page */
module.exports=[
{ name:'🔐 Login v22.07: signed-out → __hnxSignedIn() is false and the call injector loop skips; signed-in → true (v22.07)',
  run:async()=>{await sleep(2000);const sv=sessionStorage.getItem('hydroPro_session');sessionStorage.removeItem('hydroPro_session');const out=window.__hnxSignedIn();if(sv)sessionStorage.setItem('hydroPro_session',sv);else sessionStorage.setItem('hydroPro_session','{"username":"x"}');const inn=window.__hnxSignedIn();return {out,inn};},
  expect:{out:false,inn:true} }
];
