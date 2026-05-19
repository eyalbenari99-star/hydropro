/* ============================================================
   HydroNexis-AI · Cloud Sync Auto-Fix Patch
   Version: v2.85.7b-cloudfix
   Date:    2026-05-19
   ------------------------------------------------------------
   FIX from v2.85.7a:
     - Uses the REAL worker routes from the in-app cloud-js code:
         POST /auth/login   → returns token
         POST /sync/push    → uploads localStorage hydroPro_* keys
         GET  /sync/pull    → returns same shape
     - Auth = Bearer <session-token>, NOT direct API key
     - If hnx_cloud_token already exists → uses it (silent)
     - If missing → prompts ONCE for cloud password, logs in,
       saves token, then tests
     - Push payload format: {data:{...}}, matching real code

   Safe to use:
     - Does NOT change app data
     - Does NOT modify the existing in-app cloud sync system
     - Adds a top banner with result
     - Auto-hides green banner after 10s

   Install (already done in index.html v2.85.7-cloudfix):
     <script src="hnx-cloud-fix.js?v=2.85.7b"></script>
   ============================================================ */

(function () {
  'use strict';

  const PATCH_VERSION = 'v2.85.7b-cloudfix';
  const WORKER_URL    = 'https://hnx-sync.eyalbenari99.workers.dev';
  const CLOUD_USER    = 'eyal';
  const TOK_KEY       = 'hnx_cloud_token';
  const LAST_KEY      = 'hnx_cloud_last';

  const log  = function () { console.log.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };
  const warn = function () { console.warn.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };
  const err  = function () { console.error.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };

  // ---------- Banner ----------
  function showBanner(message, type, details, extraButtons) {
    const colors = {
      ok:   { bg: '#0d4d2a', border: '#22c55e', text: '#bbf7d0' },
      fail: { bg: '#4d0d0d', border: '#ef4444', text: '#fecaca' },
      info: { bg: '#0d2a4d', border: '#3b82f6', text: '#bfdbfe' },
      warn: { bg: '#4d3a0d', border: '#f59e0b', text: '#fde68a' }
    };
    const c = colors[type] || colors.info;

    const old = document.getElementById('hnx-cloud-fix-banner');
    if (old) old.remove();

    const banner = document.createElement('div');
    banner.id = 'hnx-cloud-fix-banner';
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:999999;' +
      'background:' + c.bg + ';color:' + c.text + ';' +
      'border-bottom:2px solid ' + c.border + ';' +
      'padding:10px 16px;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;' +
      'font-size:13px;text-align:center;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.4);';

    const detailsHtml = details
      ? '<div style="margin-top:6px;font-size:11px;opacity:0.85;">' + details + '</div>'
      : '';

    let extraHtml = '';
    if (extraButtons && extraButtons.length) {
      extraHtml = '<div style="margin-top:8px;">';
      for (let i = 0; i < extraButtons.length; i++) {
        const b = extraButtons[i];
        extraHtml += '<button data-act="' + b.id + '" ' +
          'style="background:transparent;border:1px solid ' + c.border + ';' +
          'color:' + c.text + ';padding:4px 14px;border-radius:4px;' +
          'cursor:pointer;margin:0 4px;font-family:inherit;font-size:12px;font-weight:600;">' +
          b.label + '</button>';
      }
      extraHtml += '</div>';
    }

    banner.innerHTML =
      '<div>' +
        '<span style="font-weight:600">[Cloud Fix ' + PATCH_VERSION + ']</span>' +
        '&nbsp;' + message +
        '&nbsp;&nbsp;' +
        '<button id="hnx-cloud-fix-close" ' +
          'style="background:transparent;border:1px solid ' + c.border + ';' +
          'color:' + c.text + ';padding:2px 10px;border-radius:4px;' +
          'cursor:pointer;margin-left:8px;font-family:inherit;font-size:12px;">' +
          'Dismiss' +
        '</button>' +
      '</div>' +
      detailsHtml +
      extraHtml;

    document.body.appendChild(banner);

    document.getElementById('hnx-cloud-fix-close').onclick = function () {
      banner.remove();
    };

    if (extraButtons && extraButtons.length) {
      banner.querySelectorAll('button[data-act]').forEach(function (btn) {
        btn.onclick = function () {
          const act = btn.getAttribute('data-act');
          const handler = extraButtons.find(function (b) { return b.id === act; });
          if (handler && typeof handler.onClick === 'function') handler.onClick();
        };
      });
    }

    if (type === 'ok') {
      setTimeout(function () {
        const b = document.getElementById('hnx-cloud-fix-banner');
        if (b) b.remove();
      }, 10000);
    }
  }

  // ---------- API helper ----------
  function api(path, opts) {
    opts = opts || {};
    const h = opts.headers || {};
    const t = localStorage.getItem(TOK_KEY);
    if (t && !h['Authorization']) h['Authorization'] = 'Bearer ' + t;
    if (opts.body && !h['Content-Type']) h['Content-Type'] = 'application/json';
    return fetch(WORKER_URL + path, {
      method: opts.method || 'GET',
      headers: h,
      body: opts.body
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) {
          const e = new Error(d.error || ('HTTP ' + r.status));
          e.status = r.status;
          throw e;
        }
        return d;
      }).catch(function (parseErr) {
        // Not JSON — read as text
        return r.text().then(function (text) {
          if (!r.ok) {
            const e = new Error('HTTP ' + r.status + ' — ' + text.slice(0, 100));
            e.status = r.status;
            throw e;
          }
          return text;
        });
      });
    });
  }

  // ---------- Health check ----------
  async function healthCheck() {
    const res = await fetch(WORKER_URL + '/health');
    if (!res.ok) throw new Error('Health HTTP ' + res.status);
    return res.json();
  }

  // ---------- Login ----------
  async function loginCloud(username, password) {
    log('Attempting login as', username);
    const res = await api('/auth/login', {
      method: 'POST',
      headers: { 'Authorization': '' }, // clear any stale token
      body: JSON.stringify({ username: username, password: password })
    });
    if (!res.token) throw new Error('Login succeeded but no token returned');
    localStorage.setItem(TOK_KEY, res.token);
    log('Login OK. Token saved.');
    return res;
  }

  // ---------- Push ----------
  async function testPush() {
    // Collect a SAMPLE of real hydroPro_ keys (don't sync everything in test)
    const data = {};
    let count = 0;
    for (let i = 0; i < localStorage.length && count < 3; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('hydroPro_') === 0 &&
          k.indexOf('hydroPro_session') !== 0 &&
          k.indexOf('hydroPro_biometric') !== 0 &&
          k.indexOf('hydroPro_audit') !== 0) {
        data[k] = localStorage.getItem(k);
        count++;
      }
    }
    // Also add a marker so we know cloudfix tested
    data['hydroPro_cloudfix_lasttest'] = JSON.stringify({
      ts: new Date().toISOString(),
      patch: PATCH_VERSION
    });

    log('Pushing', Object.keys(data).length, 'keys (sample test)');
    const res = await api('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ data: data })
    });
    localStorage.setItem(LAST_KEY, new Date().toISOString());
    return res;
  }

  // ---------- Pull ----------
  async function testPull() {
    log('Pulling');
    return api('/sync/pull');
  }

  // ---------- Main ----------
  async function main() {
    log('Starting cloud-fix patch ' + PATCH_VERSION);

    if (!document.body) {
      await new Promise(function (resolve) {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    showBanner('Running cloud sync self-test…', 'info');

    // 1. Health check (no auth)
    let healthData;
    try {
      healthData = await healthCheck();
      log('Health OK:', healthData);
    } catch (e) {
      err('Health check failed:', e);
      showBanner('❌ Cloud worker unreachable.', 'fail',
        'Cause: ' + String(e) + '<br>Worker URL: ' + WORKER_URL);
      return;
    }

    // 2. Check for existing token
    const existingToken = localStorage.getItem(TOK_KEY);
    if (!existingToken) {
      log('No token in localStorage.');
      showBanner('⚠️ Cloud sync not configured on this browser.', 'warn',
        'No saved session token. You need to log in to cloud sync once.' +
        '<br>This sets up cloud sync for this browser. Done only once per device.',
        [{
          id: 'login',
          label: '🔑 Log in to Cloud Sync',
          onClick: function () {
            promptLogin();
          }
        }]);
      return;
    }

    // 3. Test push with existing token
    log('Using existing token. Testing push…');
    try {
      await testPush();
      log('Push OK');
    } catch (e) {
      err('Push failed:', e);
      if (e.status === 401) {
        // Token expired — clear and prompt fresh login
        localStorage.removeItem(TOK_KEY);
        showBanner('⚠️ Cloud session expired.', 'warn',
          'Your saved token is no longer valid. Please log in again.',
          [{
            id: 'login',
            label: '🔑 Log in Again',
            onClick: function () { promptLogin(); }
          }]);
        return;
      }
      showBanner('❌ Push failed.', 'fail',
        'Cause: ' + String(e) + '<br>Token exists but push was rejected.');
      return;
    }

    // 4. Test pull
    try {
      const pullRes = await testPull();
      const keys = pullRes && pullRes.data ? Object.keys(pullRes.data).length : 0;
      log('Pull OK,', keys, 'keys returned');

      const ver = (healthData && healthData.version) || '?';
      showBanner('✅ Cloud sync OK — push & pull both working',
        'ok',
        'Worker v' + ver +
        ' · token valid · ' + keys + ' keys in cloud' +
        '<br>auto-hides in 10s');
    } catch (e) {
      err('Pull failed:', e);
      showBanner('⚠️ Push OK but PULL failed.', 'fail',
        'Cause: ' + String(e));
    }
  }

  // ---------- Login dialog ----------
  function promptLogin() {
    const banner = document.getElementById('hnx-cloud-fix-banner');
    if (banner) banner.remove();

    const overlay = document.createElement('div');
    overlay.id = 'hnx-cloud-fix-login';
    overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999998;' +
      'background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';

    overlay.innerHTML =
      '<div style="background:#0a1f0a;border:1px solid #22c55e;border-radius:8px;' +
        'padding:24px;max-width:380px;width:90%;color:#bbf7d0;' +
        'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">' +
        '<h3 style="margin:0 0 16px;color:#a5d6a7;">🔑 Cloud Sync Login</h3>' +
        '<div style="margin-bottom:12px;font-size:12px;opacity:0.85;">' +
          'One-time setup for this browser. Use the same cloud credentials you set on 2026-05-18.' +
        '</div>' +
        '<label style="display:block;margin-bottom:4px;font-size:11px;">Username</label>' +
        '<input id="cf-user" value="' + CLOUD_USER + '" ' +
          'style="width:100%;padding:8px;background:#0a1f0a;border:1px solid #388e3c;' +
          'color:#bbf7d0;border-radius:4px;margin-bottom:12px;font-family:inherit;" />' +
        '<label style="display:block;margin-bottom:4px;font-size:11px;">Password</label>' +
        '<input id="cf-pass" type="password" placeholder="cloud password" ' +
          'style="width:100%;padding:8px;background:#0a1f0a;border:1px solid #388e3c;' +
          'color:#bbf7d0;border-radius:4px;margin-bottom:16px;font-family:inherit;" />' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="cf-submit" style="flex:1;padding:10px;background:#388e3c;' +
            'border:none;color:#0a1f0a;border-radius:4px;cursor:pointer;font-weight:700;' +
            'font-family:inherit;">Log in</button>' +
          '<button id="cf-cancel" style="padding:10px 16px;background:transparent;' +
            'border:1px solid #388e3c;color:#bbf7d0;border-radius:4px;cursor:pointer;' +
            'font-family:inherit;">Cancel</button>' +
        '</div>' +
        '<div id="cf-msg" style="margin-top:12px;font-size:11px;min-height:16px;"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    document.getElementById('cf-cancel').onclick = function () {
      overlay.remove();
    };

    const passInput = document.getElementById('cf-pass');
    passInput.focus();
    passInput.onkeydown = function (e) {
      if (e.key === 'Enter') document.getElementById('cf-submit').click();
    };

    document.getElementById('cf-submit').onclick = async function () {
      const u = document.getElementById('cf-user').value.trim();
      const p = document.getElementById('cf-pass').value;
      const msg = document.getElementById('cf-msg');
      if (!u || !p) {
        msg.textContent = 'Username and password required.';
        msg.style.color = '#fde68a';
        return;
      }
      msg.textContent = 'Logging in…';
      msg.style.color = '#bfdbfe';

      try {
        await loginCloud(u, p);
        msg.textContent = '✓ Logged in. Testing push…';
        await testPush();
        msg.textContent = '✓ Push OK. Testing pull…';
        await testPull();
        msg.textContent = '✓ All OK!';
        msg.style.color = '#bbf7d0';
        setTimeout(function () {
          overlay.remove();
          showBanner('✅ Cloud sync OK — login + push + pull all working',
            'ok',
            'Token saved. Future loads will auto-sync silently.<br>auto-hides in 10s');
        }, 800);
      } catch (e) {
        err('Login flow failed:', e);
        msg.textContent = '❌ ' + (e.message || 'Failed');
        msg.style.color = '#fecaca';
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main, { once: true });
  } else {
    main();
  }

  window.HNX_CloudFix = {
    version: PATCH_VERSION,
    rerun:   main,
    push:    testPush,
    pull:    testPull,
    health:  healthCheck,
    login:   promptLogin
  };
})();
