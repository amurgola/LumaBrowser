# CdpHttpBootstrap

`extensions/cdp-driver/CdpHttpBootstrap.js`

Chrome's `/json/*` discovery surface, so a client finds the WebSocket URL from a base URL.
Every reply has `Content-Type: application/json; charset=utf-8` and `Cache-Control: no-cache`.

## Routes

Before routing, every request goes through
[ExposedServerKeyGuard](../../core/shared/net/ExposedServerKeyGuard.md) with the server's
bind host and `apiSecurity`. Bound to a loopback name, a foreign `Host` or a present
non-loopback/other-port `Origin` gets 403
([LoopbackRequestGuard](../../core/shared/net/LoopbackRequestGuard.md)); bound anywhere
else, a request without a valid API key gets 401 and a keyed one skips the Host/Origin
check. A refusal answers `{ error: <reason> }` and the route never runs (so a refused
`PUT /json/new` opens no tab).

On an exposed server, routes match without the `token` query parameter. When the key
came as `?token=<key>`, every `webSocketDebuggerUrl` returned (version, list, new tab)
ends in `?token=<key>` (URL-encoded), so a client that found the server by
`http://host:port?token=<key>` connects with the same key. A header or Basic key is
never written into a URL.

- `GET /json/version` -> `{ Browser: 'LumaBrowser/1.0', 'Protocol-Version': '1.3', 'User-Agent', 'V8-Version', 'WebKit-Version', webSocketDebuggerUrl }`.
- `GET /json`, `GET /json/list` -> one descriptor per target
  (`{ description, devtoolsFrontendUrl, id, title, type, url, webSocketDebuggerUrl }`).
- `GET /json/protocol` -> `{ domains: [] }` (stub).
- `PUT /json/new?<url>` opens a background automation tab (default `about:blank`); 500
  `{ error }` on failure.
- `PUT /json/activate/{id}` -> `Target activated`; `PUT /json/close/{id}` -> `Target is closing`;
  404 `No such target` for an unknown id.
- Anything else: 404 `{ error: 'Not Found' }`.

## Methods

- `new CdpHttpBootstrap(server)`, `handle(req, res)`.
