# ChatterboxSettings

`extensions/chatterbox-voice/ChatterboxSettings.js`

The add-on's paths and its small settings file.

## Methods

- `ChatterboxSettings.appBaseDir()` (core `AppPaths.appBaseDir()`, resolved per
  call), `runtimesDir()` (`<base>/runtimes`), `modelsDir()` (`<base>/models/tts/chatterbox`).
- `new ChatterboxSettings()`; `values` defaults to
  `{ preferredRuntimeId: null, idleMs: 5 min }`.
- `load()` merges `<modelsDir>/settings.json` over the defaults (missing or
  corrupt keeps them).
- `setPreferredRuntime(id)` stores `id || null` and saves.
- Getters `preferredRuntimeId`, `idleMs` (falls back to the default).
- Statics: `FILE`, `DEFAULT_IDLE_MS`.
