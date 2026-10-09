# NvidiaSmiPathSettings

`core/llm-server/service/NvidiaSmiPathSettings.js`

The nvidia-smi path diagnostics discovered once and reuses, and whether the user
dismissed the "found nvidia-smi at ..." hint. Extends [KeyedSettings](KeyedSettings.md).

## Methods

- `new NvidiaSmiPathSettings(settingsDb)`.
- `getSavedPath()` or null; `setSavedPath(path)` a falsy path deletes.
- `isHintDismissed()`, `setHintDismissed(value)`.
- `PATH_KEY` `core.llmServer.nvidiaSmiPath`, `HINT_DISMISSED_KEY` `core.llmServer.nvidiaSmiPathHintDismissed`.

## Why

Electron's inherited PATH drops `C:\Windows\System32` on some Windows setups, so
the path that worked is kept for later boots. Once dismissed, the hint stays
hidden whether or not a bare PATH lookup still fails.
