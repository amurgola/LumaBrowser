# PageSettler

`core/browser/PageSettler.js`

Waits for a page to go quiet and runs evidence scripts with a hard timeout.

## Methods

- `PageSettler.settle(wc, { quietMs, maxMs, pollMs, install, shouldStop })`
  polls until the page has had no DOM mutation, scroll or finished network
  resource for `quietMs` (default 400), capped at `maxMs` (default 3000), polling
  every `pollMs` (default 100, minimum 10). Returns
  `{ settled, waitedMs, mutations, installed, stopped? }`. `install: true`
  installs the observer first; otherwise an action script must have done so.
  It returns `installed: false` at once when the observer is gone (document
  replaced), and `stopped: true` when `shouldStop()` turns true.
- `PageSettler.runBounded(wc, script, timeoutMs = 1500)` runs
  `executeJavaScript` and resolves `null` instead of hanging or throwing.
- Constants: `DEFAULT_QUIET_MS`, `DEFAULT_MAX_SETTLE_MS`, `POLL_MS`, `MIN_POLL_MS`, `SCRIPT_TIMEOUT_MS`.

## Why

Settle detection replaced a fixed 3 s post-click sleep. It is polled from Node
on purpose: agent tabs usually sit in the background, where Chromium throttles
page timers to one tick a second (far less after five minutes hidden), so an
in-page timer loop could take seconds to notice quiet. `executeJavaScript` is
not throttled. Script calls are bounded because a page blocked by `alert()`
never answers.
