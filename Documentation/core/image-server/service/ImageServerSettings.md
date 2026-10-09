# ImageServerSettings

`core/image-server/service/ImageServerSettings.js`

The image server's persisted settings: feature toggle, models directory, slot
defaults and idle auto-unload threshold.

## Methods

- `new ImageServerSettings(settingsDb, { defaultModelsDir })`; `defaultModelsDir()`
  is called lazily (it resolves the app base dir).
- `isEnabled()`, `setEnabled(enabled)` (stored as a boolean).
- `getModelsDirConfig()` `{ configured, effectivePath, defaultPath, isUsingDefault }`;
  `setModelsDir(dir)` stores it as a string, a falsy dir deletes it; returns the config.
- `getDefaults()` `{ runtimeId, modelId, editModelId, videoModelId, pinModelRam }`.
- `setDefaults(patch)` changes only the fields present; ids are stored as
  strings, a falsy id or `pinModelRam` deletes the key; returns the defaults.
- `getAutoUnloadMs()` unset is `DEFAULT_AUTO_UNLOAD_MS` (15 min); a persisted
  0, negative or non-number is 0 (disabled). `setAutoUnloadMs(ms)` floors,
  clamps at 0, stores and returns the value.
- Statics `KEYS` (every `core.imageServer.*` key, never renamed),
  `DEFAULT_AUTO_UNLOAD_MS`, `DEFAULT_ID_FIELDS`.
