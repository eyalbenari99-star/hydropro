import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RNDController } from '../main';
import { cockpitProjects, type CockpitProject } from '../rnd-core/review-data';
import { CockpitOverview } from './CockpitOverview';
import { EngineeringStudioV2 } from './EngineeringStudioV2';
import { NexiOrb } from './NexiOrb';
import { ProjectIntakeWizard, type ProjectIntakeResult } from './ProjectIntakeWizard';
import './rnd-system.css';

type View = 'closed' | 'overview' | 'portfolio' | 'studio' | 'approvals' | 'knowledge' | 'governance';

const navigation: { id: Exclude<View, 'closed' | 'studio'>; label: string; glyph: string; count?: number }[] = [
  { id: 'overview', label: 'Executive cockpit', glyph: '⌂' },
  { id: 'portfolio', label: 'Project portfolio', glyph: '▦', count: 18 },
  { id: 'approvals', label: 'Reviews & approvals', glyph: '✓', count: 7 },
  { id: 'knowledge', label: 'Engineering knowledge', glyph: '◎' },
  { id: 'governance', label: 'Nexi governance', glyph: '◇', count: 3 },
];

export function RNDApp({ onReady }: { onReady: (controller: RNDController) => void }) {
  const [view, setView] = useState<View>('closed');
  const [projects, setProjects] = useState<CockpitProject[]>(() => loadProjects());
  const [activeProject, setActiveProject] = useState<CockpitProject>(projects[0] ?? cockpitProjects[0]);
  const [activeIntake, setActiveIntake] = useState<ProjectIntakeResult | undefined>();
  const [commandOpen, setCommandOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [shellNotice, setShellNotice] = useState('');
  const controllerRef = useRef<RNDController | null>(null);

  useEffect(() => {
    const controller: RNDController = {
      open: () => setView('overview'),
      close: () => setView('closed'),
      openItem: id => {
        setActiveIntake(undefined);
        setActiveProject(projects.find(project => project.id === id) ?? projects[0] ?? cockpitProjects[0]);
        setView('studio');
      },
      newBoard: () => setIntakeOpen(true),
    };
    controllerRef.current = controller;
    onReady(controller);
  }, [onReady, projects]);

  useEffect(() => {
    try { localStorage.setItem('hnx-rnd-pro-projects', JSON.stringify(projects)); } catch { /* local review fallback */ }
  }, [projects]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(open => !open);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const currentLabel = useMemo(() => navigation.find(item => item.id === view)?.label ?? 'Professional Engineering Studio', [view]);
  const openStudio = (project: CockpitProject) => {
    setActiveIntake(undefined);
    setActiveProject(project);
    setView('studio');
  };

  const completeIntake = (result: ProjectIntakeResult) => {
    const newProject: CockpitProject = {
      id: result.project.id,
      code: result.project.code,
      title: result.project.name,
      site: result.project.site,
      discipline: result.project.disciplines.slice(0, 2).join(' · '),
      phase: 'Nexi baseline review',
      progress: 8,
      confidence: result.analysis.confidence,
      budgetUsed: 0,
      budgetTotal: 0,
      openRisks: result.analysis.findings.filter(item => item.severity === 'critical' || item.severity === 'warning').length,
      approvals: 1,
      tasksDue: result.analysis.questions.length,
      owner: 'Eyal Ben Ari',
      updated: 'Just now',
      status: result.analysis.findings.some(item => item.severity === 'critical') ? 'Critical' : 'For review',
      accent: 'cyan',
    };
    setProjects(items => [newProject, ...items.filter(item => item.id !== newProject.id)]);
    setActiveProject(newProject);
    setActiveIntake(result);
    setIntakeOpen(false);
    setView('studio');
  };

  const announce = (message: string) => {
    setShellNotice(message);
    window.setTimeout(() => setShellNotice(''), 2600);
  };

  if (view === 'closed') return null;
  // The key is an isolation boundary. Without it, opening another project while
  // the studio is already mounted reuses the previous project's React state and
  // can autosave that drawing under the new project's storage key.
  if (view === 'studio') return <>
    <EngineeringStudioV2 key={activeProject.id} project={activeProject} intake={activeIntake} onBack={() => setView('overview')} />
    {intakeOpen && <ProjectIntakeWizard onCancel={() => setIntakeOpen(false)} onComplete={completeIntake} />}
  </>;

  return (
    <div className="rnd-shell">
      <aside className="rnd-sidebar">
        <div className="rnd-brand">
          <div className="rnd-brand__mark"><span>H</span><i /></div>
          <div><strong>HydroNexis-AI</strong><span>Engineering OS</span></div>
        </div>
        <div className="rnd-sidebar__section-label">R&amp;D &amp; PLANNING</div>
        <nav className="rnd-navigation" aria-label="R&D module navigation">
          {navigation.map(item => (
            <button key={item.id} className={view === item.id ? 'is-active' : ''} onClick={() => setView(item.id)}>
              <span className="rnd-navigation__glyph">{item.glyph}</span>
              <span>{item.label}</span>
              {item.count && <b>{item.id === 'portfolio' ? projects.length : item.count}</b>}
            </button>
          ))}
        </nav>
        <div className="rnd-sidebar__projects">
          <div className="rnd-sidebar__section-label">PINNED PROJECTS</div>
          {projects.slice(0, 3).map(project => (
            <button key={project.id} onClick={() => openStudio(project)}>
              <span className={`rnd-project-dot is-${project.accent}`} />
              <span><strong>{project.code}</strong><small>{project.title}</small></span>
            </button>
          ))}
        </div>
        <div className="rnd-sidebar__footer">
          <button className="rnd-sidebar-nexi" onClick={() => setCommandOpen(true)}>
            <NexiOrb size="small" />
            <span><strong>Nexi is monitoring</strong><small>{projects.length} projects · 3 alerts</small></span>
            <i>⌘K</i>
          </button>
          <div className="rnd-user-chip"><span>EB</span><div><strong>Eyal Ben Ari</strong><small>President · Full authority</small></div><button onClick={() => setView('governance')} title="Open access and governance">•••</button></div>
        </div>
      </aside>

      <div className="rnd-main">
        <header className="rnd-topbar">
          <div><span className="rnd-topbar__module">R&amp;D &amp; PLANNING</span><strong>{currentLabel}</strong></div>
          <button className="rnd-command-search" onClick={() => setCommandOpen(true)}><span>⌕</span> Ask Nexi, search projects, drawings, evidence… <kbd>⌘ K</kbd></button>
          <div className="rnd-topbar__actions">
            <button className="rnd-icon-button" aria-label="Notifications" onClick={() => setView('approvals')}>♢<b>4</b></button>
            <button className="rnd-button rnd-button--primary" onClick={() => controllerRef.current?.newBoard()}>+ New project</button>
            <button className="rnd-close-button" onClick={() => controllerRef.current?.close()}>× Close</button>
          </div>
        </header>

        <main className="rnd-content">
          {view === 'overview' && <CockpitOverview projects={projects} onOpenStudio={openStudio} onNavigate={target => setView(target as View)} />}
          {view === 'portfolio' && <PortfolioView projects={projects} onOpen={openStudio} onNew={() => setIntakeOpen(true)} />}
          {view === 'approvals' && <ApprovalsView onOpen={openStudio} />}
          {view === 'knowledge' && <KnowledgeView onNotice={announce} />}
          {view === 'governance' && <GovernanceView onNotice={announce} />}
        </main>
      </div>

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onOpenStudio={() => { setCommandOpen(false); openStudio(projects[0] ?? cockpitProjects[0]); }} onApprovals={() => { setCommandOpen(false); setView('approvals'); }} onCreate={() => { setCommandOpen(false); setIntakeOpen(true); }} />}
      {intakeOpen && <ProjectIntakeWizard onCancel={() => setIntakeOpen(false)} onComplete={completeIntake} />}
      {shellNotice && <div className="rnd-shell-toast"><span>✓</span>{shellNotice}</div>}
    </div>
  );
}

function PortfolioView({ projects, onOpen, onNew }: { projects: CockpitProject[]; onOpen: (project: CockpitProject) => void; onNew: () => void }) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'risk' | 'approval'>('all');
  const [query, setQuery] = useState('');
  const visibleProjects = projects.filter(project => {
    const matchesQuery = `${project.code} ${project.title} ${project.site} ${project.discipline}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all'
      || (filter === 'mine' && project.owner.toLowerCase().includes('eyal'))
      || (filter === 'risk' && (project.status === 'Critical' || project.status === 'Watch'))
      || (filter === 'approval' && project.approvals > 0);
    return matchesQuery && matchesFilter;
  });
  return (
    <div className="rnd-page rnd-enter">
      <PageIntro eyebrow="CONTROLLED PROJECT SYSTEM" title="Engineering project portfolio" copy="Every plan, model, calculation, cost, schedule, approval, and issued package stays connected to one traceable project record." action="Create project" onAction={onNew} />
      <div className="rnd-filterbar"><button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>All {projects.length}</button><button className={filter === 'mine' ? 'is-active' : ''} onClick={() => setFilter('mine')}>My projects</button><button className={filter === 'risk' ? 'is-active' : ''} onClick={() => setFilter('risk')}>At risk</button><button className={filter === 'approval' ? 'is-active' : ''} onClick={() => setFilter('approval')}>Awaiting approval</button><span /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter project portfolio…" /></div>
      <div className="rnd-table-panel">
        <div className="rnd-data-table rnd-data-table--header"><span>Project</span><span>Discipline / phase</span><span>Progress</span><span>Risk</span><span>Owner</span><span>Updated</span><span /></div>
        {visibleProjects.map(project => (
          <button className="rnd-data-table" key={project.id} onClick={() => onOpen(project)}>
            <span><b>{project.code}</b><strong>{project.title}</strong><small>{project.site}</small></span>
            <span><strong>{project.discipline}</strong><small>{project.phase}</small></span>
            <span><b>{project.progress}%</b><i className="rnd-mini-progress"><i style={{ width: `${project.progress}%` }} /></i></span>
            <span><em className={`rnd-status rnd-status--${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</em><small>{project.openRisks} open</small></span>
            <span><strong>{project.owner}</strong></span><span>{project.updated}</span><span>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ApprovalsView({ onOpen }: { onOpen: (project: CockpitProject) => void }) {
  const rows = [
    ['Safety review', 'GH7 irrigation v12', 'Hydraulic change · High impact', 'M. Santos', '18h', 'critical'],
    ['Management approval', 'Packaging Line 02', 'Concept option B · PHP 8.9M', 'A. Reyes', '6h', 'warning'],
    ['Engineering review', 'Farm OT network redesign', 'Architecture revision 04', 'IT Engineering', '3h', 'information'],
    ['Issue approval', 'GH4 roof remediation', 'IFC package revision 09', 'J. Valdez', '42m', 'nominal'],
  ];
  return (
    <div className="rnd-page rnd-enter"><PageIntro eyebrow="HUMAN AUTHORITY GATES" title="Reviews and approvals" copy="Nexi prepares the evidence. Authorized people make safety, professional, financial, and issue decisions." />
      <div className="rnd-approval-layout"><section className="rnd-panel"><div className="rnd-panel__header"><div><span className="rnd-eyebrow">DECISION QUEUE</span><h2>Requires your attention</h2></div><span className="rnd-count-badge">7 waiting</span></div>{rows.map((row, index) => <button className="rnd-approval-row" key={row[1]} onClick={() => onOpen(cockpitProjects[index % cockpitProjects.length])}><span className={`rnd-priority-mark is-${row[5]}`} /><span><small>{row[0]}</small><strong>{row[1]}</strong><em>{row[2]}</em></span><span><small>Submitted by</small><b>{row[3]}</b></span><span><small>Waiting</small><b>{row[4]}</b></span><span>Review →</span></button>)}</section><aside className="rnd-panel rnd-decision-rules"><span className="rnd-eyebrow">ACTIVE POLICY</span><h2>Approval safeguards</h2><Rule title="Professional certification" text="Licensed engineer approval cannot be skipped." /><Rule title="Safety-critical change" text="Independent safety review and evidence required." /><Rule title="President override" text="Administrative stages only; reason and expiry are audited." /><Rule title="Issued drawings" text="Changes always create a new locked revision." /></aside></div>
    </div>
  );
}

function KnowledgeView({ onNotice }: { onNotice: (message: string) => void }) {
  return <div className="rnd-page rnd-enter"><PageIntro eyebrow="GOVERNED ENGINEERING MEMORY" title="Engineering knowledge and evidence" copy="Approved standards, manufacturer data, company rules, lessons learned, and verified sources—ranked by authority and preserved with access dates." action="Add approved source" /><div className="rnd-knowledge-grid">{[['Philippine codes','38','Law and jurisdiction rules'],['Company standards','126','Approved designs and procedures'],['Manufacturer data','412','Equipment specifications and models'],['Lessons learned','94','Verified project outcomes'],['Calculation rules','67','Versioned and regression tested'],['Licensed references','21','Access-controlled standards']].map((card, index) => <article key={card[0]} style={{ '--entry-delay': `${index * 60}ms` } as React.CSSProperties}><span>0{index + 1}</span><strong>{card[1]}</strong><h3>{card[0]}</h3><p>{card[2]}</p><button onClick={() => onNotice(`${card[0]} source register opened for developer integration`)}>Explore library →</button></article>)}</div></div>;
}

function GovernanceView({ onNotice }: { onNotice: (message: string) => void }) {
  return <div className="rnd-page rnd-enter"><PageIntro eyebrow="ADMIN ONLY" title="Nexi development and governance" copy="Nexi may identify gaps and prepare improvements in a sandbox. She cannot alter her permissions, safety gates, or deployment policy." /><div className="rnd-governance-hero"><NexiOrb size="large" /><div><span className="rnd-live-label"><span /> Governance healthy</span><h2>Three improvement proposals are ready for review</h2><p>All proposals include evidence, risk classification, tests, affected modules, monitoring, and instant rollback.</p></div><button className="rnd-button rnd-button--primary" onClick={() => onNotice('Governed proposal queue opened · human approval remains required')}>Review proposals</button></div><div className="rnd-governance-grid"><GovernanceStage n="01" title="Observe" text="Errors, corrections, performance and outcome quality" status="Active" /><GovernanceStage n="02" title="Sandbox" text="Generate changes and run security, regression and simulation tests" status="3 running" /><GovernanceStage n="03" title="Approve" text="Admin reviews evidence, risk, deployment and rollback" status="Human gate" /><GovernanceStage n="04" title="Canary & monitor" text="Limited release with measurable thresholds and instant rollback" status="Policy controlled" /></div></div>;
}

function PageIntro({ eyebrow, title, copy, action, onAction }: { eyebrow: string; title: string; copy: string; action?: string; onAction?: () => void }) {
  return <section className="rnd-page-intro"><div><span className="rnd-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action && <button className="rnd-button rnd-button--primary" onClick={onAction} disabled={!onAction} title={onAction ? undefined : 'Requires connected company service'}>+ {action}</button>}</section>;
}

function Rule({ title, text }: { title: string; text: string }) { return <div className="rnd-rule"><span>✓</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function GovernanceStage({ n, title, text, status }: { n: string; title: string; text: string; status: string }) { return <article><span>{n}</span><h3>{title}</h3><p>{text}</p><small>{status}</small></article>; }

function CommandPalette({ onClose, onOpenStudio, onApprovals, onCreate }: { onClose: () => void; onOpenStudio: () => void; onApprovals: () => void; onCreate: () => void }) {
  return <div className="rnd-command-overlay" onMouseDown={onClose}><div className="rnd-command-palette rnd-enter" onMouseDown={event => event.stopPropagation()}><div className="rnd-command-palette__search"><NexiOrb size="small" /><input autoFocus placeholder="Ask Nexi or search HydroNexis-AI…" onKeyDown={event => { if (event.key === 'Enter') onOpenStudio(); }} /><kbd>ESC</kbd></div><div className="rnd-command-palette__context"><span>NEXI SUGGESTS</span><button onClick={onOpenStudio}><b>Review the GH7 hydraulic conflict</b><small>Open revision 12 with calculations and evidence</small><i>→</i></button><button onClick={onApprovals}><b>Show all decisions requiring President approval</b><small>Protected authority gates across active projects</small><i>→</i></button><button onClick={onCreate}><b>Create an engineering project from a plan</b><small>Upload → analyze → questions → editable 2D/3D</small><i>→</i></button></div><div className="rnd-command-palette__footer"><span>↵ Open priority</span><span>ESC Close</span><span>⌘K Toggle</span><b>Nexi actions are permission-checked and audited</b></div></div></div>;
}

function loadProjects(): CockpitProject[] {
  try {
    const stored = localStorage.getItem('hnx-rnd-pro-projects');
    const parsed = stored ? JSON.parse(stored) as CockpitProject[] : [];
    const knownIds = new Set(parsed.map(project => project.id));
    return [...parsed, ...cockpitProjects.filter(project => !knownIds.has(project.id))];
  } catch {
    return cockpitProjects;
  }
}
