# ArtifactRoutes

`app/gateway/ArtifactRoutes.js`

Mounts chat artifacts on the REST gateway, each route behind the ApiSecurity guard.

## Methods

- `new ArtifactRoutes({ app, guard, artifactsDir, artifactDataStore, liveApi })`.
- `mount()`:
  - `GET /artifacts/data/:rootId`: `artifactDataStore.all(rootId)`; 404 with the
    store's reply for an unknown chain, 204 when `?since=` is at or past the
    revision, else the snapshot;
  - `POST /artifacts/data/:rootId`: `mutate(rootId, { set, remove })`, 200 or 400
    (the store's quotas);
  - `POST /artifacts/api/fetch`, `POST /artifacts/api/open-tab`: the live page
    API ([LiveApi](../../core/llm-server/chat/LiveApi.md)), 200 or 400;
  - `/artifacts/*` files from `<dataDir>/artifacts` through [ConfinedFile](ConfinedFile.md).
- `ArtifactRoutes.readData(store, req, res)`, `ArtifactRoutes.reply(res, result)`.

## Why

These are the transports a popped-out artifact tab's injected `store` and `luma`
use (the inline chat and the dashboard go over IPC). They must register before
the file route, which would otherwise swallow `/artifacts/data/*` as a missing
file. They are never mounted on the sharing routers: a remote viewer must not
drive this machine's browser.
