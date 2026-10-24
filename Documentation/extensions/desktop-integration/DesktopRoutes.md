# DesktopRoutes

`extensions/desktop-integration/DesktopRoutes.js`

The `/api/desktop` router: the unguarded `GET /hello`, then the
[DesktopToken](DesktopToken.md) guard, then `/:feature` dispatch to the
feature's own router from the [FeatureRegistry](FeatureRegistry.md), recording
the client in the [ClientRegistry](ClientRegistry.md) on the way.

## Methods

- `new DesktopRoutes({ registry, token, clients, info })`: `info()` ->
  `{ name, version, apiBase }`.
- `router()`:
  - `GET /hello` -> `{ success: true, name, apiBase, version }`, no token.
  - no or wrong token -> 401 `{ success: false, error }`.
  - unknown feature -> 404 `{ success: false, error: 'Unknown feature', feature }`.
  - feature off or failed -> 404 `{ success: false, error: 'Feature disabled', feature }`.
  - a path the feature does not serve -> 404 `{ success: false, error: 'Not found', feature }`.
  - a handler that throws, rejects (Express 5 forwards async errors) or calls
    `next(err)` -> 500 `{ success: false, error, feature }`.
