# FeatureDeps

`extensions/desktop-integration/FeatureDeps.js`

Builds the `deps` object a feature's `create(deps)` receives. The full table of
keys is in the [README](README.md#6-the-deps-object): `id`, `db`, `settings`,
`ipc`, `broadcast`, `extensions` (a live getter), `handoff`, `speech`, `overlay`, `hints`, `shortcuts`, `bridge`,
`windows`, `browser`, `services`, `clients`, `features`, `log`, `appInfo`.

## Methods

- `new FeatureDeps(context, shared)`: `context` is the extension's activation
  context; `shared` is `{ broadcast, handoff, speech, overlay, hints, shortcuts, bridge, windows, clients,
  features, appInfo() }`.
- `build(descriptor)`: one feature's deps. Carries a
  `FeatureRegistry.DISPOSE` teardown that removes the feature's IPC channels.
- `FeatureDeps.scopedIpc(ipc, featureId)`: `{ channelPrefix, handle, on, send,
  dispose }` over the extension's scoped bridge; channels land at
  `ext.desktop-integration.<featureId>.<channel>`.
- `FeatureDeps.logger(base, featureId)`: `{ info, warn, error, debug }` to the
  activity log (or the console), every line tagged `desktop-integration/<id>:`;
  a logging failure never reaches the feature.
