import React, { useState } from 'react';
import { apiClient } from '../rnd-core/api-client';

interface BgImageUploadModalProps {
  onClose: () => void;
  onDone: (bg: { type: 'image'; imageKey: string }) => void;
}

export const BgImageUploadModal: React.FC<BgImageUploadModalProps> = ({ onClose, onDone }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.postForm<{ imageKey: string }>('/api/rnd/uploads/bg', form);
      onDone({ type: 'image', imageKey: res.imageKey });
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rnd-modal">
      <div className="rnd-modal-body">
        <h2>Background image</h2>
        <p>
          Upload a PNG or JPG plan (floor plan, plant layout, etc.) to display as a locked
          background. You can then draw electrical and plumbing on top.
        </p>
        {err && <div className="rnd-error">{err}</div>}
        <input type="file" accept=".png,.jpg,.jpeg"
               onChange={e => setFile(e.target.files?.[0] || null)} />
        <div className="rnd-actions" style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button className="rnd-btn primary"
                  onClick={upload} disabled={!file || loading}
                  title="Upload this image and set it as the board background.">
            {loading ? 'Uploading...' : 'Set as background'}
          </button>
        </div>
      </div>
    </div>
  );
};
