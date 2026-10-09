# FallbackConfig

`extensions/cdp-driver/FallbackConfig.js`

Builds a session's LLM fallback config `{ enabled, onFindFail, onClickIntercepted, slot }`.

## Methods

- `FallbackConfig.normalize(capValue, defaults)` with `defaults` the saved
  `{ defaultEnabled, onFindFail, onClickIntercepted, slot }`:
  - `true`: everything on, default slot;
  - `null`, `undefined`, `false`: follow the defaults (the trigger flags are only
    truthy when `defaultEnabled` is);
  - an object: each flag on unless explicitly false; its slot wins over the default;
  - anything else: all off, slot null.

CDP has no capability slot, so clients set it with `Lumabyte.configureFallback`.
