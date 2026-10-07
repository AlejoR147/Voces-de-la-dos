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
- State lives in `core/store.js` stores. `persistKey` persists a store to `localStorage`.
  - `state/appStore.js`: runtime session (`user`, `affinities`). It is NOT persisted as a whole: only a pointer `{ userId, expiresAt }` is stored, and admin sessions live in memory only.
  - `state/accountsStore.js`: local account registry (PBKDF2 hash + salt, profile, affinities) and login lockouts. Stored accounts can never hold the `admin` role.
  - `state/contentStore.js`: enrollments and team memberships (keyed by user id), user-created teams and events, and project decisions. Read it with `getContent()` (resolves the current user's `enrolled` / `joinedTeams`). Mutate it only through the exported actions, which enforce roles via `requireRole`.
  - Features react with `store.watch(selector, cb)` (fires once immediately) or `store.subscribe(cb)`. Everything else is local to the feature module.
- Auth (`services/auth.js`) has no backend: it hashes passwords with WebCrypto PBKDF2, locks an email for 60 s after 5 failed logins, expires user sessions after 7 days and admin sessions after 15 min idle, and writes a local audit trail (`services/audit.js`, shown in Moderación). Client-side checks can be bypassed from devtools, so treat them as defense in depth until a real backend exists.
  - The administrator comes from env vars (`src/config/admin.js`): `npm.cmd run admin:hash -- --email you@example.org --write` creates the git-ignored `.env.local` and prints a random password once. Restart `dev` after changing it. `.env.example` documents the keys.
  - `index.html` sets a strict Content-Security-Policy. When adding an external origin (tiles, APIs, fonts), add it there too.
- Roles are `consumidor` (a person), `gestor` (an organization) and `admin` (`config/constants.js`). Registration (`features/bienvenida`) offers person and organization with different steps and fields. Roles cannot be changed from the UI. Login is `features/acceso`.
  - `consumidor`: browses and enrolls (Para ti, Eventos, Mapa, Retos). Only consumers can enroll or join teams.
  - `gestor`: creates events on `gestion` ("Mis eventos") and sees a dashboard of only the events whose `ownerId` is their user id. Their events start as `pending`. They also create retos.
  - `admin`: `admin` (Moderación) approves or rejects pending events and projects, publishes events directly and sees the audit log. `impacto` (global dashboard) is admin only.
  - Screen visibility comes from each screen's `access`, so a new role-gated screen needs no router change.
- Events (`data/events.js` seeds + `contentStore.events`) have `status` (`pending`/`approved`/`rejected`), `capacity`, `registered` and an ISO `date`. `registered` is a simulated baseline set when an event is approved. Live counts come from `services/events.js` `eventStats`, which adds the enrollments of every local account (`event:<id>`).- Hardcoded data is in `src/data/*`. Interests and their activities are one object in `data/interests.js`. Keep its keys in sync with anything keyed by interest. Activity ids are `activity:<interestKey>`, and place enrollments are `place:<id>`.
- Map (`features/mapa`): Leaflet with OSM raster tiles (`MAP_CONFIG` in `config/constants.js`).
  - The CARTO `rastertiles` URL now returns "API KEY REQUIRED" watermarks, so don't switch back to it.
  - Walking routes come from `services/routing.js` (public `routing.openstreetmap.de` foot router) and fall back to a straight dashed line on failure.
  - Geolocation farther than 20 km from the commune falls back to a reference point in Santa Cruz.
  - Markers use `L.divIcon`, so no Leaflet marker image assets are needed.
- Shared UI is in `src/shared/` (`components/*`, `icons.js`). `formModal` backs every modal and mounts into `#modal-root`. It supports `text`, `date`, `number` and `select` fields. `eventModal` wraps it for event creation. `chipGroup` renders every filter. `activityCard`, `eventCard` and `enrollButton` are reused across screens.

## Conventions
- Insert user-provided text into `innerHTML` only through `escapeHtml` (`core/dom.js`). Stored custom content is raw, so escape it at render time.
- Don't edit files containing accents with PowerShell `Get-Content`/`Set-Content`, and don't type accented literals inside PowerShell commands. Windows PowerShell 5.1 mangles UTF-8 (it produced `U+FFFD` in a toast once). Use the edit tool instead. Console output of accents looks garbled, but the files are fine.
- Don't use inline `onclick` or inline `style` for static styling.
  - Use delegated listeners (`delegate`) and CSS classes.
  - Inline `style` is only for data-driven positions and colors.
- Global design tokens are in `styles/base/variables.css`. Reusable component styles are in `styles/components/`, imported through `styles/main.css`. Screen-specific CSS stays in its feature folder.
- Don't put `backdrop-filter` or `transform` on an ancestor of a `position: fixed` element. It becomes the containing block. This is why the mobile header drops its blur, so the bottom nav stays fixed to the viewport.
