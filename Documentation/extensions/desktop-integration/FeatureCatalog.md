# FeatureCatalog

`extensions/desktop-integration/FeatureCatalog.js`

Finds the feature modules: every `features/<id>/index.js` (folders starting
with `_` or `.` are ignored), required and checked against the contract in the
[README](README.md#5-feature-modules).

## Methods

- `FeatureCatalog.discover(dir, { load? })` -> `{ loaded, failed }`: `loaded`
  are normalized descriptors `{ id, label, description, defaultEnabled, create }`
  sorted by id; `failed` are `{ folder, error }` for folders that threw on
  load, broke the contract or repeated an id. Never throws; a missing folder
  gives two empty lists.
- `FeatureCatalog.validate(mod, folder)`: the descriptor, or a throw. The id
  must match `^[a-z0-9][a-z0-9-]{0,39}$`, equal the folder name, and not be a
  reserved path (`hello`); `create` must be a function; `defaultEnabled`
  defaults to true; `settingsSchema` is normalized by
  [FeatureSettingsSchema](FeatureSettingsSchema.md) (empty when absent).
