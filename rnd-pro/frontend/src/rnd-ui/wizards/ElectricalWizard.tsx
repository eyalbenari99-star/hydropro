import React, { useState } from 'react';
import { electricalQuestions } from '../../rnd-core/wizards/electricalQuestions';
import type { WizardAnswers } from '../../rnd-core/data-model';
import { QuestionRenderer } from './QuestionRenderer';
import { WizardStepper } from './WizardStepper';
import { FeederEditor, type Feeder } from './FeederEditor';
import { ElectricalComputedSummary } from './ComputedSummary';

const STEPS = ['Application', 'Feeders', 'Extras', 'Build & review'];

export function ElectricalWizard({ onBuilt }: { onBuilt: (out: { spec: any; computed: any }) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    const init: WizardAnswers = {};
    electricalQuestions.forEach(q => { if (q.default !== undefined) init[q.id] = q.default as any; });
    return init;
  });
  const [feeders, setFeeders] = useState<Feeder[]>([
    { id: 'f1', label: 'Water pump', kind: 'pump', count: 6, kw: 2.2, current_a: 0, voltage: '400V' },
    { id: 'f2', label: 'Roof fan',   kind: 'fan',  count: 3, kw: 0.2, current_a: 0, voltage: '400V' }
  ]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ spec: any; computed: any } | null>(null);
  const [err, setErr] = useState('');

  const applicationQs = electricalQuestions.filter(q => ['application_type','supply_voltage','short_circuit_ka','main_breaker_a','cabinet_enclosure'].includes(q.id));
  const extrasQs      = electricalQuestions.filter(q => ['has_metering','has_surge_protection','preferred_manufacturer','include_plc','project_title'].includes(q.id));

  async function submit() {
    setBusy(true); setErr('');
    try {
      const body = {
        title: String(answers.project_title || ''),
        application_type: String(answers.application_type || 'irrigation_pump_station'),
        supply_voltage: String(answers.supply_voltage || '400V'),
        short_circuit_ka: Number(answers.short_circuit_ka || 10),
        main_breaker_a: Number(answers.main_breaker_a || 500),
        has_metering: Boolean(answers.has_metering ?? true),
        has_surge_protection: Boolean(answers.has_surge_protection ?? false),
        cabinet_enclosure: String(answers.cabinet_enclosure || 'IP54'),
        preferred_manufacturer: String(answers.preferred_manufacturer || 'chint'),
        include_plc: Boolean(answers.include_plc ?? false),
        feeders
      };
      const r = await fetch((window as any).HNX_API_BASE + '/wizards/electrical/build', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      setResult(out);
      onBuilt(out);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={shell}>
      <h2 style={{ marginTop: 0, color: '#fff' }}>⚡ Electrical cabinet wizard</h2>
      <WizardStepper steps={STEPS} active={step} onPick={i => i <= step && setStep(i)} />

      {step === 0 && (
        <div>
          {applicationQs.map(q => <QuestionRenderer key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })} />)}
        </div>
      )}
      {step === 1 && (
        <div>
          <p style={{ color: '#94a3b8' }}>Add one row per group of identical loads. Counts automatically expand into individual feeders.</p>
          <FeederEditor feeders={feeders} onChange={setFeeders} />
        </div>
      )}
      {step === 2 && (
        <div>
          {extrasQs.map(q => <QuestionRenderer key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })} />)}
        </div>
      )}
      {step === 3 && (
        <div>
          {!result && <p style={{ color: '#94a3b8' }}>Click Build to size every feeder via the engineering rules library.</p>}
          {result && <ElectricalComputedSummary computed={result.computed} />}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} style={secondary}>← Back</button>
        {step < STEPS.length - 1 && <button onClick={() => setStep(step + 1)} style={primary}>Next →</button>}
        {step === STEPS.length - 1 && <button disabled={busy} onClick={submit} style={build}>{busy ? 'Building…' : '🏭 Build cabinet'}</button>}
        {err && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{err}</span>}
      </div>
    </div>
  );
}

const shell: React.CSSProperties = { maxWidth: 920, margin: '0 auto', padding: 24, background: '#1e293b', borderRadius: 12 };
const primary: React.CSSProperties = { padding: '10px 22px', background: '#facc15', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
const secondary: React.CSSProperties = { padding: '10px 22px', background: '#0f172a', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer' };
const build: React.CSSProperties = { padding: '10px 28px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
