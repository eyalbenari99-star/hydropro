# Wizard design

## Pattern

Each discipline has:
- A **question set** (config-driven, JSON or TS).
- A **wizard component** (React) that renders the questions.
- A **backend builder** that turns answers into a domain spec.
- A **selector engine** that picks assets for each element of the spec.
- A **3D adapter** that converts the spec to a Scene3D.

Same skeleton, different content.

## Adding a new discipline

1. Author `data/<discipline>_question_set.json`.
2. Add `app/api/wizards.py::<discipline>_build()` endpoint.
3. Add `app/services/selector_<discipline>.py`.
4. Add `rnd-core/wizards/<discipline>Questions.ts` (TS mirror of the JSON).
5. Add `rnd-ui/wizards/<Discipline>Wizard.tsx`.
6. Optionally add `rnd-core/scene-engine/<discipline>To3DGeometry.ts` for the 3D viewer.

## Question types

- `select` — radio buttons / dropdown.
- `number` — numeric input with min/max/units.
- `boolean` — checkbox.
- `text` — free text (used sparingly, mostly for titles).

## Mixing wizard + AI

`AiApplyPanel` has a toggle:
- **Wizard mode** — opens the discipline's wizard.
- **Smart text mode** — paste markdown / free text → backend parser routes:
  - Deterministic match (e.g. cabinet markdown table) → exact build.
  - Otherwise → LLM extraction → spec → same builder.

## Validation

- The question set marks required fields with `required: true`.
- Numeric fields have `min`/`max`.
- The frontend disables the **Build** button until every required field has a value.
- The backend re-validates and returns `400 + reason` on missing fields.
