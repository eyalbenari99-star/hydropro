import React, { useEffect, useRef } from 'react';
import type { Scene } from '../rnd-core/data-model';
import { paint } from '../rnd-core/scene-engine/canvasRenderer';
import { attach, type CanvasTool } from '../rnd-core/scene-engine/interaction';

export interface CanvasView {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface SceneCanvasProps {
  scene: Scene;
  readOnly?: boolean;
  activeTool?: CanvasTool;
  selectedId: string | null;
  view: CanvasView;
  snap: number;
  onSceneChange: (scene: Scene) => void;
  onSelect: (id: string | null) => void;
  onViewChange: (view: CanvasView) => void;
  onHistoryCommit: (before: Scene, after: Scene) => void;
  onToolComplete?: () => void;
}

export function SceneCanvas({
  scene,
  readOnly = false,
  activeTool = 'select',
  selectedId,
  view,
  snap,
  onSceneChange,
  onSelect,
  onViewChange,
  onHistoryCommit,
  onToolComplete = () => undefined,
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef(scene);
  const selectedRef = useRef(selectedId);
  const toolRef = useRef(activeTool);
  const viewRef = useRef(view);
  const callbacksRef = useRef({ onSceneChange, onSelect, onViewChange, onHistoryCommit, onToolComplete });

  sceneRef.current = scene;
  selectedRef.current = selectedId;
  toolRef.current = activeTool;
  viewRef.current = view;
  callbacksRef.current = { onSceneChange, onSelect, onViewChange, onHistoryCommit, onToolComplete };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => paint(canvas, sceneRef.current, { ...viewRef.current, selectedId: selectedRef.current });
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    canvas.addEventListener('hnx-redraw', redraw);

    const detach = attach(
      canvas,
      () => sceneRef.current,
      next => callbacksRef.current.onSceneChange(next),
      {
        getView: () => viewRef.current,
        getTool: () => toolRef.current,
        getSelectedId: () => selectedRef.current,
        onSelectionChange: id => callbacksRef.current.onSelect(id),
        onHistoryCommit: (before, after) => callbacksRef.current.onHistoryCommit(before, after),
        onViewChange: next => callbacksRef.current.onViewChange(next),
        onToolComplete: () => callbacksRef.current.onToolComplete(),
        readOnly,
        snap,
      },
    );

    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const before = viewRef.current;
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const sceneX = (mouseX - before.offsetX) / before.scale;
      const sceneY = (mouseY - before.offsetY) / before.scale;
      const nextScale = Math.min(4, Math.max(0.25, before.scale * (event.deltaY > 0 ? 0.9 : 1.1)));
      callbacksRef.current.onViewChange({
        scale: nextScale,
        offsetX: mouseX - sceneX * nextScale,
        offsetY: mouseY - sceneY * nextScale,
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    redraw();
    return () => {
      detach();
      resizeObserver.disconnect();
      canvas.removeEventListener('hnx-redraw', redraw);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [readOnly, snap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) paint(canvas, scene, { ...view, selectedId });
  }, [scene, selectedId, view]);

  return <canvas ref={canvasRef} className="rnd-scene-canvas" />;
}
