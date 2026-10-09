# StaticUiRoutes

`app/gateway/StaticUiRoutes.js`

Mounts the in-app pages on the REST gateway, each behind the ApiSecurity guard.

## Methods

- `new StaticUiRoutes({ app, guard, rootDir, extensionManager })`.
- `mount()` registers, in this order (Express matches the first route):
  - `GET /llm-ui/luma-modal.js` -> `core/shell/ui/luma-modal.js`;
  - `/llm-ui/lib/monaco/` -> `node_modules/monaco-editor/min/vs`,
    `/llm-ui/lib/chart/` -> `node_modules/chart.js/dist`,
    `/llm-ui/lib/phaser/` -> `node_modules/phaser/dist`;
  - `/llm-ui/ext/` -> [ExtensionAssetGate](ExtensionAssetGate.md);
  - `/llm-ui/` -> `core/llm-server/ui` (default `llm-tab.html`);
  - `/dashboard-ui/lib/gridstack/` -> `node_modules/gridstack/dist`;
  - `/dashboard-ui/` -> `core/dashboard/ui` (default `dashboard.html`).
  Every directory is served through [ConfinedFile](ConfinedFile.md).

## Why

The gateway binds 0.0.0.0, so anything outside `/api` still passes the same
ApiSecurity middleware, or an external caller could read in-app assets without
a bearer. The in-app tabs carry the bearer through the
[InternalBearerInjector](../ready/InternalBearerInjector.md). Only `ui/` folders
are exposed, never the server-side JS beside them.
