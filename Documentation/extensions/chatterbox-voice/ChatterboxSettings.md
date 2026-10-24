# ChatterboxSettings

`extensions/chatterbox-voice/ChatterboxSettings.js`

The add-on's paths and its small settings file.

## Methods

- `ChatterboxSettings.appBaseDir()` (core `AppPaths.appBaseDir()`, resolved per
  call), `runtimesDir()` (`<base>/runtimes`), `modelsDir()` (`<base>/models/tts/chatterbox`).
- `new ChatterboxSettings()`; `values` defaults to
  `{ preferredRuntimeId: null, idleMs: 5 min, kittenPreset: null, cloneModelId: null }`.
- `load()` merges `<modelsDir>/settings.json` over the defaults (missing or
  corrupt keeps them).
- `setPreferredRuntime(id)`, `setKittenPreset(name)`, `setCloneModel(id)`
  store the value or null and save.
- Getters `preferredRuntimeId`, `idleMs` (falls back to the default),
  `kittenPreset` (the KittenTTS 2 built-in voice, null for the model default),
  `cloneModelId` (which model clones, null for the first usable).
- Statics: `FILE`, `DEFAULT_IDLE_MS`.
