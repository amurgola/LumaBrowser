# LlmServerSettings

`core/llm-server/service/LlmServerSettings.js`

The LLM server's persisted feature settings. Extends [KeyedSettings](KeyedSettings.md).

## Methods

- `new LlmServerSettings(settingsDb, { defaultModelsDir })`; `defaultModelsDir()`
  is called lazily (it resolves the app base dir, which touches Electron).
- `isEnabled()`, `setEnabled(enabled)` (stored as a boolean; default off).
- `getOpenTabOnLoad()`, `setOpenTabOnLoad(value)` -> the new boolean. Independent
  of the feature toggle: the feature can stay on while the tab is not spawned at startup.
- `getModelsDirConfig()` `{ configured, effectivePath, defaultPath, isUsingDefault }`;
  `setModelsDir(dir)` a falsy dir reverts to the default; no filesystem check.
- `getAutoUnloadMs()` 0 (disabled) unless a positive number is stored, floored;
  `setAutoUnloadMs(ms)` floors, clamps at 0, deletes the key for 0, returns the value.
- `getUnloadOnVramPressure()` true only for a stored `true`;
  `setUnloadOnVramPressure(value)` stores `true` or deletes; returns the boolean.
- Statics: `KEYS` (`core.llmServer.enabled`, `.openTabOnLoad`, `.modelsDir`,
  `.defaults.autoUnloadMs`, `core.llm.unloadOnVramPressure`; never renamed),
  `DEFAULT_AUTO_UNLOAD_MS` (15 min, the value the toggle stores).
