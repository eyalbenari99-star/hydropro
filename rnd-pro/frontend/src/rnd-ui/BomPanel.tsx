import React, { useEffect, useState } from 'react';
import { apiClient } from '../rnd-core/api-client';

interface BomLine {
  ref?: string;
  label?: string;
  manufacturer?: string;
  partNo?: string;
  rating?: string;
  poles?: number;
  qty: number;
  unitPrice?: number;
}

interface BomPanelProps {
  itemId: string;
  spec: any;
  onClose: () => void;
}

export const BomPanel: React.FC<BomPanelProps> = ({ itemId, spec, onClose }) => {
  const [lines, setLines] = useState<BomLine[]>([]);

  useEffect(() => {
    // Derive BOM lines from spec
    const out: BomLine[] = [];
    for (const sec of spec?.sections || []) {
      for (const rail of sec.rails || []) {
        for (const item of rail.items || []) {
          out.push({
            ref: item.ref, label: item.label,
            manufacturer: item.manufacturer, partNo: item.partNo,
            rating: item.rating, poles: item.poles,
            qty: 1, unitPrice: 0,
          });
        }
      }
    }
    setLines(out);
  }, [spec]);

  const total = lines.reduce((s, l) => s + (l.qty * (l.unitPrice || 0)), 0);

  const downloadXlsx = async () => {
    const res = await apiClient.postBlob(`/api/rnd/items/${itemId}/bom-xlsx`, spec);
    triggerDownload(res, `${spec?.title || 'cabinet'}_bom.xlsx`);
  };
  const downloadPdf = async () => {
    const res = await apiClient.postBlob(`/api/rnd/items/${itemId}/panel-pdf`, spec);
    triggerDownload(res, `${spec?.title || 'cabinet'}_panel.pdf`);
  };

  return (
    <div className="rnd-modal">
      <div className="rnd-modal-body" style={{ maxWidth: 1000 }}>
        <h2>Bill of Materials</h2>
        <p>{lines.length} line items · Total {total.toFixed(2)}</p>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <table className="rnd-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1F4E79', color: '#fff' }}>
                <th>Ref</th><th>Description</th><th>Manufacturer</th><th>Part No</th>
                <th>Rating</th><th>Poles</th><th>Qty</th><th>Unit Price</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.ref}</td>
                  <td>{l.label}</td>
                  <td>{l.manufacturer}</td>
                  <td>{l.partNo}</td>
                  <td>{l.rating}</td>
                  <td>{l.poles}</td>
                  <td>{l.qty}</td>
                  <td>{(l.unitPrice ?? 0).toFixed(2)}</td>
                  <td>{(l.qty * (l.unitPrice ?? 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rnd-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="rnd-btn" onClick={downloadXlsx} title="Download as Excel">Excel</button>
          <button className="rnd-btn" onClick={downloadPdf} title="Download as PDF">PDF</button>
          <button className="rnd-btn" onClick={onClose}>Close</button>
        </div>
      </div>
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
