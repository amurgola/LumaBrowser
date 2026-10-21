# ShimBridge

`core/chrome-extensions/bridge/ShimBridge.js` (main process)

The main-process end of the extension service-worker shim. It owns the
[ChromeContextMenus](ChromeContextMenus.md) registry and the
[ChromeWebNavigation](ChromeWebNavigation.md) source, registers
[shim-worker-preload.js](../shim/shim-worker-preload.md) in every session that
holds extensions, pairs each extension worker with its IPC, and moves calls and
events between them. One instance, created in `FoundationServices` and handed
to `ChromeExtensionService` as `bridge`.

## Methods

- `new ShimBridge({ log })`.
- `attach(session)`: once per session. Registers the preload
  (`registerPreloadScript({ type: 'service-worker' })`), then listens to
  `session.serviceWorkers`: on `running-status-changed` with `starting` or
  `running` it fetches the `ServiceWorkerMain`, keeps it under the extension id
  from its `chrome-extension://` scope, and installs the `luma-shim:call`
  handler on `worker.ipc` (once per worker); `stopped` forgets the worker.
  Workers of site service workers are ignored. `console-message` warnings and
  errors from extension workers are logged as `[chrome-ext sw] ...`.
  `SessionSetup` attaches the default and `persist:main` sessions at startup
  and every later session on `session-created`; a registration made just
  before `loadExtension` reaches the worker too late.
- `installNavigation(app, getTabViewManager)`: wires ChromeWebNavigation to
  `web-contents-created`.
- `forgetExtension(extId)`: clears its menu items in every attached session
  (removal or disable).
- `broadcast(session, extId, ns, name, args)`,
  `broadcastAll(session, ns, name, args)`: `luma-shim:event` to the running
  workers of one or all extensions in a session.
- `sendAwake(session, extId, ns, name, args)`: like broadcast, but when no
  worker runs it calls `startWorkerForScope` first, so a menu click reaches a
  background Electron had stopped.

## Calls

`luma-shim:call` carries `{ ns, op, args }`:

| ns.op | goes to |
|---|---|
| `bridge.hello` | `contextMenus.setName` (the extension's display name) |
| `contextMenus.create / update / remove / removeAll` | the registry |
| `webNavigation.getFrame / getAllFrames` | the frame tree |

Anything else rejects with `Unknown shim call`.
