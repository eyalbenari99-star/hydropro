# Wizard Question Sets

The R&D Planning module uses JSON-driven question sets per discipline.
Each discipline ships:

1. **`data/{discipline}_question_set.json`** — the questions.
2. **`backend/app/services/selector_{discipline}.py`** — picks parts.
3. **`backend/app/services/calc_{discipline}.py`** — engineering math + spec builder.
4. **`backend/app/api/wizards.py`** — endpoints:
   - `GET /api/rnd/wizards/{discipline}/questions` returns the JSON.
   - `POST /api/rnd/wizards/{discipline}/build` returns `{ spec, computed }`.
5. **`frontend/src/rnd-ui/wizards/{Discipline}Wizard.tsx`** — multi-step UI.

## Disciplines shipped

| Discipline   | Questions | Selector                  | Status   |
|--------------|-----------|---------------------------|----------|
| electrical   | 15        | CHINT NXB/NXC/JR36/NM1    | shipped  |
| plumbing     | 12        | pump/filter/pipe DN       | shipped  |
| civil        | 7         | column/rafter/purlin/pad  | shipped  |
| hvac         | -         | -                         | planned  |

## Question schema

See `frontend/src/rnd-core/wizard-questions.ts` for the TypeScript types.

```ts
interface WizardQuestion {
  id: string;
  order: number;
  label: string;
  help?: string;
  type: 'select' | 'number' | 'boolean' | 'text';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  default?: string | number | boolean;
  min?: number; max?: number; step?: number;
  multiline?: boolean;
}
```

## Loader utility

`frontend/src/rnd-core/load-questions.ts` provides:

- `loadQuestionSet(discipline)` — cached fetch with offline fallback.
- `defaultAnswers(set)` — pre-fills from `q.default`.
- `validateAnswers(set, answers)` — client-side required/range check.
- `orderedQuestions(set)` — stable sort by `order`.

## CHINT-tuned selectors

`selector_electrical.py` adds three CHINT-specific wrappers on top of the
engineering-tables-driven `pick_asset`:

- `pick_chint_nxb(session, tenant, poles, current_a, curve)` — NXB MCB
- `pick_chint_nxc(session, tenant, motor_kw, supply_voltage)` — NXC AC-3 contactor
- `pick_chint_jr36(session, tenant, motor_kw, supply_voltage)` — JR36 overload

Each tries the `hnx_rnd_asset` table first (JSON-B params query), then
falls back to the engineering table synthesis so the wizard never blanks
when the catalog is incomplete.
