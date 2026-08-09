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

export const cockpitProjects: CockpitProject[] = [
  {
    id: 'greenhouse-irrigation-07',
    code: 'RND-2608-041',
    title: 'GH7 irrigation and fertigation upgrade',
    site: 'Pakchoy Campus · GH7',
    discipline: 'Plumbing · Controls',
    phase: 'Engineering review',
    progress: 68,
    confidence: 91,
    budgetUsed: 1_280_000,
    budgetTotal: 1_850_000,
    openRisks: 2,
    approvals: 1,
    tasksDue: 4,
    owner: 'M. Santos',
    updated: '12 min ago',
    status: 'Watch',
    accent: 'amber',
  },
  {
    id: 'packaging-line-02',
    code: 'RND-2608-038',
    title: 'Packaging Line 02 capacity expansion',
    site: 'Packaging Center',
    discipline: 'Industrial · Electrical',
    phase: 'Detailed design',
    progress: 44,
    confidence: 86,
    budgetUsed: 3_640_000,
    budgetTotal: 8_900_000,
    openRisks: 3,
    approvals: 2,
    tasksDue: 7,
    owner: 'A. Reyes',
    updated: '31 min ago',
    status: 'For review',
    accent: 'violet',
  },
  {
    id: 'gh4-roof-repair',
    code: 'RND-2608-032',
    title: 'GH4 roof structure remediation',
    site: 'Romaine Campus · GH4',
    discipline: 'Structural · Civil',
    phase: 'Issued for construction',
    progress: 82,
    confidence: 95,
    budgetUsed: 2_140_000,
    budgetTotal: 2_600_000,
    openRisks: 1,
    approvals: 0,
    tasksDue: 3,
    owner: 'J. Valdez',
    updated: '1 hr ago',
    status: 'Nominal',
    accent: 'lime',
  },
  {
    id: 'site-network-redesign',
    code: 'RND-2608-029',
    title: 'Farm OT and sensor network redesign',
    site: 'All production sites',
    discipline: 'IT · Automation',
    phase: 'Concept options',
    progress: 27,
    confidence: 74,
    budgetUsed: 410_000,
    budgetTotal: 2_200_000,
    openRisks: 5,
    approvals: 1,
    tasksDue: 8,
    owner: 'IT Engineering',
    updated: '2 hrs ago',
    status: 'Critical',
    accent: 'cyan',
  },
];

export const nexiInsights: NexiInsight[] = [
  {
    id: 'flow-shortfall',
    severity: 'critical',
    title: 'Peak irrigation flow is undersized',
    detail: 'The selected 50 mm main exceeds the configured velocity limit during two-zone overlap.',
    action: 'Review DN65 alternative',
    evidence: 'Hydraulic model HNX-HYD-18 · inputs v12',
    confidence: 96,
  },
  {
    id: 'stock-risk',
    severity: 'warning',
    title: 'Two BOM items are below warehouse minimum',
    detail: 'Pressure regulators and 63 mm couplings will not cover the reserved project quantity.',
    action: 'Preview material request',
    evidence: 'Packaging warehouse live inventory · 06:02',
    confidence: 99,
  },
  {
    id: 'schedule-opportunity',
    severity: 'opportunity',
    title: 'Commissioning can finish three days earlier',
    detail: 'Parallel cable testing and flushing preserves safety gates and removes idle float.',
    action: 'Compare revised Gantt',
    evidence: 'Schedule simulation · 500 runs',
    confidence: 88,
  },
];

export const activityFeed: ActivityEvent[] = [
  { id: 'a1', time: '06:18', actor: 'Nexi', verb: 'completed plan review for', target: 'GH7 irrigation v12', status: 'done' },
  { id: 'a2', time: '06:12', actor: 'Procurement', verb: 'returned quotation comparison to', target: 'Packaging Line 02', status: 'done' },
  { id: 'a3', time: '06:08', actor: 'M. Santos', verb: 'submitted revision for', target: 'Engineering review', status: 'active' },
  { id: 'a4', time: '05:54', actor: 'Nexi', verb: 'opened a verification task for', target: 'Roof load assumption A-14', status: 'waiting' },
];

export const formatPeso = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value);
