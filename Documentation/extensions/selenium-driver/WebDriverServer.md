# WebDriverServer

`extensions/selenium-driver/WebDriverServer.js`

The W3C WebDriver HTTP server (Express) on its own port, so URLs match what
`RemoteWebDriver(url)` expects without colliding with the gateway's `/api/*`.

## Methods

- `new WebDriverServer({ browser, apiSecurity, fallback, fallbackDefaults, prefix })`; a
  trailing slash on `prefix` is dropped. `apiSecurity` (ApiSecurity or null) supplies
  the keys an exposed server accepts. Builds the app at construction: JSON bodies up to 32 MB,
  every [WebDriverRouteTable](WebDriverRouteTable.md) route under the prefix, bound to
  [WebDriverCommandTable](WebDriverCommandTable.md) commands, then an
  `unknown command` fallback (404).
- `start(port, host = '127.0.0.1')` resolves the bound port; rejects (and stays
  stopped) when the listen fails, or before listening with
  `ExposedServerKeyGuard.NO_KEY_CONFIGURED` when `host` is not a loopback name and
  no API key exists.
- `stop()` closes the listener and drops every session. `isRunning()`, `port()`,
  `activeSessions()` -> `[{ id, tabId, createdAt }]`. `app`, `registry`, `apiSecurity`
  and `host` (the bind host passed to `start`; `DEFAULT_HOST` `127.0.0.1` before, so
  the in-process app is judged as loopback-bound) are public.

## Request handling

The first middleware, before body parsing, is
[ExposedServerKeyGuard](../../core/shared/net/ExposedServerKeyGuard.md) with the bind
host and `apiSecurity`. Bound to a loopback name, it runs
[LoopbackRequestGuard](../../core/shared/net/LoopbackRequestGuard.md): a foreign
`Host` or a present non-loopback/other-port `Origin` gets 403. Bound anywhere else,
a request without a valid API key (Bearer, `X-Api-Key`, Basic auth with the key as
password, as `http://luma:<key>@host:port` sends, or `?token=`) gets 401, and a
keyed request skips the Host/Origin check. Either refusal answers
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
