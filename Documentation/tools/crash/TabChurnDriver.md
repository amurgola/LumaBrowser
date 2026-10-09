# TabChurnDriver

`tools/crash/TabChurnDriver.js`

`--drive` for crash-repro: churns tabs over the local REST gateway (`http://127.0.0.1:<port>/api/browser`) while
the persisted tabs cold-load. After a 2.5 s start delay each cycle does `POST /tabs` (a URL from `URLS`),
`POST /tabs/<id>/activate`, `POST /tabs/0/activate`, `DELETE /tabs/<id>`, the attach / visibility / detach
sequence a user makes by hand. Works with a locked desktop. Ends with `[drive] <ops> ops, <errs> errors` in the
run's console log.

## Methods

- `new TabChurnDriver({ port, fetchImpl, sleep, urls })`; `run(child, log, stopAt, now)` resolves `{ ops, errs }`.
- `TabChurnDriver.tabId(reply)`: the id from `{ data: { id } }` or `{ data: { tab: { id } } }`.
- Constants: `URLS`, `START_DELAY_MS`, `REQUEST_TIMEOUT_MS`.
