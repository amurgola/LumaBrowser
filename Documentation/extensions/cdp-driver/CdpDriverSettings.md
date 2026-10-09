# CdpDriverSettings

`extensions/cdp-driver/CdpDriverSettings.js`

The cdp-driver settings in the extension's key-value store.

## Methods

- `new CdpDriverSettings(rawDb)`: anything with `get(key, default)` and `set(key, value)`
  (the extension passes `context.db.getRawDb()`).
- `read()` -> `{ enabled, port, host, fallback: { defaultEnabled, onFindFail, onClickIntercepted, slot } }`.
- `write(patch)` writes only the fields present: booleans are coerced, a non-numeric
  port becomes 9222, host is stringified, an empty slot becomes null.

| Key | Default |
|---|---|
| `cdp.enabled` (autostart gate) | false |
| `cdp.port` | 9222 |
| `cdp.host` | `127.0.0.1` |
| `cdp.fallback.enabled` | false |
| `cdp.fallback.onFindFail` | true |
| `cdp.fallback.onClickIntercepted` | true |
| `cdp.fallback.slot` | null |
