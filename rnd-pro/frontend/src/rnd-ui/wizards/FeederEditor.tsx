import React from 'react';

export interface Feeder {
  id: string;
  label: string;
  kind: 'pump' | 'fan' | 'machine' | 'outlet' | 'lighting';
  count: number;
  kw: number;
  current_a: number;
  voltage: string;
}

const KIND_OPTIONS = [
  { value: 'pump',     label: 'Pump (motor)' },
  { value: 'fan',      label: 'Fan (motor)' },
  { value: 'machine',  label: 'Machine (motor)' },
  { value: 'outlet',   label: 'AC outlet' },
  { value: 'lighting', label: 'Lighting circuit' }
] as const;

export function FeederEditor({ feeders, onChange }: {
  feeders: Feeder[];
  onChange: (next: Feeder[]) => void;
}) {
  function add() {
    onChange([...feeders, { id: `f_${Date.now()}`, label: 'New feeder', kind: 'pump', count: 1, kw: 2.2, current_a: 0, voltage: '400V' }]);
  }
  function remove(id: string) { onChange(feeders.filter(f => f.id !== id)); }
  function update(id: string, key: keyof Feeder, value: any) {
    onChange(feeders.map(f => f.id === id ? { ...f, [key]: value } : f));
  }
  return (
    <div>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Label</th>
            <th style={th}>Kind</th>
            <th style={th}>Count</th>
            <th style={th}>kW (motors)</th>
            <th style={th}>A (non-motor)</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {feeders.map(f => {
            const isMotor = f.kind === 'pump' || f.kind === 'fan' || f.kind === 'machine';
            return (
              <tr key={f.id}>
                <td><input value={f.label} onChange={e => update(f.id, 'label', e.target.value)} style={input}/></td>
                <td>
                  <select value={f.kind} onChange={e => update(f.id, 'kind', e.target.value)} style={input}>
                    {KIND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td><input type="number" min={1} max={50} value={f.count} onChange={e => update(f.id, 'count', Number(e.target.value))} style={inputNum}/></td>
                <td><input type="number" disabled={!isMotor} step={0.1} min={0} value={f.kw} onChange={e => update(f.id, 'kw', Number(e.target.value))} style={inputNum}/></td>
                <td><input type="number" disabled={isMotor} step={1} min={0} value={f.current_a} onChange={e => update(f.id, 'current_a', Number(e.target.value))} style={inputNum}/></td>
                <td><button onClick={() => remove(f.id)} style={delBtn}>✕</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={add} style={addBtn}>+ Add feeder</button>
    </div>
  );
}

const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #334155', color: '#cbd5e1', fontSize: 12, fontWeight: 600 };
const input: React.CSSProperties = { width: '100%', padding: '6px 8px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, fontSize: 13 };
const inputNum: React.CSSProperties = { ...input, textAlign: 'right' };
const addBtn: React.CSSProperties = { marginTop: 12, padding: '8px 14px', background: '#334155', color: '#facc15', border: '1px solid #facc15', borderRadius: 8, cursor: 'pointer', fontWeight: 600 };
const delBtn: React.CSSProperties = { padding: '4px 10px', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' };
