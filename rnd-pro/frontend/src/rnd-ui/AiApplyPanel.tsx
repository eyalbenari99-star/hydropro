import React, { useState } from 'react';
import type { Item, CabinetSpecV2 } from '../rnd-core/data-model';
import { applyOnline } from '../rnd-core/ai-pipeline';

export function AiApplyPanel({ item, onItemChanged }: { item: Item | null; onItemChanged: (it: Item) => void }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function onApply() {
    setBusy(true);
    setStatus('Parsing…');
    try {
      const spec = await applyOnline(text, item);
      if (!spec) {
        setStatus('No deterministic match — AI route not yet implemented.');
        return;
      }
      const updated = { ...item!, spec, updatedAt: new Date().toISOString() };
      onItemChanged(updated);
      setStatus(`✅ Built ${spec.sections.length} sections.`);
    } catch (err) {
      setStatus(`❌ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste markdown spec or describe what to build…" style={{ width: '100%', height: 100, padding: 10, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8 }} />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button disabled={busy} onClick={onApply} style={{ padding: '8px 16px', background: '#facc15', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 600 }}>⚡ Apply</button>
        <span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: 12 }}>{status}</span>
      </div>
    </div>
  );
}
