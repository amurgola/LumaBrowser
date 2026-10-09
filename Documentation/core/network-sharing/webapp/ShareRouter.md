# ShareRouter

`core/network-sharing/webapp/ShareRouter.js`

Express routes for public share links, mounted at `/share` on the Network
Sharing web backend only, never on the desktop REST gateway. A controller: the
decisions live in [SharedContentReader](SharedContentReader.md).

## Methods

- `new ShareRouter(hostService, { publicDir })`: `hostService` provides
  `resolveShare(token)`, `getChatRouter()`, `getChatStore()` (SharingHostService).
  `publicDir` defaults to `webapp/public` and holds `share-view.html`.
- `build()` returns an `express.Router` with (all GET, anonymous; the token is
  the credential):
  - `/:token` (middleware): resolves the share or 404s; sets `req.share`.
  - `/:token`: artifact share -> the rendered document; conversation share ->
    `share-view.html`, which fetches `./data`.
  - `/:token/data`: sanitised conversation JSON (conversation shares only).
  - `/:token/artifact/:id`: rendered document of an artifact in the shared
    conversation.
  - `/:token/artifact-data/:rootId[?since=rev]`: read-only live-module data for
    a chain the share covers; 204 when nothing changed since `rev`.
  - `/:token/artifact/:id/raw`: raw bytes of an image or video artifact in the
    shared conversation, with its stored mime type.
  - anything else under `/share`: 404, so nothing falls through to the SPA.

Every miss answers the same `404 Not found`.

## Why

The surface is whitelist-only and indistinguishable on failure: a malformed
token, a revoked share and an artifact outside the share all look identical,
so the route tells a prober nothing.
