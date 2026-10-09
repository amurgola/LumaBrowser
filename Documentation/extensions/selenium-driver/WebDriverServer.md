# WebDriverServer

`extensions/selenium-driver/WebDriverServer.js`

The W3C WebDriver HTTP server (Express) on its own port, so URLs match what
`RemoteWebDriver(url)` expects without colliding with the gateway's `/api/*`.

## Methods

- `new WebDriverServer({ browser, fallback, fallbackDefaults, prefix })`; a trailing
  slash on `prefix` is dropped. Builds the app at construction: JSON bodies up to 32 MB,
  every [WebDriverRouteTable](WebDriverRouteTable.md) route under the prefix, bound to
  [WebDriverCommandTable](WebDriverCommandTable.md) commands, then an
  `unknown command` fallback (404).
- `start(port, host = '127.0.0.1')` resolves the bound port; rejects (and stays
  stopped) when the listen fails.
- `stop()` closes the listener and drops every session. `isRunning()`, `port()`,
  `activeSessions()` -> `[{ id, tabId, createdAt }]`. `app`, `registry` and `host`
  (the bind host passed to `start`) are public.

## Request handling

The first middleware, before body parsing, is [LoopbackRequestGuard](../../core/shared/net/LoopbackRequestGuard.md) with the configured bind host
(`host`, set by `start`, null before): a foreign `Host` or a present
non-loopback/other-port `Origin` gets 403
`{ value: { error: 'unknown error', message: <reason>, stacktrace: '' } }` on every
route, including the unknown-command fallback. The server has no `upgrade`
listener, so Node hands upgrade attempts to the app and the same guard refuses them.

Each route sets `Content-Type: application/json; charset=utf-8` and
`Cache-Control: no-cache`, resolves `:sessionId` (unknown -> 404 `invalid session id`),
remaps params to the spec names, runs the command and answers `200 { value }`
(undefined becomes null). Errors go through `WebDriverError.serialize`.

## Bug fixed in the port

Express 5 hands a listen failure (port in use, bad host) to the `listen` callback
instead of only emitting `error`. Legacy resolved anyway, so a failed start reported
success with a dead server; the port rejects.
