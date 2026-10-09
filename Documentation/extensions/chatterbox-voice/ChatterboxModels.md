# ChatterboxModels

`extensions/chatterbox-voice/ChatterboxModels.js`

The two Chatterbox GGUF files and the language names the Setup tab shows.

## Methods

- `ChatterboxModels.getModels()` returns `MODELS`:
  - `chatterbox` (`task: 'clone'`, 0.5B, `chatterbox-q8_0.gguf`, 2088393668
    bytes, 19 language codes): zero-shot cloning from a reference clip;
  - `chatterbox-turbo` (`task: 'tts'`, 350M, `chatterbox-turbo-q8_0.gguf`,
    699101408 bytes, English): one built-in voice, roughly twice as fast, no
    cloning in audio.cpp today.
- `ChatterboxModels.getModelById(id)` returns the row or `null`.
- Statics: `HF_BASE` (audio-cpp/audio.cpp-gguf), `MODELS`, `LANGUAGE_NAMES`.

Both are single files, so the core resumable model downloader is reused as is.
Sizes were verified 2026-10-03 via the Hugging Face API.
