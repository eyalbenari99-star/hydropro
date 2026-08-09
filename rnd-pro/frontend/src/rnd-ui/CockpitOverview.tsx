import React from 'react';
import { activityFeed, cockpitProjects, formatPeso, nexiInsights, type CockpitProject } from '../rnd-core/review-data';
import { NexiOrb } from './NexiOrb';

interface CockpitOverviewProps {
  projects: CockpitProject[];
  onOpenStudio: (project: CockpitProject) => void;
  onNavigate: (view: string) => void;
}

export function CockpitOverview({ projects, onOpenStudio, onNavigate }: CockpitOverviewProps) {
  return (
    <div className="rnd-overview rnd-enter">
      <section className="rnd-command-deck">
        <div className="rnd-command-deck__copy">
          <div className="rnd-eyebrow"><span className="rnd-live-dot" /> NEXI ENGINEERING INTELLIGENCE · LIVE</div>
          <h1>Good morning. Four engineering decisions need attention.</h1>
          <p>
            I reviewed {projects.length} active projects, checked the latest drawings against project rules,
            matched BOM shortages to warehouse stock, and recalculated today&apos;s critical path.
          </p>
          <div className="rnd-command-actions">
            <button className="rnd-button rnd-button--primary" onClick={() => onOpenStudio(projects[0] ?? cockpitProjects[0])}>
              Open priority project <span aria-hidden="true">→</span>
            </button>
            <button className="rnd-button rnd-button--ghost" onClick={() => onNavigate('approvals')}>
              Review 4 decisions
            </button>
          </div>
        </div>
        <div className="rnd-command-deck__brain">
          <NexiOrb size="large" />
          <div className="rnd-brain-status">
            <strong>Portfolio confidence</strong>
            <span>{projects.length ? Math.round(projects.reduce((sum, project) => sum + project.confidence, 0) / projects.length) : 0}%</span>
          </div>
          <div className="rnd-scan-line" />
        </div>
      </section>

      <section className="rnd-kpi-grid" aria-label="R&D portfolio indicators">
        <Kpi label="Active projects" value={String(projects.length)} detail={`${new Set(projects.map(project => project.discipline)).size} disciplines · ${new Set(projects.map(project => project.site)).size} sites`} trend="Live local portfolio" tone="cyan" />
        <Kpi label="Pending approvals" value={String(projects.reduce((sum, project) => sum + project.approvals, 0)).padStart(2, '0')} detail="Human authority gates" trend="Oldest: 18 hours" tone="amber" />
        <Kpi label="Open engineering risks" value={String(projects.reduce((sum, project) => sum + project.openRisks, 0))} detail={`${projects.filter(project => project.status === 'Critical').length} critical projects`} trend="Traceable review register" tone="red" />
        <Kpi label="Forecast variance" value="−2.8%" detail="Across approved budgets" trend="PHP 1.24M protected" tone="lime" />
      </section>

      <section className="rnd-section-heading">
        <div>
          <span className="rnd-eyebrow">DIGITAL PROJECT TWINS</span>
          <h2>Priority engineering portfolio</h2>
        </div>
        <button className="rnd-link-button" onClick={() => onNavigate('portfolio')}>View all projects →</button>
      </section>

      <section className="rnd-project-grid">
        {projects.slice(0, 6).map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} onOpen={() => onOpenStudio(project)} />
        ))}
      </section>

      <section className="rnd-intelligence-grid">
        <div className="rnd-panel rnd-panel--insights">
          <div className="rnd-panel__header">
            <div>
              <span className="rnd-eyebrow">NEXI FINDINGS</span>
              <h2>Engineering intelligence</h2>
            </div>
            <span className="rnd-count-badge">3 new</span>
          </div>
          <div className="rnd-insight-list">
            {nexiInsights.map(insight => (
              <article className={`rnd-insight rnd-insight--${insight.severity}`} key={insight.id}>
                <span className="rnd-insight__signal" />
                <div>
                  <div className="rnd-insight__topline">
                    <strong>{insight.title}</strong>
                    <span>{insight.confidence}% confidence</span>
                  </div>
                  <p>{insight.detail}</p>
                  <small>{insight.evidence}</small>
                </div>
                <button onClick={() => onOpenStudio(projects[0] ?? cockpitProjects[0])}>{insight.action}</button>
              </article>
            ))}
          </div>
        </div>

        <div className="rnd-panel rnd-panel--activity">
          <div className="rnd-panel__header">
            <div>
              <span className="rnd-eyebrow">AUDITABLE ACTIVITY</span>
              <h2>Live project stream</h2>
            </div>
            <span className="rnd-live-label"><span /> Live</span>
          </div>
          <div className="rnd-activity-list">
            {activityFeed.map(event => (
              <div className="rnd-activity" key={event.id}>
                <time>{event.time}</time>
                <span className={`rnd-activity__node is-${event.status}`} />
                <p><strong>{event.actor}</strong> {event.verb} <b>{event.target}</b></p>
              </div>
            ))}
          </div>
          <button className="rnd-button rnd-button--quiet" onClick={() => onNavigate('governance')}>Open complete audit trail</button>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, detail, trend, tone }: { label: string; value: string; detail: string; trend: string; tone: string }) {
  return (
    <article className={`rnd-kpi rnd-kpi--${tone}`}>
      <span className="rnd-kpi__spark" />
      <span className="rnd-kpi__label">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
      <small>{trend}</small>
    </article>
  );
}

function ProjectCard({ project, index, onOpen }: { project: CockpitProject; index: number; onOpen: () => void }) {
  const used = Math.round(project.budgetUsed / project.budgetTotal * 100);
  return (
    <article className={`rnd-project-card rnd-project-card--${project.accent}`} style={{ '--entry-delay': `${index * 70}ms` } as React.CSSProperties}>
      <div className="rnd-project-card__top">
        <div>
          <span>{project.code}</span>
          <h3>{project.title}</h3>
          <p>{project.site}</p>
        </div>
        <span className={`rnd-status rnd-status--${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span>
      </div>
      <div className="rnd-project-card__phase">
        <span>{project.discipline}</span>
        <b>{project.phase}</b>
      </div>
      <div className="rnd-progress-block">
        <div><span>Engineering progress</span><strong>{project.progress}%</strong></div>
        <div className="rnd-progress"><span style={{ width: `${project.progress}%` }} /></div>
      </div>
      <div className="rnd-project-card__metrics">
        <Metric label="Confidence" value={`${project.confidence}%`} />
        <Metric label="Open risks" value={String(project.openRisks)} warning={project.openRisks > 3} />
        <Metric label="Approvals" value={String(project.approvals)} warning={project.approvals > 0} />
        <Metric label="Tasks due" value={String(project.tasksDue)} />
      </div>
      <div className="rnd-budget-line">
        <span>Budget {formatPeso(project.budgetUsed)} / {formatPeso(project.budgetTotal)}</span>
        <strong>{used}%</strong>
      </div>
      <div className="rnd-project-card__footer">
        <div className="rnd-owner-avatar">{project.owner.split(' ').map(part => part[0]).slice(0, 2).join('')}</div>
        <div><strong>{project.owner}</strong><span>Updated {project.updated}</span></div>
        <button onClick={onOpen}>Open studio <span>→</span></button>
      </div>
    </article>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div><span>{label}</span><strong className={warning ? 'is-warning' : ''}>{value}</strong></div>;
}
