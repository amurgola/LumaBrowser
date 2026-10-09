# VramOverride

`core/shared/runtime/vram/VramOverride.js`

The explicit per-role CUDA device setting, set by a user or an extension, that
beats [VramCoordinator](../VramCoordinator.md)'s automatic policy (but not the
placement layout).

## Methods

- `VramOverride.read(settingsDb, role)` returns `undefined` when unset (or the
  store is missing or throws), `''` for "never pin", else the trimmed string.
- `VramOverride.devices(value)` the integer indexes in a device string.
- `VramOverride.KEYS`: `llm` `core.llmServer.cudaDevice`, `music`
  `core.musicServer.cudaDevice`, `grounding` `core.groundingServer.cudaDevice`;
  every other role (images) reads `VramOverride.DEFAULT_KEY`,
  `core.imageServer.cudaDevice`.
