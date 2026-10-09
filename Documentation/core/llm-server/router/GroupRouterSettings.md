# GroupRouterSettings

`core/llm-server/router/GroupRouterSettings.js`

The tool-group router's persisted settings and model location.

## Methods

- `new GroupRouterSettings({ settingsDb, modelDir? })`; `modelDir()` defaults to
  `<AppPaths.appBaseDir()>/router`.
- `isEnabled()`, `isPinEnabled()` default false.
- `setEnabled(v)`, `setPinEnabled(v)` truthy stores `true`, falsy deletes the key.
- `modelDir()`, `bundledModelPath()` (`<modelDir>/<MODEL_FILE>`, where a
  download installs), `modelPath()` (the override, else the bundled path),
  `pathOverride()` (a non-empty string or null), `isModelInstalled()` (the
  model path is a file).
- Keys: `ENABLED_KEY` `core.llmServer.defaults.groupRouter`, `PIN_KEY`
  `core.llmServer.defaults.groupRouterPinRam`, `MODEL_PATH_KEY`
  `core.llmServer.groupRouter.modelPath`; `MODEL_FILE`
  `luma-router-qwen3-0.6b-q8_0.gguf`.

## Why

Both toggles are intent only and OFF by default. The path override is for dev
and custom retrains; with an override set the service never downloads.
