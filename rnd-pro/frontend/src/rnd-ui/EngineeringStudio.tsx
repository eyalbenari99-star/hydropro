import React, { useMemo, useRef, useState } from 'react';
import type { ImageObj, Scene, SceneObject } from '../rnd-core/data-model';
import type { CockpitProject } from '../rnd-core/review-data';
import { NexiOrb } from './NexiOrb';
import { SceneCanvas, type CanvasView } from './SceneCanvas';

interface EngineeringStudioProps {
  project: CockpitProject;
  onBack: () => void;
}

type RightTab = 'nexi' | 'properties' | 'layers';
type Tool = 'select' | 'pan' | 'rect' | 'line' | 'dimension' | 'text' | 'image';

const SCENES_KEY = 'hydroPro_rndpro_scenes_v1';
function loadScene(projectId: string, title: string, phase: string): Scene {
  try {
    const all = JSON.parse(window.localStorage.getItem(SCENES_KEY) || '{}') || {};
    if (all[projectId] && Array.isArray(all[projectId].objects)) return all[projectId];
  } catch { /* fresh */ }
  return {
    w: 1380,
    h: 860,
    bg: { type: 'grid', grid: 20 },
    objects: [
      { id: 'title', kind: 'text', layer: 'annotations', x: 76, y: 70, text: title.toUpperCase().slice(0, 60), size: 22, color: '#dff8ff', bold: true },
      { id: 'subtitle', kind: 'text', layer: 'annotations', x: 76, y: 98, text: phase.toUpperCase().slice(0, 80), size: 11, color: '#7897ad' },
      { id: 'header-line', kind: 'line', layer: 'annotations', x1: 76, y1: 116, x2: 1304, y2: 116, stroke: '#285772', width: 1 },
    ] as SceneObject[],
  };
}
function persistScene(projectId: string, scene: Scene): void {
  try {
    const all = JSON.parse(window.localStorage.getItem(SCENES_KEY) || '{}') || {};
    all[projectId] = scene;
    window.localStorage.setItem(SCENES_KEY, JSON.stringify(all));
    const sync = (window as any).hnxScheduleSync; if (typeof sync === 'function') sync();
  } catch { /* quota */ }
}
const _unusedDemo = {
  objects: [
    { id: 'title', kind: 'text', layer: 'annotations', x: 76, y: 70, text: 'GH7 IRRIGATION & FERTIGATION UPGRADE', size: 22, color: '#dff8ff', bold: true },
    { id: 'subtitle', kind: 'text', layer: 'annotations', x: 76, y: 98, text: 'HYDRAULIC ARRANGEMENT · REVISION 12 · FOR ENGINEERING REVIEW', size: 11, color: '#7897ad' },
    { id: 'header-line', kind: 'line', layer: 'annotations', x1: 76, y1: 116, x2: 1304, y2: 116, stroke: '#285772', width: 1 },
    { id: 'source-room', kind: 'rect', layer: 'background', x: 92, y: 176, w: 270, h: 230, fill: 'rgba(24, 61, 82, .46)', stroke: '#3a8dae', width: 2 },
    { id: 'source-label', kind: 'text', layer: 'annotations', x: 116, y: 210, text: 'PUMP & FERTIGATION ROOM', size: 14, color: '#8deaff', bold: true },
    { id: 'tank', kind: 'ellipse', layer: 'symbols', x: 130, y: 252, w: 78, h: 112, fill: 'rgba(48, 177, 204, .18)', stroke: '#55d9e8', width: 2 },
    { id: 'pump-a', kind: 'rect', layer: 'symbols', x: 258, y: 262, w: 66, h: 42, fill: 'rgba(120, 233, 169, .16)', stroke: '#77e0a7', width: 2 },
    { id: 'pump-label', kind: 'text', layer: 'annotations', x: 262, y: 288, text: 'P-07A', size: 12, color: '#b7ffd2', bold: true },
    { id: 'main-pipe', kind: 'line', layer: 'symbols', x1: 324, y1: 283, x2: 1160, y2: 283, stroke: '#52ddff', width: 5 },
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
    { id: 'revision-note', kind: 'text', layer: 'annotations', x: 76, y: 782, text: 'NEXI CHECK: MAIN PIPE VELOCITY ABOVE LIMIT DURING TWO-ZONE OVERLAP', size: 12, color: '#ffc85a', bold: true },
  ],
};

const toolItems: { id: Tool; label: string; key: string; glyph: string }[] = [
  { id: 'select', label: 'Select', key: 'V', glyph: '↖' },
  { id: 'pan', label: 'Pan', key: 'H', glyph: '✥' },
  { id: 'rect', label: 'Rectangle', key: 'R', glyph: '□' },
  { id: 'line', label: 'Line', key: 'L', glyph: '╱' },
  { id: 'dimension', label: 'Dimension', key: 'D', glyph: '↔' },
  { id: 'text', label: 'Text', key: 'T', glyph: 'T' },
  { id: 'image', label: 'Place image', key: 'I', glyph: '▧' },
];

export function EngineeringStudio({ project, onBack }: EngineeringStudioProps) {
  const [scene, setScene] = useState<Scene>(() => loadScene(project.id, project.title, project.phase));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [rightTab, setRightTab] = useState<RightTab>('nexi');
  const [view, setView] = useState<CanvasView>({ scale: 0.72, offsetX: 48, offsetY: 56 });
  const [snap, setSnap] = useState(10);
  const [history, setHistory] = useState<Scene[]>([]);
  const [future, setFuture] = useState<Scene[]>([]);
  const [message, setMessage] = useState('');
  const [thread, setThread] = useState([
    { role: 'nexi', text: `Working on "${project.title}". Everything you draw here saves automatically to this project and syncs to your other devices. Full engineering analysis (pipe/breaker sizing, BOM, wiring PDFs) switches on when the R&D server is connected.` },
  ]);
  const [thinking, setThinking] = useState(false);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const selected = useMemo(() => scene.objects.find(object => object.id === selectedId) ?? null, [scene, selectedId]);

  React.useEffect(() => {
    const t = window.setTimeout(() => persistScene(project.id, scene), 600);
    return () => window.clearTimeout(t);
  }, [scene, project.id]);

  const commitHistory = (before: Scene) => {
    setHistory(items => [...items.slice(-39), before]);
    setFuture([]);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(items => items.slice(0, -1));
    setFuture(items => [scene, ...items]);
    setScene(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture(items => items.slice(1));
    setHistory(items => [...items, scene]);
    setScene(next);
  };

  const addObject = (tool: Tool) => {
    if (tool === 'image') {
      imageInput.current?.click();
      return;
    }
    const before = structuredClone(scene);
    const id = `${tool}-${Date.now()}`;
    let object: SceneObject | null = null;
    if (tool === 'rect') object = { id, kind: 'rect', layer: 'symbols', x: 430, y: 360, w: 180, h: 100, fill: 'rgba(65, 205, 235, .08)', stroke: '#5be4ff', width: 2 };
    if (tool === 'line') object = { id, kind: 'line', layer: 'symbols', x1: 430, y1: 400, x2: 650, y2: 400, stroke: '#5be4ff', width: 3 };
    if (tool === 'dimension') object = { id, kind: 'dimension', layer: 'annotations', x1: 430, y1: 420, x2: 650, y2: 420, unit: 'mm' };
    if (tool === 'text') object = { id, kind: 'text', layer: 'annotations', x: 430, y: 400, text: 'ENGINEERING NOTE', size: 14, color: '#dff8ff', bold: true };
    if (!object) return;
    setScene(current => ({ ...current, objects: [...current.objects, object!] }));
    commitHistory(before);
    setSelectedId(id);
    setRightTab('properties');
    setActiveTool('select');
  };

  const uploadImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const before = structuredClone(scene);
        const maxWidth = 520;
        const ratio = image.naturalWidth / Math.max(1, image.naturalHeight);
        const width = Math.min(maxWidth, image.naturalWidth);
        const object: ImageObj = {
          id: `image-${Date.now()}`,
          kind: 'img',
          layer: 'background',
          x: 380,
          y: 180,
          w: width,
          h: width / ratio,
          src: source,
          name: file.name,
          rot: 0,
          opacity: 0.72,
          aspectLocked: true,
        };
        setScene(current => ({ ...current, objects: [...current.objects, object] }));
        commitHistory(before);
        setSelectedId(object.id);
        setRightTab('properties');
        setActiveTool('select');
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  };

  const updateSelected = (field: string, value: string | number | boolean) => {
    if (!selected) return;
    const before = structuredClone(scene);
    setScene(current => ({
      ...current,
      objects: current.objects.map(object => object.id === selected.id ? ({ ...object, [field]: value } as SceneObject) : object),
    }));
    commitHistory(before);
  };

  const sendMessage = () => {
    const prompt = message.trim();
    if (!prompt || thinking) return;
    setThread(items => [...items, { role: 'user', text: prompt }]);
    setMessage('');
    setThinking(true);
    window.setTimeout(() => {
      const n = scene.objects.length;
      setThread(items => [...items, {
        role: 'nexi',
        text: `Noted. This drawing currently has ${n} object${n === 1 ? '' : 's'} and is saved to "${project.title}". I can hold your notes here; live engineering calculations and automatic plan review need the R&D server, which is prepared in the company GitHub but not connected yet.`,
      }]);
      setThinking(false);
    }, 700);
  };

  const exportReview = () => {
    const payload = { project, exportedAt: new Date().toISOString(), scene };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.code}-drawing.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rnd-studio rnd-enter">
      <header className="rnd-studio-header">
        <button className="rnd-icon-button" onClick={onBack} aria-label="Back to cockpit">←</button>
        <div className="rnd-studio-title">
          <span>{project.code} · {project.site}</span>
          <strong>{project.title}</strong>
        </div>
        <div className="rnd-revision-pill"><span /> {project.phase}</div>
        <div className="rnd-studio-header__actions">
          <button className="rnd-button rnd-button--quiet">Compare</button>
          <button className="rnd-button rnd-button--quiet" onClick={exportReview}>Export</button>
          <button className="rnd-button rnd-button--primary">Submit for approval</button>
        </div>
      </header>

      <div className="rnd-studio-commandbar">
        <div className="rnd-tool-group">
          <button className="rnd-icon-button" onClick={undo} disabled={!history.length} title="Undo">↶</button>
          <button className="rnd-icon-button" onClick={redo} disabled={!future.length} title="Redo">↷</button>
        </div>
        <div className="rnd-tool-group rnd-tool-group--text">
          <span>Layer</span><strong>{selected?.layer ?? '—'}</strong>
        </div>
        <div className="rnd-tool-group rnd-tool-group--text">
          <span>Snap</span>
          <select value={snap} onChange={event => setSnap(Number(event.target.value))}>
            <option value={0}>Off</option><option value={5}>5 mm</option><option value={10}>10 mm</option><option value={20}>20 mm</option>
          </select>
        </div>
        <div className="rnd-tool-group rnd-tool-group--text">
          <span>Scale</span><strong>1:50</strong>
        </div>
        <div className="rnd-studio-commandbar__spacer" />
        <span className="rnd-autosave"><i /> Saved just now</span>
        <button className="rnd-button rnd-button--quiet">Share</button>
      </div>

      <div className="rnd-studio-workspace">
        <aside className="rnd-tool-rail" aria-label="Drawing tools">
          {toolItems.map(tool => (
            <button
              key={tool.id}
              className={activeTool === tool.id ? 'is-active' : ''}
              onClick={() => {
                setActiveTool(tool.id);
                if (!['select', 'pan'].includes(tool.id)) addObject(tool.id);
              }}
              title={`${tool.label} (${tool.key})`}
            >
              <span>{tool.glyph}</span><small>{tool.key}</small>
            </button>
          ))}
          <div className="rnd-tool-rail__spacer" />
          <button title="Fit drawing" onClick={() => setView({ scale: 0.72, offsetX: 48, offsetY: 56 })}><span>⊙</span></button>
        </aside>

        <main className="rnd-drawing-stage">
          <div className="rnd-ruler rnd-ruler--horizontal" />
          <div className="rnd-ruler rnd-ruler--vertical" />
          <div className="rnd-canvas-shell">
            <SceneCanvas
              scene={scene}
              selectedId={selectedId}
              view={view}
              snap={snap}
              onSceneChange={setScene}
              onSelect={setSelectedId}
              onViewChange={setView}
              onHistoryCommit={(before) => commitHistory(before)}
            />
            <div className="rnd-canvas-status">
              <span>{scene.objects.length} object{scene.objects.length === 1 ? '' : 's'}</span><span>Autosaved to this project</span>
            </div>
            <div className="rnd-canvas-zoom">
              <button onClick={() => setView(current => ({ ...current, scale: Math.max(.25, current.scale - .1) }))}>−</button>
              <span>{Math.round(view.scale * 100)}%</span>
              <button onClick={() => setView(current => ({ ...current, scale: Math.min(4, current.scale + .1) }))}>+</button>
            </div>
          </div>
        </main>

        <aside className="rnd-studio-inspector">
          <div className="rnd-inspector-tabs">
            <button className={rightTab === 'nexi' ? 'is-active' : ''} onClick={() => setRightTab('nexi')}><NexiOrb size="small" /> Nexi</button>
            <button className={rightTab === 'properties' ? 'is-active' : ''} onClick={() => setRightTab('properties')}>Properties</button>
            <button className={rightTab === 'layers' ? 'is-active' : ''} onClick={() => setRightTab('layers')}>Layers</button>
          </div>
          {rightTab === 'nexi' && (
            <div className="rnd-nexi-workbench">
              <div className="rnd-nexi-context">
                <div><NexiOrb size="medium" /><span><strong>{project.title}</strong><small>{scene.objects.length} object{scene.objects.length === 1 ? '' : 's'} · autosaved</small></span></div>
              </div>
              <div className="rnd-chat-thread">
                {thread.map((item, index) => <div className={`rnd-chat rnd-chat--${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>)}
                {thinking && <div className="rnd-thinking"><i /><i /><i /></div>}
              </div>
              <div className="rnd-chat-compose">
                <textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Ask Nexi to review, calculate, compare, or edit…" />
                <div><button title="Voice input">◉</button><span>Changes preview before apply</span><button className="rnd-send-button" onClick={sendMessage}>↑</button></div>
              </div>
            </div>
          )}
          {rightTab === 'properties' && <PropertiesPanel selected={selected} update={updateSelected} />}
          {rightTab === 'layers' && <LayersPanel scene={scene} selectedId={selectedId} onSelect={setSelectedId} />}
        </aside>
      </div>
      <input ref={imageInput} className="rnd-hidden-input" type="file" accept="image/png,image/jpeg,image/tiff" onChange={event => uploadImage(event.target.files?.[0])} />
    </div>
  );
}

function PropertiesPanel({ selected, update }: { selected: SceneObject | null; update: (field: string, value: string | number | boolean) => void }) {
  if (!selected) return <div className="rnd-empty-inspector"><span>◇</span><strong>No object selected</strong><p>Select an object to edit its exact dimensions and properties.</p></div>;
  const box = selected.kind === 'rect' || selected.kind === 'ellipse' || selected.kind === 'symbol' || selected.kind === 'img';
  const position = selected.kind !== 'line' && selected.kind !== 'dimension';
  return (
    <div className="rnd-properties">
      <div className="rnd-properties__header"><span>{selected.kind.toUpperCase()}</span><strong>{'name' in selected ? selected.name : selected.id}</strong><small>{selected.id}</small></div>
      <section>
        <h4>Transform</h4>
        <div className="rnd-field-grid">
          {position && <NumberField label="X" value={selected.x} onChange={value => update('x', value)} />}
          {position && <NumberField label="Y" value={selected.y} onChange={value => update('y', value)} />}
          {box && <NumberField label="W" value={selected.w} onChange={value => update('w', value)} />}
          {box && <NumberField label="H" value={selected.h} onChange={value => update('h', value)} />}
          {(selected.kind === 'img' || selected.kind === 'symbol') && <NumberField label="Rotation" value={selected.rot || 0} onChange={value => update('rot', value)} />}
        </div>
      </section>
      {selected.kind === 'img' && (
        <section>
          <h4>Image control</h4>
          <label className="rnd-range-field"><span>Opacity</span><input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={event => update('opacity', Number(event.target.value))} /><b>{Math.round((selected.opacity ?? 1) * 100)}%</b></label>
          <label className="rnd-toggle"><input type="checkbox" checked={selected.aspectLocked ?? true} onChange={event => update('aspectLocked', event.target.checked)} /><span /> Keep aspect ratio</label>
          <label className="rnd-toggle"><input type="checkbox" checked={selected.locked ?? false} onChange={event => update('locked', event.target.checked)} /><span /> Lock object</label>
          <div className="rnd-property-actions"><button>Crop</button><button>Mirror</button><button>Calibrate scale</button></div>
        </section>
      )}
      <section><h4>Version evidence</h4><div className="rnd-evidence-chip">Modified in working revision 12</div></section>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label><span>{label}</span><input type="number" value={Math.round(value * 10) / 10} onChange={event => onChange(Number(event.target.value))} /><small>mm</small></label>;
}

function LayersPanel({ scene, selectedId, onSelect }: { scene: Scene; selectedId: string | null; onSelect: (id: string) => void }) {
  const groups = ['annotations', 'symbols', 'background'] as const;
  return <div className="rnd-layers">{groups.map(group => <section key={group}><h4><span>▾</span>{group}<b>{scene.objects.filter(object => object.layer === group).length}</b></h4>{scene.objects.filter(object => object.layer === group).slice(0, 12).map(object => <button className={selectedId === object.id ? 'is-active' : ''} key={object.id} onClick={() => onSelect(object.id)}><span>◉</span><strong>{'name' in object ? object.name : object.id}</strong><small>{object.kind}</small></button>)}</section>)}</div>;
}
