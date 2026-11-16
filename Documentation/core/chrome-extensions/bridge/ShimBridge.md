# ShimBridge

`core/chrome-extensions/bridge/ShimBridge.js` (main process)

The main-process end of the chrome.* shim. It owns the
[ChromeContextMenus](ChromeContextMenus.md) registry, the
[ChromeWebNavigation](ChromeWebNavigation.md) source, the
[ChromeTabs](ChromeTabs.md) source (`tabs`) and the
[ChromeActionBadges](ChromeActionBadges.md) store (`badges`), registers
[shim-worker-preload.js](../shim/shim-worker-preload.md) in every session that
holds extensions, pairs each extension worker and each extension page window
with its IPC, and moves calls and events between them. One instance, created
in `FoundationServices` and handed to `ChromeExtensionService` as `bridge`.

It wires the badges to the tabs: a tab switch republishes them, and a tab that
loads a new document or closes loses its own values.

## Methods

- `new ShimBridge({ log })`.
- `attach(session)`: once per session. Registers the preload
  (`registerPreloadScript({ type: 'service-worker' })`), then listens to
  `session.serviceWorkers`: on `running-status-changed` with `starting` or
  `running` it fetches the `ServiceWorkerMain`, keeps it under the extension id
  from its `chrome-extension://` scope, and installs the `luma-shim:call`
  handler on `worker.ipc` (once per worker); `stopped` forgets the worker.
  Workers of site service workers are ignored. `console-message` warnings and
  errors from extension workers are logged as `[chrome-ext sw] ...`; a
  service worker reports the level as a number (2 warning, 3 error), a name is
  accepted too.
  `SessionSetup` attaches the default and `persist:main` sessions at startup
  and every later session on `session-created`; a registration made just
  before `loadExtension` reaches the worker too late.
- `installNavigation(app, getTabViewManager)`: wires ChromeWebNavigation to
  `web-contents-created`.
- `attachTabs(tabViewManager)`: hands the tab manager to ChromeTabs; called
  by `TabSurfaces` as the manager is built.
- `attachPage(webContents)`: an extension page window (popup, options, a
  window one of them pops out) whose preload is shim-worker-preload.js. Its
  `luma-shim:call` is answered for the extension the calling frame belongs to
  (a frame that is not a `chrome-extension://` page is refused), and it
  receives events until it is destroyed. A page's `bridge.*` notes are
  dropped: they describe a worker.
- `forgetExtension(extId)`: clears its menu items, badges and listener record
  in every attached session (removal or disable).
- `broadcastAll(session, ns, name, args)`: `luma-shim:event` to every
  extension of the session (of every session when it is `null`) whose worker
  listens to that event, and to its open page windows. `args` is the argument
  list or a function of the extension id returning it (`null` leaves that
  extension out), which is how tab events hide an address from an extension
  that may not read it.
- `sendAwake(session, extId, ns, name, args)`: to the extension's running
  workers; when none runs it calls `startWorkerForScope` first, so the event
  reaches a background Electron had stopped.

## Waking a stopped worker

Chromium stops an idle extension worker after about 30 seconds. Chrome wakes
it again for an event it has a listener for, and so does the bridge: the shim
reports the first listener of each bridged event as `bridge.listen`, the
record is kept per session and extension while the worker sleeps, and
`broadcastAll` goes through `sendAwake` for exactly those extensions. Without
it an extension stopped reacting to tab switches once its worker had idled
out. An extension that listens to nothing is never woken.

## Calls

`luma-shim:call` carries `{ ns, op, args }`:

| ns.op | goes to |
|---|---|
| `bridge.hello` | `contextMenus.setName` (the extension's display name) |
| `bridge.listen` | the listener record (the event key, such as `tabs.onActivated`) |
| `contextMenus.create / update / remove / removeAll` | the registry |
| `webNavigation.getFrame / getAllFrames` | the frame tree |
| `tabs.query / get` | ChromeTabs |
| `action.setBadgeText / setBadgeBackgroundColor` | ChromeActionBadges |

Anything else rejects with `Unknown shim call`.
