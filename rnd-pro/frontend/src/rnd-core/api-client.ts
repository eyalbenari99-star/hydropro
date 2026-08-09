/* Centralised HTTP client with timeouts, retries, and error toasts. */
import type { Item, CabinetSpecV2, Asset } from './data-model';

const BASE = (window as any).HNX_API_BASE || '/api/rnd';
const TIMEOUT_MS = 30_000;

async function http<T>(method: string, path: string, body?: unknown, opts: { timeout?: number; retries?: number } = {}): Promise<T> {
  const timeout = opts.timeout ?? TIMEOUT_MS;
  const retries = opts.retries ?? 0;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      credentials: 'include'
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}: ${txt.slice(0, 240)}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (retries > 0) return http<T>(method, path, body, { timeout, retries: retries - 1 });
    throw err;
  } finally {
    clearTimeout(t);
  }
}

const resolvePath = (path: string) => path.startsWith('/api/') ? path : BASE + path;

async function rawRequest(method: string, path: string, body?: BodyInit, contentType?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;
  const response = await fetch(resolvePath(path), { method, body, headers, credentials: 'include' });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}: ${detail.slice(0, 240)}`);
  }
  return response;
}

/** Compatibility client used by the earlier wizard/export components. */
export const apiClient = {
  get: async <T,>(path: string): Promise<T> => (await rawRequest('GET', path)).json() as Promise<T>,
  post: async <T,>(path: string, body?: unknown): Promise<T> =>
    (await rawRequest('POST', path, body === undefined ? undefined : JSON.stringify(body), 'application/json')).json() as Promise<T>,
  postForm: async <T,>(path: string, body: FormData): Promise<T> =>
    (await rawRequest('POST', path, body)).json() as Promise<T>,
  postBlob: async (path: string, body?: unknown): Promise<Blob> =>
    (await rawRequest('POST', path, body === undefined ? undefined : JSON.stringify(body), 'application/json')).blob(),
};

export const api = {
  health: () => http<{ ok: boolean; reason?: string }>('GET', '/health'),
  cockpitSummary: () => http<{
    generated_at: string;
    portfolio_confidence: number;
    required_decisions: number;
    metrics: Array<{ key: string; label: string; value: string; detail: string; severity: string }>;
    projects: Array<Record<string, unknown>>;
    source_versions: Record<string, string>;
  }>('GET', '/cockpit/summary'),

  analyzePlan: (projectId: string, request: {
    source_revision_id: string;
    autonomy_mode: 'copilot' | 'supervised' | 'maximum';
    discipline: string;
    jurisdiction?: string;
    user_instruction?: string;
    skip_questions?: boolean;
  }) => http<Record<string, unknown>>('POST', `/projects/${projectId}/nexi/analyze`, request, { timeout: 90_000 }),

  previewChangeSet: (request: Record<string, unknown>) =>
    http<Record<string, unknown>>('POST', '/change-sets/preview', request),

  // Items
  listItems: () => http<Item[]>('GET', '/items'),
  createItem: (item: Partial<Item>) => http<Item>('POST', '/items', item),
  getItem: (id: string) => http<Item>('GET', `/items/${id}`),
  updateItem: (id: string, item: Partial<Item>) => http<Item>('PUT', `/items/${id}`, item),
  deleteItem: (id: string) => http<{ ok: true }>('DELETE', `/items/${id}`),

  // Cabinet pipeline
  parseCabinet: (text: string, title?: string) => http<CabinetSpecV2>('POST', '/parse-cabinet', { text, title }),
  renderPng: (spec: CabinetSpecV2) => http<Blob>('POST', '/render-png', spec),
  bomXlsx: (spec: CabinetSpecV2) => http<Blob>('POST', '/bom-xlsx', spec),
  wirePdf: (spec: CabinetSpecV2) => http<Blob>('POST', '/wire-pdf', spec),
  exportDxf: (spec: CabinetSpecV2) => http<{ dxf: string }>('POST', '/export-dxf', spec),
  aiRender: (spec: CabinetSpecV2) => http<{ url: string }>('POST', '/ai-render', spec),

  // Assets
  listAssets: (params: { domain?: string; search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString();
    return http<Asset[]>('GET', '/assets' + (qs ? `?${qs}` : ''));
  },
  createAsset: (asset: Partial<Asset>) => http<Asset>('POST', '/assets', asset),

  // Import (uses multipart, separate from JSON paths)
  importSpec: async (file: File): Promise<{ kind: 'text'; text: string; maybeCabinet: boolean; format?: 'markdown-table' | 'flat' }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(BASE + '/import-spec', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status} import failed`);
    return res.json();
  }
};
