import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RNDController } from '../main';
import { cockpitProjects, type CockpitProject } from '../rnd-core/review-data';
import { CockpitOverview } from './CockpitOverview';
import { EngineeringStudio } from './EngineeringStudio';
import { NexiOrb } from './NexiOrb';
import './rnd-system.css';

type View = 'closed' | 'overview' | 'portfolio' | 'studio' | 'approvals' | 'knowledge' | 'governance';

const _real = cockpitProjects.filter(p => p.id !== 'empty');
const navigation: { id: Exclude<View, 'closed' | 'studio'>; label: string; glyph: string; count?: number }[] = [
  { id: 'overview', label: 'Executive cockpit', glyph: '⌂' },
  { id: 'portfolio', label: 'Project portfolio', glyph: '▦', count: _real.length || undefined },
  { id: 'approvals', label: 'Reviews & approvals', glyph: '✓', count: _real.filter(p => p.status === 'For review').length || undefined },
  { id: 'knowledge', label: 'Engineering knowledge', glyph: '◎' },
  { id: 'governance', label: 'Nexi governance', glyph: '◇' },
];

export function RNDApp({ onReady }: { onReady: (controller: RNDController) => void }) {
  const [view, setView] = useState<View>('closed');
  const [activeProject, setActiveProject] = useState<CockpitProject>(cockpitProjects[0]);
  const [commandOpen, setCommandOpen] = useState(false);
  const controllerRef = useRef<RNDController | null>(null);

  useEffect(() => {
    const controller: RNDController = {
      open: () => setView('overview'),
      close: () => setView('closed'),
      openItem: id => {
        setActiveProject(cockpitProjects.find(project => project.id === id) ?? cockpitProjects[0]);
        setView('studio');
      },
      newBoard: () => {
        setActiveProject({ ...cockpitProjects[0], id: `new-${Date.now()}`, code: 'NEW PROJECT', title: 'Untitled engineering project', phase: 'Working draft', progress: 0 });
        setView('studio');
      },
    };
    controllerRef.current = controller;
    onReady(controller);
  }, [onReady]);

  const currentLabel = useMemo(() => navigation.find(item => item.id === view)?.label ?? 'Professional Engineering Studio', [view]);
  const openStudio = (project: CockpitProject) => {
    setActiveProject(project);
    setView('studio');
  };

  if (view === 'closed') return null;
  if (view === 'studio') return <EngineeringStudio project={activeProject} onBack={() => setView('overview')} />;

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
              {item.count && <b>{item.count}</b>}
            </button>
          ))}
        </nav>
        <div className="rnd-sidebar__projects">
          <div className="rnd-sidebar__section-label">PINNED PROJECTS</div>
          {cockpitProjects.slice(0, 3).map(project => (
            <button key={project.id} onClick={() => openStudio(project)}>
              <span className={`rnd-project-dot is-${project.accent}`} />
              <span><strong>{project.code}</strong><small>{project.title}</small></span>
            </button>
          ))}
        </div>
        <div className="rnd-sidebar__footer">
          <button className="rnd-sidebar-nexi" onClick={() => setCommandOpen(true)}>
            <NexiOrb size="small" />
            <span><strong>Nexi is monitoring</strong><small>live data</small></span>
            <i>⌘K</i>
          </button>
          <div className="rnd-user-chip"><span>EB</span><div><strong>Eyal Ben Ari</strong><small>President · Full authority</small></div><button>•••</button></div>
        </div>
      </aside>

      <div className="rnd-main">
        <header className="rnd-topbar">
          <div><span className="rnd-topbar__module">R&amp;D &amp; PLANNING</span><strong>{currentLabel}</strong></div>
          <button className="rnd-command-search" onClick={() => setCommandOpen(true)}><span>⌕</span> Ask Nexi, search projects, drawings, evidence… <kbd>⌘ K</kbd></button>
          <div className="rnd-topbar__actions">
            <button className="rnd-icon-button" aria-label="Notifications">♢<b>4</b></button>
            <button className="rnd-button rnd-button--primary" onClick={() => controllerRef.current?.newBoard()}>+ New project</button>
            <button className="rnd-close-button" onClick={() => controllerRef.current?.close()}>× Close</button>
          </div>
        </header>

        <main className="rnd-content">
          {view === 'overview' && <CockpitOverview onOpenStudio={openStudio} onNavigate={target => setView(target as View)} />}
          {view === 'portfolio' && <PortfolioView onOpen={openStudio} />}
          {view === 'approvals' && <ApprovalsView onOpen={openStudio} />}
          {view === 'knowledge' && <KnowledgeView />}
          {view === 'governance' && <GovernanceView />}
        </main>
      </div>

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onOpenStudio={() => { setCommandOpen(false); openStudio(cockpitProjects[0]); }} />}
    </div>
  );
}

function PortfolioView({ onOpen }: { onOpen: (project: CockpitProject) => void }) {
  const [filter, setFilter] = React.useState('');
  const [mode, setMode] = React.useState<'all' | 'review'>('all');
  const real = cockpitProjects.filter(p => p.id !== 'empty');
  const review = real.filter(p => p.status === 'For review');
  const shown = (mode === 'review' ? review : real).filter(p =>
    !filter || (p.title + ' ' + p.discipline + ' ' + p.owner).toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="rnd-page rnd-enter">
      <PageIntro eyebrow="CONTROLLED PROJECT SYSTEM" title="Engineering project portfolio" copy="Every project from Projects & Files, every Engineering Board drawing and every classic R&D drawing — one live list." />
      <div className="rnd-filterbar"><button className={mode === 'all' ? 'is-active' : ''} onClick={() => setMode('all')}>All {real.length}</button><button className={mode === 'review' ? 'is-active' : ''} onClick={() => setMode('review')}>Waiting for review {review.length}</button><span /><input placeholder="Filter project portfolio…" value={filter} onChange={e => setFilter(e.target.value)} /></div>
      <div className="rnd-table-panel">
        <div className="rnd-data-table rnd-data-table--header"><span>Project</span><span>Discipline / phase</span><span>Progress</span><span>Risk</span><span>Owner</span><span>Updated</span><span /></div>
        {shown.map(project => (
          <button className="rnd-data-table" key={project.id} onClick={() => onOpen(project)}>
            <span><b>{project.code}</b><strong>{project.title}</strong><small>{project.site}</small></span>
            <span><strong>{project.discipline}</strong><small>{project.phase}</small></span>
            <span><b>{project.progress}%</b><i className="rnd-mini-progress"><i style={{ width: `${project.progress}%` }} /></i></span>
            <span><em className={`rnd-status rnd-status--${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</em><small>{project.openRisks} open</small></span>
            <span><strong>{project.owner}</strong></span><span>{project.updated}</span><span>→</span>
          </button>
        ))}
        {!shown.length && <div style={{ padding: '18px', opacity: .7 }}>Nothing matches — create a project in 📁 Projects & Files or draw on the 📐 Engineering Board.</div>}
      </div>
    </div>
  );
}

function ApprovalsView({ onOpen }: { onOpen: (project: CockpitProject) => void }) {
  const queue = cockpitProjects.filter(p => p.status === 'For review' && p.id !== 'empty');
  return (
    <div className="rnd-page rnd-enter"><PageIntro eyebrow="HUMAN AUTHORITY GATES" title="Reviews and approvals" copy="Nexi prepares the evidence. Authorized people make safety, professional, financial, and issue decisions." />
      <div className="rnd-approval-layout"><section className="rnd-panel"><div className="rnd-panel__header"><div><span className="rnd-eyebrow">DECISION QUEUE</span><h2>Requires your attention</h2></div><span className="rnd-count-badge">{queue.length} waiting</span></div>{queue.map(p => <button className="rnd-approval-row" key={p.id} onClick={() => onOpen(p)}><span className="rnd-priority-mark is-warning" /><span><small>{p.discipline}</small><strong>{p.title}</strong><em>{p.phase}</em></span><span><small>Owner</small><b>{p.owner}</b></span><span><small>Updated</small><b>{p.updated}</b></span><span>Review →</span></button>)}{!queue.length && <div style={{ padding: '18px', opacity: .7 }}>Nothing is waiting for review. New drafts and empty projects will appear here.</div>}</section><aside className="rnd-panel rnd-decision-rules"><span className="rnd-eyebrow">ACTIVE POLICY</span><h2>Approval safeguards</h2><Rule title="Professional certification" text="Licensed engineer approval cannot be skipped." /><Rule title="Safety-critical change" text="Independent safety review and evidence required." /><Rule title="President override" text="Administrative stages only; reason and expiry are audited." /><Rule title="Issued drawings" text="Changes always create a new locked revision." /></aside></div>
    </div>
  );
}

function KnowledgeView() {
  const J = (k: string) => { try { const v = JSON.parse(window.localStorage.getItem(k) || 'null'); return Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0; } catch { return 0; } };
  const cards: [string, string, string][] = [
    ['Project files', String(J('hydroPro_rnd2_projfiles_v1')), 'Plans and documents in Projects & Files'],
    ['Board drawings', String(J('hydroPro_rnd2_boards_v1')), 'Engineering Board drawings'],
    ['Classic R&D library', String(J('hydroPro_rnd_items_v1')), 'Drawings from the classic module'],
    ['Company policies', String(J('hnx_company_policies_v1')), 'Approved company rules'],
    ['Manufacturer 3D parts', '203', 'Chint · Schneider · ABB — activates with the R&D server'],
    ['Codes & standards', '—', 'Philippine codes library — activates with the R&D server'],
  ];
  return <div className="rnd-page rnd-enter"><PageIntro eyebrow="GOVERNED ENGINEERING MEMORY" title="Engineering knowledge and evidence" copy="Live counts from your own libraries. Server-side libraries are labelled and switch on with the R&D server." /><div className="rnd-knowledge-grid">{cards.map((card, index) => <article key={card[0]} style={{ '--entry-delay': `${index * 60}ms` } as React.CSSProperties}><span>0{index + 1}</span><strong>{card[1]}</strong><h3>{card[0]}</h3><p>{card[2]}</p></article>)}</div></div>;
}

function GovernanceView() {
  return <div className="rnd-page rnd-enter"><PageIntro eyebrow="ADMIN ONLY" title="Nexi development and governance" copy="Nexi may identify gaps and prepare improvements in a sandbox. She cannot alter her permissions, safety gates, or deployment policy." /><div className="rnd-governance-hero"><NexiOrb size="large" /><div><span className="rnd-live-label"><span /> Standalone mode</span><h2>Nexi governance activates with the R&D server</h2><p>The observe → sandbox → approve → canary pipeline is part of the backend (ready in the company GitHub). No proposals run until it is deployed and you approve them.</p></div></div><div className="rnd-governance-grid"><GovernanceStage n="01" title="Observe" text="Errors, corrections, performance and outcome quality" status="Waiting for server" /><GovernanceStage n="02" title="Sandbox" text="Generate changes and run security, regression and simulation tests" status="Waiting for server" /><GovernanceStage n="03" title="Approve" text="Admin reviews evidence, risk, deployment and rollback" status="Human gate" /><GovernanceStage n="04" title="Canary & monitor" text="Limited release with measurable thresholds and instant rollback" status="Policy controlled" /></div></div>;
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: string }) {
  return <section className="rnd-page-intro"><div><span className="rnd-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action && <button className="rnd-button rnd-button--primary">+ {action}</button>}</section>;
}

function Rule({ title, text }: { title: string; text: string }) { return <div className="rnd-rule"><span>✓</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function GovernanceStage({ n, title, text, status }: { n: string; title: string; text: string; status: string }) { return <article><span>{n}</span><h3>{title}</h3><p>{text}</p><small>{status}</small></article>; }

function CommandPalette({ onClose, onOpenStudio }: { onClose: () => void; onOpenStudio: () => void }) {
  return <div className="rnd-command-overlay" onMouseDown={onClose}><div className="rnd-command-palette rnd-enter" onMouseDown={event => event.stopPropagation()}><div className="rnd-command-palette__search"><NexiOrb size="small" /><input autoFocus placeholder="Ask Nexi or search HydroNexis-AI…" /><kbd>ESC</kbd></div><div className="rnd-command-palette__context"><span>NEXI SUGGESTS</span><button onClick={onOpenStudio}><b>Open the newest project in the Studio</b><small>Draw, annotate and autosave — everything stays with the project</small><i>→</i></button></div><div className="rnd-command-palette__footer"><span>↑↓ Navigate</span><span>↵ Open</span><span>⌘K Close</span><b>Nexi actions are permission-checked and audited</b></div></div></div>;
}
