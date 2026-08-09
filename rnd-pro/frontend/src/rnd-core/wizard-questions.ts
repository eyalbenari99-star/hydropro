/**
 * Shared types for wizard question sets.
 *
 * Each discipline (electrical/plumbing/civil) ships a JSON file at
 *   /data/{discipline}_question_set.json
 * matching `QuestionSet`. The wizard UI iterates over `questions`
 * in `order` and renders the input by `type`.
 *
 * Backend serves these via GET /api/rnd/wizards/{discipline}/questions
 * and accepts answers via POST /api/rnd/wizards/{discipline}/build.
 */

export type QuestionInputType =
  | 'select'
  | 'number'
  | 'boolean'
  | 'text';

export interface QuestionOption {
  value: string | number;
  label: string;
}

export interface WizardQuestion {
  id: string;
  order: number;
  label: string;
  help?: string;
  type: QuestionInputType;
  options?: QuestionOption[];     // for select
  required?: boolean;
  default?: string | number | boolean;
  min?: number;                   // for number
  max?: number;                   // for number
  step?: number;                  // for number
  multiline?: boolean;            // for text
}

export interface QuestionSet {
  discipline: 'electrical' | 'plumbing' | 'civil' | 'hvac';
  version: number;
  questions: WizardQuestion[];
}

/** A built answer set: question id → primitive value. */
export type WizardAnswers = Record<string, string | number | boolean | undefined>;

/** Discipline-specific feeder editor row (electrical). */
export interface FeederRow {
  id: string;
  name: string;
  type: 'pump' | 'socket' | 'lighting' | 'machine' | 'other';
  currentA: number;
  motorKW?: number;
  cableLengthM?: number;
}

/** Build response shape — both spec and engineering computed values. */
export interface WizardBuildResponse<TSpec = unknown, TComputed = unknown> {
  spec: TSpec;
  computed: TComputed;
}
