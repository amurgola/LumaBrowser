# FeatureSettings

`extensions/desktop-integration/FeatureSettings.js`

One feature's key-value settings (`deps.settings`), stored in the extension's
namespace as `ext.desktop-integration.feature.<id>.<key>`. Values are anything
JSON can hold.

## Methods

- `new FeatureSettings(db, featureId)`.
- `get(key, defaultValue?)`, `set(key, value)`, `delete(key)`: an empty key throws.
- `all()`: every stored key of this feature, without the prefix.
