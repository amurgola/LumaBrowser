# LoopbackRequestGuard

`core/shared/net/LoopbackRequestGuard.js`

Refuses DNS-rebinding and cross-site browser requests to a local automation
server (cdp-driver's CDP endpoint, selenium-driver's WebDriver endpoint), while
stock Puppeteer, Playwright, chrome-remote-interface, chromedriver-style and
Selenium clients keep working with no extra setup. All methods are static.
The servers reach it through [ExposedServerKeyGuard](ExposedServerKeyGuard.md),
which runs this check only while the server is bound to a loopback name; a
server bound anywhere else requires an API key instead.

## The rule

A request is accepted only when BOTH hold:

1. **Host.** The `Host` header's hostname (lower-cased, brackets and port
   stripped, any port allowed) is `localhost`, `127.0.0.1`, `::1` (written
   `[::1]` or bare `::1`), or the server's configured bind host
   (`cdp.host` / `selenium.host`). A wildcard bind host (`0.0.0.0`, `::`, empty)
   never admits its own literal, since no client connects by that name. A
   missing or malformed Host (bad port, extra colons) is refused.
2. **Origin.** The `Origin` header is absent, or it parses as an `http:` or
   `https:` URL whose hostname is `localhost`, `127.0.0.1` or `[::1]` and whose
   effective port (explicit, else 80/443) equals the port the request arrived on
   (`req.socket.localPort`). Any other present value is refused, including
   `null`, the empty string, `chrome-extension://...`, `file://`, a loopback
   origin on another port and the bind host. The bind host deliberately does not
   widen the Origin rule: the servers serve no pages, so no legitimate page has
   that origin.

Host is checked first. Why it is enough: a DNS-rebinding page keeps its own
hostname in `Host`, and every browser request (fetch, XHR, WebSocket) carries an
`Origin`, while automation clients send none. Same idea as Chrome's own
`--remote-allow-origins` gate on DevTools WebSockets.

Consequence: with a wildcard or LAN bind host this check alone would make
remote clients address the server by the configured bind host name. Such a
server is exposed, though, so ExposedServerKeyGuard replaces this check with the
API key and remote clients may send any Host.

## Methods

- `LoopbackRequestGuard.refusal(req, bindHost)` -> `null` when allowed, else
  `HOST_REFUSED` or `ORIGIN_REFUSED` (the reason strings, also static).
- `LoopbackRequestGuard.isAllowed(req, bindHost)` -> boolean.
- `LoopbackRequestGuard.rejectUpgrade(socket, reason, status = 403)` writes a
  raw `HTTP/1.1 403 Forbidden` (or the given status, e.g. `401 Unauthorized`
  from `STATUS_TEXT`) with a `{ error: reason }` JSON body and
  `Connection: close` before any WebSocket handshake, then ends the socket
  (destroys it if writing throws).
- `LoopbackRequestGuard.hostnameOf(header)` -> normalised hostname or `null`
  when malformed.
- Constants: `LOOPBACK_NAMES`, `WILDCARD_HOSTS`, `ORIGIN_SCHEMES`,
  `HOST_PATTERN`, `HOST_REFUSED`, `ORIGIN_REFUSED`, `STATUS_TEXT`.

## Callers

- [ExposedServerKeyGuard](ExposedServerKeyGuard.md): `refusal` for a
  loopback-bound server, `LOOPBACK_NAMES` and `hostnameOf` to decide exposure.
  Through it: [CdpHttpBootstrap](../../../extensions/cdp-driver/CdpHttpBootstrap.md)
  on every `/json/*` route (403 `{ error }`),
  [CdpServer](../../../extensions/cdp-driver/CdpServer.md) on every WebSocket
  upgrade, and [WebDriverServer](../../../extensions/selenium-driver/WebDriverServer.md)
  as the first middleware on every route (403 W3C `unknown error` body).
- CdpServer calls `rejectUpgrade` directly with the refusal's status (403 or 401).
