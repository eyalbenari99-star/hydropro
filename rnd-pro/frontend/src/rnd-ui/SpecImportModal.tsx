import React, { useState } from 'react';
import { apiClient } from '../rnd-core/api-client';

interface ImportResult {
  text: string;
  maybeCabinet: boolean;
  maybePlumbing: boolean;
  format: string;
  sourceExt: string;
  lengthChars: number;
}

interface SpecImportModalProps {
  onClose: () => void;
  onSpecBuilt: (itemId: string) => void;
}

export const SpecImportModal: React.FC<SpecImportModalProps> = ({ onClose, onSpecBuilt }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.postForm<ImportResult>('/api/rnd/import-spec', form);
      setResult(res);
    } catch (e: any) {
      setErr(e?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const build = async (kind: 'cabinet' | 'plumbing') => {
    if (!result) return;
    setLoading(true);
    setErr(null);
    try {
      const ep = kind === 'cabinet'
        ? '/api/rnd/parse-cabinet-and-create-board'
        : '/api/rnd/parse-plumbing-and-create-board';
      const r = await apiClient.post<{ itemId: string }>(ep, { text: result.text, format: result.format });
      onSpecBuilt(r.itemId);
    } catch (e: any) {
      setErr(e?.message || 'Build failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rnd-modal">
      <div className="rnd-modal-body" style={{ maxWidth: 720 }}>
        <h2>Import spec</h2>
        <p>Upload a PDF, Excel, Word file, or image of a spec table.</p>
        {err && <div className="rnd-error">{err}</div>}

        {!result && (
          <>
            <input type="file"
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.tsv,.json,image/*"
                   onChange={e => setFile(e.target.files?.[0] || null)} />
            <div style={{ marginTop: 12 }}>
              <button className="rnd-btn primary" onClick={upload} disabled={!file || loading}>
                {loading ? 'Uploading...' : 'Upload and extract'}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <h3>Detected spec</h3>
            <textarea readOnly value={result.text} rows={10}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }} />
            <p style={{ marginTop: 10 }}>
              Format: <strong>{result.format}</strong>{' · '}
              Length: <strong>{result.lengthChars}</strong> chars{' · '}
              Cabinet? <strong>{result.maybeCabinet ? 'yes' : 'no'}</strong>{' · '}
              Plumbing? <strong>{result.maybePlumbing ? 'yes' : 'no'}</strong>
            </p>
            <div className="rnd-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {result.maybeCabinet && (
                <button className="rnd-btn primary" onClick={() => build('cabinet')} disabled={loading}>
                  Parse as electrical cabinet
                </button>
              )}
              {result.maybePlumbing && (
                <button className="rnd-btn" onClick={() => build('plumbing')} disabled={loading}>
                  Parse as hydraulic system
                </button>
              )}
              <button className="rnd-btn" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
