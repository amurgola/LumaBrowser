# FeatureSettingsSchema

`extensions/desktop-integration/FeatureSettingsSchema.js`

A feature's declarative `settingsSchema`: the fields the settings tab renders
under the feature's card. Bad entries are dropped, never fatal.

## Field shape

`{ key, label, type, default, help?, options?, min?, max?, step? }`

- `key`: letters, digits, `_`, `.`, `-` (up to 60); duplicates keep the first.
- `type`: `text`, `textarea`, `number`, `bool`, `select` or `hotkey`; anything
  else becomes `text`.
- `options` (select): `[{ value, label }]` or plain values.
- `min`, `max`, `step` (number): bounds checked on save.

## Methods

- `normalize(raw)`: the clean field array (empty when `raw` is not an array).
- `withValues(fields, settings)`: each field plus `value` (stored, else `default`).
- `coerce(fields, key, value)`: the value to store, typed to the field; throws
  on an unknown key, a non-number, an out-of-range number or an unknown option.

Used by FeatureCatalog (descriptor `settingsSchema`) and FeatureRegistry
(`describe` lists `settings`; `setSetting(id, key, value)` stores and calls the
instance's optional `onSettingsChanged(key, value)`).
