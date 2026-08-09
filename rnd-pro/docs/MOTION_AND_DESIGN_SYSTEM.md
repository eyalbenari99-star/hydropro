# Nexi R&D cockpit — design and motion system

## Visual direction

The R&D module uses the same HydroNexis-AI digital-twin family as Production while expressing a different job: professional engineering, evidence, precision, and controlled autonomy.

- Near-black operational background rather than flat black.
- Cyan indicates active engineering intelligence and editable geometry.
- Lime indicates verified/nominal outcomes.
- Amber indicates review, assumption, or decision required.
- Red is reserved for critical engineering or security risk.
- Violet identifies industrial/design-option work without changing semantic status colors.
- Fine grid, ruler, scan, and calibration motifs establish a CAD/engineering context.

The implementation uses CSS shapes, gradients, typography, borders, and canvas geometry; it does not depend on remote visual assets.

## Motion principles

1. Motion explains system state. It is never decorative noise on top of critical decisions.
2. New surfaces enter with a short opacity/vertical transition.
3. Cards stagger only during initial presentation; hover motion is limited to four pixels.
4. Nexi uses slow orbital and scan motion to signal monitoring, never human-like emotion.
5. Live dots pulse at low frequency.
6. Thinking indicators are shown only while a response is being prepared.
7. Object movement and resizing follow the pointer directly; no easing is applied to precision editing.
8. `prefers-reduced-motion: reduce` disables nonessential motion globally.

## Motion tokens

| Token | Value | Use |
|---|---:|---|
| Immediate | 1–80 ms | Precision pointer feedback |
| Fast | 180–200 ms | Buttons, tabs, hover states |
| Surface | 400–520 ms | Page/card entry |
| Ambient | 2–8 s | Nexi orbit, scan, live monitoring |
| Standard curve | `cubic-bezier(.22,.8,.24,1)` | Surface entry |

## Interaction requirements

- Selected objects use a cyan dashed bounding box.
- Images and box objects expose eight resize handles.
- Image and symbol objects expose a separate amber rotation handle.
- Shift constrains aspect ratio; image aspect lock is also available in properties.
- Alt temporarily bypasses grid snap during pointer manipulation.
- Shift plus arrow moves ten units; arrow alone moves one unit.
- Delete/Backspace deletes the working-revision object after selection.
- Ctrl/Cmd plus wheel zooms around the pointer location.
- Approved and issued revisions must disable mutation in the production permission adapter.

## Accessibility

- The canvas is focusable and has an accessible label.
- Keyboard nudge and delete behavior are supported.
- Buttons include visible labels or accessible labels/titles.
- Semantic colors are accompanied by text.
- Important information is not conveyed through animation alone.
- Motion is removed for users who request reduced motion.
- Production QA must complete keyboard, focus visibility, zoom/reflow, and screen-reader testing for all nonvisual actions.

