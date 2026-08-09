/* Facade that exposes window.RND.* — keeps the legacy host app happy.
 * Every call delegates to window.__rndController (built by main.tsx).
 */
import type { RNDController } from '../main';

declare global {
  interface Window {
    RND?: any;
    __rndController?: RNDController;
  }
}

export function installShim(): void {
  const ensure = () => {
    if (window.__rndController) return window.__rndController;
    const host = document.getElementById('hnx-rnd-root') as HTMLElement | null;
    if (!host || !(window as any).__initRNDv2) return null;
    window.__rndController = (window as any).__initRNDv2(host);
    return window.__rndController;
  };

  window.RND = window.RND || {};
  window.RND.open       = () => { const c = ensure(); c && c.open(); };
  window.RND.openItem   = (id: string) => { const c = ensure(); c && c.openItem(id); };
  window.RND.newBoard   = () => { const c = ensure(); c && c.newBoard(); };
  window.RND._closeBoard = () => { const c = ensure(); c && c.close(); };

  // TODO(14.2): wire the remaining 70+ methods enumerated in the audit's section 6
  // — most are thin façades that just call into the React controller's methods.
}
