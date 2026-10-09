# TtsVoiceSettings

`core/tts-server/TtsVoiceSettings.js`

The persisted text-to-speech choices, each read back through a range check so a
corrupt value falls back to a safe default.

## Methods

- `new TtsVoiceSettings(settingsDb)` (any `{ get(key, default), set(key, value) }`).
- `getModelId()` / `setModelId(id)`: `core.voice.tts.modelId`, `null` when unset
  or blank; stored as a string.
- `getSid()` / `setSid(sid)`: `core.voice.tts.sid`, a non-negative number, else 0.
- `getSpeed()` / `setSpeed(speed)`: `core.voice.tts.speed`, strictly between
  0.25 and 4, else 1.
- `getAutoUnloadMs()`: `core.voice.tts.autoUnloadMs`, non-negative (0 means
  never), else 5 minutes. Written by the settings UI, not here.
- Statics: the four keys, `DEFAULT_IDLE_MS`, `MIN_SPEED`, `MAX_SPEED`.
