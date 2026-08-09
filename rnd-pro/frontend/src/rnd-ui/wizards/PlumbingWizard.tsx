import React, { useState } from 'react';
import { plumbingQuestions } from '../../rnd-core/wizards/plumbingQuestions';
import type { WizardAnswers } from '../../rnd-core/data-model';
import { QuestionRenderer } from './QuestionRenderer';
import { WizardStepper } from './WizardStepper';
import { PlumbingComputedSummary } from './ComputedSummary';

const STEPS = ['System', 'Hydraulics', 'Fertigation', 'Build & review'];

export function PlumbingWizard({ onBuilt }: { onBuilt: (out: { spec: any; computed: any }) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    const init: WizardAnswers = {};
    plumbingQuestions.forEach(q => { if (q.default !== undefined) init[q.id] = q.default as any; });
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [err, setErr] = useState('');

  const systemQs = plumbingQuestions.filter(q => ['system_type','source_type','zones_count','pipe_material','project_title'].includes(q.id));
  const hydraulicQs = plumbingQuestions.filter(q => ['total_flow_m3h','working_pressure_bar','filter_micron'].includes(q.id));
  const fertQs    = plumbingQuestions.filter(q => ['has_fertigation','fert_drums_count','has_dosing_unit','has_ec_ph_sensors'].includes(q.id));

  async function submit() {
    setBusy(true); setErr('');
    try {
      const body: Record<string, any> = {
        title: String(answers.project_title || ''),
        system_type: String(answers.system_type || 'fertigation'),
        source_type: String(answers.source_type || 'reservoir'),
        zones_count: Number(answers.zones_count || 4),
        total_flow_m3h: Number(answers.total_flow_m3h || 12),
        working_pressure_bar: Number(answers.working_pressure_bar || 3.5),
        elevation_m: Number(answers.elevation_m || 0),
        filter_micron: Number(answers.filter_micron || 130),
        has_fertigation: Boolean(answers.has_fertigation ?? true),
        fert_drums_count: Number(answers.fert_drums_count || 2),
        has_dosing_unit: Boolean(answers.has_dosing_unit ?? true),
        has_ec_ph_sensors: Boolean(answers.has_ec_ph_sensors ?? true),
        pipe_material: String(answers.pipe_material || 'pe'),
        max_velocity_ms: 1.8
      };
      const r = await fetch((window as any).HNX_API_BASE + '/wizards/plumbing/build', {
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
      <h2 style={{ marginTop: 0, color: '#fff' }}>💧 Plumbing / fertigation wizard</h2>
      <WizardStepper steps={STEPS} active={step} onPick={i => i <= step && setStep(i)} />

      {step === 0 && systemQs.map(q => <QuestionRenderer key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })} />)}
      {step === 1 && hydraulicQs.map(q => <QuestionRenderer key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })} />)}
      {step === 2 && fertQs.map(q => <QuestionRenderer key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswers({ ...answers, [q.id]: v })} />)}
      {step === 3 && (
        <div>
          {!result && <p style={{ color: '#94a3b8' }}>Click Build to compute pump duty point, pipe DN, and filter sizing.</p>}
          {result && <PlumbingComputedSummary computed={result.computed} />}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        <button disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} style={secondary}>← Back</button>
        {step < STEPS.length - 1 && <button onClick={() => setStep(step + 1)} style={primary}>Next →</button>}
        {step === STEPS.length - 1 && <button disabled={busy} onClick={submit} style={build}>{busy ? 'Building…' : '🚰 Build system'}</button>}
        {err && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{err}</span>}
      </div>
    </div>
  );
}

const shell: React.CSSProperties = { maxWidth: 920, margin: '0 auto', padding: 24, background: '#1e293b', borderRadius: 12 };
const primary: React.CSSProperties = { padding: '10px 22px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
const secondary: React.CSSProperties = { padding: '10px 22px', background: '#0f172a', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer' };
const build: React.CSSProperties = { padding: '10px 28px', background: '#facc15', color: '#0f172a', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' };
