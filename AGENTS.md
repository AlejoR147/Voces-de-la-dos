# AGENTS.md

## Stack and commands
- Vanilla JS (ES modules) + Vite 6. No framework, TypeScript, tests, linter or git.
- Use `npm.cmd` in PowerShell, because `npm.ps1` is blocked by the execution policy.
- `npm.cmd run dev` starts the dev server. `npm.cmd run build` is the only verification step, so run it after changes.
- Don't open `index.html` via `file://`. ES modules and `?raw` imports need Vite.
- UI copy and data are in Spanish (Comuna 2 Santa Cruz, Medellín). Prices are COP, formatted with `es-CO`.
- `docs/legacy/Santa_Cruz_Vive_Digital_Prototipo.html` is the original single-file prototype. It is reference only, so don't edit it.

## Architecture
- `src/main.js` imports the global CSS and calls `app/App.js`. `App.js` builds the tabs and an empty `<section class="screen" id=...>` per screen, then calls each feature's `mount(section)`.
- `app/router.js` is a tab and hash router. `navigate(id)` is for code. Any element with `data-navigate="id"` navigates through delegated click handling.
- Each screen is a feature in `src/features/<id>/` with `index.js`, `<id>.html` (imported with `?raw`) and `<id>.css`. `index.js` exports `screen = { id, label, mount }`.
- To add a screen, create the feature folder and register it in `src/features/index.js`. Tab order follows the `SCREENS` array.
- Cross-screen state lives only in `state/appStore.js` (`role`, `barrio`, `interests`, `affinities`).
  - Features react with `appStore.watch(selector, cb)`. `watch` fires once immediately, then on changes.
  - Everything else is local to the feature module.
- Hardcoded data is in `src/data/*`. Interests and their activities are one object in `data/interests.js`. Keep its keys in sync with anything keyed by interest.
- Shared UI is in `src/shared/components/`. `formModal` backs all three modals, mounted into `#modal-root`. `priceFilter` and `priceBadge` are reused by the map and recommendations.
- The "AI" in `services/affinity.js` and `services/maps.js` is fake and uses `Math.random()`, so results are non-deterministic by design.

## Conventions
- Insert user-provided text into `innerHTML` only through `escapeHtml` (`core/dom.js`).
- Don't use inline `onclick` or inline `style` for static styling.
  - Use delegated listeners (`delegate`) and CSS classes.
  - Inline `style` is only for data-driven positions and colors.
- Global design tokens are in `styles/base/variables.css`. Reusable component styles are in `styles/components/`, imported through `styles/main.css`. Screen-specific CSS stays in its feature folder.
