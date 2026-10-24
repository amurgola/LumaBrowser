# FeatureRegistry

`extensions/desktop-integration/FeatureRegistry.js`

The live feature modules. A feature's on/off state is the stored toggle
(settings key `featureEnabled`, an `{ <id>: boolean }` map) or else its
`defaultEnabled`. Starting a feature calls `create(deps)` and `mount(router)` on
a fresh `express.Router`; stopping calls `dispose()` and drops the router, so
[DesktopRoutes](DesktopRoutes.md) answers 404 `Feature disabled` at once. A
`create` or `mount` that throws leaves that feature in an error state (shown
in the settings tab) and touches nothing else.

## Methods

- `new FeatureRegistry({ db, buildDeps, onChange?, log?, routerFactory? })`:
  `buildDeps(descriptor)` is [FeatureDeps](FeatureDeps.md)`.build`; `onChange()`
  runs after every toggle (the handshake rewrite).
- `load({ loaded, failed })`: the [FeatureCatalog](FeatureCatalog.md) result;
  starts every enabled feature and logs the failed folders.
- `isEnabled(id)`, `has(id)`, `routerFor(id)` (null when unknown, off or failed),
  `enabledIds()` (on and running: what the handshake advertises).
- `setEnabled(id, enabled)`: persists, starts or stops, calls `onChange`,
  returns `describe(id)`; throws for an unknown id.
- `list()` / `describe(id)`: `{ id, label, description, defaultEnabled, enabled, running, error, settings }`;
  `settings` is the feature's settingsSchema with current values.
- `setSetting(id, key, value)`: coerces and stores one settingsSchema value
  ([FeatureSettingsSchema](FeatureSettingsSchema.md)), calls the running
  instance's optional `onSettingsChanged(key, value)`, returns `describe(id)`.
- `failed()`: the folders that did not load.
- `disposeAll()`: stops every feature (deactivate).
- `FeatureRegistry.DISPOSE`: the symbol key under which a deps object carries
  its own teardown (scoped IPC removal).
