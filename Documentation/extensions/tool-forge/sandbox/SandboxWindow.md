# SandboxWindow

`extensions/tool-forge/sandbox/SandboxWindow.js`

The hidden renderer that tool code runs in, and its lockdown.

## Methods

- `new SandboxWindow({ electron, onCrash, dir = __dirname })`.
- `prepare()`: the live window, created lazily; after `RECYCLE_AFTER` (50)
  calls a fresh one. Creation: harden the session once, open a `BrowserWindow`
  with `windowOptions(dir/runner-preload.js)`, deny `window.open`, watch
  `render-process-gone` (calls `onCrash('Sandbox crashed (<reason>).')` and
  drops the window), load `dir/runner.html`.
- `nextCallId()`: `c<base36 time>_<count>`; counts toward recycling.
- `isSender(event)`: the IPC came from the current runner page.
- `destroy()`.
- `SandboxWindow.windowOptions(preload)`: `show: false`, 400x300,
  `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`,
  `nodeIntegrationInWorker: false`, `webSecurity: true`,
  `partition: 'tool-forge-sandbox'` (no `persist:`, in memory),
  `backgroundThrottling: false`.
- `SandboxWindow.isOwnPageUrl(url)`: `file:` or `about:blank`.

Session hardening (partition `tool-forge-sandbox`): every permission request
and check is denied, and `webRequest.onBeforeRequest` cancels every request
except the runner page's own (`isOwnPageUrl`); all real network goes through
the IPC net bridge.
