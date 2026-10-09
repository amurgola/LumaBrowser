# SeleniumDriverSettings

`extensions/selenium-driver/SeleniumDriverSettings.js`

The selenium-driver settings in the extension's key-value store.

## Methods

- `new SeleniumDriverSettings(rawDb)`; `read()` ->
  `{ enabled, port, host, prefix, fallback: { defaultEnabled, onFindFail, onClickIntercepted, slot } }`;
  `write(patch)` writes only the fields present (non-numeric port -> 9515, prefix
  stringified with null -> '', empty slot -> null).

| Key | Default |
|---|---|
| `selenium.enabled` (autostart gate) | false |
| `selenium.port` | 9515 |
| `selenium.host` | `127.0.0.1` |
| `selenium.prefix` (for example `/wd/hub`) | '' |
| `selenium.fallback.enabled` | false |
| `selenium.fallback.onFindFail` | true |
| `selenium.fallback.onClickIntercepted` | true |
| `selenium.fallback.slot` | null |
