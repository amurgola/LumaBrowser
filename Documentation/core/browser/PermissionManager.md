# PermissionManager

`core/browser/PermissionManager.js`

The deny-by-default policy for every web permission request, attached to every tab
session (the shared `persist:main` partition, the default session hosting the app's
own file:// UI, and private partitions).

## Rules

- `notifications`: always granted (notification interception is the product).
- `clipboard-sanitized-write`: granted to the app's own file:// UI only.
- `camera`, `microphone`, and `media` (Chromium's getUserMedia permission): the app
  UI keeps them. Remote pages get a remembered per-origin answer when one exists,
  otherwise a prompt with Allow once / Always allow / Block.
- Allow once is scoped to tab + origin + kind and dies on cross-origin navigation,
  tab close, or app exit. Always allow and Block persist (see SitePermissionStore).
- Hidden persisted tabs never prompt: remembered answer or denial.
- Everything else is denied.
- The check handler only polices `media` (device labels in enumerateDevices and
  navigator.permissions state); every other check keeps Electron's default (allowed).

Every Electron callback completes exactly once, including when the tab closes or
navigates away while its prompt is open (denied). Concurrent requests for the same
tab + origin + kinds share one prompt. An unanswered prompt is dismissed after
`PROMPT_TIMEOUT_MS` (2 minutes).

A webContents that is not one of our tabs (a real popup window) gets a synthetic
identity `wc:<id>` so allow-once and dedupe still work; it is tracked by its own
`destroyed` event, and its prompt is sent with `tabId: null`.

## Methods

- `new PermissionManager({ db, getMainWindow, resolveTab, logger })`. `resolveTab(wc)`
  returns `{ id, hidden }` or null.
- `PermissionManager.install(instance)` / `PermissionManager.current()` hold the
  process-wide instance (TabViewManager uses it to attach sessions and report lifecycle).
- `attachSession(session)` installs the request and check handlers once per session.
- `handleRequest(wc, permission, callback, details)` the request handler.
- `check(wc, permission, requestingOrigin, details)` the synchronous check handler.
- `decideMedia(wc, origin, kinds)` resolves to the grant, prompting if undecided.
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
