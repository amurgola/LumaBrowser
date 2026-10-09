# WebAppServer

`core/network-sharing/webapp/WebAppServer.js`

The web backend: a standalone HTTP listener serving the browser chat client (a
PWA) with the sharing API, public share links, trigger webhooks and registered
extra mounts on the same origin, so any device on the network can open a URL and
use the host's shared models without the Electron app. Extends
[SharingListener](../host/SharingListener.md).

## Methods

- `new WebAppServer({ hostService, assetDirs })`: `hostService` is the
  SharingHostService (throws without one). `assetDirs` overrides any of
  `WebAppServer.defaultAssetDirs()` (tests).
- `WebAppServer.defaultAssetDirs()` returns `{ publicDir, llmUiDir, shellUiDir,
  monacoDir, chartDir }`: `webapp/public`, `core/llm-server/ui`, `core/shell/ui`,
  `node_modules/monaco-editor/min/vs`, `node_modules/chart.js/dist`.
- `WebAppServer.normalizePrefix(prefix)`: see [WebMountRegistry](WebMountRegistry.md).
- `setHooksRouter(router)`: the trigger webhook receiver, mounted at `/hooks` on
  the next (re)start.
- `registerMount(prefix, { router, upgrade })`: an extra surface, served live;
  returns an unregister function. See [WebMountRegistry](WebMountRegistry.md).
- `buildApp()` returns the Express app the listener serves (also what tests drive
  with supertest).
- `start(port)` resolves `{ success, port }` or `{ success: false, error }`;
  `stop()`, `isRunning()`, `getPort()` from SharingListener.

## The app, in order

1. JSON (50 MB) and urlencoded body parsers, skipped for `/hooks` when a hooks
   router is set, so webhook signatures see the raw bytes.
2. `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` on every response.
3. Origin gate: [OriginPolicy](../OriginPolicy.md)`.originAllowed(hostService.getBindMode(), req)`,
   else `403 Origin not allowed by sharing policy`. LAN-only by default.
4. `/sharing`: [SharingRouter](../host/routes/SharingRouter.md) (PIN and token gated).
5. `/share`: [ShareRouter](ShareRouter.md) with `publicDir` (anonymous, whitelist-only).
6. `/hooks`: the hooks router, when set.
7. Registered mounts (dynamic dispatcher).
8. `/llm-ui/lib/monaco`, `/llm-ui/lib/chart`, `/llm-ui/luma-modal.js` (from
   `shellUiDir`), then `/llm-ui` (the real desktop chat UI).
9. The PWA's static files (`index.html` as index; see [WebClient](public/WebClient.md)).
10. SPA fallback: any other GET outside `/sharing/`, `/share/` and the mounts
    gets `index.html`, so client-side routing survives a refresh. Non-GETs fall
    to Express's 404.

WebSocket upgrades pass the same origin gate and go to the mount that owns the
path; anything else (or a throwing handler, logged as
`[sharing] web upgrade handler failed:`) has its socket destroyed.

## Why

Its own listener, not the REST gateway: the only surface is the PWA plus the
gated APIs above, and the host's `/api/*` is never reachable (an `/api` path
just gets the shell). Lifecycle is owned by SharingHostService through
HostListeners: it runs iff sharing and the web toggle are on; bind errors are
reported so the settings UI can revert the toggle. `sendFile` takes a `root`
because a bare absolute path is dotfile-checked per segment and 404s under
AppImage's `/tmp/.mount_*` prefix.
