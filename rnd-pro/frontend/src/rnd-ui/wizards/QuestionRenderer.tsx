import React from 'react';
import type { WizardQuestion } from '../../rnd-core/data-model';

interface Props {
  question: WizardQuestion;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}

export function QuestionRenderer({ question: q, value, onChange }: Props) {
  if (q.type === 'select') {
    return (
      <label style={field}>
        <span style={label}>{q.label}{q.required && <em style={{ color: '#facc15', marginLeft: 4 }}>*</em>}</span>
        <select value={String(value ?? '')} onChange={e => {
          const opt = q.options?.find(o => String(o.value) === e.target.value);
          if (opt) onChange(opt.value);
        }} style={input}>
          <option value="">— pick —</option>
          {q.options?.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (q.type === 'number') {
    return (
      <label style={field}>
        <span style={label}>{q.label}{q.required && <em style={{ color: '#facc15', marginLeft: 4 }}>*</em>}</span>
        <input type="number" min={q.min} max={q.max} value={Number(value ?? q.default ?? 0)} onChange={e => onChange(Number(e.target.value))} style={input} />
      </label>
    );
  }
  if (q.type === 'boolean') {
    return (
      <label style={{ ...field, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" checked={Boolean(value ?? q.default ?? false)} onChange={e => onChange(e.target.checked)} />
        <span style={label}>{q.label}</span>
      </label>
    );
  }
  // text
  return (
    <label style={field}>
      <span style={label}>{q.label}</span>
      <input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} style={input} />
    </label>
  );
}

const field: React.CSSProperties  = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 };
const label: React.CSSProperties  = { fontSize: 13, color: '#cbd5e1' };
const input: React.CSSProperties  = { padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14 };
