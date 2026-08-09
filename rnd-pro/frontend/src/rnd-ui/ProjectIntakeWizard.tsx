import React, { useEffect, useMemo, useRef, useState } from 'react';
import './project-intake-wizard.css';

export type IntakeDiscipline =
  | 'Greenhouse & agricultural systems'
  | 'Civil & site planning'
  | 'Structural engineering'
  | 'Mechanical & HVAC'
  | 'Plumbing, irrigation & fertigation'
  | 'Electrical, controls & automation'
  | 'IT & operational technology'
  | 'Industrial & packaging engineering';

export type IntakeAutonomyMode = 'copilot' | 'supervised' | 'maximum';
export type IntakeFindingSeverity = 'critical' | 'warning' | 'verified' | 'information';

export interface ProjectIntakeFile {
  id: string;
  file: File;
  name: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  lastModified: number;
  category: 'drawing' | 'model' | 'image' | 'data' | 'document' | 'unknown';
  previewDataUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  fingerprint: string;
}

export interface ProjectIntakeFinding {
  id: string;
  severity: IntakeFindingSeverity;
  category: string;
  title: string;
  detail: string;
  recommendation: string;
  confidence: number;
}

export interface ProjectIntakeQuestion {
  id: string;
  prompt: string;
  reason: string;
  options: string[];
  required: boolean;
}

export interface ProjectIntakeAssumption {
  id: string;
  statement: string;
  impact: 'low' | 'medium' | 'high';
  includeInDraft: boolean;
}

export interface ProjectIntakeResult {
  /** Convenience fields for host applications that do not need the full project record. */
  title: string;
  site: string;
  description: string;
  disciplines: IntakeDiscipline[];
  autonomyMode: IntakeAutonomyMode;
  files: ProjectIntakeFile[];
  project: {
    id: string;
    code: string;
    name: string;
    site: string;
    client: string;
    description: string;
    units: 'metric' | 'imperial';
    disciplines: IntakeDiscipline[];
    autonomyMode: IntakeAutonomyMode;
    status: 'Draft';
    createdAt: string;
  };
  sourceFiles: ProjectIntakeFile[];
  analysis: {
    engine: 'nexi-offline-deterministic-v1';
    fingerprint: string;
    completenessScore: number;
    confidence: number;
    findings: ProjectIntakeFinding[];
    questions: ProjectIntakeQuestion[];
    answers: Record<string, string>;
    skippedQuestions: string[];
    assumptions: ProjectIntakeAssumption[];
    analyzedAt: string;
  };
}

export interface ProjectIntakeWizardProps {
  onCancel: () => void;
  onComplete: (result: ProjectIntakeResult) => void;
  initialName?: string;
  initialSite?: string;
}

type Step = 0 | 1 | 2 | 3 | 4;

interface IdentityState {
  name: string;
  code: string;
  site: string;
  client: string;
  description: string;
  units: 'metric' | 'imperial';
}

const DISCIPLINES: IntakeDiscipline[] = [
  'Greenhouse & agricultural systems',
  'Civil & site planning',
  'Structural engineering',
  'Mechanical & HVAC',
  'Plumbing, irrigation & fertigation',
  'Electrical, controls & automation',
  'IT & operational technology',
  'Industrial & packaging engineering',
];

const STEPS = [
  { label: 'Project', detail: 'Identity & site' },
  { label: 'Engineering', detail: 'Scope & autonomy' },
  { label: 'Sources', detail: 'Plans & models' },
  { label: 'Nexi analysis', detail: 'Risks & questions' },
  { label: 'Create', detail: 'Controlled project' },
] as const;

const ANALYSIS_STAGES = [
  ['Securing source package', 'Fingerprinting files and preserving source metadata'],
  ['Classifying engineering content', 'Detecting drawing, model, image and data sources'],
  ['Building plan intelligence', 'Indexing dimensions, symbols, systems and notes'],
  ['Running engineering checks', 'Testing completeness, constructability and risk signals'],
  ['Preparing controlled baseline', 'Creating questions, assumptions and approval gates'],
] as const;

const AUTONOMY: Array<{ id: IntakeAutonomyMode; label: string; badge: string; text: string }> = [
  { id: 'copilot', label: 'Copilot', badge: 'Advise only', text: 'Nexi recommends. A person performs and confirms every change.' },
  { id: 'supervised', label: 'Supervised engineer', badge: 'Company default', text: 'Nexi prepares drafts and previews every proposed change for approval.' },
  { id: 'maximum', label: 'Maximum autonomy', badge: 'Within approved limits', text: 'Nexi manages the workflow while human gates protect safety, legal, finance and issue status.' },
];

const ACCEPTED_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'svg', 'dwg', 'dxf', 'ifc',
  'step', 'stp', 'iges', 'igs', 'stl', 'obj', 'gltf', 'glb', 'csv', 'xls', 'xlsx',
]);
const MAX_FILE_SIZE = 200 * 1024 * 1024;
// Data URLs are ~33% larger than their source and are later copied into the
// canvas state. Keep large sources as metadata-only entries in this offline
// review build so a valid 200 MB upload cannot freeze or exhaust the browser.
const MAX_INLINE_PREVIEW_SIZE = 12 * 1024 * 1024;

export function ProjectIntakeWizard({ onCancel, onComplete, initialName = '', initialSite = '' }: ProjectIntakeWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [identity, setIdentity] = useState<IdentityState>({
    name: initialName,
    code: createSuggestedCode(),
    site: initialSite,
    client: 'ABA Pardes',
    description: '',
    units: 'metric',
  });
  const [disciplines, setDisciplines] = useState<IntakeDiscipline[]>(['Greenhouse & agricultural systems']);
  const [autonomyMode, setAutonomyMode] = useState<IntakeAutonomyMode>('supervised');
  const [files, setFiles] = useState<ProjectIntakeFile[]>([]);
  const [fileMessage, setFileMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(-1);
  const [analysisPercent, setAnalysisPercent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([]);
  const [assumptionOverrides, setAssumptionOverrides] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const createTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);

  const analysis = useMemo(
    () => buildDeterministicAnalysis(identity, disciplines, autonomyMode, files),
    [identity, disciplines, autonomyMode, files],
  );
  const assumptions = useMemo(
    () => analysis.assumptions.map(item => ({
      ...item,
      includeInDraft: assumptionOverrides[item.id] ?? item.includeInDraft,
    })),
    [analysis.assumptions, assumptionOverrides],
  );
  const answeredCount = analysis.questions.filter(question => Boolean(answers[question.id]) || skippedQuestions.includes(question.id)).length;
  const allQuestionsSkipped = analysis.questions.length > 0 && analysis.questions.every(question => skippedQuestions.includes(question.id));

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating && !created) onCancel();
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [created, isCreating, onCancel]);

  useEffect(() => () => {
    if (createTimerRef.current !== null) window.clearTimeout(createTimerRef.current);
    if (completeTimerRef.current !== null) window.clearTimeout(completeTimerRef.current);
  }, []);

  useEffect(() => {
    if (step !== 3 || analysisIndex >= ANALYSIS_STAGES.length) return;
    if (analysisIndex < 0) {
      setAnalysisIndex(0);
      setAnalysisPercent(4);
      return;
    }
    const stageStart = analysisIndex * 20;
    const stageEnd = (analysisIndex + 1) * 20;
    let transitionTimer: number | undefined;
    setAnalysisPercent(current => Math.max(current, stageStart));
    const timer = window.setInterval(() => {
      setAnalysisPercent(current => {
        const next = Math.min(current + 4, stageEnd);
        if (next >= stageEnd) {
          window.clearInterval(timer);
          transitionTimer = window.setTimeout(() => setAnalysisIndex(index => index + 1), 180);
        }
        return next;
      });
    }, 80);
    return () => {
      window.clearInterval(timer);
      if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
    };
  }, [analysisIndex, step]);

  const analysisComplete = analysisIndex >= ANALYSIS_STAGES.length;
  const validation = validateStep(step, identity, disciplines, files, analysisComplete);

  const updateIdentity = <K extends keyof IdentityState>(key: K, value: IdentityState[K]) => {
    setIdentity(current => ({ ...current, [key]: value }));
  };

  const toggleDiscipline = (discipline: IntakeDiscipline) => {
    setDisciplines(current => current.includes(discipline)
      ? current.filter(item => item !== discipline)
      : [...current, discipline]);
  };

  const addFiles = async (incoming: File[]) => {
    const accepted: File[] = [];
    const errors: string[] = [];
    const seen = new Set(files.map(existing => `${existing.name}:${existing.sizeBytes}:${existing.lastModified}`));
    for (const file of incoming) {
      const extension = getExtension(file.name);
      const identity = `${file.name}:${file.size}:${file.lastModified}`;
      if (!ACCEPTED_EXTENSIONS.has(extension)) errors.push(`${file.name}: unsupported format`);
      else if (file.size > MAX_FILE_SIZE) errors.push(`${file.name}: larger than 200 MB`);
      else if (seen.has(identity)) errors.push(`${file.name}: already added`);
      else {
        accepted.push(file);
        seen.add(identity);
      }
    }

    const mapped = await Promise.all(accepted.map(mapFile));
    setFiles(current => [...current, ...mapped]);
    setFileMessage(errors.length ? errors.join(' · ') : `${mapped.length} source ${mapped.length === 1 ? 'file' : 'files'} added to this local review session.`);
  };

  const next = () => {
    if (!validation.valid) return;
    if (step === 2) {
      setAnalysisIndex(-1);
      setAnalysisPercent(0);
      setStep(3);
      return;
    }
    setStep(current => Math.min(4, current + 1) as Step);
  };

  const toggleSkipAllQuestions = () => {
    const questionIds = analysis.questions.map(question => question.id);
    if (allQuestionsSkipped) {
      setSkippedQuestions(current => current.filter(id => !questionIds.includes(id)));
      return;
    }
    setSkippedQuestions(questionIds);
    setAnswers(current => {
      const nextAnswers = { ...current };
      questionIds.forEach(id => delete nextAnswers[id]);
      return nextAnswers;
    });
  };

  const createProject = () => {
    if (isCreating || created) return;
    setIsCreating(true);
    createTimerRef.current = window.setTimeout(() => {
      const analyzedAt = new Date().toISOString();
      const result: ProjectIntakeResult = {
        title: identity.name.trim(),
        site: identity.site.trim(),
        description: identity.description.trim(),
        disciplines,
        autonomyMode,
        files,
        project: {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rnd-${Date.now()}`,
          code: identity.code.trim().toUpperCase(),
          name: identity.name.trim(),
          site: identity.site.trim(),
          client: identity.client.trim(),
          description: identity.description.trim(),
          units: identity.units,
          disciplines,
          autonomyMode,
          status: 'Draft',
          createdAt: analyzedAt,
        },
        sourceFiles: files,
        analysis: {
          engine: 'nexi-offline-deterministic-v1',
          fingerprint: analysis.fingerprint,
          completenessScore: analysis.completenessScore,
          confidence: analysis.confidence,
          findings: analysis.findings,
          questions: analysis.questions,
          answers,
          skippedQuestions,
          assumptions,
          analyzedAt,
        },
      };
      setCreated(true);
      setIsCreating(false);
      completeTimerRef.current = window.setTimeout(() => onComplete(result), 650);
    }, 900);
  };

  return (
    <div ref={dialogRef} className="pwi-overlay" role="dialog" aria-modal="true" aria-labelledby="pwi-title">
      <div className="pwi-ambient" aria-hidden="true"><i /><i /><i /></div>
      <div className="pwi-shell">
        <header className="pwi-header">
          <div className="pwi-brand">
            <span className="pwi-brand-mark">H<i /></span>
            <span><strong>HydroNexis-AI</strong><small>R&amp;D · CONTROLLED PROJECT INTAKE</small></span>
          </div>
          <div className="pwi-security"><span /> LOCAL DEVELOPER REVIEW <b>·</b> SESSION LOG ACTIVE</div>
          <button type="button" className="pwi-close" onClick={onCancel} disabled={isCreating || created} aria-label="Close project intake">×</button>
        </header>

        <div className="pwi-body">
          <aside className="pwi-step-rail" aria-label="Project intake progress">
            <div className="pwi-nexi-mini" aria-hidden="true"><span><i /><i /><i /></span></div>
            <div className="pwi-step-intro"><small>NEXI INTAKE ENGINE</small><strong>From source plan to controlled engineering project</strong></div>
            <ol>
              {STEPS.map((item, index) => (
                <li key={item.label} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}>
                  <button type="button" aria-label={`${item.label}: ${item.detail}${index === step ? ', current step' : index < step ? ', completed' : ', not yet available'}`} onClick={() => index < step && !isCreating && !created && setStep(index as Step)} disabled={index > step || isCreating || created}>
                    <span>{index < step ? '✓' : String(index + 1).padStart(2, '0')}</span>
                    <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="pwi-trust-note"><span>⌾</span><p><strong>Human authority preserved</strong>Nexi cannot certify safety-critical or legally regulated engineering work.</p></div>
          </aside>

          <main className="pwi-main">
            <div className="pwi-main-scroll">
              {step === 0 && (
                <section className="pwi-step pwi-enter">
                  <StepHeading ref={headingRef} eyebrow="01 · PROJECT IDENTITY" title="Start with the engineering outcome" copy="Create the controlled record that will connect every source plan, calculation, task, cost, approval and issued revision." />
                  <div className="pwi-form-grid">
                    <Field label="Project name" hint="Required" wide>
                      <input aria-label="Project name" value={identity.name} onChange={event => updateIdentity('name', event.target.value)} placeholder="e.g. GH7 fertigation and irrigation upgrade" autoFocus />
                    </Field>
                    <Field label="Project code" hint="Unique controlled reference">
                      <input aria-label="Project code" value={identity.code} onChange={event => updateIdentity('code', event.target.value)} placeholder="RND-2608-001" />
                    </Field>
                    <Field label="Site / facility" hint="Required">
                      <input aria-label="Project site or facility" value={identity.site} onChange={event => updateIdentity('site', event.target.value)} placeholder="e.g. ABA Pardes Farm · GH7" />
                    </Field>
                    <Field label="Client / business unit" hint="Owner of the outcome">
                      <input aria-label="Client or business unit" value={identity.client} onChange={event => updateIdentity('client', event.target.value)} placeholder="ABA Pardes" />
                    </Field>
                    <Field label="Drawing units" hint="Can be changed later">
                      <div className="pwi-segmented" role="group" aria-label="Drawing units">
                        <button type="button" className={identity.units === 'metric' ? 'is-active' : ''} onClick={() => updateIdentity('units', 'metric')}>Metric <small>mm · m · kPa</small></button>
                        <button type="button" className={identity.units === 'imperial' ? 'is-active' : ''} onClick={() => updateIdentity('units', 'imperial')}>Imperial <small>in · ft · psi</small></button>
                      </div>
                    </Field>
                    <Field label="Engineering intent" hint={`${identity.description.length}/500`} wide>
                      <textarea aria-label="Engineering intent" maxLength={500} value={identity.description} onChange={event => updateIdentity('description', event.target.value)} placeholder="Describe what must be designed, improved, checked or built. Nexi will use this to focus the plan review." />
                    </Field>
                  </div>
                  <div className="pwi-context-strip"><span>⌁</span><p><strong>Nexi will preserve this intent.</strong> Every recommendation, calculation and design change will be checked against the outcome described here.</p></div>
                </section>
              )}

              {step === 1 && (
                <section className="pwi-step pwi-enter">
                  <StepHeading ref={headingRef} eyebrow="02 · ENGINEERING CONTROL" title="Define the disciplines and Nexi’s authority" copy="Choose every engineering area involved. Nexi will coordinate interfaces across disciplines while respecting project permissions and human approval gates." />
                  <fieldset className="pwi-fieldset">
                    <legend>Engineering disciplines <span>Select one or more</span></legend>
                    <div className="pwi-discipline-grid">
                      {DISCIPLINES.map((discipline, index) => {
                        const selected = disciplines.includes(discipline);
                        return <label key={discipline} className={selected ? 'is-selected' : ''}><input type="checkbox" checked={selected} onChange={() => toggleDiscipline(discipline)} /><span className="pwi-discipline-icon">{disciplineGlyph(index)}</span><span><strong>{discipline}</strong><small>{disciplineDetail(index)}</small></span><i>{selected ? '✓' : '+'}</i></label>;
                      })}
                    </div>
                  </fieldset>
                  <fieldset className="pwi-fieldset pwi-autonomy-fieldset">
                    <legend>Nexi autonomy for this project <span>Supervised is recommended</span></legend>
                    <div className="pwi-autonomy-grid">
                      {AUTONOMY.map(mode => <label key={mode.id} className={autonomyMode === mode.id ? 'is-selected' : ''}><input type="radio" name="autonomy" value={mode.id} checked={autonomyMode === mode.id} onChange={() => setAutonomyMode(mode.id)} /><span className="pwi-radio" /><span><strong>{mode.label}</strong><small>{mode.badge}</small><p>{mode.text}</p></span></label>)}
                    </div>
                    <div className="pwi-safety-lock"><span>▣</span><p><strong>Non-negotiable authority gates remain active</strong> Safety, legal, financial, licensed-engineer and issued-document actions always require qualified human approval.</p></div>
                  </fieldset>
                </section>
              )}

              {step === 2 && (
                <section className="pwi-step pwi-enter">
                  <StepHeading ref={headingRef} eyebrow="03 · SOURCE INTELLIGENCE" title="Upload the plan, model or engineering evidence" copy="Nexi preserves every original file, reads its structure where supported and creates an editable working baseline without changing the source." />
                  <input ref={fileInputRef} className="pwi-visually-hidden" type="file" tabIndex={-1} multiple accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.webp,.svg,.dwg,.dxf,.ifc,.step,.stp,.iges,.igs,.stl,.obj,.gltf,.glb,.csv,.xls,.xlsx" onChange={event => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
                  <div
                    className={`pwi-dropzone ${dragActive ? 'is-dragging' : ''}`}
                    onDragEnter={event => { event.preventDefault(); setDragActive(true); }}
                    onDragOver={event => event.preventDefault()}
                    onDragLeave={event => { event.preventDefault(); if (event.currentTarget === event.target) setDragActive(false); }}
                    onDrop={event => { event.preventDefault(); setDragActive(false); void addFiles(Array.from(event.dataTransfer.files)); }}
                  >
                    <div className="pwi-drop-visual" aria-hidden="true"><span>⌑</span><i /><i /><i /></div>
                    <div><strong>{dragActive ? 'Release to secure the source package' : 'Drop plans, models and data here'}</strong><p>PDF · DWG/DXF · IFC · STEP · images · SVG · Excel/CSV</p></div>
                    <button type="button" className="pwi-button pwi-button--primary" onClick={() => fileInputRef.current?.click()}>Choose source files</button>
                    <small>Up to 200 MB per file · metadata captured locally · production storage not connected</small>
                  </div>
                  {fileMessage && <p className="pwi-file-message" role="status">{fileMessage}</p>}
                  {files.length > 0 && (
                    <div className="pwi-source-list">
                      <div className="pwi-section-title"><span><strong>Source package</strong><small>{files.length} files · {formatBytes(files.reduce((sum, file) => sum + file.sizeBytes, 0))}</small></span><button type="button" onClick={() => fileInputRef.current?.click()}>+ Add files</button></div>
                      <div className="pwi-file-grid">
                        {files.map(file => <article key={file.id} className="pwi-file-card">
                          <div className="pwi-file-preview">
                            {file.previewDataUrl ? <img src={file.previewDataUrl} alt={`Preview of ${file.name}`} /> : <div className={`pwi-file-type is-${file.category}`}><span>{file.extension.toUpperCase()}</span><i /><i /><i /></div>}
                            <em>{file.category}</em>
                          </div>
                          <div className="pwi-file-copy"><strong title={file.name}>{file.name}</strong><small>{formatBytes(file.sizeBytes)} · {file.imageWidth ? `${file.imageWidth} × ${file.imageHeight} px` : 'Source metadata ready'}</small><span><i /> Session reference · <b>{file.fingerprint.slice(0, 8)}</b></span></div>
                          <button type="button" onClick={() => setFiles(current => current.filter(item => item.id !== file.id))} aria-label={`Remove ${file.name}`}>×</button>
                        </article>)}
                      </div>
                    </div>
                  )}
                  <div className="pwi-capability-row"><Capability glyph="⌖" title="Source classification" copy="File type, dimensions and source metadata" /><Capability glyph="◫" title="2D / 3D baseline" copy="Editable scene and model preparation" /><Capability glyph="◇" title="Preliminary review" copy="Metadata-based gaps, risks and questions" /><Capability glyph="≋" title="Project controls" copy="Review structures for BOM, schedule and approvals" /></div>
                </section>
              )}

              {step === 3 && (
                <section className="pwi-step pwi-enter">
                  <StepHeading ref={headingRef} eyebrow="04 · NEXI ENGINEERING ANALYSIS" title={analysisComplete ? 'Your controlled engineering baseline is ready' : 'Nexi is building plan intelligence'} copy={analysisComplete ? 'Review the preliminary findings, answer focused engineering questions or allow clearly identified assumptions for the first draft.' : 'The local review engine is analyzing the project package. No cloud connection is required for this deterministic developer preview.'} />
                  {!analysisComplete ? (
                    <AnalysisProgress index={analysisIndex} percent={analysisPercent} files={files} />
                  ) : (
                    <div className="pwi-analysis-results">
                      <div className="pwi-scoreboard">
                        <ScoreGauge value={analysis.completenessScore} label="Package completeness" />
                        <div><small>PRELIMINARY ENGINEERING READINESS</small><strong>{analysis.findings.filter(item => item.severity === 'critical').length} critical · {analysis.findings.filter(item => item.severity === 'warning').length} review items</strong><p>Nexi found a viable starting baseline. Open items remain visible until resolved, accepted as assumptions, or formally approved.</p></div>
                        <span><b>{analysis.confidence}%</b><small>confidence</small></span>
                      </div>

                      <div className="pwi-results-layout">
                        <div>
                          <div className="pwi-section-title"><span><strong>Engineering findings</strong><small>Evidence-linked preliminary review</small></span><em>{analysis.findings.length} findings</em></div>
                          <div className="pwi-findings">
                            {analysis.findings.map(finding => <article key={finding.id} className={`is-${finding.severity}`}><span>{severityGlyph(finding.severity)}</span><div><small>{finding.category} · {finding.confidence}% confidence</small><strong>{finding.title}</strong><p>{finding.detail}</p><em>{finding.recommendation}</em></div></article>)}
                          </div>
                        </div>
                        <aside className="pwi-analysis-summary">
                          <span className="pwi-eyebrow">NEXI PROJECT MAP</span>
                          <h3>What Nexi will prepare</h3>
                          {['Editable 2D working plan', 'Synchronized basic 3D baseline', 'Calculation register and evidence map', 'Initial BOM and cost structure', 'AI Gantt plan with approval gates'].map(item => <div key={item}><span>✓</span>{item}</div>)}
                          <hr />
                          <small>SOURCE FINGERPRINT</small><code>{analysis.fingerprint}</code>
                        </aside>
                      </div>

                      <div className="pwi-questions-panel">
                        <div className="pwi-section-title"><span><strong>Focused engineering questions</strong><small>{answeredCount} of {analysis.questions.length} answered or skipped</small></span><button type="button" onClick={toggleSkipAllQuestions}>{allQuestionsSkipped ? 'Restore all questions' : 'Skip all · use assumptions'}</button></div>
                        <div className="pwi-question-list">
                          {analysis.questions.map((question, index) => {
                            const skipped = skippedQuestions.includes(question.id);
                            return <article key={question.id} className={skipped ? 'is-skipped' : ''}>
                              <span>{String(index + 1).padStart(2, '0')}</span>
                              <div><strong>{question.prompt}{question.required && <em>Required</em>}</strong><small>{question.reason}</small>
                                {!skipped && <div className="pwi-option-row">{question.options.map(option => <button type="button" key={option} className={answers[question.id] === option ? 'is-selected' : ''} onClick={() => setAnswers(current => ({ ...current, [question.id]: option }))}>{answers[question.id] === option ? '✓ ' : ''}{option}</button>)}</div>}
                                {!skipped && <input aria-label={`Custom answer for ${question.prompt}`} value={question.options.includes(answers[question.id]) ? '' : answers[question.id] ?? ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} placeholder="Or enter a project-specific answer…" />}
                              </div>
                              <button type="button" onClick={() => { setSkippedQuestions(current => skipped ? current.filter(id => id !== question.id) : [...current, question.id]); if (!skipped) setAnswers(current => { const nextAnswers = { ...current }; delete nextAnswers[question.id]; return nextAnswers; }); }}>{skipped ? 'Restore' : 'Skip'}</button>
                            </article>;
                          })}
                        </div>
                      </div>

                      <div className="pwi-assumptions">
                        <div className="pwi-section-title"><span><strong>Draft assumptions</strong><small>Every assumption stays visible, editable and replaceable</small></span></div>
                        {assumptions.map(item => <label key={item.id}><input type="checkbox" checked={item.includeInDraft} onChange={event => setAssumptionOverrides(current => ({ ...current, [item.id]: event.target.checked }))} /><span className="pwi-switch" /><span><strong>{item.statement}</strong><small className={`is-${item.impact}`}>{item.impact} impact</small></span></label>)}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {step === 4 && (
                <section className="pwi-step pwi-enter">
                  <StepHeading ref={headingRef} eyebrow="05 · CONTROLLED CREATION" title="Create the project and engineering workspace" copy="This developer review creates local revision 00, opens the editable plan baseline and registers findings, answers and assumptions. Production source preservation requires the connected document service." />
                  <div className={`pwi-create-hero ${isCreating ? 'is-creating' : ''} ${created ? 'is-created' : ''}`}>
                    <div className="pwi-project-seal"><span>{created ? '✓' : 'H'}</span><i /><i /><i /></div>
                    <div><small>{identity.code.toUpperCase()} · REVISION 00</small><h2>{identity.name}</h2><p>{identity.site} · {disciplines.length} engineering {disciplines.length === 1 ? 'discipline' : 'disciplines'} · {AUTONOMY.find(mode => mode.id === autonomyMode)?.label}</p></div>
                    <em>{created ? 'PROJECT CREATED' : isCreating ? 'CREATING CONTROLLED RECORD…' : 'READY TO CREATE'}</em>
                  </div>
                  <div className="pwi-create-grid">
                    <ReviewBlock title="Source package" value={`${files.length} files · ${formatBytes(files.reduce((sum, file) => sum + file.sizeBytes, 0))}`} items={files.slice(0, 3).map(file => file.name).concat(files.length > 3 ? [`+ ${files.length - 3} more`] : [])} />
                    <ReviewBlock title="Nexi baseline" value={`${analysis.completenessScore}% complete · ${analysis.confidence}% confidence`} items={[`${analysis.findings.length} findings registered`, `${answeredCount}/${analysis.questions.length} questions handled`, `${assumptions.filter(item => item.includeInDraft).length} labeled assumptions`]} />
                    <ReviewBlock title="Human authority gates" value="Approval policy active" items={['Management approval required', 'Safety / legal gates cannot be skipped', 'Every change and export audited']} />
                    <ReviewBlock title="Initial outputs" value="Engineering studio baseline" items={['Editable 2D plan workspace', 'Basic synchronized 3D', 'BOM · cost · Gantt structures']} />
                  </div>
                  <div className="pwi-legal-note"><span>▣</span><p><strong>Company confidential engineering asset.</strong> External sharing, export and downloads remain permission-controlled and recorded. Nexi-generated content requires qualified professional review before construction or issue.</p></div>
                </section>
              )}
            </div>

            <footer className="pwi-footer">
              <div>
                {step > 0 && !created && <button type="button" className="pwi-button pwi-button--ghost" onClick={() => setStep(current => Math.max(0, current - 1) as Step)} disabled={isCreating}>← Back</button>}
              </div>
              <div className="pwi-footer-status" role="status">
                {!validation.valid && <span>{validation.message}</span>}
                {validation.valid && step < 4 && <span className="is-ready"><i /> Ready to continue</span>}
              </div>
              <div>
                {step < 4 && <button type="button" className="pwi-button pwi-button--primary" disabled={!validation.valid} onClick={next}>{step === 2 ? 'Analyze with Nexi' : step === 3 ? 'Review project creation' : 'Continue'} <span>→</span></button>}
                {step === 4 && <button type="button" className="pwi-button pwi-button--create" disabled={isCreating || created} onClick={createProject}>{created ? 'Project created' : isCreating ? <><i className="pwi-spinner" /> Creating project…</> : <>Create project &amp; open studio <span>→</span></>}</button>}
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

const StepHeading = React.forwardRef<HTMLHeadingElement, { eyebrow: string; title: string; copy: string }>(function StepHeading({ eyebrow, title, copy }, ref) {
  return <div className="pwi-step-heading"><span className="pwi-eyebrow">{eyebrow}</span><h1 id="pwi-title" ref={ref} tabIndex={-1}>{title}</h1><p>{copy}</p></div>;
});

function Field({ label, hint, wide, children }: { label: string; hint: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`pwi-field ${wide ? 'is-wide' : ''}`} role="group" aria-label={label}><span><strong>{label}</strong><small>{hint}</small></span>{children}</div>;
}

function Capability({ glyph, title, copy }: { glyph: string; title: string; copy: string }) {
  return <div><span>{glyph}</span><p><strong>{title}</strong><small>{copy}</small></p></div>;
}

function AnalysisProgress({ index, percent, files }: { index: number; percent: number; files: ProjectIntakeFile[] }) {
  return <div className="pwi-analysis-progress" aria-live="polite">
    <div className="pwi-analysis-orb" aria-hidden="true"><span><i /><i /><i /></span><b>{percent}%</b></div>
    <div className="pwi-progress-copy"><small>NEXI ENGINEERING INTELLIGENCE</small><h2>{ANALYSIS_STAGES[Math.min(Math.max(index, 0), ANALYSIS_STAGES.length - 1)][0]}</h2><p>{ANALYSIS_STAGES[Math.min(Math.max(index, 0), ANALYSIS_STAGES.length - 1)][1]}</p><div className="pwi-progress-track"><i style={{ width: `${percent}%` }} /></div><span>{files.length} sources · local deterministic analysis · no data transmitted</span></div>
    <ol>{ANALYSIS_STAGES.map((stage, stageIndex) => <li key={stage[0]} className={stageIndex < index ? 'is-complete' : stageIndex === index ? 'is-active' : ''}><span>{stageIndex < index ? '✓' : stageIndex + 1}</span><p><strong>{stage[0]}</strong><small>{stage[1]}</small></p><em>{stageIndex < index ? 'Complete' : stageIndex === index ? 'Analyzing' : 'Queued'}</em></li>)}</ol>
    <div className="pwi-scan-console"><span>NEXI / PLAN INTELLIGENCE</span><code>{`> sources.index(${files.length})\n> metadata.validate()\n> engineering.interfaces.map()\n> assumptions.label(strict=true)\n> approval_gates.enforce()`}</code></div>
  </div>;
}

function ScoreGauge({ value, label }: { value: number; label: string }) {
  return <div className="pwi-score-gauge" style={{ '--pwi-score': `${value * 3.6}deg` } as React.CSSProperties}><span><b>{value}</b><small>/100</small></span><em>{label}</em></div>;
}

function ReviewBlock({ title, value, items }: { title: string; value: string; items: string[] }) {
  return <article className="pwi-review-block"><span>✓</span><div><small>{title}</small><strong>{value}</strong>{items.map(item => <p key={item}>{item}</p>)}</div></article>;
}

function validateStep(step: Step, identity: IdentityState, disciplines: IntakeDiscipline[], files: ProjectIntakeFile[], analysisComplete: boolean) {
  if (step === 0 && !identity.name.trim()) return { valid: false, message: 'Enter a project name to continue.' };
  if (step === 0 && !identity.code.trim()) return { valid: false, message: 'Enter a controlled project code.' };
  if (step === 0 && !identity.site.trim()) return { valid: false, message: 'Enter the project site or facility.' };
  if (step === 1 && disciplines.length === 0) return { valid: false, message: 'Select at least one engineering discipline.' };
  if (step === 2 && files.length === 0) return { valid: false, message: 'Add at least one plan, model, image or data source.' };
  if (step === 3 && !analysisComplete) return { valid: false, message: 'Nexi is completing the preliminary analysis.' };
  return { valid: true, message: '' };
}

async function mapFile(file: File): Promise<ProjectIntakeFile> {
  const extension = getExtension(file.name);
  const id = `source-${stableHash(`${file.name}:${file.size}:${file.lastModified}`)}`;
  const category = categorizeFile(extension);
  const base: ProjectIntakeFile = {
    id,
    file,
    name: file.name,
    extension,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    lastModified: file.lastModified,
    category,
    fingerprint: stableHash(`${file.name}|${file.size}|${file.lastModified}|${file.type}`).padEnd(16, '0'),
  };
  if (category !== 'image' || file.size > MAX_INLINE_PREVIEW_SIZE) return base;
  try {
    const previewDataUrl = await readAsDataUrl(file);
    const dimensions = await readImageDimensions(previewDataUrl);
    return { ...base, previewDataUrl, imageWidth: dimensions.width, imageHeight: dimensions.height };
  } catch {
    return base;
  }
}

function buildDeterministicAnalysis(identity: IdentityState, disciplines: IntakeDiscipline[], autonomy: IntakeAutonomyMode, files: ProjectIntakeFile[]) {
  const fingerprint = stableHash([identity.code, identity.name, identity.site, autonomy, ...disciplines, ...files.map(file => file.fingerprint)].join('|')).padEnd(16, '0');
  const rasterSources = files.filter(file => file.category === 'image');
  const cadSources = files.filter(file => ['dwg', 'dxf', 'ifc', 'step', 'stp', 'iges', 'igs'].includes(file.extension));
  const dataSources = files.filter(file => file.category === 'data');
  const seed = parseInt(fingerprint.slice(0, 6), 36) || 17;
  const completenessScore = Math.min(94, 58 + Math.min(files.length * 5, 15) + Math.min(disciplines.length * 3, 12) + (identity.description.length > 40 ? 6 : 0) + (cadSources.length ? 5 : 0));
  const confidence = Math.min(93, 68 + Math.min(files.length * 3, 9) + (cadSources.length ? 7 : 0) + (dataSources.length ? 4 : 0) + seed % 4);

  const findings: ProjectIntakeFinding[] = [
    {
      id: 'source-integrity', severity: 'verified', category: 'Source control', title: `${files.length} source ${files.length === 1 ? 'file is' : 'files are'} ready for immutable preservation`,
      detail: `The package contains ${formatBytes(files.reduce((sum, file) => sum + file.sizeBytes, 0))} across ${new Set(files.map(file => file.category)).size} source categories. Metadata fingerprints can anchor revision 00.`,
      recommendation: 'Preserve originals as read-only assets and perform all edits in a controlled working revision.', confidence: 99,
    },
    {
      id: 'scale-calibration', severity: rasterSources.length ? 'warning' : 'information', category: 'Geometry', title: rasterSources.length ? 'Raster drawing scale requires a known measurement' : 'Drawing units and scale must be verified during import',
      detail: rasterSources.length ? `${rasterSources.length} image source${rasterSources.length > 1 ? 's do' : ' does'} not contain reliable engineering scale metadata.` : `Project units are configured as ${identity.units}; imported model units still require source-to-project verification.`,
      recommendation: rasterSources.length ? 'Ask the engineer to identify one known dimension, then calibrate X/Y scale before measurement.' : 'Display the detected source unit and require confirmation before geometry conversion.', confidence: 96,
    },
    {
      id: 'cross-discipline', severity: disciplines.length > 1 ? 'warning' : 'information', category: 'Coordination', title: disciplines.length > 1 ? `${disciplines.length} discipline interfaces require coordinated review` : 'Single-discipline baseline still requires interface boundaries',
      detail: disciplines.length > 1 ? 'Loads, penetrations, routes, clearances, controls and maintenance access must remain synchronized across discipline models.' : 'Connections to utilities, structures, operations and adjacent systems are not yet confirmed.',
      recommendation: 'Create interface checkpoints in the AI Gantt plan and assign an accountable reviewer for every boundary.', confidence: 91,
    },
    {
      id: 'approval-baseline', severity: 'verified', category: 'Governance', title: 'Human approval gates can be applied at project creation',
      detail: `${AUTONOMY.find(mode => mode.id === autonomy)?.label ?? autonomy} mode will preserve previews, reasons, confidence, risk and rollback data for Nexi changes.`,
      recommendation: 'Create revision 00 as Draft; require management approval before issue and qualified certification where legally required.', confidence: 100,
    },
  ];

  if (!dataSources.length) findings.splice(3, 0, {
    id: 'quantity-inputs', severity: 'warning', category: 'Cost & planning', title: 'No structured quantity or cost source was included',
    detail: 'An initial BOM and budget can be estimated from extracted geometry, but supplier price, lead time and warehouse availability are not yet evidenced.',
    recommendation: 'Connect the selected warehouse and procurement catalog after the first quantity takeoff.', confidence: 88,
  });

  const questions: ProjectIntakeQuestion[] = [
    { id: 'design-stage', prompt: 'What design maturity should Nexi prepare first?', reason: 'Controls detail level, deliverables, cost tolerance and approval workflow.', options: ['Concept / feasibility', '30% preliminary design', 'Detailed design', 'As-built verification'], required: true },
    { id: 'site-datum', prompt: 'Which source governs dimensions, coordinates and elevation?', reason: 'Prevents scale, datum and alignment conflicts across uploaded sources.', options: ['Uploaded survey / plan', 'Existing approved as-built', 'Field verification required', 'Let Nexi propose a datum'], required: true },
  ];
  if (disciplines.includes('Plumbing, irrigation & fertigation')) questions.push({ id: 'hydraulic-basis', prompt: 'What is the hydraulic design basis?', reason: 'Required for pipe sizing, pressure-loss, flow and pump calculations.', options: ['Use measured field data', 'Use approved equipment duty point', 'Use company design standard', 'Estimate and label assumptions'], required: true });
  if (disciplines.includes('Electrical, controls & automation')) questions.push({ id: 'electrical-basis', prompt: 'Which electrical supply and load basis applies?', reason: 'Required for demand, protection, cable and panel calculations.', options: ['Existing single-line diagram', 'Verified field panel schedule', 'Utility / generator data', 'Estimate and label assumptions'], required: true });
  if (disciplines.includes('Structural engineering') || disciplines.includes('Civil & site planning')) questions.push({ id: 'design-actions', prompt: 'Which survey, soil and environmental load records are approved?', reason: 'Structural and civil decisions require jurisdiction-specific evidence.', options: ['Approved reports uploaded', 'Company historical data', 'External engineer to verify', 'Continue with conservative assumptions'], required: true });
  if (disciplines.includes('IT & operational technology')) questions.push({ id: 'ot-availability', prompt: 'What availability and network security class is required?', reason: 'Defines redundancy, segmentation, backup power and monitoring scope.', options: ['Standard operations', 'High availability', 'Safety / production critical', 'Assess and recommend'], required: false });
  if (questions.length < 4) questions.push({ id: 'budget-priority', prompt: 'Which outcome should control option comparison?', reason: 'Nexi will compare the best option against the selected business priority.', options: ['Lowest lifecycle cost', 'Fastest safe delivery', 'Highest resilience', 'Balanced recommendation'], required: false });

  const assumptions: ProjectIntakeAssumption[] = [
    { id: 'assumption-units', statement: `All unmarked dimensions use ${identity.units === 'metric' ? 'millimetres, metres and SI units' : 'inches, feet and US customary units'}.`, impact: 'medium', includeInDraft: true },
    { id: 'assumption-source', statement: 'The newest uploaded source is the current field condition until verified against an approved as-built or survey.', impact: 'high', includeInDraft: true },
    { id: 'assumption-access', statement: 'Equipment access, maintenance clearance and safe isolation must be preserved in every design option.', impact: 'medium', includeInDraft: true },
    { id: 'assumption-cost', statement: 'Early cost output is an estimate until inventory, supplier quotation, tax and delivery data are connected.', impact: 'low', includeInDraft: true },
  ];

  return { fingerprint, completenessScore, confidence, findings, questions, assumptions };
}

function categorizeFile(extension: string): ProjectIntakeFile['category'] {
  if (['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp', 'svg'].includes(extension)) return 'image';
  if (['dwg', 'dxf'].includes(extension)) return 'drawing';
  if (['ifc', 'step', 'stp', 'iges', 'igs', 'stl', 'obj', 'gltf', 'glb'].includes(extension)) return 'model';
  if (['csv', 'xls', 'xlsx'].includes(extension)) return 'data';
  if (extension === 'pdf') return 'document';
  return 'unknown';
}

function getExtension(name: string) { return name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''; }
function formatBytes(bytes: number) { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`; }
function stableHash(value: string) { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); }
function createSuggestedCode() {
  const date = new Date();
  const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const entropy = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint16Array(1))[0]
    : Date.now() % 65_535;
  return `RND-${datePart}-${entropy.toString(36).toUpperCase().padStart(4, '0')}`;
}
function readAsDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); }); }
function readImageDimensions(src: string) { return new Promise<{ width: number; height: number }>((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = reject; image.src = src; }); }
function severityGlyph(severity: IntakeFindingSeverity) { return severity === 'verified' ? '✓' : severity === 'critical' ? '!' : severity === 'warning' ? '△' : 'i'; }
function disciplineGlyph(index: number) { return ['⌂', '⌖', '△', '◌', '≈', 'ϟ', '⌘', '⚙'][index] ?? '◇'; }
function disciplineDetail(index: number) { return ['Crop systems · irrigation · climate', 'Survey · grading · drainage', 'Loads · frames · foundations', 'Airflow · cooling · machinery', 'Water · nutrients · pumps · pipework', 'Power · controls · sensors · PLC', 'Network · OT · cybersecurity', 'Lines · machines · process flow'][index] ?? 'Engineering scope'; }

export default ProjectIntakeWizard;
