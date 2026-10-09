# TabShareWebRouter

`extensions/tab-share/TabShareWebRouter.js`

Public `/tab` routes on the Network Sharing web backend listener (never the
desktop REST gateway). Whitelist-only, like `/share`: the only way in is an
exact 32-hex token, regex-gated before the store is consulted; everything
else is the same `404 Not found`.

## Methods

- `new TabShareWebRouter(service, { webDir, WebSocketServer })`: `webDir`
  defaults to the extension's `web/` folder; `WebSocketServer` defaults to
  `ws`'s (null refuses every upgrade).
- `buildRouter()` (express via [AppDependencyLoader](AppDependencyLoader.md)):
  - `GET /tab/assets/*`: the viewer assets, static, no index.
  - `GET /tab/:token`: `viewer.html`, `Cache-Control: no-store`.
  - `GET /tab/:token/info`: `{ title, pageUrl, mode, live }`, no-store.
  - anything else under `/tab`: 404, so nothing falls through to the PWA shell.
- `buildUpgrade()`: the raw `upgrade` handler. Only
  `/tab/<32 hex>/ws` with a live streamer is accepted (max payload 64 KB);
  everything else has its socket destroyed. The web server applies the
  origin policy before this runs.
