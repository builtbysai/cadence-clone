# Tide

A private cycle tracker. Everything stays on your device.

Open `index.html` through any static server. There is no build step and no dependencies.

```sh
npm run dev    # http://localhost:8000
npm test       # model and store tests
```

## Deploy

Push to `main`. GitHub Pages serves the repository root. All asset paths are relative, so it works under a subpath such as `/cadence/`.

## Structure

| File | Role |
| --- | --- |
| `cycle.js` | Pure cycle model: dates, phases, forecasts. No DOM. |
| `content.js` | All copy and option lists. |
| `store.js` | State, localStorage, import/export, undo. No DOM. |
| `figures.js` | SVG builders for the Guide and tendencies chart. |
| `app.js` | UI: views, sheets, events. |
| `styles.css` | Design tokens and components. |
| `sw.js` | Offline cache. |

Your data lives in `localStorage` under `cadence_pwa_state_v2`. Use **More → Export backup** to save it.
