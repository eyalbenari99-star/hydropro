/**
 * Question-set loader for wizards.
 *
 * Caches by discipline so the JSON is fetched once per session.
 * Falls back to a tiny bundled set so the wizard never blanks
 * if the API is down (developer-mode safety net).
 */
import type { QuestionSet, WizardAnswers, WizardQuestion } from './wizard-questions';
import { apiClient } from './api-client';

const cache = new Map<string, QuestionSet>();

export async function loadQuestionSet(discipline: string): Promise<QuestionSet> {
  const hit = cache.get(discipline);
  if (hit) return hit;
  try {
    const set = await apiClient.get<QuestionSet>(
      `/api/rnd/wizards/${discipline}/questions`
    );
    cache.set(discipline, set);
    return set;
  } catch (e) {
    console.warn(`[load-questions] API failed for ${discipline}, using fallback`, e);
    return FALLBACK_SETS[discipline] || { discipline: discipline as any, version: 0, questions: [] };
  }
}

/** Default answers derived from question.default. */
export function defaultAnswers(set: QuestionSet): WizardAnswers {
  const out: WizardAnswers = {};
  for (const q of set.questions) {
    if (q.default !== undefined) out[q.id] = q.default as any;
    else if (q.type === 'boolean') out[q.id] = false;
    else if (q.type === 'number') out[q.id] = q.min ?? 0;
    else if (q.type === 'select' && q.options?.length) out[q.id] = q.options[0].value as any;
  }
  return out;
}

/** Pure client-side validation — returns { ok, errors[] }. */
export function validateAnswers(set: QuestionSet, answers: WizardAnswers): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const q of set.questions) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (v === undefined || v === '' || v === null) {
      errors.push(`${q.label} is required`);
      continue;
    }
    if (q.type === 'number' && typeof v === 'number') {
      if (q.min !== undefined && v < q.min) errors.push(`${q.label} must be >= ${q.min}`);
      if (q.max !== undefined && v > q.max) errors.push(`${q.label} must be <= ${q.max}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Sort by .order for stable rendering. */
export function orderedQuestions(set: QuestionSet): WizardQuestion[] {
  return [...set.questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Bundled fallback sets — minimal so the wizard never breaks offline. */
const FALLBACK_SETS: Record<string, QuestionSet> = {
  electrical: {
    discipline: 'electrical', version: 0,
    questions: [
      { id: 'panel_type', order: 1, label: 'Panel type', type: 'select',
        options: [{ value: 'irrigation', label: 'Irrigation' }, { value: 'distribution', label: 'Distribution' }],
        required: true },
      { id: 'supply_voltage', order: 2, label: 'Supply voltage', type: 'select',
        options: [{ value: '3x400', label: '3 x 400 V' }, { value: '1x230', label: '1 x 230 V' }],
        required: true, default: '3x400' },
      { id: 'feeders_count', order: 3, label: 'Feeders count', type: 'number',
        min: 1, max: 48, required: true, default: 6 }
    ]
  },
  plumbing: {
    discipline: 'plumbing', version: 0,
    questions: [
      { id: 'system_type', order: 1, label: 'System type', type: 'select',
        options: [{ value: 'irrigation', label: 'Irrigation' }, { value: 'fertigation', label: 'Fertigation' }],
        required: true },
      { id: 'zones_count', order: 2, label: 'Zones', type: 'number',
        min: 1, max: 64, required: true, default: 4 }
    ]
  },
  civil: {
    discipline: 'civil', version: 0,
    questions: [
      { id: 'project_type', order: 1, label: 'Project type', type: 'select',
        options: [{ value: 'greenhouse', label: 'Greenhouse' }, { value: 'pump_room', label: 'Pump room' }],
        required: true }
    ]
  }
};
