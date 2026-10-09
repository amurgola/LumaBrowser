# GroundingSettings

`core/grounding-server/GroundingSettings.js`

The grounding server's persisted choices.

## Methods

- `new GroundingSettings(settingsDb)`.
- `getModelPath()` (`''` when unset), `getMmprojPath()` (the explicit
  projector, else [GroundingModelFiles](GroundingModelFiles.md)`.pairMmproj` of
  the weights, else null).
- `getAutoUnloadMs()` default 10 min; non-numeric or negative falls back to the
  default; 0 means never.
- `setAutoUnloadMs(ms)` stores `max(0, Number(ms) || 0)` and returns it.
- `isConfigured()` both the weights and the projector exist on disk.
- `select(modelPath, mmprojPath)` stores the weights; stores the projector or
  deletes the key so it is paired on read. `clear()` deletes both keys.
- Statics: `KEYS` (`core.groundingServer.modelPath`, `.mmprojPath`,
  `.autoUnloadMs`), `DEFAULT_AUTO_UNLOAD_MS`. The optional device pin
  `core.groundingServer.cudaDevice` is read by VramCoordinator's override tier.
