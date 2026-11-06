# NewTabPage

`core/browser/newtab/NewTabPage.js`

The new tab page at `luma://newtab/`: a search box for the user's search engine and the most visited sites (one tile
per host over the last 90 days, at most 8, with favicons from the favicon cache), nothing else.

- **Scheme:** `luma:` is registered privileged (standard, secure, fetch) before the app is ready (ProcessSetup) and
  served on every tab session (SessionSetup). Only `/`, `/newtab.html`, `/newtab.css` and `/newtab.js` of host
  `newtab` exist, from `ui/newtab`; anything else is a 404.
- **"New tabs open"** (`core.newtab.mode`: `newtab` (default) or `start`) decides what Ctrl+T, the + button, the
  first tab at startup and the replacement for a closed last tab open: `NewTabPage.resolve(db)`.
- **A tile's x** hides its host (`core.newtab.hidden`).

## Methods

- Statics: `privilegedScheme()`, `isNewTab(url)`, `resolve(db)`, `attach(session, fetchFile)` (once per session),
  `serve(url, fetchFile)`.
- `new NewTabPage({ db, history, favicons })`, `mode()`, `setMode(mode)`, `url()`, `data()` -> `{ engine: { name },
  sites: [{ url, title, host, icon }] }`, `searchUrl(query)`, `hidden()`, `hide(url)`, `resetHidden()`.
