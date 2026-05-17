/* HydroNexis-AI patches.js · v2 (crops matrix dropdown + dropdown clip fix) · 2026-05-17 */
(function () {
  console.log(
    '%c[HydroNexis-AI patches] loaded · v2 · 2026-05-17',
    'color:#66bb6a;font-weight:bold;font-size:13px;'
  );
  window.__HNX_PATCHES = {
    version: 'v2-crops-matrix-dropdown',
    loadedAt: new Date().toISOString(),
    source: 'KV:patches:latest',
    fixes: ['module-dropdown-clip', 'crops-matrix-dropdown'],
  };

  // ============================================================
  // FIX 1 (carry-over from v1): Module switcher panel gets clipped
  // on screens narrower than 1500px (topbar overflow-x:auto implicitly
  // upgrades overflow-y to auto too). Switch panel to position:fixed
  // and reposition on every open relative to the trigger button.
  // ============================================================
  function applyModuleDropdownFix() {
    if (!document.getElementById('hnx-patch-mod-dropdown')) {
      const style = document.createElement('style');
      style.id = 'hnx-patch-mod-dropdown';
      style.textContent =
        '.hnx-mod-panel{position:fixed!important;max-height:calc(100vh - 180px)!important;}';
      document.head.appendChild(style);
    }
    const trigger = document.getElementById('hnxModTrigger');
    const panel   = document.getElementById('hnxModPanel');
    const picker  = document.getElementById('hnxModPicker');
    if (!trigger || !panel || !picker) {
      setTimeout(applyModuleDropdownFix, 500);
      return;
    }
    if (picker.dataset.hnxFixed === '1') return;
    picker.dataset.hnxFixed = '1';
    function reposition() {
      if (!picker.classList.contains('open')) return;
      const rect = trigger.getBoundingClientRect();
      panel.style.top  = (rect.bottom + 8) + 'px';
      panel.style.left = rect.left + 'px';
    }
    new MutationObserver(reposition).observe(picker, {
      attributes: true, attributeFilter: ['class'],
    });
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { capture: true, passive: true });
    console.log('[HNX-patches] fix 1: module-dropdown clip-fix active');
  }
  applyModuleDropdownFix();

  // ============================================================
  // FIX 2 (new in v2): Add "Crops Matrix" as a standalone item in
  // the Production module's matrix view dropdown. The Crops Matrix
  // already exists inside the Dashboard (controlled by the body
  // class hp-crops-matrix-only). This patch surfaces it as its own
  // entry in the matrix view dropdown and wires switchView to handle it.
  // ============================================================
  function applyCropsMatrixDropdownFix() {
    if (!Array.isArray(window.MATRIX_NAV_ITEMS)) {
      setTimeout(applyCropsMatrixDropdownFix, 500);
      return;
    }
    const exists = window.MATRIX_NAV_ITEMS.find(x => x.id === 'crops_matrix');
    if (!exists) {
      window.MATRIX_NAV_ITEMS.push({
        id: 'crops_matrix',
        icon: '🌿',
        label: 'Crops Matrix',
        desc: 'All facilities · planting · varieties · cycles · brain-highlighted cells',
      });
      console.log('[HNX-patches] fix 2a: crops_matrix added to MATRIX_NAV_ITEMS');
    }

    if (typeof window.switchView !== 'function') {
      setTimeout(applyCropsMatrixDropdownFix, 500);
      return;
    }
    if (window.switchView._hnxCropsWrapped) return;

    const origSwitchView = window.switchView;
    window.switchView = function (target) {
      if (target === 'crops_matrix') {
        // Brain-view cleanup (mirrors existing activateCropsMatrixTab)
        const appMain = document.getElementById('appMain');
        if (appMain) {
          Array.from(appMain.querySelectorAll(':scope > .hn-brain-view')).forEach(v => v.remove());
          Array.from(appMain.children).forEach(c => {
            if (c.dataset && c.dataset.hnBrainHidden) {
              c.classList.remove('hn-brain-force-hide');
              if (c.dataset.hnBrainHadActive) {
                c.classList.add('active');
                delete c.dataset.hnBrainHadActive;
              }
              delete c.dataset.hnBrainHidden;
            }
          });
        }
        // Activate the underlying dashboard view, then enter crops-matrix-only mode
        const r = origSwitchView('dashboard');
        setTimeout(function () {
          document.body.classList.add('hp-crops-matrix-only');
          ['renderMatrix','renderStatusMatrix','renderDashboardMatrix','renderAll','renderRecurringWeek'].forEach(function (fn) {
            if (typeof window[fn] === 'function') { try { window[fn](); } catch (e) {} }
          });
          if (typeof window.hnApplyMatrixOverlay === 'function') {
            try { window.hnApplyMatrixOverlay(); } catch (e) {}
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 60);
        return r;
      }
      // Any other view target → leave crops-matrix-only mode if it was on
      if (document.body.classList.contains('hp-crops-matrix-only')) {
        document.body.classList.remove('hp-crops-matrix-only');
      }
      return origSwitchView.apply(this, arguments);
    };
    window.switchView._hnxCropsWrapped = true;
    console.log('[HNX-patches] fix 2b: switchView wrapped for crops_matrix view');
  }
  applyCropsMatrixDropdownFix();
})();
