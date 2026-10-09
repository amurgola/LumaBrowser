# RendererRecovery

`core/shell/RendererRecovery.js`

Bounded automatic recovery of the main window's renderer process.

## Methods

- `new RendererRecovery({ maxRetries = 3, backoffMs = 400, log = console, setTimeoutFn = setTimeout })`
- `attach(win, hooks)` wires a BrowserWindow and returns `this`. Hooks (all
  optional): `reload()` reloads the chrome document, `onSuspended(reason)`,
  `onRenewed()`, `isExiting()` short-circuits everything during quit.
- `renew()` is the explicit open from the tray or dock: when suspended, renews
  the budget, reloads and fires `onRenewed`. Returns true only if it reloaded.
- `crashed()` records a crash; true when an automatic reload is allowed.
- `loadFailed(reason)` suspends with no automatic retry.
- `open()` leaves Suspended with a fresh budget, without reloading.
- `suspended` (getter) and `state` (`{ tag: 'operational', retries }` or
  `{ tag: 'suspended' }`).

## Behaviour

Operational carries a retry budget. A `render-process-gone` (except reasons
`clean-exit` and `killed`) reloads the chrome after `backoffMs * retries`, up to
`maxRetries` times. A main-frame `did-fail-load` (except `ERR_ABORTED` -3), a
reload that throws, or an exhausted budget moves to Suspended and hides the
window. The tray then says "Window unavailable. Open to retry", and only an
explicit open renews the budget.

A pending backoff reload is dropped if the state became Suspended meanwhile.
Hooks that throw are swallowed so recovery itself never fails.

## Why

Renderer failure never touches the LLM or image services or any child process:
those belong to the main process and keep running underneath. Bounding the
reloads stops a renderer that crashes on load from looping forever.
