# ExposedServerKeyGuard

`core/shared/net/ExposedServerKeyGuard.js`

Decides who may use a local automation server (cdp-driver's CDP endpoint,
selenium-driver's WebDriver endpoint). A server bound off loopback demands a
configured API key on every request; a loopback-bound server keeps the
[LoopbackRequestGuard](LoopbackRequestGuard.md) Host/Origin check and needs no
key, exactly as before. All methods are static. The keys are the app's own API
keys ([ApiSecurity](../../shell/ApiSecurity.md), created in Settings > API & MCP).

## The rule

- **Exposed.** A bind host is exposed unless its normalised name
  (`LoopbackRequestGuard.hostnameOf`) is `localhost`, `127.0.0.1` or `::1`
  (`[::1]` too). So `0.0.0.0`, `::`, an empty host (all interfaces), LAN IPs,
  host names and other loopback-range addresses such as `127.0.0.2` are exposed.
- **Start.** An exposed server must not listen while no API key exists:
  `startRefusal` returns `NO_KEY_CONFIGURED`, which names Settings > API & MCP.
  No ApiSecurity at all counts as no key.
- **Requests.** On an exposed server every HTTP request and WebSocket upgrade
  must present a key `ApiSecurity.isValidKey` accepts, else 401 `KEY_REFUSED`.
  A valid key replaces the Host/Origin check, so a remote client that sends its
  real Host (the LAN IP) works. On a loopback server the Host/Origin check runs
  unchanged (403) and a key changes nothing. Keys are read live, so a key
  deleted while the server runs is refused at once.
- **Where a key is read from**, first match wins: `Authorization: Bearer <key>`
  or `X-Api-Key` ([ApiKeyEntry](../../shell/api-security/ApiKeyEntry.md)
  `fromHeaders`), then HTTP Basic auth whose password is the key (what
  `http://luma:<key>@host:port` sends), then a `token` query parameter (for
  WebSocket clients that cannot set headers; the repo's `?token=` convention).

## Methods

- `isExposed(bindHost)` -> boolean.
- `startRefusal(bindHost, apiSecurity)` -> `null` or `NO_KEY_CONFIGURED`.
- `refusal(req, bindHost, apiSecurity)` -> `null` when the request may proceed,
  else `{ status: 401 | 403, reason }` (403 reasons are LoopbackRequestGuard's).
- `presentedKey(req)` -> `{ key, source: 'header' | 'basic' | 'query' }` or `null`.
- `queryKeyToCarry(req, bindHost)` -> the key when the server is exposed and the
  key came as `?token=`, else `null`. CDP discovery puts it on the WebSocket URLs
  it returns; a header key is never echoed.
- `routedUrl(req, bindHost)` -> the URL to route on. An exposed server drops the
  `token` parameter (and a then empty `?`); every other query part keeps its raw
  form, which `PUT /json/new?<url>` relies on. A loopback server gets `req.url`
  untouched.
- Constants: `QUERY_PARAMETER` (`token`), `SOURCE_HEADER`, `SOURCE_BASIC`,
  `SOURCE_QUERY`, `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NO_KEY_CONFIGURED`,
  `KEY_REFUSED`.

## Callers

- [CdpServer](../../../extensions/cdp-driver/CdpServer.md): `startRefusal` in
  `start`; `refusal` and `routedUrl` on every upgrade (refusals written raw with
  `LoopbackRequestGuard.rejectUpgrade(socket, reason, status)`).
- [CdpHttpBootstrap](../../../extensions/cdp-driver/CdpHttpBootstrap.md):
  `refusal`, `routedUrl` and `queryKeyToCarry` on every `/json/*` request.
- [WebDriverServer](../../../extensions/selenium-driver/WebDriverServer.md):
  `startRefusal` in `start`; `refusal` as the first middleware (W3C
  `unknown error` body with the refusal status).

Both extensions get ApiSecurity from `context.sharedServices.apiSecurity`
([ExtensionHost](../../../app/services/ExtensionHost.md)).
