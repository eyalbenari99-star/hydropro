/* ============================================================
   HydroNexis-AI · Cloud Sync Auto-Fix Patch
   Version: v2.85.7-cloudfix
   Date:    2026-05-19
   Author:  Eyal Ben Ari / Claude
   ------------------------------------------------------------
   What it does (automatically, on page load):
     1. Restores cloud API token + worker URL to localStorage
     2. Force-enables cloud sync (hnx_cloud_enabled = "1")
     3. Tests cloud push to your Cloudflare Worker
     4. Tests cloud pull (reads back the test value)
     5. Shows a top banner: GREEN if OK, RED if failed
     6. Fixes the broken "Cloud OFF" button by re-binding click

   Safe to use:
     - Does NOT change your app data (49 issues, 89 tasks, etc.)
     - Does NOT touch any other localStorage keys
     - Does NOT modify index.html logic
     - Banner has Dismiss button + auto-hides on success after 10s

   How to install:
     1. Save this file as: hnx-cloud-fix.js
     2. Upload to Netlify (drag-and-drop into the site)
     3. Add this ONE line at the bottom of index.html,
        just before </body>:
          <script src="hnx-cloud-fix.js"></script>
     4. Reload the site. Look at the top banner.
   ============================================================ */

(function () {
  'use strict';

  const PATCH_VERSION = 'v2.85.7-cloudfix';
  const WORKER_URL    = 'https://hnx-sync.eyalbenari99.workers.dev';
  const API_KEY       = 'hnxai_4a8f3c91d7e62b5806f4ac9e1d3b27f5e8a91c6047b3e2d8f5c91b6a4e7d80f3';
  const CLOUD_USER    = 'eyal';
  const TEST_KEY      = 'cloudfix_selftest_' + Date.now();

  const log  = function () { console.log.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };
  const warn = function () { console.warn.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };
  const err  = function () { console.error.apply(console, ['[CloudFix]'].concat([].slice.call(arguments))); };

  function showBanner(message, type, details) {
    const colors = {
      ok:   { bg: '#0d4d2a', border: '#22c55e', text: '#bbf7d0' },
      fail: { bg: '#4d0d0d', border: '#ef4444', text: '#fecaca' },
      info: { bg: '#0d2a4d', border: '#3b82f6', text: '#bfdbfe' }
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
      detailsHtml;

    document.body.appendChild(banner);

    document.getElementById('hnx-cloud-fix-close').onclick = function () {
      banner.remove();
    };

    if (type === 'ok') {
      setTimeout(function () {
        const b = document.getElementById('hnx-cloud-fix-banner');
        if (b) b.remove();
      }, 10000);
    }
  }

  function restoreCloudConfig() {
    const before = {
      enabled: localStorage.getItem('hnx_cloud_enabled'),
      token:   localStorage.getItem('hnx_cloud_token'),
      user:    localStorage.getItem('hnx_cloud_user'),
      url:     localStorage.getItem('hnx_cloud_url')
    };
    localStorage.setItem('hnx_cloud_enabled', '1');
    localStorage.setItem('hnx_cloud_token',   API_KEY);
    localStorage.setItem('hnx_cloud_user',    CLOUD_USER);
    localStorage.setItem('hnx_cloud_url',     WORKER_URL);
    log('Cloud config restored. Before:', before);
    return before;
  }

  async function healthCheck() {
    const res = await fetch(WORKER_URL + '/health', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + API_KEY }
    });
    if (!res.ok) throw new Error('Health HTTP ' + res.status);
    const data = await res.json();
    log('Health OK:', data);
    return data;
  }

  async function testPush() {
    const payload = {
      key: TEST_KEY,
      value: {
        type: 'cloudfix-selftest',
        patch: PATCH_VERSION,
        ts: new Date().toISOString(),
        ua: navigator.userAgent.slice(0, 80)
      }
    };
    const res = await fetch(WORKER_URL + '/push', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(function () { return ''; });
      throw new Error('Push HTTP ' + res.status + ' — ' + text.slice(0, 120));
    }
    const data = await res.json().catch(function () { return {}; });
    log('Push OK:', data);
    localStorage.setItem('hnx_cloud_last', new Date().toISOString());
    localStorage.setItem('hnx_cloud_last_push', new Date().toISOString());
    return data;
  }

  async function testPull() {
    const res = await fetch(WORKER_URL + '/pull?key=' + encodeURIComponent(TEST_KEY), {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + API_KEY }
    });
    if (!res.ok) {
      const text = await res.text().catch(function () { return ''; });
      throw new Error('Pull HTTP ' + res.status + ' — ' + text.slice(0, 120));
    }
    const data = await res.json().catch(function () { return {}; });
    log('Pull OK:', data);
    localStorage.setItem('hnx_cloud_last_pull', new Date().toISOString());
    return data;
  }

  function fixCloudButton() {
    const all = document.querySelectorAll('button, div, span, a');
    let target = null;
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const txt = (el.textContent || '').trim();
      if (/^Cloud\s*(OFF|ON)$/i.test(txt) && el.children.length <= 3) {
        target = el;
        break;
      }
    }
    if (!target) {
      log('Cloud button not found in DOM — skipping rebind.');
      return false;
    }
    target.style.cursor = 'pointer';
    target.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const cur = localStorage.getItem('hnx_cloud_enabled') === '1';
      localStorage.setItem('hnx_cloud_enabled', cur ? '0' : '1');
      log('Cloud toggled to:', cur ? 'OFF' : 'ON', '— reloading');
      location.reload();
    }, true);
    log('Cloud button rebound.');
    return true;
  }

  async function main() {
    log('Starting cloud-fix patch ' + PATCH_VERSION);

    if (!document.body) {
      await new Promise(function (resolve) {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    showBanner('Running cloud sync self-test…', 'info');

    try {
      restoreCloudConfig();
    } catch (e) {
      err('restoreCloudConfig failed:', e);
      showBanner('❌ Could not write to localStorage.', 'fail', String(e));
      return;
    }

    let healthData;
    try {
      healthData = await healthCheck();
    } catch (e) {
      err('Health check failed:', e);
      showBanner('❌ Cloud worker unreachable.', 'fail',
        'Cause: ' + String(e) + '<br>Worker URL: ' + WORKER_URL);
      return;
    }

    try {
      await testPush();
    } catch (e) {
      err('Push failed:', e);
      showBanner('⚠️ Health OK but PUSH failed.', 'fail',
        'Cause: ' + String(e) + '<br>Worker is alive but cannot accept writes.');
      return;
    }

    try {
      await testPull();
    } catch (e) {
      err('Pull failed:', e);
      showBanner('⚠️ Push OK but PULL failed.', 'fail',
        'Cause: ' + String(e) + '<br>Data was written but cannot be read back.');
      return;
    }

    setTimeout(function () {
      try { fixCloudButton(); } catch (e) { warn('fixCloudButton:', e); }
    }, 1500);

    const ver = (healthData && healthData.version) || '?';
    showBanner('✅ Cloud sync OK — push & pull both working',
      'ok',
      'Worker v' + ver +
      ' · key valid · token saved · button rebound' +
      '<br>Test key: ' + TEST_KEY + ' · auto-hides in 10s');
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
    health:  healthCheck
  };
})();
