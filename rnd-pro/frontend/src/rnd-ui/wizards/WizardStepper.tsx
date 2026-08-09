import React from 'react';

export function WizardStepper({ steps, active, onPick }: {
  steps: string[];
  active: number;
  onPick: (idx: number) => void;
}) {
  return (
    <div style={bar}>
      {steps.map((label, i) => (
        <div key={i} onClick={() => onPick(i)} style={{ ...step, ...(i === active ? activeStep : {}), cursor: i <= active ? 'pointer' : 'default' }}>
          <span style={badge}>{i + 1}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

const bar: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 18 };
const step: React.CSSProperties = { flex: 1, padding: '10px 12px', background: '#0f172a', borderRadius: 8, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #1e293b' };
const activeStep: React.CSSProperties = { background: '#1e293b', color: '#facc15', borderColor: '#facc15' };
const badge: React.CSSProperties = { width: 20, height: 20, borderRadius: 10, background: '#0f172a', border: '1px solid currentColor', textAlign: 'center', fontSize: 11, lineHeight: '20px' };
