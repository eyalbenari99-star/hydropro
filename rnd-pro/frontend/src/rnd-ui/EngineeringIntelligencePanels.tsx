import React, { useMemo, useState } from 'react';
import './engineering-intelligence.css';

export type EngineeringFinding = {
  id: string;
  severity: 'critical' | 'warning' | 'information' | 'opportunity';
  title: string;
  detail: string;
  source: string;
  confidence: number;
  status: 'Open' | 'Acknowledged' | 'Resolved';
};

type CalculationDomain = 'hydraulic' | 'electrical' | 'structural' | 'hvac';

const number = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—';

export function CalculationsPanel({ onApplyRecommendation, onAudit }: {
  onApplyRecommendation: (message: string) => void;
  onAudit: (message: string) => void;
}) {
  const [domain, setDomain] = useState<CalculationDomain>('hydraulic');
  return (
    <div className="eng-workbench eng-enter">
      <header className="eng-workbench__header">
        <div><span>LIVE ENGINEERING CALCULATIONS</span><h2>Transparent, editable and reviewable</h2><p>Every result exposes inputs, formula, units, assumptions and the approval boundary.</p></div>
        <div className="eng-domain-tabs" role="tablist" aria-label="Calculation discipline">
          {(['hydraulic', 'electrical', 'structural', 'hvac'] as CalculationDomain[]).map(item => (
            <button key={item} className={domain === item ? 'is-active' : ''} onClick={() => setDomain(item)}>{item}</button>
          ))}
        </div>
      </header>
      {domain === 'hydraulic' && <HydraulicCalculator onApply={onApplyRecommendation} onAudit={onAudit} />}
      {domain === 'electrical' && <ElectricalCalculator onAudit={onAudit} />}
      {domain === 'structural' && <StructuralCalculator onAudit={onAudit} />}
      {domain === 'hvac' && <HvacCalculator onAudit={onAudit} />}
    </div>
  );
}

function HydraulicCalculator({ onApply, onAudit }: { onApply: (message: string) => void; onAudit: (message: string) => void }) {
  const [flow, setFlow] = useState(10.35);
  const [diameter, setDiameter] = useState(50);
  const [length, setLength] = useState(186);
  const [roughness, setRoughness] = useState(150);
  const [staticHead, setStaticHead] = useState(11.5);
  const [efficiency, setEfficiency] = useState(68);
  const result = useMemo(() => hydraulic(flow, diameter, length, roughness, staticHead, efficiency), [flow, diameter, length, roughness, staticHead, efficiency]);
  const alternative = useMemo(() => hydraulic(flow, 65, length, roughness, staticHead, efficiency), [flow, length, roughness, staticHead, efficiency]);
  const highVelocity = result.velocity > 1.8;
  return <div className="eng-calculation-layout">
    <section className="eng-card eng-input-card"><CardTitle eyebrow="DESIGN INPUTS" title="Main irrigation line" badge="Revision 12" />
      <div className="eng-input-grid">
        <MetricInput label="Design flow" value={flow} unit="m³/h" onChange={setFlow} />
        <MetricInput label="Internal diameter" value={diameter} unit="mm" onChange={setDiameter} />
        <MetricInput label="Equivalent length" value={length} unit="m" onChange={setLength} />
        <MetricInput label="Hazen-Williams C" value={roughness} unit="C" onChange={setRoughness} />
        <MetricInput label="Static head" value={staticHead} unit="m" onChange={setStaticHead} />
        <MetricInput label="Pump efficiency" value={efficiency} unit="%" onChange={setEfficiency} />
      </div>
      <EvidenceLine title="Source set" detail="Plan v12 · Irrigation design basis DB-07 · Pipe manufacturer table 2026-07" />
      <EvidenceLine title="Assumption" detail="Two zones may overlap for 8 minutes during transition." tone="amber" />
    </section>
    <section className="eng-card eng-result-card"><CardTitle eyebrow="CALCULATED DUTY" title="Hydraulic result" badge={`${highVelocity ? 'High impact' : 'Within limit'}`} tone={highVelocity ? 'red' : 'green'} />
      <div className="eng-result-grid">
        <ResultMetric label="Velocity" value={`${number(result.velocity)} m/s`} limit="Limit ≤ 1.80" state={highVelocity ? 'bad' : 'good'} />
        <ResultMetric label="Friction loss" value={`${number(result.frictionHead)} m`} limit={`${number(result.frictionHead / length * 100)} m / 100 m`} />
        <ResultMetric label="Total dynamic head" value={`${number(result.totalHead)} m`} limit="Includes 10% allowance" />
        <ResultMetric label="Estimated shaft power" value={`${number(result.powerKw)} kW`} limit={`${efficiency}% efficiency`} />
      </div>
      <div className="eng-formula"><strong>Hazen–Williams</strong><code>hƒ = 10.67 × L × Q^1.852 ÷ (C^1.852 × d^4.87)</code><span>Q in m³/s · d in m · SI units</span></div>
    </section>
    <section className="eng-card eng-compare-card"><CardTitle eyebrow="NEXI OPTION COMPARISON" title="DN50 versus recommended DN65" badge="96% confidence" tone="cyan" />
      <div className="eng-option-table">
        <div className="eng-option-table__head"><span>Criterion</span><span>Current DN50</span><span>Option DN65</span></div>
        <CompareRow label="Velocity" current={`${number(result.velocity)} m/s`} proposed={`${number(alternative.velocity)} m/s`} better />
        <CompareRow label="Friction loss" current={`${number(result.frictionHead)} m`} proposed={`${number(alternative.frictionHead)} m`} better />
        <CompareRow label="Pump power" current={`${number(result.powerKw)} kW`} proposed={`${number(alternative.powerKw)} kW`} better />
        <CompareRow label="Estimated cost change" current="Baseline" proposed="+ PHP 46,800" />
      </div>
      <div className="eng-action-row"><button className="eng-btn eng-btn--quiet" onClick={() => onAudit('Hydraulic evidence package opened')}>Open evidence</button><button className="eng-btn eng-btn--primary" onClick={() => onApply(`Preview DN65 main: velocity ${number(alternative.velocity)} m/s, TDH ${number(alternative.totalHead)} m, estimated delta PHP 46,800`)}>Preview DN65 in plan</button></div>
    </section>
  </div>;
}

function ElectricalCalculator({ onAudit }: { onAudit: (message: string) => void }) {
  const [load, setLoad] = useState(48);
  const [voltage, setVoltage] = useState(400);
  const [pf, setPf] = useState(0.86);
  const [length, setLength] = useState(82);
  const [cable, setCable] = useState(35);
  const current = load * 1000 / (Math.sqrt(3) * voltage * pf);
  const resistance = 0.0175 * length / cable;
  const drop = Math.sqrt(3) * current * resistance;
  const dropPct = drop / voltage * 100;
  const breaker = [63, 80, 100, 125, 160].find(size => size >= current * 1.25) ?? 200;
  return <GenericCalculation title="Three-phase feeder check" source="IEC/company feeder rule set · manufacturer cable data" onAudit={onAudit}
    inputs={<><MetricInput label="Connected load" value={load} unit="kW" onChange={setLoad} /><MetricInput label="Voltage" value={voltage} unit="V" onChange={setVoltage} /><MetricInput label="Power factor" value={pf} unit="pf" step={0.01} onChange={setPf} /><MetricInput label="Route length" value={length} unit="m" onChange={setLength} /><MetricInput label="Cable area" value={cable} unit="mm²" onChange={setCable} /></>}
    results={<><ResultMetric label="Design current" value={`${number(current, 1)} A`} limit="Calculated 3-phase" /><ResultMetric label="Breaker suggestion" value={`${breaker} A`} limit="Final coordination required" /><ResultMetric label="Voltage drop" value={`${number(dropPct)}%`} limit="Project limit ≤ 3%" state={dropPct <= 3 ? 'good' : 'bad'} /><ResultMetric label="Estimated drop" value={`${number(drop)} V`} limit={`${length} m route`} /></>} />;
}

function StructuralCalculator({ onAudit }: { onAudit: (message: string) => void }) {
  const [span, setSpan] = useState(6);
  const [areaLoad, setAreaLoad] = useState(0.75);
  const [tributary, setTributary] = useState(3);
  const [sectionModulus, setSectionModulus] = useState(145);
  const lineLoad = areaLoad * tributary;
  const moment = lineLoad * span * span / 8;
  const stress = moment * 1e6 / (sectionModulus * 1e3);
  return <GenericCalculation title="Preliminary simply-supported beam check" source="Concept-stage calculation · licensed structural review mandatory" onAudit={onAudit}
    inputs={<><MetricInput label="Clear span" value={span} unit="m" step={0.1} onChange={setSpan} /><MetricInput label="Area load" value={areaLoad} unit="kPa" step={0.05} onChange={setAreaLoad} /><MetricInput label="Tributary width" value={tributary} unit="m" step={0.1} onChange={setTributary} /><MetricInput label="Section modulus" value={sectionModulus} unit="cm³" onChange={setSectionModulus} /></>}
    results={<><ResultMetric label="Line load" value={`${number(lineLoad)} kN/m`} limit="Unfactored concept load" /><ResultMetric label="Max. moment" value={`${number(moment)} kN·m`} limit="wL² / 8" /><ResultMetric label="Bending stress" value={`${number(stress)} MPa`} limit="Material/design factors pending" state={stress < 150 ? 'good' : 'bad'} /><ResultMetric label="Review gate" value="Engineer required" limit="Cannot be skipped" state="warn" /></>} />;
}

function HvacCalculator({ onAudit }: { onAudit: (message: string) => void }) {
  const [area, setArea] = useState(420);
  const [sensible, setSensible] = useState(145);
  const [latent, setLatent] = useState(28);
  const [diversity, setDiversity] = useState(0.9);
  const coolingKw = area * (sensible + latent) / 1000 * diversity;
  const tons = coolingKw / 3.517;
  const airflow = coolingKw * 1000 / (1.2 * 1005 * 10) * 3600;
  return <GenericCalculation title="Preliminary cooling and airflow estimate" source="Project climate basis · concept-stage load density method" onAudit={onAudit}
    inputs={<><MetricInput label="Conditioned area" value={area} unit="m²" onChange={setArea} /><MetricInput label="Sensible load" value={sensible} unit="W/m²" onChange={setSensible} /><MetricInput label="Latent load" value={latent} unit="W/m²" onChange={setLatent} /><MetricInput label="Diversity" value={diversity} unit="factor" step={0.05} onChange={setDiversity} /></>}
    results={<><ResultMetric label="Cooling load" value={`${number(coolingKw)} kW`} limit="Preliminary" /><ResultMetric label="Cooling capacity" value={`${number(tons)} TR`} limit="Before equipment selection" /><ResultMetric label="Supply airflow" value={`${number(airflow, 0)} m³/h`} limit="At 10 K ΔT" /><ResultMetric label="Detailed model" value="Required" limit="Envelope, solar and process loads" state="warn" /></>} />;
}

function GenericCalculation({ title, source, inputs, results, onAudit }: { title: string; source: string; inputs: React.ReactNode; results: React.ReactNode; onAudit: (message: string) => void }) {
  return <div className="eng-calculation-layout eng-calculation-layout--generic"><section className="eng-card eng-input-card"><CardTitle eyebrow="DESIGN INPUTS" title={title} badge="Editable" /><div className="eng-input-grid">{inputs}</div><EvidenceLine title="Evidence basis" detail={source} /></section><section className="eng-card eng-result-card"><CardTitle eyebrow="CALCULATED RESULT" title="Live engineering output" badge="Traceable" tone="cyan" /><div className="eng-result-grid">{results}</div><div className="eng-action-row"><button className="eng-btn eng-btn--quiet" onClick={() => onAudit(`${title} calculation record opened`)}>View calculation record</button><button className="eng-btn eng-btn--primary" onClick={() => onAudit(`${title} sent for discipline review`)}>Send for discipline review</button></div></section></div>;
}

type BomRow = { id: string; item: string; specification: string; qty: number; unit: string; stock: number; reserved: number; min: number; unitCost: number; supplier: string; lead: number; requested?: boolean };
const initialBom: BomRow[] = [
  { id: 'PIP-065', item: 'HDPE main pipe', specification: 'PE100 · SDR11 · DN65', qty: 210, unit: 'm', stock: 132, reserved: 40, min: 80, unitCost: 486, supplier: 'AquaFlow PH', lead: 12 },
  { id: 'VLV-065', item: 'Butterfly valve', specification: 'DN65 · PN16 · EPDM', qty: 8, unit: 'pc', stock: 14, reserved: 2, min: 6, unitCost: 8350, supplier: 'AVK Partner', lead: 21 },
  { id: 'REG-032', item: 'Pressure regulator', specification: 'DN32 · 1.5 bar', qty: 18, unit: 'pc', stock: 7, reserved: 3, min: 12, unitCost: 4280, supplier: 'Netafim PH', lead: 18 },
  { id: 'SOL-032', item: 'Solenoid valve', specification: '24 VDC · DN32 · NC', qty: 18, unit: 'pc', stock: 25, reserved: 5, min: 10, unitCost: 6890, supplier: 'Bermad PH', lead: 9 },
  { id: 'CAB-4C', item: 'Control cable', specification: '4C × 1.5 mm² · UV rated', qty: 420, unit: 'm', stock: 680, reserved: 160, min: 250, unitCost: 119, supplier: 'Phelps Dodge', lead: 7 },
];

export function BomProcurementPanel({ onAudit }: { onAudit: (message: string) => void }) {
  const [rows, setRows] = useState(initialBom);
  const [warehouse, setWarehouse] = useState('Packaging Center Warehouse');
  const total = rows.reduce((sum, row) => sum + row.qty * row.unitCost, 0);
  const shortages = rows.filter(row => row.stock - row.reserved < row.qty);
  const updateQty = (id: string, qty: number) => setRows(items => items.map(item => item.id === id ? { ...item, qty: Math.max(0, qty) } : item));
  const request = (id: string) => {
    setRows(items => items.map(item => item.id === id ? { ...item, requested: true } : item));
    onAudit(`Project-coded procurement request created for ${id}`);
  };
  return <div className="eng-workbench eng-enter">
    <header className="eng-workbench__header"><div><span>PROJECT-CODED MATERIAL CONTROL</span><h2>BOM, warehouse availability and procurement</h2><p>Quantities remain linked to the drawing, selected warehouse, project budget and approval thresholds.</p></div><label className="eng-select-field"><span>Check warehouse</span><select value={warehouse} onChange={event => setWarehouse(event.target.value)}><option>Packaging Center Warehouse</option><option>Maintenance Warehouse</option><option>GH Operations Store</option></select></label></header>
    <div className="eng-bom-summary"><SummaryTile label="Estimated material value" value={`PHP ${total.toLocaleString('en-PH')}`} detail="Before tax and freight" /><SummaryTile label="BOM lines" value={String(rows.length)} detail="5 specifications verified" /><SummaryTile label="Shortage lines" value={String(shortages.length)} detail="Project request required" tone={shortages.length ? 'red' : 'green'} /><SummaryTile label="Warehouse" value="Live check" detail={warehouse} tone="cyan" /></div>
    <section className="eng-card eng-bom-card"><div className="eng-bom-table eng-bom-table--head"><span>Item / specification</span><span>Required</span><span>Available</span><span>Min level</span><span>Unit cost</span><span>Supply</span><span /></div>{rows.map(row => {
      const available = row.stock - row.reserved;
      const shortage = Math.max(0, row.qty - available);
      return <div className={`eng-bom-table ${shortage ? 'has-shortage' : ''}`} key={row.id}><span><b>{row.id}</b><strong>{row.item}</strong><small>{row.specification}</small></span><span><input aria-label={`${row.item} required quantity`} type="number" value={row.qty} onChange={event => updateQty(row.id, Number(event.target.value))} /><small>{row.unit}</small></span><span><strong>{available} {row.unit}</strong><small>{row.stock} stock · {row.reserved} reserved</small></span><span><strong>{row.min} {row.unit}</strong><small>{available < row.min ? 'Below minimum' : 'Healthy'}</small></span><span><strong>PHP {row.unitCost.toLocaleString()}</strong><small>PHP {(row.qty * row.unitCost).toLocaleString()}</small></span><span><strong>{row.supplier}</strong><small>{row.lead} day lead</small></span><span>{shortage ? <button className="eng-btn eng-btn--small eng-btn--warning" disabled={row.requested} onClick={() => request(row.id)}>{row.requested ? 'Requested' : `Request ${shortage}`}</button> : <em className="eng-stock-ok">Reserved</em>}</span></div>;
    })}</section>
  </div>;
}

type ScheduleTask = { id: string; name: string; owner: string; start: number; duration: number; progress: number; gate?: boolean; risk?: boolean };
const seedTasks: ScheduleTask[] = [
  { id: 'T1', name: 'Complete detailed hydraulic design', owner: 'M. Santos', start: 0, duration: 4, progress: 72, risk: true },
  { id: 'T2', name: 'Engineering and safety review', owner: 'QA + External PE', start: 4, duration: 3, progress: 15, gate: true },
  { id: 'T3', name: 'Management approval', owner: 'President', start: 7, duration: 1, progress: 0, gate: true },
  { id: 'T4', name: 'Procure shortage materials', owner: 'Procurement', start: 8, duration: 12, progress: 0, risk: true },
  { id: 'T5', name: 'Site preparation and prefabrication', owner: 'Maintenance', start: 9, duration: 7, progress: 0 },
  { id: 'T6', name: 'Installation', owner: 'Project Team', start: 20, duration: 8, progress: 0 },
  { id: 'T7', name: 'Testing and commissioning', owner: 'R&D + Operations', start: 28, duration: 4, progress: 0, gate: true },
];

export function SmartSchedulePanel({ onAudit }: { onAudit: (message: string) => void }) {
  const [tasks, setTasks] = useState(seedTasks);
  const [optimized, setOptimized] = useState(false);
  const finish = Math.max(...tasks.map(task => task.start + task.duration));
  const optimize = () => {
    setTasks(items => items.map(task => task.id === 'T5' ? { ...task, start: 8 } : task.id === 'T7' ? { ...task, start: 27, duration: 3 } : task));
    setOptimized(true);
    onAudit('Nexi schedule option prepared: 2 days recovered without bypassing approval gates');
  };
  return <div className="eng-workbench eng-enter">
    <header className="eng-workbench__header"><div><span>AI CRITICAL-PATH PLANNING</span><h2>Project schedule and approval gates</h2><p>Nexi may optimize sequencing and resources, but protected reviews remain locked milestones.</p></div><button className="eng-btn eng-btn--primary" onClick={optimize}>{optimized ? 'Optimized option active' : 'Nexi optimize schedule'}</button></header>
    <div className="eng-schedule-summary"><SummaryTile label="Forecast duration" value={`${finish} days`} detail={optimized ? '2 days recovered' : 'Current working plan'} /><SummaryTile label="Critical tasks" value="4" detail="2 supply · 2 approval" tone="red" /><SummaryTile label="Protected gates" value="3" detail="Cannot be bypassed" tone="amber" /><SummaryTile label="Confidence" value="87%" detail="Based on 500 simulations" tone="cyan" /></div>
    <section className="eng-card eng-gantt"><div className="eng-gantt__calendar"><span>Task / owner</span>{[0, 5, 10, 15, 20, 25, 30].map(day => <b key={day}>D{day + 1}</b>)}</div>{tasks.map(task => <div className="eng-gantt__row" key={task.id}><span><strong>{task.name}</strong><small>{task.owner}</small></span><div className="eng-gantt__track"><i className={`${task.gate ? 'is-gate' : ''} ${task.risk ? 'is-risk' : ''}`} style={{ left: `${task.start / 34 * 100}%`, width: `${task.duration / 34 * 100}%` }}><em style={{ width: `${task.progress}%` }} /><b>{task.duration}d</b></i></div></div>)}</section>
  </div>;
}

export function EngineeringReviewPanel({ findings, onFindingChange, onSubmit, onAudit }: {
  findings: EngineeringFinding[];
  onFindingChange: (id: string, status: EngineeringFinding['status']) => void;
  onSubmit: () => void;
  onAudit: (message: string) => void;
}) {
  const open = findings.filter(item => item.status !== 'Resolved');
  const assumptions = [
    ['A-01', 'Two irrigation zones may overlap for eight minutes', 'Needs operations confirmation', 'High'],
    ['A-02', 'Available pump curve corresponds to 60 Hz operation', 'Manufacturer document M-442', 'Medium'],
    ['A-03', 'Existing trench route is reusable with 20% spare width', 'Site verification task open', 'Medium'],
    ['A-04', 'Warehouse quantities reflect reservations through 06:02', 'Live inventory snapshot', 'Low'],
  ];
  return <div className="eng-workbench eng-enter">
    <header className="eng-workbench__header"><div><span>TRACEABLE ENGINEERING REVIEW</span><h2>Findings, assumptions, evidence and approvals</h2><p>No issue disappears silently. Every resolution records author, evidence, time and revision.</p></div><button className="eng-btn eng-btn--primary" disabled={open.some(item => item.severity === 'critical')} onClick={onSubmit}>Submit controlled revision</button></header>
    <div className="eng-review-layout"><section className="eng-card"><CardTitle eyebrow="NEXI REVIEW" title={`${open.length} unresolved findings`} badge={`${findings.length} total`} />
      <div className="eng-findings">{findings.map(item => <article key={item.id} className={`eng-finding is-${item.severity}`}><span className="eng-finding__severity">{item.severity}</span><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.source} · {item.confidence}% confidence</small></div><select value={item.status} onChange={event => onFindingChange(item.id, event.target.value as EngineeringFinding['status'])}><option>Open</option><option>Acknowledged</option><option>Resolved</option></select></article>)}</div>
    </section><section className="eng-card"><CardTitle eyebrow="ASSUMPTION REGISTER" title="Explicit design assumptions" badge="4 active" tone="amber" /><div className="eng-assumption-list">{assumptions.map(item => <button key={item[0]} onClick={() => onAudit(`Assumption ${item[0]} evidence opened`)}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]}</small></span><em>{item[3]}</em></button>)}</div></section></div>
    <section className="eng-card eng-approval-chain"><CardTitle eyebrow="CONTROLLED APPROVAL PATH" title="Revision 12 authority gates" badge="President final authority" tone="cyan" /><div className="eng-approval-steps"><ApprovalStep n="01" label="Engineering review" owner="M. Santos" state="In progress" /><ApprovalStep n="02" label="Safety / quality" owner="Qualified reviewer" state="Waiting" /><ApprovalStep n="03" label="Management approval" owner="President / CEO" state="Waiting" /><ApprovalStep n="04" label="Issued package" owner="Document control" state="Locked" /></div></section>
  </div>;
}

export function hydraulic(flowM3h: number, diameterMm: number, lengthM: number, c: number, staticHeadM: number, efficiencyPct: number) {
  const flowM3s = flowM3h / 3600;
  const diameterM = diameterMm / 1000;
  const area = Math.PI * diameterM * diameterM / 4;
  const velocity = flowM3s / Math.max(area, 0.000001);
  const frictionHead = 10.67 * lengthM * Math.pow(flowM3s, 1.852) / (Math.pow(Math.max(c, 1), 1.852) * Math.pow(Math.max(diameterM, 0.001), 4.87));
  const totalHead = (staticHeadM + frictionHead) * 1.1;
  const powerKw = 1000 * 9.81 * flowM3s * totalHead / (Math.max(efficiencyPct, 1) / 100) / 1000;
  return { velocity, frictionHead, totalHead, powerKw };
}

function CardTitle({ eyebrow, title, badge, tone = 'neutral' }: { eyebrow: string; title: string; badge: string; tone?: string }) { return <div className="eng-card-title"><div><span>{eyebrow}</span><h3>{title}</h3></div><em className={`is-${tone}`}>{badge}</em></div>; }
function MetricInput({ label, value, unit, step = 1, onChange }: { label: string; value: number; unit: string; step?: number; onChange: (value: number) => void }) { return <label className="eng-metric-input"><span>{label}</span><div><input type="number" step={step} value={value} onChange={event => onChange(Number(event.target.value))} /><b>{unit}</b></div></label>; }
function ResultMetric({ label, value, limit, state = 'neutral' }: { label: string; value: string; limit: string; state?: 'neutral' | 'good' | 'bad' | 'warn' }) { return <div className={`eng-result-metric is-${state}`}><span>{label}</span><strong>{value}</strong><small>{limit}</small></div>; }
function EvidenceLine({ title, detail, tone = 'cyan' }: { title: string; detail: string; tone?: string }) { return <div className={`eng-evidence is-${tone}`}><span>◆</span><div><strong>{title}</strong><p>{detail}</p></div></div>; }
function CompareRow({ label, current, proposed, better }: { label: string; current: string; proposed: string; better?: boolean }) { return <div><span>{label}</span><b>{current}</b><strong className={better ? 'is-better' : ''}>{proposed}</strong></div>; }
function SummaryTile({ label, value, detail, tone = 'neutral' }: { label: string; value: string; detail: string; tone?: string }) { return <article className={`eng-summary-tile is-${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function ApprovalStep({ n, label, owner, state }: { n: string; label: string; owner: string; state: string }) { return <div><b>{n}</b><span><strong>{label}</strong><small>{owner}</small></span><em>{state}</em></div>; }
