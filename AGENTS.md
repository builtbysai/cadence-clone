# AGENTS.md

Cadence is a private, on-device cycle tracker (PWA). Vanilla JS ES modules, no build, no dependencies, no network calls.

## Commands

- `npm run dev` serves on :8000
- `npm test` runs `node --test` (test/cycle.test.js, test/store.test.js)

## Architecture

- `cycle.js` pure model. Every function takes a profile and an ISO date (`YYYY-MM-DD`) and returns data. Never touches DOM or storage. Add logic here first, with a test.
- `content.js` all user-facing copy and option lists. Change wording here, not in `app.js`.
- `store.js` the only module that reads or writes state. `commit(mutate)` persists, notifies and returns an `undo` function. Everything entering state goes through `normalize*`.
- `figures.js` pure SVG builders: Guide illustrations and the tendencies rose. No DOM, no state.
- `app.js` templates return `html\`\``; interpolated values are escaped unless they are `Raw`. Events are delegated through `data-action` and the `actions` map. Log chips update in place; do not re-render while the user is typing.
- `styles.css` tokens at the top (`--bg`, `--ink`, `--line`, phase colors). Light and dark follow the system. One accent per phase through `body[data-phase]`.

## Invariants (do not break)

- localStorage key `cadence_pwa_state_v2`; saved shape `{ theme, activeProfileId, activeView, profiles }`.
- Import must keep accepting: vault `{ profiles: [...] }`, `{ type: 'cadence_single_profile', profile }`, and a bare `{ name, periods }`.
- Profile: `{ id, name, relation, goal, color, cycleLength, periodLength, lutealLength, periods: [{ start, length }], logs: { ISO: {...} } }`. A profile always has at least one period.
- Saved tag strings (moods, symptoms, intimacy notes) are ids such as `Warm / Affectionate` and `Salt/Sweet Cravings`. Change `label` in `content.js`, never `id`. `canonicalTag` maps older spellings back.
- Top-level fields the app does not own (for example `theme`) are written back untouched. `/cadence/` and any sibling path share one origin and one storage key.
- Asset paths stay relative (GitHub Pages subpath).
- Destructive actions return an undo and show a toast; keep it that way.
- Dates are ISO strings handled by helpers in `cycle.js`; do not use `new Date('YYYY-MM-DD')` directly (timezone shifts).

## Style

- No taglines, helper text or secondary labels. If a screen needs them, fix the layout.
- Inputs are 16px minimum. Tap targets are 44px.
- Respect `prefers-reduced-motion`.
- Health copy is plain and inclusive ("people", "they"). Say what the evidence supports and no more; don't hedge every line. Cite only sources you have verified; see the comment above `GUIDE` in `content.js`.
- Model rules (cycle.js): fertile window is the six days ending on ovulation (peak = last three). Prediction margins (±days) appear only after three observed cycles. A positive LH test or a three-day temperature rise moves ovulation and the next period for the current cycle (`observedOvulation`). Normal ranges follow FIGO 2018 (`regularity`).
- Profile `hormonal: true` turns off fertility, ovulation, hormone curves, temperature and LH fields. Check `p.hormonal` when adding anything fertility-related.
- Log fields added in this version (`pain`, `events`) and the profile field `hormonal` default safely when absent in old data and backups.
- Do not use `100vw`; it includes the scrollbar on Windows and causes horizontal scroll.
- Test layout at 320, 390, 768, 1024, 1440 and 1920px before shipping.
