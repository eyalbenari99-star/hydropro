/* Entrypoint — exposes window.__initRNDv2 for the legacy host to call. */
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { RNDApp } from './rnd-ui/RNDApp';
import { installShim } from './integration/hnx-shim';

export interface RNDController {
  open: () => void;
  openItem: (id: string) => void;
  newBoard: () => void;
  close: () => void;
}

declare global {
  interface Window {
    __initRNDv2?: (host: HTMLElement) => RNDController;
    __rndController?: RNDController;
    RND?: any;
  }
}

let root: Root | null = null;

function createRNDApp(host: HTMLElement): RNDController {
  if (!root) root = createRoot(host);
  const controllerRef: { current: RNDController | null } = { current: null };

  root.render(<RNDApp onReady={c => (controllerRef.current = c)} />);

  const wait = (fn: () => void) =>
    controllerRef.current ? fn() : setTimeout(() => wait(fn), 50);

  return {
    open: () => wait(() => controllerRef.current!.open()),
    openItem: (id) => wait(() => controllerRef.current!.openItem(id)),
    newBoard: () => wait(() => controllerRef.current!.newBoard()),
    close: () => wait(() => controllerRef.current!.close())
  };
}

window.__initRNDv2 = createRNDApp;
installShim();

// Dev-mode autostart when running standalone (npm run dev)
if (import.meta.env.DEV) {
  const host = document.getElementById('hnx-rnd-root');
  if (host) {
    window.__rndController = createRNDApp(host);
    window.__rndController.open();
  }
}
