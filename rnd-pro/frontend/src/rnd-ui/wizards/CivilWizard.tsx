import React, { useEffect, useState } from 'react';
import { apiClient } from '../../rnd-core/api-client';
import { loadQuestionSet, defaultAnswers, validateAnswers, orderedQuestions } from '../../rnd-core/load-questions';
import type { QuestionSet, WizardAnswers, WizardBuildResponse } from '../../rnd-core/wizard-questions';
import { WizardStepper } from './WizardStepper';

interface CivilComputed {
  totalAreaM2: number;
  baysCount: number;
  bayPitchM: number;
  eaveHeightM: number;
  ridgeHeightM: number;
  totals: { columns: number; rafters: number; purlins: number; foundations: number };
}

export const CivilWizard: React.FC<{ onDone?: (specId: string) => void }> = ({ onDone }) => {
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WizardBuildResponse<any, CivilComputed> | null>(null);

  useEffect(() => {
    loadQuestionSet('civil').then(s => {
      setSet(s);
      setAnswers(defaultAnswers(s));
    });
  }, []);

  if (!set) return <div className="rnd-loading">Loading civil questions...</div>;

  const qs = orderedQuestions(set);
  const stepGroups = [
    { title: 'Structure',  qs: qs.filter(q => ['project_type', 'frame_material', 'roof_type'].includes(q.id)) },
    { title: 'Dimensions', qs: qs.filter(q => ['spans_count', 'span_width_m', 'length_m'].includes(q.id)) },
    { title: 'Notes',      qs: qs.filter(q => ['design_loads'].includes(q.id)) },
    { title: 'Build',      qs: [] }
  ];

  const handleBuild = async () => {
    setError(null);
    setLoading(true);
    const { ok, errors } = validateAnswers(set, answers);
    if (!ok) {
      setError(errors.join('; '));
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.post<WizardBuildResponse<any, CivilComputed>>(
        '/api/rnd/wizards/civil/build', answers
      );
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Build failed');
    } finally {
      setLoading(false);
    }
  };

  const renderQ = (qid: string) => {
    const q = qs.find(x => x.id === qid);
    if (!q) return null;
    const v = answers[q.id];
    const set_ = (val: any) => setAnswers(a => ({ ...a, [q.id]: val }));
    return (
      <label key={q.id} className="rnd-q">
        <span className="rnd-q-label">{q.label}</span>
        {q.help && <small className="rnd-q-help">{q.help}</small>}
        {q.type === 'select' && (
          <select value={String(v ?? '')} onChange={e => set_(e.target.value)}>
            {q.options!.map(o => (
              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
          </select>
        )}
        {q.type === 'number' && (
          <input type="number" min={q.min} max={q.max} step={q.step ?? 1}
                 value={Number(v ?? 0)}
                 onChange={e => set_(Number(e.target.value) || 0)} />
        )}
        {q.type === 'boolean' && (
          <input type="checkbox" checked={!!v} onChange={e => set_(e.target.checked)} />
        )}
        {q.type === 'text' && (
          q.multiline
            ? <textarea rows={3} value={String(v ?? '')} onChange={e => set_(e.target.value)} />
            : <input type="text" value={String(v ?? '')} onChange={e => set_(e.target.value)} />
        )}
      </label>
    );
  };

  return (
    <div className="rnd-wizard">
      <h2>Civil structure wizard</h2>
      <WizardStepper steps={stepGroups.map(s => s.title)} active={step} onPick={index => index <= step && setStep(index)} />
      {error && <div className="rnd-error">{error}</div>}

      {step < 3 && (
        <section>
          <h3>{stepGroups[step].title}</h3>
          {stepGroups[step].qs.map(q => renderQ(q.id))}
        </section>
      )}

      {step === 3 && (
        <section>
          <h3>Build &amp; review</h3>
          {!result && (
            <button onClick={handleBuild} disabled={loading}>
              {loading ? 'Building...' : 'Build structure'}
            </button>
          )}
          {result && (
            <div className="rnd-computed">
              <h4>Computed</h4>
              <ul>
                <li>Total area: <strong>{result.computed.totalAreaM2} m^2</strong></li>
                <li>Bays: <strong>{result.computed.baysCount}</strong> @ {result.computed.bayPitchM} m pitch</li>
                <li>Eave height: <strong>{result.computed.eaveHeightM} m</strong>, Ridge: {result.computed.ridgeHeightM} m</li>
              </ul>
              <h4>Bill of structure</h4>
              <table className="rnd-table">
                <thead><tr><th>Element</th><th>Count</th></tr></thead>
                <tbody>
                  <tr><td>Columns</td><td>{result.computed.totals.columns}</td></tr>
                  <tr><td>Rafters</td><td>{result.computed.totals.rafters}</td></tr>
                  <tr><td>Purlins</td><td>{result.computed.totals.purlins}</td></tr>
                  <tr><td>Foundations</td><td>{result.computed.totals.foundations}</td></tr>
                </tbody>
              </table>
              <button onClick={() => onDone?.(String(result.spec?.title || 'civil'))}>Open in 3D viewer</button>
            </div>
          )}
        </section>
      )}

      <footer className="rnd-wizard-footer">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        {step < 3 && <button onClick={() => setStep(s => Math.min(3, s + 1))}>Next</button>}
      </footer>
    </div>
  );
};
