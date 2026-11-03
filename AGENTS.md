# AGENTS.md

Cadence is a private, on-device cycle tracker (PWA). Vanilla JS ES modules, no build, no dependencies, no network calls.

## Commands

- `npm run dev` serves on :8000
- `npm test` runs `node --test` (test/cycle.test.js, test/store.test.js)

## Architecture

- `cycle.js` pure model. Every function takes a profile and an ISO date (`YYYY-MM-DD`) and returns data. Never touches DOM or storage. Add logic here first, with a test.
- `content.js` all user-facing copy and option lists. Change wording here, not in `app.js`.
- `store.js` the only module that reads or writes state. `commit(mutate)` persists, notifies and returns an `undo` function. Everything entering state goes through `normalize*`.
- `app.js` templates return `html\`\``; interpolated values are escaped unless they are `Raw`. Events are delegated through `data-action` and the `actions` map. Log chips update in place; do not re-render while the user is typing.
- `styles.css` tokens at the top (`--bg`, `--ink`, `--line`, phase colors). Light and dark follow the system. One accent per phase through `body[data-phase]`.

## Invariants (do not break)

- localStorage key `cadence_pwa_state_v2`; saved shape `{ theme, activeProfileId, activeView, profiles }`.
- Import must keep accepting: vault `{ profiles: [...] }`, `{ type: 'cadence_single_profile', profile }`, and a bare `{ name, periods }`.
- Profile: `{ id, name, relation, goal, color, cycleLength, periodLength, lutealLength, periods: [{ start, length }], logs: { ISO: {...} } }`. A profile always has at least one period.
- Asset paths stay relative (GitHub Pages subpath).
- Destructive actions return an undo and show a toast; keep it that way.
- Dates are ISO strings handled by helpers in `cycle.js`; do not use `new Date('YYYY-MM-DD')` directly (timezone shifts).

## Style

- No taglines, helper text or secondary labels. If a screen needs them, fix the layout.
- Inputs are 16px minimum. Tap targets are 44px.
- Respect `prefers-reduced-motion`.
- Health copy is hedged and inclusive. Cite only sources you have verified.
