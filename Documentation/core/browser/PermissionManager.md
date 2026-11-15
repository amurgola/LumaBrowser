# PermissionManager

`core/browser/PermissionManager.js`

The deny-by-default policy for every web permission request, attached to every tab
session (the shared `persist:main` partition, the default session hosting the app's
own file:// UI, and private partitions).

## Rules

- `notifications`: a remembered per-origin answer, otherwise a prompt with Allow / Block
  (no Allow once). Persisted (keep-alive) tabs and internal app tabs may always notify unless
  the origin was blocked, so notification interception keeps working for the tabs that exist
  for it; the app's file:// UI and `chrome-extension://` pages are always granted. The check
  handler answers the same way, so a site with no answer reads as not granted (the tab
  preload's MainWorldScript reports that to the page as `'default'`).
- `clipboard-sanitized-write`: granted to the app's own file:// UI only.
- `display-capture` (screen, window and tab capture; Electron 45 reports it apart from `media`): granted to
  the app's own file:// UI only, without a prompt. The session's display-media handler then decides what the
  page may capture (a window tab gets its own window, anything else nothing). A website asking is denied.
- `camera`, `microphone`, and `media` (Chromium's getUserMedia permission): the app
  UI keeps them. Remote pages get a remembered per-origin answer when one exists,
  otherwise a prompt with Allow once / Always allow / Block.
- `localModel` (the local model through the web Prompt API; not an Electron permission request, asked by
  [PromptApiAccess](../prompt-api/PromptApiAccess.md) through `decideSiteAccess`): the app's own file:// pages
  have it. A site gets its remembered per-origin answer when one exists, otherwise a prompt in its tab with
  Allow once / Always allow / Block. A page with no origin is refused.
- Allow once is scoped to tab + origin + kind and dies on cross-origin navigation,
  tab close, or app exit. Always allow and Block persist (see SitePermissionStore).
- Hidden persisted tabs never prompt: remembered answer or denial.
- Everything else is denied.
- The check handler polices `media` (device labels in enumerateDevices and
  navigator.permissions state) and `notifications`; every other check keeps Electron's
  default (allowed).

The check handler never throws: Electron calls it synchronously from a page's permission
query, and an exception there is an uncaught error in the main process, whose error box
blocks the app. A failing check (a page still asking while the app quits, after the
settings database closed) answers "not granted".

Every Electron callback completes exactly once, including when the tab closes or
navigates away while its prompt is open (denied). Concurrent requests for the same
tab + origin + kinds share one prompt. An unanswered prompt is dismissed after
`PROMPT_TIMEOUT_MS` (2 minutes).

A webContents that is not one of our tabs (a real popup window) gets a synthetic
identity `wc:<id>` so allow-once and dedupe still work; it is tracked by its own
`destroyed` event, and its prompt is sent with `tabId: null`.

## Methods

- `new PermissionManager({ db, getMainWindow, windowForTab, resolveTab, logger })`. `resolveTab(wc)`
  returns `{ id, hidden }` or null. `windowForTab(tabId)` returns the window the tab is
  drawn in: its prompt (and the prompt's close) goes there, so a tab dragged into its
  own window is prompted in that window. Without it, or for a webContents that is not
  a tab, prompts go to the main window.
- `PermissionManager.install(instance)` / `PermissionManager.current()` hold the
  process-wide instance (TabViewManager uses it to attach sessions and report lifecycle).
- `attachSession(session)` installs the request and check handlers once per session.
- `handleRequest(wc, permission, callback, details)` the request handler.
- `check(wc, permission, requestingOrigin, details)` the synchronous check handler.
- `decideMedia(wc, origin, kinds)` resolves to the grant, prompting if undecided.
- `decideSiteAccess(wc, requestingOrigin, kind)` for access that is not an Electron
  permission request (the local model): the origin comes from `requestingOrigin`, else
  the page's URL; the app origin resolves true, no origin false, anything else goes
  through `decideMedia` with `[kind]`.
- `siteBlocked(requestingOrigin, kind)` whether the user answered Block for this site
  and kind.
- `respond(requestId, decision)` settles a prompt; decision is `once | always | block`,
  anything else dismisses. Returns false for an unknown or settled request.
- `onTabNavigated(tabId, url)`, `onTabClosed(tabId)`, `onTabHidden(tabId)` lifecycle hooks.
- `listSites()`, `clearSite(origin)`, `clearAllSites()` for Settings.
- Constants: `SITES_KEY`, `PROMPT_TIMEOUT_MS`, `DECISIONS`.

IPC: main sends `permission:prompt` `{ requestId, tabId, origin, host, kinds, what }`
and `permission:prompt-close` `{ requestId }`; the renderer answers on
`permission:decision`. Settings handles `core.settings.sitePermissions.list`,
`.clear`, `.clearAll`.

## Why

The prompt is rendered by the main-window renderer in a ChromeOverlay layer
because DOM cannot paint over the native page view.
