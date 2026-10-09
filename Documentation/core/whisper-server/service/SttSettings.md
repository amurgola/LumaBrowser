# SttSettings

`core/whisper-server/service/SttSettings.js`

The persisted speech-to-text choices, each read back with a safe default.

## Methods

- `new SttSettings(settingsDb)` (any `{ get(key, default), set(key, value), delete?(key) }`).
- `getModelPath()` / `setModelPath(p)`: `core.voice.stt.modelPath`, a whisper
  `.bin` file or a sherpa model dir; `null` when unset. An empty path deletes
  the key (a store without `delete` keeps the old value).
- `getLanguage()` / `setLanguage(l)`: `core.voice.stt.language`, `auto` when
  unset or empty.
- `getAutoUnloadMs()`: `core.voice.stt.autoUnloadMs`, non-negative (0 means
  never), else 5 minutes.
- Statics: `MODEL_KEY`, `LANGUAGE_KEY`, `IDLE_KEY`, `DEFAULT_IDLE_MS`, `AUTO_LANGUAGE`.

## Why

Same role as [TtsVoiceSettings](../../tts-server/TtsVoiceSettings.md) for the
other half of voice mode. They share no base: the keys, value kinds and
validation differ.
