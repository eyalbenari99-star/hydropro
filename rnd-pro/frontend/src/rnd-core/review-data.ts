/* LIVE data layer — builds the cockpit from the HOST APP's real stores
 * (HydroNexis index.html localStorage) instead of the demo review set.
 * Reads: hydroPro_rnd2_projects_v1  (Projects & Files projects)
 *        hydroPro_rnd2_projfiles_v1 (their file libraries)
 *        hydroPro_rnd2_boards_v1    (Engineering Board drawings)
 *        hydroPro_rnd_items_v1      (classic R&D drawings)
 */

export type ProjectStatus = 'Nominal' | 'Watch' | 'Critical' | 'For review';

export interface CockpitProject {
  id: string;
  code: string;
  title: string;
  site: string;
  discipline: string;
  phase: string;
  progress: number;
  confidence: number;
  budgetUsed: number;
  budgetTotal: number;
  openRisks: number;
  approvals: number;
  tasksDue: number;
  owner: string;
  updated: string;
  status: ProjectStatus;
  accent: 'cyan' | 'lime' | 'amber' | 'violet';
}

export interface NexiInsight {
  id: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'information';
  title: string;
  detail: string;
  action: string;
  evidence: string;
  confidence: number;
}

export interface ActivityEvent {
  id: string;
  time: string;
  actor: string;
  verb: string;
  target: string;
  status: 'done' | 'active' | 'waiting';
}

function J(key: string, fb: any): any {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) || 'null');
    return v == null ? fb : v;
  } catch {
    return fb;
  }
}

function ago(t: number): string {
  if (!t) return '—';
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 48) return h + ' hr' + (h > 1 ? 's' : '') + ' ago';
  return Math.round(h / 24) + ' days ago';
}

function disciplineOf(text: string): string {
  const s = (text || '').toLowerCase();
  const out: string[] = [];
  if (/electri|cabinet|breaker|panel|wiring|cable/.test(s)) out.push('Electrical');
  if (/plumb|irrigat|fertigat|pipe|pump|water|pool/.test(s)) out.push('Plumbing');
  if (/civil|roof|structur|foundation|steel/.test(s)) out.push('Civil');
  if (/sensor|network|automation|iot|control/.test(s)) out.push('Controls');
  return out.length ? out.join(' · ') : 'Engineering';
}

const ACCENTS: CockpitProject['accent'][] = ['amber', 'violet', 'lime', 'cyan'];

function buildProjects(): CockpitProject[] {
  const projects: any[] = J('hydroPro_rnd2_projects_v1', []) || [];
  const files: any[] = J('hydroPro_rnd2_projfiles_v1', []) || [];
  const boardsRaw: any = J('hydroPro_rnd2_boards_v1', []);
  const boards: any[] = Array.isArray(boardsRaw) ? boardsRaw : Object.values(boardsRaw || {});
  const legacy: any[] = J('hydroPro_rnd_items_v1', []) || [];

  const out: CockpitProject[] = [];

  projects.forEach((p: any, i: number) => {
    if (!p || !p.id) return;
    const pf = files.filter((f: any) => f && f.pid === p.id);
    const latest = Math.max(p.at || 0, ...pf.map((f: any) => f.at || 0));
    const progress = Math.min(96, 8 + pf.length * 6);
    out.push({
      id: p.id,
      code: 'PRJ-' + String(i + 1).padStart(3, '0'),
      title: p.name || 'Untitled project',
      site: p.desc || 'ABA Pardes',
      discipline: disciplineOf((p.name || '') + ' ' + (p.desc || '')),
      phase: pf.length ? 'Working documents · ' + pf.length + ' file' + (pf.length > 1 ? 's' : '') : 'New project',
      progress,
      confidence: pf.length ? 85 : 60,
      budgetUsed: 0,
      budgetTotal: 0,
      openRisks: 0,
      approvals: 0,
      tasksDue: 0,
      owner: p.createdBy || '—',
      updated: ago(latest),
      status: pf.length ? 'Nominal' : 'For review',
      accent: ACCENTS[i % ACCENTS.length],
    });
  });

  boards.forEach((b: any, i: number) => {
    if (!b || !(b.title || b.id)) return;
    const n = Array.isArray(b.objs) ? b.objs.length : 0;
    out.push({
      id: 'board_' + (b.id || i),
      code: 'DRW-' + String(i + 1).padStart(3, '0'),
      title: (b.title || 'Drawing') + ' (Engineering Board)',
      site: 'Engineering Board drawing',
      discipline: disciplineOf(b.title || ''),
      phase: n ? n + ' object' + (n > 1 ? 's' : '') + ' drawn' : 'Empty board',
      progress: Math.min(90, n * 4),
      confidence: 80,
      budgetUsed: 0,
      budgetTotal: 0,
      openRisks: 0,
      approvals: 0,
      tasksDue: 0,
      owner: b.by || '—',
      updated: ago(b.savedAt || b.updatedAt || 0),
      status: 'Nominal',
      accent: ACCENTS[(i + 2) % ACCENTS.length],
    });
  });

  legacy.forEach((it: any, i: number) => {
    if (!it || !it.title) return;
    out.push({
      id: 'legacy_' + (it.id || i),
      code: 'RND-' + String(i + 1).padStart(3, '0'),
      title: it.title,
      site: 'Classic R&D library',
      discipline: disciplineOf((it.title || '') + ' ' + (it.kind || '')),
      phase: it.status || 'Draft',
      progress: it.status === 'Approved' ? 100 : 45,
      confidence: 75,
      budgetUsed: 0,
      budgetTotal: 0,
      openRisks: 0,
      approvals: it.status === 'Approved' ? 1 : 0,
      tasksDue: 0,
      owner: it.designer || it.by || '—',
      updated: ago(it.updatedAt || it.at || 0),
      status: it.status === 'Approved' ? 'Nominal' : 'For review',
      accent: ACCENTS[(i + 1) % ACCENTS.length],
    });
  });

  if (!out.length) {
    out.push({
      id: 'empty',
      code: 'START',
      title: 'No projects yet — create one in 📁 Projects & Files or draw on the 📐 Engineering Board',
      site: 'ABA Pardes',
      discipline: 'Engineering',
      phase: 'Getting started',
      progress: 0,
      confidence: 100,
      budgetUsed: 0,
      budgetTotal: 0,
      openRisks: 0,
      approvals: 0,
      tasksDue: 0,
      owner: '—',
      updated: '—',
      status: 'For review',
      accent: 'cyan',
    });
  }
  return out;
}

function buildInsights(list: CockpitProject[]): NexiInsight[] {
  const out: NexiInsight[] = [];
  const empty = list.filter(p => p.progress === 0 && p.id !== 'empty');
  if (empty.length)
    out.push({
      id: 'empty-projects',
      severity: 'warning',
      title: empty.length + ' project(s) have no documents yet',
      detail: empty.map(p => p.title).slice(0, 3).join(', ') + ' — upload plans so the team can work from one library.',
      action: 'Open Projects & Files',
      evidence: 'Project file libraries',
      confidence: 100,
    });
  const drafts = list.filter(p => p.status === 'For review' && p.id !== 'empty');
  if (drafts.length)
    out.push({
      id: 'awaiting-review',
      severity: 'information',
      title: drafts.length + ' item(s) waiting for review or first content',
      detail: 'Open each one and either approve it or add the missing documents.',
      action: 'Review list',
      evidence: 'Live project data',
      confidence: 100,
    });
  out.push({
    id: 'server-off',
    severity: 'opportunity',
    title: 'AI engineering analysis is available when the R&D server is connected',
    detail: 'Pipe/breaker sizing wizards with real calculations, BOM Excel, wiring PDFs, DXF and the 3D parts catalog run on the backend server (ready in GitHub, not yet deployed).',
    action: 'Ask Eyal to enable the server',
    evidence: 'rnd-pro/backend in the company repository',
    confidence: 100,
  });
  return out;
}

function buildActivity(): ActivityEvent[] {
  const files: any[] = J('hydroPro_rnd2_projfiles_v1', []) || [];
  const projects: any[] = J('hydroPro_rnd2_projects_v1', []) || [];
  const name = (pid: string) => (projects.find((p: any) => p && p.id === pid) || {}).name || 'project';
  const evs: ActivityEvent[] = files
    .slice()
    .sort((a: any, b: any) => (b.at || 0) - (a.at || 0))
    .slice(0, 6)
    .map((f: any, i: number) => ({
      id: 'f' + i,
      time: f.at ? new Date(f.at).toLocaleTimeString().slice(0, 5) : '—',
      actor: f.by || '—',
      verb: 'uploaded ' + (f.name || 'a file') + ' to',
      target: name(f.pid),
      status: 'done' as const,
    }));
  if (!evs.length)
    evs.push({ id: 'a0', time: '—', actor: 'Nexi', verb: 'is ready — waiting for the first upload in', target: 'Projects & Files', status: 'waiting' });
  return evs;
}

export const cockpitProjects: CockpitProject[] = buildProjects();
export const nexiInsights: NexiInsight[] = buildInsights(cockpitProjects);
export const activityFeed: ActivityEvent[] = buildActivity();

export const formatPeso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value);
