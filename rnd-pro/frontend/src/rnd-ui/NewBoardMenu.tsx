import React, { useState } from 'react';

interface NewBoardMenuProps {
  onNewBlank: () => void;
  onNewFromSpec: () => void;
  onNewFromWizard: () => void;
}

export const NewBoardMenu: React.FC<NewBoardMenuProps> = ({ onNewBlank, onNewFromSpec, onNewFromWizard }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rnd-new-board-menu" style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="rnd-btn primary"
        onClick={() => setOpen(o => !o)}
        title="Create a new design board — from spec, via wizard, or blank."
      >
        New board {String.fromCharCode(0x25BE)}
      </button>
      {open && (
        <div className="rnd-menu dropdown"
             style={{ position: 'absolute', top: '100%', right: 0, background: '#fff',
                      border: '1px solid #ddd', borderRadius: 6, padding: 6, marginTop: 6,
                      boxShadow: '0 4px 16px rgba(0,0,0,.12)', minWidth: 280, zIndex: 100 }}>
          <MenuItem label="From spec (PDF / Excel / Word)"
                    sub="Import a document and auto-build the design"
                    title="Upload a PDF, Excel, or Word spec. The system reads it, builds a cabinet or hydraulic spec, and generates 2D/3D and BOM automatically."
                    onClick={() => { setOpen(false); onNewFromSpec(); }} />
          <MenuItem label="Guided wizard"
                    sub="Answer questions — system sizes and selects devices"
                    title="Use a step-by-step wizard (Electrical or Plumbing). You answer technical questions, the system calculates sizes, picks parts, and builds the design."
                    onClick={() => { setOpen(false); onNewFromWizard(); }} />
          <MenuItem label="Blank board"
                    sub="Start from an empty canvas"
                    title="Open an empty drawing canvas. Add symbols and geometry manually."
                    onClick={() => { setOpen(false); onNewBlank(); }} />
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ label: string; sub: string; title: string; onClick: () => void }> = ({ label, sub, title, onClick }) => (
  <button className="rnd-menu-item" onClick={onClick} title={title}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                   background: 'none', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
    <div style={{ fontWeight: 600, color: '#1e293b' }}>{label}</div>
    <div className="rnd-menu-sub" style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
  </button>
);
