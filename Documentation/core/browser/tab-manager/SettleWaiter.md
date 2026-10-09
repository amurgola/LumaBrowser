# SettleWaiter

`core/browser/tab-manager/SettleWaiter.js`

waitForSettle: the quiet-page wait for callers that changed the page some other way.

## Methods

- `SettleWaiter.wait(page, { quietMs, maxMs })` -> `{ success, data: { settled, waitedMs, mutations } }`. Installs the observer, settles via [PageSettler](../PageSettler.md) (defaults 400 ms quiet, 3000 ms cap), then tears the observer down.
