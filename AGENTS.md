# AGENTS.md

## Stack and commands
- Vanilla JS (ES modules) + Vite 6 + Leaflet. No framework, TypeScript, tests or linter.
- Use `npm.cmd` in PowerShell, because `npm.ps1` is blocked by the execution policy.
- `npm.cmd run dev` starts the dev server. `npm.cmd run build` is the only verification step, so run it after changes.
- Don't open `index.html` via `file://`. ES modules and `?raw` imports need Vite.
- UI copy and data are in Spanish (Comuna 2 Santa Cruz, Medellín). Prices are COP, formatted with `es-CO`.
- `docs/legacy/Santa_Cruz_Vive_Digital_Prototipo.html` is the original single-file prototype. It is reference only, so don't edit it.
- Git repo on `main`. Commit only when asked, with short conventional messages (`feat:`, `fix:`, `refactor:`, `chore:`).

## Architecture
- `src/main.js` imports the global CSS and calls `app/App.js`. `App.js` creates one `<section class="screen" id="screen-<id>" data-screen="<id>">` per screen and calls its `mount(section)`.
  - Section ids are prefixed on purpose. A bare `id="mapa"` would collide with the `#mapa` hash and make the browser scroll to it.
- Each screen is a feature in `src/features/<id>/` with `index.js`, `<id>.html` (imported with `?raw`) and `<id>.css`. `index.js` exports `screen = { id, label, icon, nav, access, mount, onShow? }`.
  - `access` is `'public'` (only without a session), `'auth'` (any user) or an array of roles.
  - `nav: true` puts the screen in the header nav (bottom bar on mobile). `onShow` runs on every activation. The map is created lazily there, because Leaflet needs a visible container.
- To add a screen, create the feature folder and register it in `src/features/index.js`. Nav order follows the `SCREENS` array.
- `app/router.js` is a hash router with guards. It redirects to `bienvenida` without a session and to `inicio` with one. `navigate(id)` is for code, and `data-navigate="id"` works through delegated clicks.
- State is persisted to `localStorage` through `core/store.js` (`persistKey`).
  - `state/appStore.js`: `user` (name, role, age, barrio, availability, interests) and `affinities`. Scores are random but computed once and then persisted.
  - `state/contentStore.js`: enrollments, joined teams, user-created teams and events, and project decisions. Mutate it only through the exported actions.
  - Features react with `store.watch(selector, cb)` (fires once immediately) or `store.subscribe(cb)`. Everything else is local to the feature module.
- Roles are `consumidor`, `gestor` and `admin` (`config/constants.js`). There is no backend or real auth, so the profile page lets you switch roles for demos. Registration only offers consumidor and gestor.
  - `consumidor`: browses and enrolls (Para ti, Eventos, Mapa, Retos).
  - `gestor`: creates events on `gestion` ("Mis eventos") and sees a dashboard of only the events whose `ownerId` is their user id. Their events start as `pending`.
  - `admin`: `admin` (Moderación) approves or rejects pending events and projects, and publishes events directly. `impacto` (global dashboard) is admin only.
  - Screen visibility comes from each screen's `access`, so a new role-gated screen needs no router change.
- Events (`data/events.js` seeds + `contentStore.events`) have `status` (`pending`/`approved`/`rejected`), `capacity`, `registered` and an ISO `date`. `registered` is a simulated baseline set when an event is approved. Live counts come from `services/events.js` `eventStats`, which adds the local user's own enrollment (`event:<id>`).
- Hardcoded data is in `src/data/*`. Interests and their activities are one object in `data/interests.js`. Keep its keys in sync with anything keyed by interest. Activity ids are `activity:<interestKey>`, and place enrollments are `place:<id>`.
- Map (`features/mapa`): Leaflet with OSM raster tiles (`MAP_CONFIG` in `config/constants.js`).
  - The CARTO `rastertiles` URL now returns "API KEY REQUIRED" watermarks, so don't switch back to it.
  - Walking routes come from `services/routing.js` (public `routing.openstreetmap.de` foot router) and fall back to a straight dashed line on failure.
  - Geolocation farther than 20 km from the commune falls back to a reference point in Santa Cruz.
  - Markers use `L.divIcon`, so no Leaflet marker image assets are needed.
- Shared UI is in `src/shared/` (`components/*`, `icons.js`). `formModal` backs every modal and mounts into `#modal-root`. It supports `text`, `date`, `number` and `select` fields. `eventModal` wraps it for event creation. `chipGroup` renders every filter. `activityCard`, `eventCard` and `enrollButton` are reused across screens.

## Conventions
- Insert user-provided text into `innerHTML` only through `escapeHtml` (`core/dom.js`). Stored custom content is raw, so escape it at render time.
- Don't edit files containing accents with PowerShell `Get-Content`/`Set-Content`. Windows PowerShell 5.1 can mangle UTF-8. Use the edit tool instead. Console output of accents looks garbled, but the files are fine.
- Don't use inline `onclick` or inline `style` for static styling.
  - Use delegated listeners (`delegate`) and CSS classes.
  - Inline `style` is only for data-driven positions and colors.
- Global design tokens are in `styles/base/variables.css`. Reusable component styles are in `styles/components/`, imported through `styles/main.css`. Screen-specific CSS stays in its feature folder.
- Don't put `backdrop-filter` or `transform` on an ancestor of a `position: fixed` element. It becomes the containing block. This is why the mobile header drops its blur, so the bottom nav stays fixed to the viewport.
