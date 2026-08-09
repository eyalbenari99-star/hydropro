import React, { useState } from 'react';
import type { Item } from '../rnd-core/data-model';

export function LibraryView({ items, onOpen, onNew }: { items: Item[]; onOpen: (id: string) => void; onNew: () => void }) {
  const [filter, setFilter] = useState('');
  const filtered = items.filter(i => !filter || i.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <button onClick={onNew} style={btnPrimary}>+ New board</button>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" style={input} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {filtered.map(it => (
          <div key={it.id} onClick={() => onOpen(it.id)} style={card}>
            <h3 style={{ margin: 0, fontSize: 14, color: '#fff' }}>{it.title}</h3>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{it.status} · v{it.version}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid #facc15', background: '#facc15', color: '#0f172a', cursor: 'pointer', fontWeight: 600 };
const input: React.CSSProperties = { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' };
const card: React.CSSProperties = { padding: 16, background: '#1e293b', borderRadius: 10, cursor: 'pointer', border: '1px solid #334155' };
