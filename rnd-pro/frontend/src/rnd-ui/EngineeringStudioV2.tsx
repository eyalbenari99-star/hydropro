import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageObj, Scene, SceneObject } from '../rnd-core/data-model';
import type { CanvasTool } from '../rnd-core/scene-engine/interaction';
import type { CockpitProject } from '../rnd-core/review-data';
import { SceneCanvas, type CanvasView } from './SceneCanvas';
import { NexiOrb } from './NexiOrb';
import { DigitalTwin3D } from './DigitalTwin3D';
import type { ProjectIntakeResult } from './ProjectIntakeWizard';
import {
  BomProcurementPanel,
  CalculationsPanel,
  EngineeringReviewPanel,
  SmartSchedulePanel,
  type EngineeringFinding,
} from './EngineeringIntelligencePanels';
import './engineering-studio-v2.css';

type StudioView = 'plan' | 'model' | 'calculations' | 'bom' | 'schedule' | 'review';
type InspectorTab = 'nexi' | 'properties' | 'layers' | 'history';
type StudioTool = CanvasTool | 'image';

interface EngineeringStudioV2Props {
  project: CockpitProject;
  intake?: ProjectIntakeResult;
  onBack: () => void;
}

type AuditEvent = { id: string; time: string; actor: string; action: string };
type ChatItem = { role: 'nexi' | 'user'; text: string };
type PendingChange = { title: string; reason: string; evidence: string[]; confidence: number; risk: string; before: Scene; after: Scene };
type RevisionSnapshot = { revision: number; at: string; scene: Scene };
type WorkflowStatus = 'Draft' | 'For engineering review' | 'Submitted for review';
type StoredWorkspace = {
  scene?: Scene;
  revision?: number;
  revisionSnapshots?: RevisionSnapshot[];
  findings?: EngineeringFinding[];
  audit?: AuditEvent[];
  autonomyMode?: ProjectIntakeResult['autonomyMode'];
  workflowStatus?: WorkflowStatus;
};

const studioViews: { id: StudioView; label: string; glyph: string }[] = [
  { id: 'plan', label: '2D Plan', glyph: '▱' },
  { id: 'model', label: '3D Twin', glyph: '⬡' },
  { id: 'calculations', label: 'Calculations', glyph: 'ƒ' },
  { id: 'bom', label: 'BOM & Cost', glyph: '▦' },
  { id: 'schedule', label: 'AI Gantt', glyph: '≋' },
  { id: 'review', label: 'Review', glyph: '✓' },
];

const toolItems: { id: StudioTool; label: string; key: string; glyph: string }[] = [
  { id: 'select', label: 'Select and transform', key: 'V', glyph: '↖' },
  { id: 'pan', label: 'Pan drawing', key: 'H', glyph: '✥' },
  { id: 'rect', label: 'Draw rectangle', key: 'R', glyph: '□' },
  { id: 'line', label: 'Draw line or route', key: 'L', glyph: '╱' },
  { id: 'dimension', label: 'Measure and dimension', key: 'D', glyph: '↔' },
  { id: 'text', label: 'Place annotation', key: 'T', glyph: 'T' },
  { id: 'image', label: 'Place plan or image', key: 'I', glyph: '▧' },
];

const baseScene: Scene = {
  w: 1380,
  h: 860,
  bg: { type: 'grid', grid: 20 },
  objects: [
    { id: 'title', kind: 'text', layer: 'annotations', x: 76, y: 70, text: 'GH7 IRRIGATION & FERTIGATION UPGRADE', size: 22, color: '#dff8ff', bold: true },
    { id: 'subtitle', kind: 'text', layer: 'annotations', x: 76, y: 98, text: 'HYDRAULIC ARRANGEMENT · WORKING REVISION · SUPERVISED MODE', size: 11, color: '#7897ad' },
    { id: 'header-line', kind: 'line', layer: 'annotations', x1: 76, y1: 116, x2: 1304, y2: 116, stroke: '#285772', width: 1 },
    { id: 'source-room', kind: 'rect', layer: 'background', x: 92, y: 176, w: 270, h: 230, fill: 'rgba(24, 61, 82, .46)', stroke: '#3a8dae', width: 2 },
    { id: 'source-label', kind: 'text', layer: 'annotations', x: 116, y: 210, text: 'PUMP & FERTIGATION ROOM', size: 14, color: '#8deaff', bold: true },
    { id: 'tank', kind: 'ellipse', layer: 'symbols', x: 130, y: 252, w: 78, h: 112, fill: 'rgba(48, 177, 204, .18)', stroke: '#55d9e8', width: 2 },
    { id: 'pump-a', kind: 'rect', layer: 'symbols', x: 258, y: 262, w: 66, h: 42, fill: 'rgba(120, 233, 169, .16)', stroke: '#77e0a7', width: 2 },
    { id: 'pump-label', kind: 'text', layer: 'annotations', x: 262, y: 288, text: 'P-07A', size: 12, color: '#b7ffd2', bold: true },
    { id: 'main-pipe', kind: 'line', layer: 'symbols', x1: 324, y1: 283, x2: 1160, y2: 283, stroke: '#52ddff', width: 5 },
    { id: 'main-label', kind: 'text', layer: 'annotations', x: 620, y: 270, text: 'DN50 PE100 SDR11 · REVIEW REQUIRED', size: 11, color: '#ffc85a', bold: true },
    { id: 'branch-one', kind: 'line', layer: 'symbols', x1: 552, y1: 283, x2: 552, y2: 620, stroke: '#40bddd', width: 3 },
    { id: 'branch-two', kind: 'line', layer: 'symbols', x1: 810, y1: 283, x2: 810, y2: 620, stroke: '#40bddd', width: 3 },
    { id: 'branch-three', kind: 'line', layer: 'symbols', x1: 1068, y1: 283, x2: 1068, y2: 620, stroke: '#40bddd', width: 3 },
    { id: 'zone-one', kind: 'rect', layer: 'background', x: 432, y: 460, w: 240, h: 190, fill: 'rgba(87, 196, 112, .07)', stroke: '#3c8a59', width: 2 },
    { id: 'zone-two', kind: 'rect', layer: 'background', x: 690, y: 460, w: 240, h: 190, fill: 'rgba(87, 196, 112, .07)', stroke: '#3c8a59', width: 2 },
    { id: 'zone-three', kind: 'rect', layer: 'background', x: 948, y: 460, w: 240, h: 190, fill: 'rgba(87, 196, 112, .07)', stroke: '#3c8a59', width: 2 },
    { id: 'zone-label-one', kind: 'text', layer: 'annotations', x: 455, y: 496, text: 'ZONE A · 3.45 m³/h', size: 13, color: '#9eeab7', bold: true },
    { id: 'zone-label-two', kind: 'text', layer: 'annotations', x: 713, y: 496, text: 'ZONE B · 3.45 m³/h', size: 13, color: '#9eeab7', bold: true },
    { id: 'zone-label-three', kind: 'text', layer: 'annotations', x: 971, y: 496, text: 'ZONE C · 3.45 m³/h', size: 13, color: '#9eeab7', bold: true },
    { id: 'dimension-main', kind: 'dimension', layer: 'annotations', x1: 324, y1: 336, x2: 1160, y2: 336, unit: 'mm' },
    { id: 'revision-note', kind: 'text', layer: 'annotations', x: 76, y: 782, text: 'NEXI CHECK: MAIN PIPE VELOCITY ABOVE PROJECT LIMIT DURING TWO-ZONE OVERLAP', size: 12, color: '#ffc85a', bold: true },
  ],
};

const seedFindings: EngineeringFinding[] = [
  { id: 'F-001', severity: 'critical', title: 'Main pipe velocity exceeds project limit', detail: 'Calculated 2.31 m/s during two-zone overlap against the 1.80 m/s approved limit.', source: 'Hydraulic model HNX-HYD-18 · inputs revision 12', confidence: 96, status: 'Open' },
  { id: 'F-002', severity: 'warning', title: 'Pressure regulator quantity is below available stock', detail: 'Project needs 18 units; only four unreserved units are currently available.', source: 'Packaging warehouse inventory snapshot · 06:02', confidence: 99, status: 'Acknowledged' },
  { id: 'F-003', severity: 'information', title: 'Trench route requires field verification', detail: 'The source plan does not confirm usable width through the east crossing.', source: 'Plan OCR review · missing dimension D-14', confidence: 82, status: 'Open' },
  { id: 'F-004', severity: 'opportunity', title: 'Commissioning sequence can recover two days', detail: 'Flushing and control-panel testing can run in parallel without bypassing safety gates.', source: 'Schedule simulation · 500 runs', confidence: 88, status: 'Open' },
];

export function EngineeringStudioV2({ project, intake, onBack }: EngineeringStudioV2Props) {
  const storageKey = `hnx-rnd-pro:${project.id}`;
  const restored = useMemo(() => loadStoredWorkspace(storageKey), [storageKey]);
  const initialScene = restored?.scene ?? createInitialScene(project, intake);
  const initialFindings = restored?.findings ?? createInitialFindings(intake);
  const [scene, setScene] = useState<Scene>(() => cloneScene(initialScene));
  const [activeView, setActiveView] = useState<StudioView>('plan');
  const [selectedId, setSelectedId] = useState<string | null>('main-pipe');
  const [activeTool, setActiveTool] = useState<StudioTool>('select');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('nexi');
  const [view, setView] = useState<CanvasView>({ scale: 0.72, offsetX: 48, offsetY: 56 });
  const [snap, setSnap] = useState(10);
  const [history, setHistory] = useState<Scene[]>([]);
  const [future, setFuture] = useState<Scene[]>([]);
  const [revision, setRevision] = useState(restored?.revision ?? (intake ? 0 : 12));
  const [revisionSnapshots, setRevisionSnapshots] = useState<RevisionSnapshot[]>(restored?.revisionSnapshots ?? (intake ? [] : [
    { revision: 11, at: '2026-08-08 16:42', scene: cloneScene(baseScene) },
  ]));
  const [findings, setFindings] = useState<EngineeringFinding[]>(() => initialFindings);
  const [audit, setAudit] = useState<AuditEvent[]>(restored?.audit ?? (intake ? [
    { id: 'a-intake', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor: 'Nexi', action: `Created local revision 00 from ${intake.sourceFiles.length} intake source${intake.sourceFiles.length === 1 ? '' : 's'}` },
  ] : [
    { id: 'a-1', time: '06:18', actor: 'Nexi', action: 'Completed traceable plan review against design basis DB-07' },
    { id: 'a-2', time: '06:12', actor: 'M. Santos', action: 'Uploaded working revision 12' },
    { id: 'a-3', time: '05:54', actor: 'Nexi', action: 'Opened verification task for assumption A-03' },
  ]));
  const [autonomyMode] = useState<ProjectIntakeResult['autonomyMode']>(restored?.autonomyMode ?? intake?.autonomyMode ?? 'supervised');
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(restored?.workflowStatus ?? (intake ? 'Draft' : 'For engineering review'));
  const [thread, setThread] = useState<ChatItem[]>([
    { role: 'nexi', text: intake
      ? `Local revision 00 is ready with ${initialFindings.length} preliminary review items from the intake metadata. Open Review to inspect them, or ask me about the plan, model, calculations, schedule or material structure.`
      : 'Revision 12 is loaded. I found four review items. The highest-impact issue is the DN50 main during two-zone overlap. Ask me to calculate, compare, preview, schedule, or check materials.' },
  ]);
  const [message, setMessage] = useState(intake ? 'Review the preliminary findings and tell me what information is still missing.' : 'Compare DN50 and DN65 and prepare a supervised change preview.');
  const [thinking, setThinking] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [modal, setModal] = useState<'compare' | 'approval' | 'exports' | 'evidence' | null>(null);
  const [notice, setNotice] = useState('');
  const [lastSaved, setLastSaved] = useState('Saved locally');
  const imageInput = useRef<HTMLInputElement | null>(null);
  const selected = useMemo(() => scene.objects.find(object => object.id === selectedId) ?? null, [scene, selectedId]);
  const displayedScene = previewing && pendingChange ? pendingChange.after : scene;
  const primaryFinding = useMemo(() => [...findings].sort((a, b) => findingPriority(a) - findingPriority(b))[0] ?? null, [findings]);
  const hydraulicDemoAvailable = scene.objects.some(object => object.id === 'main-pipe') && findings.some(finding => finding.id === 'F-001');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ scene, revision, revisionSnapshots: revisionSnapshots.slice(-12), findings, audit, autonomyMode, workflowStatus } satisfies StoredWorkspace));
        setLastSaved(`Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch {
        setLastSaved('Local storage full · export project');
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [audit, autonomyMode, findings, revision, revisionSnapshots, scene, storageKey, workflowStatus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      const key = event.key.toLowerCase();
      const map: Partial<Record<string, StudioTool>> = { v: 'select', h: 'pan', r: 'rect', l: 'line', d: 'dimension', t: 'text', i: 'image' };
      if (map[key]) chooseTool(map[key]!);
      if ((event.metaKey || event.ctrlKey) && key === 'z') event.shiftKey ? redo() : undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const addAudit = (action: string, actor = 'Eyal Ben Ari') => {
    const event = { id: `audit-${Date.now()}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), actor, action };
    setAudit(items => [event, ...items].slice(0, 30));
    setNotice(action);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const commitHistory = (before: Scene) => {
    setHistory(items => [...items.slice(-59), cloneScene(before)]);
    setFuture([]);
  };

  const undo = () => {
    if (previewing) { addAudit('Undo is blocked while a supervised preview is open', 'Change policy'); return; }
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(items => items.slice(0, -1));
    setFuture(items => [cloneScene(scene), ...items]);
    setScene(cloneScene(previous));
    addAudit('Undid last drawing change');
  };

  const redo = () => {
    if (previewing) { addAudit('Redo is blocked while a supervised preview is open', 'Change policy'); return; }
    const next = future[0];
    if (!next) return;
    setFuture(items => items.slice(1));
    setHistory(items => [...items, cloneScene(scene)]);
    setScene(cloneScene(next));
    addAudit('Redid drawing change');
  };

  const chooseTool = (tool: StudioTool) => {
    if (previewing && tool !== 'pan' && tool !== 'select') {
      addAudit('Drawing changes are blocked while a supervised preview is open', 'Change policy');
      return;
    }
    if (tool === 'image') {
      imageInput.current?.click();
      return;
    }
    setActiveTool(tool);
    if (tool !== 'select') setSelectedId(null);
  };

  const uploadImage = (file?: File) => {
    if (!file) return;
    if (previewing) {
      addAudit('Image placement is blocked while a supervised preview is open', 'Change policy');
      return;
    }
    if (!file.type.startsWith('image/')) {
      addAudit(`${file.name} registered as a source file; raster preview requires PDF/DXF processing service`, 'Nexi');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const before = cloneScene(scene);
        const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
        const width = Math.min(680, image.naturalWidth);
        const object: ImageObj = { id: `image-${Date.now()}`, kind: 'img', layer: 'background', x: 330, y: 145, w: width, h: width / ratio, src: source, name: file.name, rot: 0, opacity: .72, aspectLocked: true };
        setScene(current => ({ ...current, objects: [...current.objects, object] }));
        commitHistory(before);
        setSelectedId(object.id);
        setInspectorTab('properties');
        setActiveTool('select');
        addAudit(`Placed source image ${file.name} on the plan`);
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  };

  const updateSelected = (field: string, value: string | number | boolean | object | undefined) => {
    if (!selected) return;
    if (previewing) {
      addAudit('Property editing is blocked while a supervised preview is open', 'Change policy');
      return;
    }
    if (selected.kind === 'img' && selected.locked && field !== 'locked') {
      addAudit(`Unlock ${selected.name} before changing its properties`, 'Object lock');
      return;
    }
    const before = cloneScene(scene);
    setScene(current => ({ ...current, objects: current.objects.map(object => object.id === selected.id ? ({ ...object, [field]: value } as SceneObject) : object) }));
    commitHistory(before);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (previewing) { addAudit('Delete is blocked while a supervised preview is open', 'Change policy'); return; }
    if (selected.kind === 'img' && selected.locked) { addAudit(`Unlock ${selected.name} before deleting it`, 'Object lock'); return; }
    const before = cloneScene(scene);
    setScene(current => ({ ...current, objects: current.objects.filter(object => object.id !== selected.id) }));
    commitHistory(before);
    setSelectedId(null);
    addAudit(`Deleted ${selected.id} from working revision`);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    if (previewing) { addAudit('Duplicate is blocked while a supervised preview is open', 'Change policy'); return; }
    const before = cloneScene(scene);
    const copy = cloneScene({ ...scene, objects: [selected] }).objects[0] as SceneObject;
    copy.id = `${selected.id}-copy-${Date.now()}`;
    if ('x' in copy) { copy.x += 24; copy.y += 24; }
    if ('x1' in copy) { copy.x1 += 24; copy.y1 += 24; copy.x2 += 24; copy.y2 += 24; }
    setScene(current => ({ ...current, objects: [...current.objects, copy] }));
    commitHistory(before);
    setSelectedId(copy.id);
    addAudit(`Duplicated ${selected.id}`);
  };

  const reorderSelected = (front: boolean) => {
    if (!selected) return;
    if (previewing) { addAudit('Layer order is blocked while a supervised preview is open', 'Change policy'); return; }
    if (selected.kind === 'img' && selected.locked) { addAudit(`Unlock ${selected.name} before changing its layer order`, 'Object lock'); return; }
    const before = cloneScene(scene);
    setScene(current => {
      const rest = current.objects.filter(object => object.id !== selected.id);
      return { ...current, objects: front ? [...rest, selected] : [selected, ...rest] };
    });
    commitHistory(before);
    addAudit(`${front ? 'Brought' : 'Sent'} ${selected.id} ${front ? 'to front' : 'to back'}`);
  };

  const imageAction = (action: 'crop' | 'mirror' | 'calibrate') => {
    if (!selected || selected.kind !== 'img') return;
    if (previewing) { addAudit('Image editing is blocked while a supervised preview is open', 'Change policy'); return; }
    if (selected.locked) { addAudit(`Unlock ${selected.name} before editing it`, 'Object lock'); return; }
    if (action === 'mirror') updateSelected('mirrorX', !selected.mirrorX);
    if (action === 'crop') updateSelected('crop', selected.crop ? undefined : { x: .05, y: .05, w: .9, h: .9 });
    if (action === 'calibrate') {
      const known = window.prompt('Enter the known width represented by this image in millimetres:', '10000');
      if (known && Number(known) > 0) updateSelected('calibratedUnitsPerPixel', Number(known) / Math.max(selected.w, 1));
    }
    addAudit(`${action[0].toUpperCase()}${action.slice(1)} applied to ${selected.name}`);
  };

  const prepareDn65Change = (reason: string) => {
    const after = cloneScene(scene);
    after.objects = after.objects.map(object => {
      if (object.id === 'main-pipe' && object.kind === 'line') return { ...object, width: 8, stroke: '#67f0c6' };
      if (object.id === 'main-label' && object.kind === 'text') return { ...object, text: 'DN65 PE100 SDR11 · SUPERVISED CHANGE PREVIEW', color: '#67f0c6' };
      if (object.id === 'revision-note' && object.kind === 'text') return { ...object, text: 'NEXI PREVIEW: DN65 REDUCES VELOCITY TO 1.37 m/s · ESTIMATED DELTA PHP 46,800', color: '#67f0c6' };
      return object;
    });
    setPendingChange({ title: 'Resize main irrigation line from DN50 to DN65', reason, evidence: ['Hydraulic model HNX-HYD-18', 'Project limit DB-07 §4.2', 'PE100 SDR11 manufacturer table', 'Warehouse and supplier snapshot 06:02'], confidence: 96, risk: 'Medium · BOM, pump duty and trench clearance affected', before: cloneScene(scene), after });
    setPreviewing(true);
    setActiveView('plan');
    addAudit('Opened supervised DN65 change preview', 'Nexi');
  };

  const applyPendingChange = () => {
    if (!pendingChange) return;
    commitHistory(scene);
    setScene(cloneScene(pendingChange.after));
    setRevisionSnapshots(items => [...items, { revision, at: new Date().toLocaleString(), scene: cloneScene(scene) }]);
    setRevision(value => value + 1);
    setWorkflowStatus('For engineering review');
    setFindings(items => items.map(item => item.id === 'F-001' ? { ...item, status: 'Resolved', detail: 'Resolved in supervised DN65 change; final pump-duty review remains required.' } : item));
    setPendingChange(null);
    setPreviewing(false);
    addAudit('Applied DN65 change as a new controlled revision', 'Eyal Ben Ari · President');
  };

  const rejectPendingChange = () => {
    setPendingChange(null);
    setPreviewing(false);
    addAudit('Rejected DN65 preview; no drawing change applied');
  };

  const sendMessage = () => {
    const prompt = message.trim();
    if (!prompt || thinking) return;
    setThread(items => [...items, { role: 'user', text: prompt }]);
    setMessage('');
    setThinking(true);
    window.setTimeout(() => {
      const answer = nexiResponse(prompt, scene, findings);
      setThread(items => [...items, { role: 'nexi', text: answer.text }]);
      if (answer.action === 'dn65' && hydraulicDemoAvailable) prepareDn65Change(`Requested in Nexi conversation: “${prompt}”`);
      if (answer.view) setActiveView(answer.view);
      setThinking(false);
      addAudit(`Nexi answered: ${answer.audit}`, 'Nexi');
    }, 420);
  };

  const startVoice = () => {
    const Recognition = (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; start: () => void; onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onerror: () => void } }).webkitSpeechRecognition;
    if (!Recognition) { addAudit('Voice recognition is unavailable in this browser'); return; }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.onresult = event => setMessage(event.results[0][0].transcript);
    recognition.onerror = () => addAudit('Voice command could not be captured');
    recognition.start();
    addAudit('Voice command listening started');
  };

  const saveRevision = () => {
    setRevisionSnapshots(items => [...items, { revision, at: new Date().toLocaleString(), scene: cloneScene(scene) }]);
    setRevision(value => value + 1);
    setWorkflowStatus('For engineering review');
    addAudit(`Saved immutable working revision ${revision}`);
  };

  const updateFinding = (id: string, status: EngineeringFinding['status']) => {
    setFindings(items => items.map(item => item.id === id ? { ...item, status } : item));
    addAudit(`Finding ${id} changed to ${status}`);
  };

  const submitForApproval = () => setModal('approval');

  const confirmSubmission = () => {
    if (findings.some(item => item.severity === 'critical' && item.status !== 'Resolved')) {
      addAudit('Submission blocked by unresolved critical finding', 'Approval policy');
      return;
    }
    setModal(null);
    setWorkflowStatus('Submitted for review');
    addAudit(`Revision ${revision} submitted to Engineering Review → Safety/Quality → President Approval`, 'Eyal Ben Ari · President');
  };

  const exportProject = (format: 'json' | 'svg' | 'dxf' | 'csv' | 'print') => {
    if (format === 'print') { window.print(); addAudit('Opened branded print layout'); return; }
    if (format === 'json') downloadText(`${project.code}-revision-${revision}.hnxproject.json`, JSON.stringify({ project, revision, scene, findings, audit }, null, 2), 'application/json');
    if (format === 'svg') downloadText(`${project.code}-revision-${revision}.svg`, sceneToSvg(scene, project, revision), 'image/svg+xml');
    if (format === 'dxf') downloadText(`${project.code}-revision-${revision}.dxf`, sceneToDxf(scene), 'application/dxf');
    if (format === 'csv') downloadText(`${project.code}-BOM.csv`, 'Item,Specification,Qty,Unit,Status\nHDPE main pipe,PE100 SDR11 DN65,210,m,Shortage\nPressure regulator,DN32 1.5 bar,18,pc,Procurement required\nSolenoid valve,24VDC DN32 NC,18,pc,Available', 'text/csv');
    addAudit(`Exported ${format.toUpperCase()} from revision ${revision}`);
  };

  return <div className="rnd-pro-studio">
    <header className="rnd-pro-header">
      <button className="rnd-pro-back" onClick={onBack} aria-label="Back to R&D cockpit">←</button>
      <div className="rnd-pro-project"><span>{project.code} · {project.site}</span><strong>{project.title}</strong></div>
      <div className="rnd-pro-mode"><span /> {autonomyModeLabel(autonomyMode)}</div>
      <nav className="rnd-pro-view-tabs" aria-label="Engineering workspaces">{studioViews.map(item => <button key={item.id} className={activeView === item.id ? 'is-active' : ''} onClick={() => setActiveView(item.id)}><i>{item.glyph}</i>{item.label}{item.id === 'review' && <b>{findings.filter(f => f.status !== 'Resolved').length}</b>}</button>)}</nav>
      <div className="rnd-pro-header-actions"><button onClick={() => setModal('compare')} disabled={!revisionSnapshots.length} title={revisionSnapshots.length ? 'Compare with the previous saved revision' : 'Save a new revision before comparing'}>Compare</button><button onClick={() => setModal('exports')}>Export</button><button className="is-primary" onClick={submitForApproval} disabled={workflowStatus === 'Submitted for review'}>{workflowStatus === 'Submitted for review' ? 'Submitted for review' : 'Submit for approval'}</button></div>
    </header>

    <div className="rnd-pro-revisionbar"><span className="rnd-pro-status">WORKING REVISION {revision}</span><span>{previewing ? 'Nexi supervised preview · not applied' : workflowStatus}</span><span>{lastSaved}</span><span>{scene.objects.length} plan objects</span><span>{findings.filter(item => item.status !== 'Resolved').length} open findings</span><button onClick={saveRevision} disabled={previewing}>Save new revision</button></div>

    <main className="rnd-pro-body">
      {activeView === 'plan' && <PlanWorkspace scene={displayedScene} editableScene={scene} selected={selected} selectedId={selectedId} activeTool={activeTool === 'image' ? 'select' : activeTool} inspectorTab={inspectorTab} view={view} snap={snap} history={history} future={future} thread={thread} message={message} thinking={thinking} audit={audit} previewing={previewing} pendingChange={pendingChange} primaryFinding={primaryFinding} hydraulicPreviewAvailable={hydraulicDemoAvailable}
        onSceneChange={setScene} onSelect={setSelectedId} onTool={chooseTool} onToolComplete={() => setActiveTool('select')} onInspector={setInspectorTab} onView={setView} onSnap={setSnap} onHistoryCommit={commitHistory} onUndo={undo} onRedo={redo} onUpdate={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected} onReorder={reorderSelected} onImageAction={imageAction} onMessage={setMessage} onSend={sendMessage} onVoice={startVoice} onPreviewFix={() => hydraulicDemoAvailable ? prepareDn65Change('Nexi finding F-001 preview') : setActiveView('review')} onEvidence={() => setModal('evidence')} onApply={applyPendingChange} onReject={rejectPendingChange} />}
      {activeView === 'model' && <DigitalTwin3D scene={displayedScene} selectedId={selectedId} onSelect={setSelectedId} />}
      {activeView === 'calculations' && <CalculationsPanel onApplyRecommendation={prepareDn65Change} onAudit={addAudit} />}
      {activeView === 'bom' && <BomProcurementPanel onAudit={addAudit} />}
      {activeView === 'schedule' && <SmartSchedulePanel onAudit={addAudit} />}
      {activeView === 'review' && <EngineeringReviewPanel findings={findings} onFindingChange={updateFinding} onSubmit={submitForApproval} onAudit={addAudit} />}
    </main>

    <input ref={imageInput} className="rnd-hidden-input" type="file" accept="image/png,image/jpeg,image/webp,image/tiff,application/pdf,.dxf" onChange={event => { uploadImage(event.target.files?.[0]); event.target.value = ''; }} />
    {notice && <div className="rnd-pro-toast"><span>✓</span>{notice}</div>}
    {modal === 'compare' && <CompareModal revision={revision} snapshots={revisionSnapshots} scene={scene} onClose={() => setModal(null)} onAudit={addAudit} />}
    {modal === 'exports' && <ExportModal onExport={exportProject} onClose={() => setModal(null)} />}
    {modal === 'evidence' && <EvidenceModal finding={primaryFinding} onClose={() => setModal(null)} />}
    {modal === 'approval' && <ApprovalModal revision={revision} findings={findings} onConfirm={confirmSubmission} onClose={() => setModal(null)} />}
  </div>;
}

type PlanWorkspaceProps = {
  scene: Scene; editableScene: Scene; selected: SceneObject | null; selectedId: string | null; activeTool: CanvasTool; inspectorTab: InspectorTab; view: CanvasView; snap: number; history: Scene[]; future: Scene[]; thread: ChatItem[]; message: string; thinking: boolean; audit: AuditEvent[]; previewing: boolean; pendingChange: PendingChange | null; primaryFinding: EngineeringFinding | null; hydraulicPreviewAvailable: boolean;
  onSceneChange: (scene: Scene) => void; onSelect: (id: string | null) => void; onTool: (tool: StudioTool) => void; onToolComplete: () => void; onInspector: (tab: InspectorTab) => void; onView: (view: CanvasView) => void; onSnap: (value: number) => void; onHistoryCommit: (before: Scene) => void; onUndo: () => void; onRedo: () => void; onUpdate: (field: string, value: string | number | boolean | object | undefined) => void; onDelete: () => void; onDuplicate: () => void; onReorder: (front: boolean) => void; onImageAction: (action: 'crop' | 'mirror' | 'calibrate') => void; onMessage: (message: string) => void; onSend: () => void; onVoice: () => void; onPreviewFix: () => void; onEvidence: () => void; onApply: () => void; onReject: () => void;
};

function PlanWorkspace(props: PlanWorkspaceProps) {
  return <div className="rnd-pro-plan">
    <div className="rnd-pro-commandbar"><div><button onClick={props.onUndo} disabled={props.previewing || !props.history.length}>↶ Undo</button><button onClick={props.onRedo} disabled={props.previewing || !props.future.length}>↷ Redo</button></div><label>Snap<select value={props.snap} onChange={event => props.onSnap(Number(event.target.value))}><option value={0}>Off</option><option value={5}>5 mm</option><option value={10}>10 mm</option><option value={20}>20 mm</option></select></label><span>Scale 1:50</span><span>Units mm</span><i /><strong>{props.previewing ? 'PREVIEW MODE · NO CHANGE APPLIED' : 'AUTOSAVE ACTIVE'}</strong></div>
    <div className="rnd-pro-plan-grid">
      <aside className="rnd-pro-toolrail">{toolItems.map(tool => <button key={tool.id} className={props.activeTool === tool.id ? 'is-active' : ''} disabled={props.previewing && tool.id !== 'select' && tool.id !== 'pan'} onClick={() => props.onTool(tool.id)} title={props.previewing && tool.id !== 'select' && tool.id !== 'pan' ? 'Apply or reject the preview before editing' : `${tool.label} (${tool.key})`}><span>{tool.glyph}</span><small>{tool.key}</small></button>)}<i /><button onClick={() => props.onView({ scale: .72, offsetX: 48, offsetY: 56 })} title="Fit plan">⊙</button></aside>
      <section className="rnd-pro-canvas-stage"><div className="rnd-pro-ruler is-horizontal" /><div className="rnd-pro-ruler is-vertical" /><SceneCanvas scene={props.previewing ? props.scene : props.editableScene} readOnly={props.previewing} activeTool={props.previewing ? (props.activeTool === 'pan' ? 'pan' : 'select') : props.activeTool} selectedId={props.selectedId} view={props.view} snap={props.snap} onSceneChange={props.onSceneChange} onSelect={props.onSelect} onViewChange={props.onView} onHistoryCommit={before => props.onHistoryCommit(before)} onToolComplete={props.onToolComplete} /><div className="rnd-pro-canvas-coordinates">X 810.00 · Y 283.00 · calibrated millimetres</div><div className="rnd-pro-zoom"><button onClick={() => props.onView({ ...props.view, scale: Math.max(.25, props.view.scale - .1) })}>−</button><b>{Math.round(props.view.scale * 100)}%</b><button onClick={() => props.onView({ ...props.view, scale: Math.min(4, props.view.scale + .1) })}>+</button></div>{props.previewing && props.pendingChange && <div className="rnd-pro-previewbar"><div><span>NEXI SUPERVISED CHANGE</span><strong>{props.pendingChange.title}</strong><small>{props.pendingChange.confidence}% confidence · {props.pendingChange.risk}</small></div><button onClick={props.onReject}>Reject</button><button className="is-primary" onClick={props.onApply}>Apply as new revision</button></div>}</section>
      <aside className="rnd-pro-inspector"><div className="rnd-pro-inspector-tabs"><button className={props.inspectorTab === 'nexi' ? 'is-active' : ''} onClick={() => props.onInspector('nexi')}><NexiOrb size="small" /> Nexi</button><button className={props.inspectorTab === 'properties' ? 'is-active' : ''} onClick={() => props.onInspector('properties')}>Properties</button><button className={props.inspectorTab === 'layers' ? 'is-active' : ''} onClick={() => props.onInspector('layers')}>Layers</button><button className={props.inspectorTab === 'history' ? 'is-active' : ''} onClick={() => props.onInspector('history')}>History</button></div>
        {props.inspectorTab === 'nexi' && <NexiWorkbench thread={props.thread} message={props.message} thinking={props.thinking} pending={props.pendingChange} finding={props.primaryFinding} hydraulicPreviewAvailable={props.hydraulicPreviewAvailable} onMessage={props.onMessage} onSend={props.onSend} onVoice={props.onVoice} onPreview={props.onPreviewFix} onEvidence={props.onEvidence} />}
        {props.inspectorTab === 'properties' && <PropertiesPanelV2 selected={props.selected} onUpdate={props.onUpdate} onDelete={props.onDelete} onDuplicate={props.onDuplicate} onReorder={props.onReorder} onImageAction={props.onImageAction} />}
        {props.inspectorTab === 'layers' && <LayersPanelV2 scene={props.editableScene} selectedId={props.selectedId} onSelect={id => props.onSelect(id)} />}
        {props.inspectorTab === 'history' && <HistoryPanel audit={props.audit} />}
      </aside>
    </div>
  </div>;
}

function NexiWorkbench({ thread, message, thinking, pending, finding, hydraulicPreviewAvailable, onMessage, onSend, onVoice, onPreview, onEvidence }: { thread: ChatItem[]; message: string; thinking: boolean; pending: PendingChange | null; finding: EngineeringFinding | null; hydraulicPreviewAvailable: boolean; onMessage: (value: string) => void; onSend: () => void; onVoice: () => void; onPreview: () => void; onEvidence: () => void }) {
  return <div className="rnd-pro-nexi"><div className="rnd-pro-nexi-context"><NexiOrb size="medium" /><span><strong>Engineering context active</strong><small>Local plan · review structures · session evidence</small></span><b>{finding?.confidence ?? 0}%</b></div>{finding && <article className="rnd-pro-finding"><span>{finding.severity.toUpperCase()} · {finding.id}</span><strong>{finding.title}</strong><p>{finding.detail}</p><div><button onClick={onEvidence}>Evidence</button><button onClick={onPreview}>{hydraulicPreviewAvailable ? (pending ? 'Preview ready' : 'Prepare fix') : 'Open review'}</button></div></article>}<div className="rnd-pro-chat">{thread.map((item, index) => <div className={`is-${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>)}{thinking && <div className="rnd-pro-thinking"><i /><i /><i /></div>}</div><div className="rnd-pro-compose"><textarea value={message} onChange={event => onMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder="Ask Nexi to analyze, calculate, compare or prepare a change…" /><div><button onClick={onVoice} title="Voice command">◉ Voice</button><span>Preview before apply</span><button className="is-send" onClick={onSend}>↑</button></div></div></div>;
}

function PropertiesPanelV2({ selected, onUpdate, onDelete, onDuplicate, onReorder, onImageAction }: { selected: SceneObject | null; onUpdate: PlanWorkspaceProps['onUpdate']; onDelete: () => void; onDuplicate: () => void; onReorder: (front: boolean) => void; onImageAction: PlanWorkspaceProps['onImageAction'] }) {
  if (!selected) return <div className="rnd-pro-empty"><span>◇</span><strong>Select an object</strong><p>Draw or select an object to edit exact engineering properties.</p></div>;
  const isBox = selected.kind === 'rect' || selected.kind === 'ellipse' || selected.kind === 'symbol' || selected.kind === 'img';
  const hasPosition = selected.kind !== 'line' && selected.kind !== 'dimension';
  return <div className="rnd-pro-properties"><header><span>{selected.kind.toUpperCase()}</span><strong>{'name' in selected ? selected.name : selected.id}</strong><small>{selected.id}</small></header><section><h4>Geometry</h4><div className="rnd-pro-fields">{hasPosition && <NumberField label="X" value={selected.x} onChange={value => onUpdate('x', value)} />}{hasPosition && <NumberField label="Y" value={selected.y} onChange={value => onUpdate('y', value)} />}{isBox && <NumberField label="W" value={selected.w} onChange={value => onUpdate('w', value)} />}{isBox && <NumberField label="H" value={selected.h} onChange={value => onUpdate('h', value)} />}{(selected.kind === 'img' || selected.kind === 'symbol') && <NumberField label="Rotation" value={selected.rot ?? 0} unit="°" onChange={value => onUpdate('rot', value)} />}</div>{selected.kind === 'text' && <label className="rnd-pro-text-field"><span>Annotation</span><textarea value={selected.text} onChange={event => onUpdate('text', event.target.value)} /></label>}</section>{selected.kind === 'img' && <section><h4>Professional image control</h4><label className="rnd-pro-range"><span>Opacity</span><input type="range" min=".1" max="1" step=".05" value={selected.opacity ?? 1} onChange={event => onUpdate('opacity', Number(event.target.value))} /><b>{Math.round((selected.opacity ?? 1) * 100)}%</b></label><label className="rnd-pro-check"><input type="checkbox" checked={selected.aspectLocked ?? true} onChange={event => onUpdate('aspectLocked', event.target.checked)} /> Keep aspect ratio</label><label className="rnd-pro-check"><input type="checkbox" checked={selected.locked ?? false} onChange={event => onUpdate('locked', event.target.checked)} /> Lock object</label><div className="rnd-pro-property-actions"><button onClick={() => onImageAction('crop')}>{selected.crop ? 'Reset crop' : 'Crop 5%'}</button><button onClick={() => onImageAction('mirror')}>Mirror</button><button onClick={() => onImageAction('calibrate')}>Calibrate scale</button></div>{selected.calibratedUnitsPerPixel && <div className="rnd-pro-calibration">Scale: {selected.calibratedUnitsPerPixel.toFixed(3)} mm / pixel</div>}</section>}<section><h4>Arrange</h4><div className="rnd-pro-property-actions"><button onClick={onDuplicate}>Duplicate</button><button onClick={() => onReorder(true)}>Bring front</button><button onClick={() => onReorder(false)}>Send back</button><button className="is-danger" onClick={onDelete}>Delete</button></div></section></div>;
}

function LayersPanelV2({ scene, selectedId, onSelect }: { scene: Scene; selectedId: string | null; onSelect: (id: string) => void }) { return <div className="rnd-pro-layers">{(['annotations', 'symbols', 'background'] as const).map(layer => <section key={layer}><h4><span>▾</span>{layer}<b>{scene.objects.filter(item => item.layer === layer).length}</b></h4>{scene.objects.filter(item => item.layer === layer).map(object => <button key={object.id} className={selectedId === object.id ? 'is-active' : ''} onClick={() => onSelect(object.id)}><span>{object.kind === 'img' ? '▧' : object.kind === 'line' ? '╱' : object.kind === 'text' ? 'T' : '□'}</span><strong>{'name' in object ? object.name : object.id}</strong><small>{object.kind}</small></button>)}</section>)}</div>; }
function HistoryPanel({ audit }: { audit: AuditEvent[] }) { return <div className="rnd-pro-history"><header><span>AUDIT & CHANGE HISTORY</span><strong>Current working session</strong></header>{audit.map(event => <article key={event.id}><time>{event.time}</time><span /><div><strong>{event.actor}</strong><p>{event.action}</p></div></article>)}</div>; }
function NumberField({ label, value, unit = 'mm', onChange }: { label: string; value: number; unit?: string; onChange: (value: number) => void }) { return <label><span>{label}</span><div><input type="number" value={Math.round(value * 10) / 10} onChange={event => onChange(Number(event.target.value))} /><small>{unit}</small></div></label>; }

function ModalShell({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: React.ReactNode }) { return <div className="rnd-pro-modal-backdrop" onMouseDown={onClose}><section className="rnd-pro-modal" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true"><button className="rnd-pro-modal-close" onClick={onClose}>×</button><header><span>{eyebrow}</span><h2>{title}</h2></header>{children}</section></div>; }
function CompareModal({ revision, snapshots, scene, onClose, onAudit }: { revision: number; snapshots: RevisionSnapshot[]; scene: Scene; onClose: () => void; onAudit: (message: string) => void }) {
  const previous = snapshots[snapshots.length - 1];
  if (!previous) return <ModalShell eyebrow="REVISION CONTROL" title="No previous revision available" onClose={onClose}><div className="rnd-pro-change-list"><p>Save a new revision before opening comparison. The current working scene has {scene.objects.length} objects.</p></div><footer><button onClick={onClose}>Close</button></footer></ModalShell>;
  const delta = scene.objects.length - previous.scene.objects.length;
  return <ModalShell eyebrow="REVISION CONTROL" title={`Compare revision ${previous.revision} with ${revision}`} onClose={onClose}><div className="rnd-pro-compare"><article><span>REV {previous.revision}</span><strong>{previous.scene.objects.length} objects</strong><small>{previous.at}</small></article><b>→</b><article className="is-current"><span>REV {revision}</span><strong>{scene.objects.length} objects</strong><small>{delta >= 0 ? '+' : ''}{delta} object change · geometry updates tracked</small></article></div><div className="rnd-pro-change-list"><p><b>Object count</b> {previous.scene.objects.length} → {scene.objects.length}</p><p><b>Geometry</b> Detailed property changes remain available in the exported project audit.</p></div><footer><button onClick={() => { onAudit(`Revision ${previous.revision} comparison report opened`); onClose(); }}>Open comparison record</button></footer></ModalShell>;
}
function ExportModal({ onExport, onClose }: { onExport: (format: 'json' | 'svg' | 'dxf' | 'csv' | 'print') => void; onClose: () => void }) { return <ModalShell eyebrow="BRANDED ENGINEERING OUTPUT" title="Export controlled project package" onClose={onClose}><div className="rnd-pro-export-grid">{[['svg','SVG drawing','Editable vector plan'],['dxf','DXF drawing','AutoCAD-compatible exchange'],['csv','Excel-ready BOM','Quantities, costs and shortages'],['json','HNX project','Complete editable project state'],['print','PDF / print','Company title block and review status']].map(item => <button key={item[0]} onClick={() => { onExport(item[0] as 'json' | 'svg' | 'dxf' | 'csv' | 'print'); onClose(); }}><span>{item[0].toUpperCase()}</span><strong>{item[1]}</strong><small>{item[2]}</small></button>)}</div><p className="rnd-pro-legal">Every output is a confidential ABA Pardes company asset. Unauthorized external sharing is prohibited and remains auditable.</p></ModalShell>; }
function EvidenceModal({ finding, onClose }: { finding: EngineeringFinding | null; onClose: () => void }) {
  if (finding?.id !== 'F-001') return <ModalShell eyebrow="PRELIMINARY EVIDENCE" title={finding ? `${finding.id} · ${finding.title}` : 'No finding selected'} onClose={onClose}><div className="rnd-pro-evidence-list"><article><span>01</span><div><strong>Recorded source reference</strong><p>{finding?.source ?? 'No source reference is available.'}</p></div><b>Local review</b></article><article><span>02</span><div><strong>Confidence and status</strong><p>{finding ? `${finding.confidence}% confidence · ${finding.status}` : 'Not available'}</p></div><b>Preliminary</b></article><article><span>03</span><div><strong>Professional review boundary</strong><p>Production evidence retrieval and qualified discipline validation are not connected in this local developer build.</p></div><b>Required</b></article></div></ModalShell>;
  return <ModalShell eyebrow="TRACEABLE EVIDENCE" title="Finding F-001 · Main pipe velocity" onClose={onClose}><div className="rnd-pro-evidence-list"><article><span>01</span><div><strong>Hydraulic calculation HNX-HYD-18</strong><p>10.35 m³/h · DN50 ID · 186 m equivalent length · Hazen-Williams C150</p></div><b>Verified</b></article><article><span>02</span><div><strong>Project design basis DB-07 §4.2</strong><p>Maximum normal water velocity: 1.80 m/s</p></div><b>Approved</b></article><article><span>03</span><div><strong>PE100 SDR11 manufacturer data</strong><p>DN50 and DN65 internal dimensions, pressure and temperature derating</p></div><b>2026-07</b></article><article><span>04</span><div><strong>Assumption A-01</strong><p>Two-zone overlap is possible for eight minutes during valve transition</p></div><b>Confirm</b></article></div></ModalShell>;
}
function ApprovalModal({ revision, findings, onConfirm, onClose }: { revision: number; findings: EngineeringFinding[]; onConfirm: () => void; onClose: () => void }) { const critical = findings.some(item => item.severity === 'critical' && item.status !== 'Resolved'); return <ModalShell eyebrow="HUMAN AUTHORITY GATE" title={`Submit revision ${revision} for controlled approval`} onClose={onClose}><div className={`rnd-pro-approval-state ${critical ? 'is-blocked' : 'is-ready'}`}><span>{critical ? '!' : '✓'}</span><div><strong>{critical ? 'Submission blocked by safety policy' : 'Revision is ready for submission'}</strong><p>{critical ? 'Resolve or formally disposition finding F-001. President authority cannot bypass a required qualified engineering gate.' : 'Route: Engineering review → Safety/quality → President final approval → Issued package.'}</p></div></div><div className="rnd-pro-gates"><p><b>01</b> Engineering review <span>Required</span></p><p><b>02</b> Safety / quality review <span>Required</span></p><p><b>03</b> President / CEO approval <span>Final authority</span></p></div><footer><button onClick={onClose}>Cancel</button><button className="is-primary" disabled={critical} onClick={onConfirm}>Submit controlled revision</button></footer></ModalShell>; }

export function nexiResponse(prompt: string, scene: Scene, findings: EngineeringFinding[]): { text: string; audit: string; action?: 'dn65'; view?: StudioView } {
  const text = prompt.toLowerCase();
  const hasHydraulicDemo = scene.objects.some(object => object.id === 'main-pipe') && findings.some(finding => finding.id === 'F-001');
  if ((hasHydraulicDemo && /velocity|pipe|hydraulic|preview/.test(text)) || /dn65/.test(text)) return { text: hasHydraulicDemo ? 'I recalculated the active revision. DN50 reaches 2.31 m/s. DN65 reduces velocity to approximately 1.37 m/s and lowers friction loss, with an estimated material delta of PHP 46,800. I prepared a supervised 2D/3D change preview; nothing is applied until you approve it.' : 'I recognized the DN65 request, but this project has no validated hydraulic route to change; nothing is applied until you approve a change based on connected geometry and calculation evidence.', action: 'dn65', audit: 'Prepared DN65 governed change set request with evidence gate' };
  if (/bom|material|stock|warehouse|procure/.test(text)) return { text: hasHydraulicDemo ? 'The local review BOM simulation has two shortage lines. Open BOM & Cost to inspect the sample reservation and procurement flow. Production warehouse availability is not connected in this build.' : 'The BOM & Cost workspace contains simulation data only. Project shortage quantities cannot be claimed until geometry extraction and the selected warehouse service are connected.', view: 'bom', audit: 'Opened local BOM and procurement review' };
  if (/schedule|gantt|finish|critical path/.test(text)) return { text: 'The current critical path forecasts 32 days. Parallel site preparation and prefabrication plus an earlier commissioning handoff can recover two days without bypassing engineering, safety or President approval gates.', view: 'schedule', audit: 'Analyzed critical path and protected gates' };
  if (/3d|model|twin|orbit/.test(text)) return { text: 'The synchronized 3D twin is ready. Rectangles and zones are extruded from the current 2D plan; pipe routes update from the same scene objects. Use orbit, pan, zoom, standard views and explode controls.', view: 'model', audit: 'Opened synchronized 3D project twin' };
  if (/risk|review|assumption|evidence|approve/.test(text)) {
    const unresolved = findings.filter(item => item.status !== 'Resolved');
    const critical = unresolved.filter(item => item.severity === 'critical');
    return { text: `There ${unresolved.length === 1 ? 'is' : 'are'} ${unresolved.length} unresolved ${unresolved.length === 1 ? 'finding' : 'findings'}. ${critical.length ? `${critical.length} critical finding${critical.length === 1 ? '' : 's'} block submission.` : 'No critical finding currently blocks the local review.'} Open Review to inspect each preliminary source reference, confidence and status.`, view: 'review', audit: 'Summarized current findings and approval gates' };
  }
  if (/draw|object|plan|dimension/.test(text)) return { text: `The plan contains ${scene.objects.length} editable objects. Select a drawing tool to place geometry by dragging. Images support eight resize handles, rotation, crop, mirror, opacity, exact dimensions, locking and scale calibration.`, view: 'plan', audit: 'Reported active drawing capabilities' };
  return { text: 'I can work from the active revision across 2D, 3D, calculations, BOM, schedule, findings and approvals. Ask a focused engineering question or tell me the change you want prepared. I will show assumptions, evidence, confidence, risk and required human approvals before applying anything.', audit: 'Provided contextual engineering guidance' };
}

function createInitialScene(project: CockpitProject, intake?: ProjectIntakeResult): Scene {
  const scene: Scene = intake ? {
    w: 1380,
    h: 860,
    bg: { type: 'grid', grid: 20 },
    objects: [
      { id: 'title', kind: 'text', layer: 'annotations', x: 76, y: 70, text: project.title.toUpperCase(), size: 22, color: '#dff8ff', bold: true },
      { id: 'subtitle', kind: 'text', layer: 'annotations', x: 76, y: 98, text: `${project.code} · ${project.site.toUpperCase()} · LOCAL REVISION 00`, size: 11, color: '#7897ad' },
      { id: 'header-line', kind: 'line', layer: 'annotations', x1: 76, y1: 116, x2: 1304, y2: 116, stroke: '#285772', width: 1 },
      { id: 'intake-note', kind: 'text', layer: 'annotations', x: 76, y: 790, text: 'LOCAL INTAKE BASELINE · VERIFY SCALE, GEOMETRY AND ENGINEERING INPUTS BEFORE ISSUE', size: 12, color: '#ffc85a', bold: true },
    ],
  } : cloneScene(baseScene);
  scene.objects = scene.objects.map(object => {
    if (object.id === 'title' && object.kind === 'text') return { ...object, text: project.title.toUpperCase() };
    if (object.id === 'subtitle' && object.kind === 'text') return { ...object, text: `${project.code} · ${project.site.toUpperCase()} · ${intake ? autonomyModeLabel(intake.autonomyMode).toUpperCase() : 'SUPERVISED ENGINEERING BASELINE'}` };
    return object;
  });
  const preview = intake?.sourceFiles.find(file => file.previewDataUrl);
  if (preview?.previewDataUrl) {
    const width = Math.min(780, preview.imageWidth ?? 780);
    const ratio = (preview.imageWidth ?? 1) / Math.max(1, preview.imageHeight ?? 1);
    scene.objects.unshift({ id: `source-${preview.id}`, kind: 'img', layer: 'background', x: 400, y: 130, w: width, h: width / ratio, src: preview.previewDataUrl, name: preview.name, opacity: .42, aspectLocked: true, locked: false });
  }
  return scene;
}

function createInitialFindings(intake?: ProjectIntakeResult): EngineeringFinding[] {
  if (!intake?.analysis.findings.length) return seedFindings;
  const mapped = intake.analysis.findings.map((finding): EngineeringFinding => ({
    id: finding.id,
    severity: finding.severity === 'verified' ? 'information' : finding.severity,
    title: finding.title,
    detail: `${finding.detail} Recommendation: ${finding.recommendation}`,
    source: `Nexi intake analysis · ${intake.analysis.fingerprint.slice(0, 12)}`,
    confidence: finding.confidence,
    status: 'Open',
  }));
  return mapped.length >= 4 ? mapped : [...mapped, ...seedFindings.slice(0, 4 - mapped.length)];
}

function cloneScene(scene: Scene): Scene { return typeof structuredClone === 'function' ? structuredClone(scene) : JSON.parse(JSON.stringify(scene)) as Scene; }
function loadStoredWorkspace(key: string): StoredWorkspace | null { try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as StoredWorkspace : null; } catch { return null; } }
function downloadText(name: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function findingPriority(finding: EngineeringFinding) { return finding.severity === 'critical' ? 0 : finding.severity === 'warning' ? 1 : finding.severity === 'information' ? 2 : 3; }
function autonomyModeLabel(mode: ProjectIntakeResult['autonomyMode']) { return mode === 'copilot' ? 'Copilot · advise only' : mode === 'maximum' ? 'Maximum autonomy · governed' : 'Supervised engineering'; }
function escapeXml(value: string) { return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char] ?? char)); }
export function sceneToSvg(scene: Scene, project: CockpitProject, revision: number) { const objects = scene.objects.map(object => { if (object.kind === 'line' || object.kind === 'dimension') return `<line x1="${object.x1}" y1="${object.y1}" x2="${object.x2}" y2="${object.y2}" stroke="${object.kind === 'line' ? object.stroke : '#62dfe8'}" stroke-width="${object.kind === 'line' ? object.width : 1}"/>`; if (object.kind === 'rect') return `<rect x="${object.x}" y="${object.y}" width="${object.w}" height="${object.h}" fill="${object.fill ?? 'none'}" stroke="${object.stroke ?? '#4fd6e6'}"/>`; if (object.kind === 'ellipse') return `<ellipse cx="${object.x + object.w / 2}" cy="${object.y + object.h / 2}" rx="${object.w / 2}" ry="${object.h / 2}" fill="${object.fill ?? 'none'}" stroke="${object.stroke ?? '#4fd6e6'}"/>`; if (object.kind === 'text') return `<text x="${object.x}" y="${object.y}" fill="${object.color}" font-size="${object.size}">${escapeXml(object.text)}</text>`; if (object.kind === 'img') return `<image href="${object.src}" x="${object.x}" y="${object.y}" width="${object.w}" height="${object.h}" opacity="${object.opacity ?? 1}"/>`; return ''; }).join(''); return `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${scene.w}" height="${scene.h}" viewBox="0 0 ${scene.w} ${scene.h}"><rect width="100%" height="100%" fill="#08111c"/><text x="30" y="35" fill="#dff8ff" font-size="18">${escapeXml(project.code)} · ${escapeXml(project.title)} · REV ${revision}</text>${objects}<text x="30" y="${scene.h - 22}" fill="#8199a3" font-size="10">CONFIDENTIAL ABA PARDES COMPANY ASSET · FOR ENGINEERING REVIEW</text></svg>`; }
export function sceneToDxf(scene: Scene) { const entities: string[] = []; scene.objects.forEach(object => { if (object.kind === 'line' || object.kind === 'dimension') entities.push(`0\nLINE\n8\n${object.layer}\n10\n${object.x1}\n20\n${scene.h - object.y1}\n11\n${object.x2}\n21\n${scene.h - object.y2}`); if (object.kind === 'rect') { const p = [[object.x, object.y],[object.x + object.w, object.y],[object.x + object.w, object.y + object.h],[object.x, object.y + object.h],[object.x, object.y]]; for (let i = 0; i < 4; i++) entities.push(`0\nLINE\n8\n${object.layer}\n10\n${p[i][0]}\n20\n${scene.h - p[i][1]}\n11\n${p[i + 1][0]}\n21\n${scene.h - p[i + 1][1]}`); } if (object.kind === 'text') entities.push(`0\nTEXT\n8\n${object.layer}\n10\n${object.x}\n20\n${scene.h - object.y}\n40\n${object.size}\n1\n${object.text}`); }); return `0\nSECTION\n2\nENTITIES\n${entities.join('\n')}\n0\nENDSEC\n0\nEOF`; }
