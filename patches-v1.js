/* HydroNexis-AI patches.js · v1 (module dropdown fix) · 2026-05-17 */
(function () {
  console.log(
    '%c[HydroNexis-AI patches] loaded · v1 · 2026-05-17',
    'color:#66bb6a;font-weight:bold;font-size:13px;'
  );
  window.__HNX_PATCHES = {
    version: 'v1-mod-dropdown-fix',
    loadedAt: new Date().toISOString(),
    source: 'KV:patches:latest',
  };

  // FIX: module dropdown gets clipped on screens < 1500px wide.
  // Root cause: @media (max-width:1500px) sets #topbar { overflow-x:auto },
  // which implicitly upgrades overflow-y from visible to auto, clipping the
  // absolutely-positioned .hnx-mod-panel inside it.
  // Fix: switch panel to position:fixed and reposition it on every open
  // relative to the trigger's viewport coordinates.
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
      // Elements not ready yet (still on login screen?). Retry.
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

    console.log('[HNX-patches] module-dropdown fix active');
  }

  applyModuleDropdownFix();
})();
