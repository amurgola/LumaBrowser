# LoopbackRequestGuard

`core/shared/net/LoopbackRequestGuard.js`

Refuses DNS-rebinding and cross-site browser requests to a local automation
server (cdp-driver's CDP endpoint, selenium-driver's WebDriver endpoint), while
stock Puppeteer, Playwright, chrome-remote-interface, chromedriver-style and
Selenium clients keep working with no extra setup. All methods are static.

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

Consequence: with a wildcard or LAN bind host, remote clients must address the
server by the configured bind host name, not some other address of the machine.

## Methods

- `LoopbackRequestGuard.refusal(req, bindHost)` -> `null` when allowed, else
  `HOST_REFUSED` or `ORIGIN_REFUSED` (the reason strings, also static).
- `LoopbackRequestGuard.isAllowed(req, bindHost)` -> boolean.
- `LoopbackRequestGuard.rejectUpgrade(socket, reason)` writes a raw
  `HTTP/1.1 403 Forbidden` with a `{ error: reason }` JSON body and
  `Connection: close` before any WebSocket handshake, then ends the socket
  (destroys it if writing throws).
- `LoopbackRequestGuard.hostnameOf(header)` -> normalised hostname or `null`
  when malformed.
- Constants: `LOOPBACK_NAMES`, `WILDCARD_HOSTS`, `ORIGIN_SCHEMES`,
  `HOST_PATTERN`, `HOST_REFUSED`, `ORIGIN_REFUSED`.

## Callers

- [CdpHttpBootstrap](../../../extensions/cdp-driver/CdpHttpBootstrap.md): every
  `/json/*` route (403 `{ error }`).
- [CdpServer](../../../extensions/cdp-driver/CdpServer.md): every WebSocket
  upgrade (`rejectUpgrade`).
- [WebDriverServer](../../../extensions/selenium-driver/WebDriverServer.md):
  first middleware on every route (403 W3C `unknown error` body).
