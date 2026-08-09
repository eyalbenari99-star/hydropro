import React, { useState } from 'react';
import { apiClient } from '../rnd-core/api-client';
import { BgImageUploadModal } from './BgImageUploadModal';
import { BomPanel } from './BomPanel';
import { Cabinet3DView } from './Cabinet3DView';

interface BoardModalProps {
  itemId: string;
  spec: any;
  onClose: () => void;
}

export const BoardModal: React.FC<BoardModalProps> = ({ itemId, spec, onClose }) => {
  const [bgOpen, setBgOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(false);
  const [threeOpen, setThreeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submission, setSubmission] = useState<any>(null);

  const download = async (kind: 'png' | 'pdf' | 'dxf' | 'xlsx') => {
    setBusy(true);
    try {
      const res = await apiClient.postBlob(`/api/rnd/items/${itemId}/export-${kind}`, spec);
      triggerDownload(res, `${spec?.title || 'design'}.${kind}`);
    } catch (e: any) { alert(e?.message || 'Export failed'); }
    finally { setBusy(false); setExportOpen(false); }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const r = await apiClient.post<any>(`/api/rnd/items/${itemId}/submit`, spec);
      setSubmission(r);
    } catch (e: any) { alert(e?.message || 'Submit failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rnd-board-modal">
      <div className="rnd-board-toolbar" style={{ display: 'flex', gap: 8, padding: 8, background: '#1e293b' }}>
        <h2 style={{ color: '#fff', flex: 1, margin: 0, fontSize: 16 }}>{spec?.title || 'Design board'}</h2>
        <button className="rnd-btn" onClick={() => setBgOpen(true)}
                title="Upload a floor plan (PNG/JPG) as a locked background.">
          BG image
        </button>
        <button className="rnd-btn" onClick={() => setThreeOpen(true)}
                title="Open the 3D view of this design.">
          {'\u{1F9CA}'} 3D
        </button>
        <button className="rnd-btn" onClick={() => setBomOpen(true)}
                title="Open the Bill of Materials.">
          BOM
        </button>
        <div style={{ position: 'relative' }}>
          <button className="rnd-btn" onClick={() => setExportOpen(o => !o)} title="Export menu">
            Export {String.fromCharCode(0x25BE)}
          </button>
          {exportOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 4, zIndex: 100 }}>
              <button onClick={() => download('png')} title="PNG snapshot">PNG</button>
              <button onClick={() => download('pdf')} title="Panel schedule PDF">PDF</button>
              <button onClick={() => download('xlsx')} title="BOM Excel">XLSX</button>
              <button onClick={() => download('dxf')} title="DXF (AutoCAD)">DXF</button>
            </div>
          )}
        </div>
        <button className="rnd-btn primary" onClick={submit} disabled={busy}
                title="Build the full submission package (PNG + BOM + PDF + DXF), mark as Submitted.">
          {busy ? 'Submitting...' : 'Submit package'}
        </button>
        <button onClick={onClose} title="Close">&times;</button>
      </div>

      <div className="rnd-board-canvas" style={{ flex: 1, minHeight: 400, background: '#0b0f15', position: 'relative' }}>
        {/* Canvas placeholder — board renderer mounts here */}
        <div style={{ color: '#94a3b8', padding: 30 }}>
          Board canvas. Spec contains {(spec?.sections || []).length} sections.
        </div>
      </div>

      {bgOpen && <BgImageUploadModal onClose={() => setBgOpen(false)} onDone={() => setBgOpen(false)} />}
      {bomOpen && <BomPanel itemId={itemId} spec={spec} onClose={() => setBomOpen(false)} />}
      {threeOpen && <Cabinet3DView scene3d={spec} onClose={() => setThreeOpen(false)} />}

      {submission && (
        <div className="rnd-modal" onClick={() => setSubmission(null)}>
          <div className="rnd-modal-body" onClick={e => e.stopPropagation()}>
            <h3>Submission package</h3>
            <pre style={{ fontSize: 11 }}>{JSON.stringify(submission, null, 2)}</pre>
            <button onClick={() => setSubmission(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}
